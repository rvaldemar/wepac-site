import { constants } from "node:fs";
import { chmod, mkdir, open, readFile, rename, unlink } from "node:fs/promises";
import { dirname, isAbsolute } from "node:path";

export interface HealthcheckState {
  version: 1;
  consecutiveFailures: number;
  outageAlertSent: boolean;
  notificationAttempts: number;
  nextNotificationAt: string | null;
  updatedAt: string;
}

export type HealthNotification = "outage" | "recovery";

const RETRY_DELAYS_MS = [15 * 60_000, 60 * 60_000, 6 * 60 * 60_000] as const;

export function initialHealthcheckState(now = new Date(0)): HealthcheckState {
  return {
    version: 1,
    consecutiveFailures: 0,
    outageAlertSent: false,
    notificationAttempts: 0,
    nextNotificationAt: null,
    updatedAt: now.toISOString(),
  };
}

function notificationDue(state: HealthcheckState, now: Date): boolean {
  return !state.nextNotificationAt || Date.parse(state.nextNotificationAt) <= now.getTime();
}

export function advanceHealthcheckState(
  state: HealthcheckState,
  healthy: boolean,
  now: Date,
): { state: HealthcheckState; notification: HealthNotification | null } {
  const next = { ...state, updatedAt: now.toISOString() };
  if (!healthy) {
    next.consecutiveFailures += 1;
    return {
      state: next,
      notification:
        next.consecutiveFailures >= 2 &&
        !next.outageAlertSent &&
        notificationDue(next, now)
          ? "outage"
          : null,
    };
  }

  next.consecutiveFailures = 0;
  if (next.outageAlertSent) {
    return {
      state: next,
      notification: notificationDue(next, now) ? "recovery" : null,
    };
  }
  next.notificationAttempts = 0;
  next.nextNotificationAt = null;
  return { state: next, notification: null };
}

export function recordHealthNotificationResult(
  state: HealthcheckState,
  notification: HealthNotification,
  succeeded: boolean,
  now: Date,
): HealthcheckState {
  if (succeeded) {
    return {
      ...state,
      outageAlertSent: notification === "outage",
      notificationAttempts: 0,
      nextNotificationAt: null,
      updatedAt: now.toISOString(),
    };
  }
  const attempts = state.notificationAttempts + 1;
  const delay = RETRY_DELAYS_MS[Math.min(attempts - 1, RETRY_DELAYS_MS.length - 1)];
  return {
    ...state,
    notificationAttempts: attempts,
    nextNotificationAt: new Date(now.getTime() + delay).toISOString(),
    updatedAt: now.toISOString(),
  };
}

function isHealthcheckState(value: unknown): value is HealthcheckState {
  if (!value || typeof value !== "object") return false;
  const state = value as Record<string, unknown>;
  return (
    state.version === 1 &&
    Number.isSafeInteger(state.consecutiveFailures) &&
    Number(state.consecutiveFailures) >= 0 &&
    typeof state.outageAlertSent === "boolean" &&
    Number.isSafeInteger(state.notificationAttempts) &&
    Number(state.notificationAttempts) >= 0 &&
    (state.nextNotificationAt === null ||
      (typeof state.nextNotificationAt === "string" &&
        Number.isFinite(Date.parse(state.nextNotificationAt)))) &&
    typeof state.updatedAt === "string"
  );
}

export async function readHealthcheckState(path: string): Promise<HealthcheckState> {
  if (!isAbsolute(path)) throw new Error("HEALTHCHECK_STATE_FILE must be absolute");
  try {
    const value: unknown = JSON.parse(await readFile(path, "utf8"));
    return isHealthcheckState(value) ? value : initialHealthcheckState();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return initialHealthcheckState();
    throw error;
  }
}

export async function writeHealthcheckState(
  path: string,
  state: HealthcheckState,
): Promise<void> {
  if (!isAbsolute(path)) throw new Error("HEALTHCHECK_STATE_FILE must be absolute");
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  const temporary = `${path}.${process.pid}.${crypto.randomUUID()}.tmp`;
  let handle: Awaited<ReturnType<typeof open>> | undefined;
  try {
    handle = await open(
      temporary,
      constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY,
      0o600,
    );
    await handle.writeFile(`${JSON.stringify(state)}\n`, "utf8");
    await handle.sync();
    await handle.close();
    handle = undefined;
    await rename(temporary, path);
    await chmod(path, 0o600);
  } catch (error) {
    await handle?.close().catch(() => undefined);
    await unlink(temporary).catch(() => undefined);
    throw error;
  }
}
