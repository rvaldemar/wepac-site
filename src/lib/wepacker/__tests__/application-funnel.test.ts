import { beforeEach, describe, expect, it, vi } from "vitest";

// Story: fix the public application funnel (src/lib/wepacker/actions/application.ts).
//   Bug 1 — a re-application from a rejected/contacted candidate must return
//           to the pending queue instead of silently keeping its old status.
//   Bug 2 — a specific packSlug must survive a later resubmission through
//           the generic "wepacker" intake sentinel.
//   Bug 3 — the unauthenticated public write must be rate limited.

const packFindUnique = vi.fn();
const betaSignupFindUnique = vi.fn();
const betaSignupUpsert = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    pack: {
      findUnique: (...args: unknown[]) => packFindUnique(...args),
    },
    betaSignup: {
      findUnique: (...args: unknown[]) => betaSignupFindUnique(...args),
      upsert: (...args: unknown[]) => betaSignupUpsert(...args),
    },
  },
}));

const sendBetaSignupConfirmationEmail = vi.fn(async (..._args: unknown[]) => undefined);
const sendBetaSignupNotificationEmail = vi.fn(async (..._args: unknown[]) => undefined);

vi.mock("@/lib/email", () => ({
  sendBetaSignupConfirmationEmail: (...args: unknown[]) =>
    sendBetaSignupConfirmationEmail(...args),
  sendBetaSignupNotificationEmail: (...args: unknown[]) =>
    sendBetaSignupNotificationEmail(...args),
}));

vi.mock("@/lib/wepacker/guards", () => ({
  requireAdmin: vi.fn(),
}));

// submitApplication is a Server Action — it reads the visitor IP via
// next/headers rather than a Request object. Each test controls which IP
// the "incoming request" carries.
let visitorIp = "203.0.113.10";
vi.mock("next/headers", () => ({
  headers: async () => ({
    get: (name: string) => (name === "x-real-ip" ? visitorIp : null),
  }),
}));

// The rate limiter (src/lib/wessex/rate-limit.ts) is a module-level
// singleton scoped to the whole application.ts module, so its per-IP
// counters persist across every test in this file, not just within a
// single `it`. Each test gets its own never-reused IP so unrelated tests
// (including the ones deliberately exhausting a burst window below) can
// never bleed into each other's quota.
let ipSeq = 0;
function freshVisitorIp(): string {
  ipSeq += 1;
  return `10.${Math.floor(ipSeq / 65536) % 256}.${Math.floor(ipSeq / 256) % 256}.${ipSeq % 256}`;
}

import { submitApplication } from "@/lib/wepacker/actions/application";

describe("submitApplication — reapplication returns to the pending queue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    visitorIp = freshVisitorIp();
    betaSignupUpsert.mockResolvedValue({ id: "signup-1" });
  });

  it("resets a rejected candidate's status to pending and records the reapplication in notes", async () => {
    betaSignupFindUnique.mockResolvedValueOnce({
      status: "rejected",
      packSlug: "wepacker",
      notes: null,
    });

    await submitApplication({
      packSlug: "wepacker",
      name: "Maria Silva",
      email: "maria@example.com",
      motivation: "Quero tentar de novo.",
    });

    expect(betaSignupUpsert).toHaveBeenCalledTimes(1);
    const call = betaSignupUpsert.mock.calls[0][0];
    expect(call.update.status).toBe("pending");
    expect(call.update.notes).toContain("Estado anterior: rejected");
  });

  it("appends to existing admin notes rather than discarding them", async () => {
    betaSignupFindUnique.mockResolvedValueOnce({
      status: "contacted",
      packSlug: "wepacker",
      notes: "Falámos por telefone em maio.",
    });

    await submitApplication({
      packSlug: "wepacker",
      name: "João Costa",
      email: "joao@example.com",
    });

    const call = betaSignupUpsert.mock.calls[0][0];
    expect(call.update.notes).toContain("Falámos por telefone em maio.");
    expect(call.update.notes).toContain("Estado anterior: contacted");
    expect(call.update.status).toBe("pending");
  });

  it("does not touch status/notes on a genuinely first-time application", async () => {
    betaSignupFindUnique.mockResolvedValueOnce(null);

    await submitApplication({
      packSlug: "wepacker",
      name: "Ana Ferreira",
      email: "ana@example.com",
    });

    const call = betaSignupUpsert.mock.calls[0][0];
    expect(call.create).toBeDefined();
    expect(call.update.status).toBeUndefined();
    expect(call.update.notes).toBeUndefined();
  });
});

