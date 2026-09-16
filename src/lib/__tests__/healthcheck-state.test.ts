import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  advanceHealthcheckState,
  initialHealthcheckState,
  readHealthcheckState,
  recordHealthNotificationResult,
  writeHealthcheckState,
} from "@/lib/healthcheck-state";

const temporaryDirectories: string[] = [];
const T0 = new Date("2026-08-25T12:00:00.000Z");

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((path) => rm(path, { recursive: true })));
});

describe("healthcheck state", () => {
  it("alerts after two consecutive failures and recovers exactly once", () => {
    let state = initialHealthcheckState(T0);
    let transition = advanceHealthcheckState(state, false, T0);
    expect(transition.notification).toBeNull();

    transition = advanceHealthcheckState(transition.state, false, T0);
    expect(transition.notification).toBe("outage");
    state = recordHealthNotificationResult(transition.state, "outage", true, T0);

    transition = advanceHealthcheckState(state, false, T0);
    expect(transition.notification).toBeNull();
    transition = advanceHealthcheckState(transition.state, true, T0);
    expect(transition.notification).toBe("recovery");
    state = recordHealthNotificationResult(transition.state, "recovery", true, T0);

    expect(advanceHealthcheckState(state, true, T0).notification).toBeNull();
  });

  it("backs off a failed notification instead of retrying every run", () => {
    const first = advanceHealthcheckState(
      { ...initialHealthcheckState(T0), consecutiveFailures: 1 },
      false,
      T0,
    );
    const failed = recordHealthNotificationResult(first.state, "outage", false, T0);

    expect(advanceHealthcheckState(failed, false, new Date(T0.getTime() + 5 * 60_000)).notification).toBeNull();
    expect(advanceHealthcheckState(failed, false, new Date(T0.getTime() + 15 * 60_000)).notification).toBe("outage");
  });

  it("writes an atomic 0600 content-free JSON state file", async () => {
    const directory = await mkdtemp(join(tmpdir(), "wepac-health-state-"));
    temporaryDirectories.push(directory);
    const path = join(directory, "nested", "state.json");
    const state = { ...initialHealthcheckState(T0), consecutiveFailures: 2 };

    await writeHealthcheckState(path, state);

    expect((await stat(path)).mode & 0o777).toBe(0o600);
    expect(await readHealthcheckState(path)).toEqual(state);
    const parsed = JSON.parse(await readFile(path, "utf8"));
    expect(Object.keys(parsed).sort()).toEqual([
      "consecutiveFailures",
      "nextNotificationAt",
      "notificationAttempts",
      "outageAlertSent",
      "updatedAt",
      "version",
    ]);
    expect(JSON.stringify(parsed)).not.toMatch(/smtp|secret|password|url|body|header/i);
  });
});
