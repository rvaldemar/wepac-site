import {
  advanceHealthcheckState,
  readHealthcheckState,
  recordHealthNotificationResult,
  writeHealthcheckState,
  type HealthNotification,
} from "../src/lib/healthcheck-state";
import { logSafeError } from "../src/lib/wepacker/log-safe-error";
import { homedir } from "node:os";
import { isAbsolute, join, relative } from "node:path";

const baseUrl = new URL(process.env.BASE_URL ?? "http://127.0.0.1:3000");
const timeoutMs = Number(process.env.HEALTHCHECK_TIMEOUT_MS ?? "10000");
const stateFile =
  process.env.HEALTHCHECK_STATE_FILE ??
  join(process.env.XDG_STATE_HOME || join(homedir(), ".local", "state"), "wepac", "healthcheck.json");

if (!/^https?:$/.test(baseUrl.protocol)) throw new Error("BASE_URL must use http or https");
if (baseUrl.username || baseUrl.password || baseUrl.search || baseUrl.hash) {
  throw new Error("BASE_URL must not contain credentials, query or fragment");
}
if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new Error("HEALTHCHECK_TIMEOUT_MS must be positive");
const stateRelativeToCheckout = relative(process.cwd(), stateFile);
if (
  !isAbsolute(stateFile) ||
  (!stateRelativeToCheckout.startsWith("..") && !isAbsolute(stateRelativeToCheckout))
) {
  throw new Error("HEALTHCHECK_STATE_FILE must be outside the checkout");
}

const checks = [
  {
    name: "homepage",
    path: "/",
    method: "GET",
    expectedBody: "From packers to WEPACkers.",
    expected: (status: number) => status >= 200 && status < 400,
  },
  {
    name: "bilheteira",
    path: "/bilheteira",
    method: "GET",
    expectedBody: "Bilheteira",
    expected: (status: number) => status >= 200 && status < 400,
  },
  // OPTIONS validates route availability without selecting an engine, sending a prompt or consuming an upstream API.
  { name: "wessex-chat", path: "/api/wessex/chat", method: "OPTIONS", expected: (status: number) => status === 204 },
] as const;

async function run() {
  const results = [];
  for (const check of checks) {
    const startedAt = performance.now();
    try {
      const response = await fetch(new URL(check.path, baseUrl), {
        method: check.method,
        redirect: "follow",
        signal: AbortSignal.timeout(timeoutMs),
      });
      const body = check.method === "GET" ? await response.text() : "";
      const serverDigests = [...body.matchAll(/\\?"digest\\?":\\?"([^"\\]+)/g)].map(
        (match) => match[1],
      );
      const bodyOk =
        (!("expectedBody" in check) || body.includes(check.expectedBody)) &&
        !body.includes("Algo não correu como esperado") &&
        !body.includes("Something did not go as expected") &&
        serverDigests.every((digest) => digest.startsWith("NEXT_REDIRECT"));
      results.push({
        name: check.name,
        method: check.method,
        path: check.path,
        status: response.status,
        durationMs: Math.round(performance.now() - startedAt),
        ok: check.expected(response.status) && bodyOk,
        ...(bodyOk ? {} : { error: "expected_content_missing" }),
      });
    } catch (error) {
      results.push({
        name: check.name,
        method: check.method,
        path: check.path,
        durationMs: Math.round(performance.now() - startedAt),
        ok: false,
        error: error instanceof Error ? error.name : "request_failed",
      });
    }
  }

  const checkedAt = new Date();
  const report = { checkedAt: checkedAt.toISOString(), baseUrl: baseUrl.origin, ok: results.every((result) => result.ok), results };
  console.log(JSON.stringify(report, null, 2));

  let state = await readHealthcheckState(stateFile);
  const transition = advanceHealthcheckState(state, report.ok, checkedAt);
  state = transition.state;
  await writeHealthcheckState(stateFile, state);

  const recipient = process.env.HEALTHCHECK_ALERT_EMAIL?.trim();
  if (recipient && transition.notification) {
    const notification = transition.notification;
    try {
      await sendHealthNotification(recipient, notification, report);
      state = recordHealthNotificationResult(state, notification, true, new Date());
      await writeHealthcheckState(stateFile, state);
    } catch (error) {
      state = recordHealthNotificationResult(state, notification, false, new Date());
      await writeHealthcheckState(stateFile, state);
      console.error("[healthcheck alert] delivery_failed", {
        notification,
        ...logSafeError(error),
      });
    }
  }
  if (!report.ok) process.exitCode = 1;
}

async function sendHealthNotification(
  recipient: string,
  notification: HealthNotification,
  report: { baseUrl: string; results: Array<{ name: string; ok: boolean }> },
): Promise<void> {
  const { emailTransporter, safeEmailRecipient } = await import("../src/lib/email-security");
  const outage = notification === "outage";
  const failedChecks = report.results.filter((result) => !result.ok).map((result) => result.name);
  await emailTransporter.sendMail({
    from: process.env.SMTP_FROM || "info@wepac.pt",
    to: safeEmailRecipient(recipient),
    subject: outage ? "[WEPAC] Site healthcheck failed" : "[WEPAC] Site healthcheck recovered",
    text: outage
      ? `The site healthcheck failed twice consecutively.\nOrigin: ${report.baseUrl}\nChecks: ${failedChecks.join(", ")}`
      : `The site healthcheck recovered after an alerted outage.\nOrigin: ${report.baseUrl}`,
  });
}

void run().catch((error) => {
  console.error("[healthcheck] run_failed", logSafeError(error));
  process.exitCode = 1;
});
