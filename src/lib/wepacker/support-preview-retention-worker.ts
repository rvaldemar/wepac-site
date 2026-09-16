import { applySupportPreviewRetention } from "@/lib/wepacker/support-preview-retention";

const DEFAULT_INTERVAL_MS = 24 * 60 * 60 * 1000;
const MIN_INTERVAL_MS = 60 * 60 * 1000;
const MAX_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

export interface SupportPreviewRetentionWorkerConfig {
  enabled: boolean;
  intervalMs: number;
}

export interface SupportPreviewRetentionWorkerEnv {
  [key: string]: string | undefined;
  SUPPORT_PREVIEW_RETENTION_WORKER_ENABLED?: string;
  SUPPORT_PREVIEW_RETENTION_WORKER_INTERVAL_MS?: string;
}

interface SupportPreviewRetentionWorkerState {
  config: SupportPreviewRetentionWorkerConfig;
  timer: ReturnType<typeof setInterval>;
  running: boolean;
  stopped: boolean;
}

type SupportPreviewRetentionWorkerGlobal = typeof globalThis & {
  __wepacSupportPreviewRetentionWorkerV1?: SupportPreviewRetentionWorkerState;
};

export type SupportPreviewRetentionWorkerStartResult =
  | { started: true; config: SupportPreviewRetentionWorkerConfig }
  | {
      started: false;
      reason: "disabled" | "already_running";
      config: SupportPreviewRetentionWorkerConfig;
    };

function boundedInterval(raw: string | undefined): number {
  if (!raw?.trim()) return DEFAULT_INTERVAL_MS;
  const parsed = Number(raw);
  if (!Number.isSafeInteger(parsed)) return DEFAULT_INTERVAL_MS;
  return Math.min(MAX_INTERVAL_MS, Math.max(MIN_INTERVAL_MS, parsed));
}

export function readSupportPreviewRetentionWorkerConfig(
  env: SupportPreviewRetentionWorkerEnv = process.env,
): SupportPreviewRetentionWorkerConfig {
  return {
    enabled: env.SUPPORT_PREVIEW_RETENTION_WORKER_ENABLED === "true",
    intervalMs: boundedInterval(
      env.SUPPORT_PREVIEW_RETENTION_WORKER_INTERVAL_MS,
    ),
  };
}

function workerGlobal(): SupportPreviewRetentionWorkerGlobal {
  return globalThis as SupportPreviewRetentionWorkerGlobal;
}

function logFailure(error: unknown): void {
  try {
    console.error("[wepacker:support-preview-retention] cycle failed", {
      kind: error instanceof Error ? error.name : "unknown",
    });
  } catch {
    // Logging must never turn a recovered timer failure into a rejection.
  }
}

async function runCycle(
  state: SupportPreviewRetentionWorkerState,
): Promise<void> {
  if (state.running || state.stopped) return;
  state.running = true;
  try {
    const result = await applySupportPreviewRetention();
    if (Object.values(result).some((count) => count > 0)) {
      // Aggregate counts only: no actor, target, Session, grant or ticket.
      console.info("[wepacker:support-preview-retention] cycle complete", result);
    }
  } catch (error) {
    logFailure(error);
  } finally {
    state.running = false;
  }
}

function triggerCycle(state: SupportPreviewRetentionWorkerState): void {
  void runCycle(state).catch((error) => {
    state.running = false;
    logFailure(error);
  });
}

export function startSupportPreviewRetentionWorker(
  env: SupportPreviewRetentionWorkerEnv = process.env,
): SupportPreviewRetentionWorkerStartResult {
  const config = readSupportPreviewRetentionWorkerConfig(env);
  if (!config.enabled) return { started: false, reason: "disabled", config };

  const runtime = workerGlobal();
  const existing = runtime.__wepacSupportPreviewRetentionWorkerV1;
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
  } as SupportPreviewRetentionWorkerState;
  const timer = setInterval(() => triggerCycle(state), config.intervalMs);
  state.timer = timer;
  runtime.__wepacSupportPreviewRetentionWorkerV1 = state;

  if (typeof timer.unref === "function") timer.unref();

  triggerCycle(state);
  console.info("[wepacker:support-preview-retention] started", {
    intervalMs: config.intervalMs,
  });
  return { started: true, config };
}

export function stopSupportPreviewRetentionWorker(): boolean {
  const runtime = workerGlobal();
  const state = runtime.__wepacSupportPreviewRetentionWorkerV1;
  if (!state || state.stopped) return false;

  state.stopped = true;
  clearInterval(state.timer);
  delete runtime.__wepacSupportPreviewRetentionWorkerV1;
  return true;
}
