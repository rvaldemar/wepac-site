import { runSessionMediaRetention } from "@/lib/wepacker/session-media/retention";

const DEFAULT_INTERVAL_MS = 60 * 60_000;
const MIN_INTERVAL_MS = 5 * 60_000;
const MAX_INTERVAL_MS = 24 * 60 * 60_000;

type State = {
  timer: ReturnType<typeof setInterval>;
  running: boolean;
};

const runtime = globalThis as typeof globalThis & {
  __wepacSessionMediaRetentionWorkerV1?: State;
};

export function startSessionMediaRetentionWorker(): boolean {
  if (
    process.env.SESSION_MEDIA_RETENTION_WORKER_ENABLED !== "true" ||
    runtime.__wepacSessionMediaRetentionWorkerV1
  ) {
    return false;
  }
  const parsed = Number(
    process.env.SESSION_MEDIA_RETENTION_WORKER_INTERVAL_MS ??
      DEFAULT_INTERVAL_MS,
  );
  const intervalMs = Number.isSafeInteger(parsed)
    ? Math.min(MAX_INTERVAL_MS, Math.max(MIN_INTERVAL_MS, parsed))
    : DEFAULT_INTERVAL_MS;
  const state = { running: false } as State;
  const cycle = async () => {
    if (state.running) return;
    state.running = true;
    try {
      const result = await runSessionMediaRetention();
      if (Object.values(result).some((count) => count > 0)) {
        console.info("[wepacker:session-media-retention] cycle complete", result);
      }
    } catch (error) {
      console.error("[wepacker:session-media-retention] cycle failed", {
        kind: error instanceof Error ? error.name : "unknown",
      });
    } finally {
      state.running = false;
    }
  };
  state.timer = setInterval(() => void cycle(), intervalMs);
  state.timer.unref?.();
  runtime.__wepacSessionMediaRetentionWorkerV1 = state;
  void cycle();
  return true;
}
