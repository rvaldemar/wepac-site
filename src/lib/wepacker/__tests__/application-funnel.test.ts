import { beforeEach, describe, expect, it, vi } from "vitest";

// Story: fix the public application funnel (src/lib/wepacker/actions/application.ts).
//   Bug 1 — a re-application from a rejected/contacted candidate must return
//           to the pending queue instead of silently keeping its old status.
//   Bug 2 — the generic Life Plan intake must remain a distinct offer from
//           specific Discipline applications held by the same person.
//   Bug 3 — the unauthenticated public write must be rate limited.
//   Bug 4 — BetaSignup.email was a GLOBAL unique constraint, so the same
//           person could only ever hold one application across every WEPAC
//           offer: applying to a second offer silently overwrote (and
//           re-tagged) the first one. Applications are now unique per
//           (email, packSlug) — the same human can hold a standing
//           application per offer.

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

const sendBetaSignupConfirmationEmail = vi.fn(async (...args: unknown[]) => {
  void args;
});
const sendBetaSignupNotificationEmail = vi.fn(async (...args: unknown[]) => {
  void args;
});

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

    // Looked up by (email, packSlug) — the composite key an application
    // is now unique on — not by email alone.
    expect(betaSignupFindUnique.mock.calls[0][0]).toEqual({
      where: { email_packSlug: { email: "maria@example.com", packSlug: "wepacker" } },
      select: { status: true, packSlug: true, notes: true },
    });

    expect(betaSignupUpsert).toHaveBeenCalledTimes(1);
    const call = betaSignupUpsert.mock.calls[0][0];
    expect(call.where).toEqual({
      email_packSlug: { email: "maria@example.com", packSlug: "wepacker" },
    });
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

describe("submitApplication — one application per (person, offer)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    visitorIp = freshVisitorIp();
    betaSignupUpsert.mockResolvedValue({ id: "signup-multi" });
  });

  it("creates two independent rows when the same email applies to two different offers", async () => {
    packFindUnique.mockResolvedValueOnce({ slug: "artist", active: true });
    betaSignupFindUnique.mockResolvedValueOnce(null); // no prior "artist" application

    await submitApplication({
      packSlug: "artist",
      name: "Carla Nunes",
      email: "carla@example.com",
    });

    const firstCall = betaSignupUpsert.mock.calls[0][0];
    expect(firstCall.where).toEqual({
      email_packSlug: { email: "carla@example.com", packSlug: "artist" },
    });
    expect(firstCall.create.packSlug).toBe("artist");
    // A brand new offer for this email — never folded into a reapplication.
    expect(firstCall.update.status).toBeUndefined();

    betaSignupUpsert.mockClear();
    packFindUnique.mockResolvedValueOnce({ slug: "summer-university", active: true });
    // The "artist" application from above exists now, but this submission
    // targets a *different* specific offer — its own composite key — so
    // the exact lookup for ("carla@example.com", "summer-university")
    // still finds nothing.
    betaSignupFindUnique.mockResolvedValueOnce(null);

    await submitApplication({
      packSlug: "summer-university",
      name: "Carla Nunes",
      email: "carla@example.com",
    });

    const secondCall = betaSignupUpsert.mock.calls[0][0];
    expect(secondCall.where).toEqual({
      email_packSlug: { email: "carla@example.com", packSlug: "summer-university" },
    });
    expect(secondCall.create.packSlug).toBe("summer-university");
    expect(secondCall.update.status).toBeUndefined();

    // Two separate offers -> two separate upsert calls, each its own row —
    // never a single row whose packSlug got overwritten.
    expect(firstCall.where).not.toEqual(secondCall.where);
  });

  it("re-applying to the same offer updates that row and returns it to pending, without duplicating it", async () => {
    packFindUnique.mockResolvedValueOnce({ slug: "summer-university", active: true });
    betaSignupFindUnique.mockResolvedValueOnce({
      status: "rejected",
      packSlug: "summer-university",
      notes: null,
    });

    await submitApplication({
      packSlug: "summer-university",
      name: "Diogo Reis",
      email: "diogo@example.com",
    });

    expect(betaSignupFindUnique).toHaveBeenCalledWith({
      where: {
        email_packSlug: { email: "diogo@example.com", packSlug: "summer-university" },
      },
      select: { status: true, packSlug: true, notes: true },
    });
    expect(betaSignupUpsert).toHaveBeenCalledTimes(1);
    const call = betaSignupUpsert.mock.calls[0][0];
    expect(call.where).toEqual({
      email_packSlug: { email: "diogo@example.com", packSlug: "summer-university" },
    });
    expect(call.update.status).toBe("pending");
    expect(call.update.notes).toContain("Estado anterior: rejected");
  });
});

describe("submitApplication — Life Plan intake stays distinct", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    visitorIp = freshVisitorIp();
    betaSignupUpsert.mockResolvedValue({ id: "signup-2" });
  });

  it("creates a Life Plan row independently from any specific application", async () => {
    betaSignupFindUnique.mockResolvedValueOnce(null);

    await submitApplication({
      packSlug: "wepacker",
      name: "Rita Alves",
      email: "rita@example.com",
    });

    expect(packFindUnique).not.toHaveBeenCalled();
    expect(betaSignupFindUnique).toHaveBeenCalledWith({
      where: {
        email_packSlug: { email: "rita@example.com", packSlug: "wepacker" },
      },
      select: { status: true, packSlug: true, notes: true },
    });
    const call = betaSignupUpsert.mock.calls[0][0];
    expect(call.where).toEqual({
      email_packSlug: { email: "rita@example.com", packSlug: "wepacker" },
    });
    expect(call.create.packSlug).toBe("wepacker");
    expect(call.update.status).toBeUndefined();
  });

  it("still updates packSlug when the new submission targets a different specific pack", async () => {
    betaSignupFindUnique.mockResolvedValueOnce({
      status: "pending",
      packSlug: "easy-peasy",
      notes: null,
    });
    packFindUnique.mockResolvedValueOnce({ slug: "easy-peasy", active: true });

    await submitApplication({
      packSlug: "easy-peasy",
      name: "Rita Alves",
      email: "rita@example.com",
    });

    const call = betaSignupUpsert.mock.calls[0][0];
    expect(call.where).toEqual({
      email_packSlug: { email: "rita@example.com", packSlug: "easy-peasy" },
    });
  });

  it("clears stale artistic fields on a non-artistic Life Plan resubmission", async () => {
    betaSignupFindUnique.mockResolvedValueOnce({
      status: "contacted",
      packSlug: "wepacker",
      notes: null,
    });

    await submitApplication({
      packSlug: "wepacker",
      name: "Nuno Pinto",
      email: "nuno@example.com",
      motivation: "Entro como família.",
    });

    const call = betaSignupUpsert.mock.calls[0][0];
    expect(call.update.artisticArea).toBeNull();
    expect(call.update.socialLinks).toBeNull();
  });

  it("uses Life Plan semantics in both transactional emails", async () => {
    betaSignupFindUnique.mockResolvedValueOnce(null);

    await submitApplication({
      packSlug: "wepacker",
      name: "Nuno Pinto",
      email: "nuno@example.com",
    });

    expect(sendBetaSignupConfirmationEmail).toHaveBeenCalledWith(
      "Nuno Pinto",
      "nuno@example.com",
      "life-plan"
    );
    expect(sendBetaSignupNotificationEmail).toHaveBeenCalledWith(
      "Nuno Pinto",
      "nuno@example.com",
      undefined,
      "life-plan"
    );
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
