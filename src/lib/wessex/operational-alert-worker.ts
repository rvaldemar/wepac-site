import { wessexOperationalAlerter } from "@/lib/wessex/operational-alert";
import { logSafeError } from "@/lib/wepacker/log-safe-error";

const INTERVAL_MS = 5 * 60_000;

type WorkerGlobal = typeof globalThis & {
  __wessexOperationalAlertWorker?: ReturnType<typeof setInterval>;
};

async function runCycle(): Promise<void> {
  try {
    await wessexOperationalAlerter.dispatchDue();
  } catch (error) {
    console.error("[wessex alert worker] cycle_failed", logSafeError(error));
  }
}

export function startWessexOperationalAlertWorker(): boolean {
  const runtime = globalThis as WorkerGlobal;
  if (runtime.__wessexOperationalAlertWorker) return false;
  const timer = setInterval(() => void runCycle(), INTERVAL_MS);
  if (typeof timer.unref === "function") timer.unref();
  runtime.__wessexOperationalAlertWorker = timer;
  void runCycle();
  return true;
}