describe("submitApplication — specific packSlug survives a generic resubmission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    visitorIp = freshVisitorIp();
    betaSignupUpsert.mockResolvedValue({ id: "signup-2" });
  });

  it("keeps the existing specific packSlug when the new submission is the generic sentinel", async () => {
    betaSignupFindUnique.mockResolvedValueOnce({
      status: "pending",
      packSlug: "artist",
      notes: null,
    });

    await submitApplication({
      packSlug: "wepacker", // generic intake — no pack chosen this time
      name: "Rita Alves",
      email: "rita@example.com",
    });

    expect(packFindUnique).not.toHaveBeenCalled();
    const call = betaSignupUpsert.mock.calls[0][0];
    expect(call.update.packSlug).toBe("artist");
  });

  it("still updates packSlug when the new submission targets a different specific pack", async () => {
    betaSignupFindUnique.mockResolvedValueOnce({
      status: "pending",
      packSlug: "artist",
      notes: null,
    });
    packFindUnique.mockResolvedValueOnce({ slug: "easy-peasy", active: true });

    await submitApplication({
      packSlug: "easy-peasy",
      name: "Rita Alves",
      email: "rita@example.com",
    });

    const call = betaSignupUpsert.mock.calls[0][0];
    expect(call.update.packSlug).toBe("easy-peasy");
  });

  it("uses the generic sentinel for a genuinely first-time generic application", async () => {
    betaSignupFindUnique.mockResolvedValueOnce(null);

    await submitApplication({
      packSlug: "wepacker",
      name: "Nuno Pinto",
      email: "nuno@example.com",
    });

    const call = betaSignupUpsert.mock.calls[0][0];
    expect(call.create.packSlug).toBe("wepacker");
  });
});

describe("submitApplication — rate limiting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    visitorIp = freshVisitorIp();
    betaSignupFindUnique.mockResolvedValue(null);
    betaSignupUpsert.mockResolvedValue({ id: "signup-3" });
  });

  it("allows the burst limit of applications from the same visitor", async () => {
    for (let i = 0; i < 10; i++) {
      await expect(
        submitApplication({
          packSlug: "wepacker",
          name: "Visitor",
          email: `visitor${i}@example.com`,
        })
      ).resolves.toBeDefined();
    }
    expect(betaSignupUpsert).toHaveBeenCalledTimes(10);
  });

  it("blocks the 11th application from the same visitor within the burst window", async () => {
    for (let i = 0; i < 10; i++) {
      await submitApplication({
        packSlug: "wepacker",
        name: "Visitor",
        email: `visitor${i}@example.com`,
      });
    }
    betaSignupUpsert.mockClear();
    sendBetaSignupConfirmationEmail.mockClear();

    await expect(
      submitApplication({
        packSlug: "wepacker",
        name: "Visitor",
        email: "visitor-overflow@example.com",
      })
    ).rejects.toThrow();

    // The blocked call must never reach the DB or send email.
    expect(betaSignupUpsert).not.toHaveBeenCalled();
    expect(sendBetaSignupConfirmationEmail).not.toHaveBeenCalled();
  });

  it("tracks a different visitor IP independently of an exhausted one", async () => {
    for (let i = 0; i < 10; i++) {
      await submitApplication({
        packSlug: "wepacker",
        name: "Visitor",
        email: `visitor${i}@example.com`,
      });
    }
    visitorIp = freshVisitorIp();

    await expect(
      submitApplication({
        packSlug: "wepacker",
        name: "Other visitor",
        email: "other-visitor@example.com",
      })
    ).resolves.toBeDefined();
  });
});
