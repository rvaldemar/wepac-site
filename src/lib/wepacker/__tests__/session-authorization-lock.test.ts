import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(process.cwd(), "src/lib/wepacker/actions/session.ts"),
  "utf8",
);

describe("Session capability TOCTOU guard", () => {
  it("locks exact Mentorship and Cycle capability rows before Session insert", () => {
    const revalidation = source.match(
      /async function revalidateSessionAttendeesInTransaction[\s\S]*?\n}\n/,
    )?.[0];
    expect(revalidation).toBeDefined();
    expect(revalidation).toContain("Prisma.join(attendeeUserIds)");
    expect(revalidation?.match(/FOR SHARE/g)).toHaveLength(2);
    expect(revalidation).not.toContain("$queryRawUnsafe");

    const browserCreate = source.indexOf("export async function createSession(");
    const webhookCreate = source.indexOf(
      "export async function createSessionFromResolvedActors(",
    );
    const firstInnerRevalidation = source.indexOf(
      "revalidateSessionAttendeesInTransaction(tx",
      browserCreate,
    );
    const firstInsert = source.indexOf("tx.session.create", browserCreate);
    const secondInnerRevalidation = source.indexOf(
      "revalidateSessionAttendeesInTransaction(tx",
      webhookCreate,
    );
    const secondInsert = source.indexOf("tx.session.create", webhookCreate);

    expect(firstInnerRevalidation).toBeGreaterThan(browserCreate);
    expect(firstInnerRevalidation).toBeLessThan(firstInsert);
    expect(secondInnerRevalidation).toBeGreaterThan(webhookCreate);
    expect(secondInnerRevalidation).toBeLessThan(secondInsert);
  });
});
