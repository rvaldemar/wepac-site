import { logSafeError } from "@/lib/wepacker/log-safe-error";
import { dispatchDueEmailOutbox } from "@/lib/wepacker/notifications";

const DEFAULT_INTERVAL_MS = 60_000;
const MIN_INTERVAL_MS = 5_000;
const MAX_INTERVAL_MS = 60 * 60_000;
const DEFAULT_BATCH_SIZE = 25;
const MIN_BATCH_SIZE = 1;
const MAX_BATCH_SIZE = 100;

export interface NotificationOutboxWorkerConfig {
  enabled: boolean;
  intervalMs: number;
  batchSize: number;
}

export interface NotificationOutboxWorkerEnv {
  [key: string]: string | undefined;
  NOTIFICATION_OUTBOX_WORKER_ENABLED?: string;
  NOTIFICATION_OUTBOX_WORKER_INTERVAL_MS?: string;
  NOTIFICATION_OUTBOX_WORKER_BATCH_SIZE?: string;
}

interface NotificationOutboxWorkerState {
  config: NotificationOutboxWorkerConfig;
  timer: ReturnType<typeof setInterval>;
  running: boolean;
  stopped: boolean;
}

type NotificationOutboxWorkerGlobal = typeof globalThis & {
  __wepacNotificationOutboxWorkerV1?: NotificationOutboxWorkerState;
};

export type NotificationOutboxWorkerStartResult =
  | {
      started: true;
      config: NotificationOutboxWorkerConfig;
    }
  | {
      started: false;
      reason: "disabled" | "already_running";
      config: NotificationOutboxWorkerConfig;
    };

function boundedInteger(
  raw: string | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  if (!raw?.trim()) return fallback;
  const parsed = Number(raw);
  if (!Number.isSafeInteger(parsed)) return fallback;
  return Math.min(maximum, Math.max(minimum, parsed));
}

export function readNotificationOutboxWorkerConfig(
  env: NotificationOutboxWorkerEnv = process.env,
): NotificationOutboxWorkerConfig {
  return {
    enabled: env.NOTIFICATION_OUTBOX_WORKER_ENABLED === "true",
    intervalMs: boundedInteger(
      env.NOTIFICATION_OUTBOX_WORKER_INTERVAL_MS,
      DEFAULT_INTERVAL_MS,
      MIN_INTERVAL_MS,
      MAX_INTERVAL_MS,
    ),
    batchSize: boundedInteger(
      env.NOTIFICATION_OUTBOX_WORKER_BATCH_SIZE,
      DEFAULT_BATCH_SIZE,
      MIN_BATCH_SIZE,
      MAX_BATCH_SIZE,
    ),
  };
}

function workerGlobal(): NotificationOutboxWorkerGlobal {
  return globalThis as NotificationOutboxWorkerGlobal;
}

function logWorkerFailure(error: unknown): void {
  try {
    console.error(
      "[wepacker:notification-outbox-worker] cycle failed",
      logSafeError(error),
    );
  } catch {
    // A timer recovery path must never become an unhandled rejection.
  }
}

async function runCycle(state: NotificationOutboxWorkerState): Promise<void> {
  if (state.running || state.stopped) return;
  state.running = true;
  try {
    const result = await dispatchDueEmailOutbox(state.config.batchSize);
    if (result.attempted > 0) {
      console.info("[wepacker:notification-outbox-worker] cycle complete", result);
    }
  } catch (error) {
    logWorkerFailure(error);
  } finally {
    state.running = false;
  }
}

function triggerCycle(state: NotificationOutboxWorkerState): void {
  void runCycle(state).catch((error) => {
    state.running = false;
    logWorkerFailure(error);
  });
}

export function startNotificationOutboxWorker(
  env: NotificationOutboxWorkerEnv = process.env,
): NotificationOutboxWorkerStartResult {
  const config = readNotificationOutboxWorkerConfig(env);
  if (!config.enabled) return { started: false, reason: "disabled", config };

  const runtime = workerGlobal();
  const existing = runtime.__wepacNotificationOutboxWorkerV1;
  if (existing && !existing.stopped) {
    return {
      started: false,
      reason: "already_running",
      config: existing.config,
    };
  }

  const state = {
    config,
    running: false,
    stopped: false,
  } as NotificationOutboxWorkerState;
  const timer = setInterval(() => triggerCycle(state), config.intervalMs);
  state.timer = timer;
  runtime.__wepacNotificationOutboxWorkerV1 = state;
  if (typeof timer.unref === "function") timer.unref();

  triggerCycle(state);
  console.info("[wepacker:notification-outbox-worker] started", {
    intervalMs: config.intervalMs,
    batchSize: config.batchSize,
  });
  return { started: true, config };
}

export function stopNotificationOutboxWorker(): boolean {
  const runtime = workerGlobal();
  const state = runtime.__wepacNotificationOutboxWorkerV1;
  if (!state || state.stopped) return false;

  state.stopped = true;
  clearInterval(state.timer);
  delete runtime.__wepacNotificationOutboxWorkerV1;
  return true;
}
