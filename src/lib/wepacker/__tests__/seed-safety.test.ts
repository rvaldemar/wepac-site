import { describe, expect, it } from "vitest";
import { assertDisposableSeedTarget } from "../../../../prisma/seed-safety";

const localTestUrl =
  "postgresql://fixture:fixture@127.0.0.1:55439/wepac_local_test";

describe("destructive seed safety", () => {
  it("requires manual capability plus the exact disposable database name", () => {
    expect(
      assertDisposableSeedTarget({
        DATABASE_URL: localTestUrl,
        WEPACKER_SEED_ALLOW_DB_RESET: "1",
        WEPACKER_SEED_DATABASE_NAME: "wepac_local_test",
      }),
    ).toEqual({ host: "127.0.0.1", databaseName: "wepac_local_test" });
  });

  it("accepts the existing E2E capability only for a safe loopback database", () => {
    expect(
      assertDisposableSeedTarget({
        DATABASE_URL: localTestUrl,
        E2E_ALLOW_DB_RESET: "1",
      }),
    ).toEqual({ host: "127.0.0.1", databaseName: "wepac_local_test" });
  });

  it.each([
    [{ DATABASE_URL: localTestUrl }, "capability"],
    [
      {
        DATABASE_URL: localTestUrl,
        WEPACKER_SEED_ALLOW_DB_RESET: "1",
        WEPACKER_SEED_DATABASE_NAME: "another_database",
      },
      "exact database name",
    ],
    [
      {
        DATABASE_URL:
          "postgresql://fixture:fixture@127.0.0.1:55439/wepac_production",
        E2E_ALLOW_DB_RESET: "1",
      },
      "not disposable",
    ],
    [
      {
        DATABASE_URL:
          "postgresql://fixture:fixture@db.internal:5432/wepac_local_test",
        E2E_ALLOW_DB_RESET: "1",
      },
      "not loopback",
    ],
  ])("refuses an unsafe target: %s", (env, message) => {
    expect(() => assertDisposableSeedTarget(env)).toThrow(message);
  });
});
