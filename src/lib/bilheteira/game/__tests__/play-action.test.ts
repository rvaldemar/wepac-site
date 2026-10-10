import { beforeEach, describe, expect, it, vi } from "vitest";

const ticketFindUnique = vi.fn();
const participantFindUnique = vi.fn();
const participantCount = vi.fn();
const participantCreate = vi.fn();
const voucherCreate = vi.fn();
const voucherUpdate = vi.fn();
const sendVoucherEmail = vi.fn();
const queryRaw = vi.fn();
let cookieValue: string | undefined;

vi.mock("@/lib/db", () => ({
  prisma: {
    ticket: { findUnique: (...a: unknown[]) => ticketFindUnique(...a) },
    gameParticipant: {
      findUnique: (...a: unknown[]) => participantFindUnique(...a),
      count: (...a: unknown[]) => participantCount(...a),
    },
    prizeVoucher: { update: (...a: unknown[]) => voucherUpdate(...a) },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        $queryRaw: (...a: unknown[]) => queryRaw(...a),
        gameParticipant: {
          create: (...a: unknown[]) => participantCreate(...a),
          count: (...a: unknown[]) => participantCount(...a),
        },
        prizeVoucher: { create: (...a: unknown[]) => voucherCreate(...a) },
      }),
  },
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-forwarded-for": "10.0.0.1, 203.0.113.7" }),
  cookies: async () => ({
    get: (name: string) => (name === "bilheteira_game_kiosk" && cookieValue ? { value: cookieValue } : undefined),
    set: () => undefined,
  }),
}));

vi.mock("../voucher-email", () => ({
  sendVoucherEmail: (...a: unknown[]) => sendVoucherEmail(...a),
}));

import { lookupTicketForGame, playAction } from "../actions";
import { kioskCookieValue } from "../kiosk-access";
import { resetRateLimits } from "../rate-limit";

const CODE_RE = /^AC-[A-Z2-9]{4}-[A-Z2-9]{4}$/;

beforeEach(() => {
  vi.clearAllMocks();
  resetRateLimits();
  delete process.env.GAME_KIOSK_ACCESS_KEY;
  delete process.env.GAME_PUBLIC;
  process.env.NEXTAUTH_SECRET = "test-secret";
  cookieValue = undefined;
  participantCount.mockResolvedValue(0);
  queryRaw.mockResolvedValue([{ id: "locked" }]);
  participantCreate.mockImplementation(async ({ data }) => ({ id: "p1", ...data }));
  voucherCreate.mockResolvedValue({});
  voucherUpdate.mockResolvedValue({});
  sendVoucherEmail.mockResolvedValue(undefined);
});

describe("lookupTicketForGame", () => {
  it("extracts the id from the QR url and masks the email", async () => {
    ticketFindUnique.mockResolvedValue({
      id: "ckt1",
      buyerName: "Ana Maria Silva",
      buyerEmail: "ana.silva@example.com",
      seats: 4,
      status: "pending",
      event: { title: "Capela Viva" },
    });
    participantCount.mockResolvedValue(1);
    participantFindUnique.mockResolvedValue({ id: "p0" });
    const r = await lookupTicketForGame("https://wepac.pt/en/bilheteira/ticket/ckt1");
    expect(ticketFindUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "ckt1" } }));
    expect(r).toEqual({
      ok: true,
      ticketId: "ckt1",
      buyerName: "Ana",
      maskedEmail: "a••••••••@example.com",
      eventTitle: "Capela Viva",
      seats: 4,
      spinsUsed: 1,
      buyerPlayed: true,
    });
    expect(JSON.stringify(r)).not.toContain("ana.silva@");
  });

  it("treats cancelled or unknown tickets as not found", async () => {
    ticketFindUnique.mockResolvedValue(null);
    expect(await lookupTicketForGame("nope")).toEqual({ ok: false, error: "ticket_not_found" });
    ticketFindUnique.mockResolvedValue({ id: "x", buyerName: "A", buyerEmail: "a@b.pt", seats: 1, status: "cancelled", event: { title: "T" } });
    expect(await lookupTicketForGame("x")).toEqual({ ok: false, error: "ticket_not_found" });
  });
});

describe("playAction", () => {
  const base = { termsAccepted: true, marketingConsent: false, locale: "pt-PT" };
  const person = { name: "Rui Santos", email: "rui@wepac.pt" };

  it("refuses without accepted terms before touching the DB", async () => {
    const r = await playAction({ ...base, termsAccepted: false, identity: { mode: "email", person } });
    expect(r).toEqual({ ok: false, error: "terms_required" });
    // Truthy-but-not-true values are not acceptance either.
    const r2 = await playAction({ ...base, termsAccepted: "yes" as unknown as boolean, identity: { mode: "email", person } });
    expect(r2).toEqual({ ok: false, error: "terms_required" });
    expect(participantFindUnique).not.toHaveBeenCalled();
  });

  it("validates name, email and phone in email mode", async () => {
    expect(await playAction({ ...base, identity: { mode: "email", person: { name: "Ana", email: "not-an-email" } } }))
      .toEqual({ ok: false, error: "invalid_email" });
    expect(await playAction({ ...base, identity: { mode: "email", person: { name: "Ana", email: "x,victim@a.com" } } }))
      .toEqual({ ok: false, error: "invalid_email" });
    expect(await playAction({ ...base, identity: { mode: "email", person: { name: " ", email: "a@b.pt" } } }))
      .toEqual({ ok: false, error: "invalid_name" });
    expect(await playAction({ ...base, identity: { mode: "email", person: { name: "Ana", email: "a@b.pt", phone: "abc" } } }))
      .toEqual({ ok: false, error: "invalid_phone" });
    expect(participantFindUnique).not.toHaveBeenCalled();
  });

  it("email mode: creates participant + voucher, records consent and delivers the code by email only", async () => {
    participantFindUnique.mockResolvedValue(null);
    const r = await playAction({
      ...base,
      marketingConsent: true,
      identity: { mode: "email", person: { name: "  Rui   Santos ", email: " Rui.San.tos+promo@Gmail.com ", phone: "+351 912 345 678" } },
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.code).toBeNull();
    expect(r.emailSent).toBe(true);
    expect(r.maskedEmail).toBe("r••••••••@gmail.com");
    const created = participantCreate.mock.calls[0][0].data;
    // Gmail aliases collapse to one identity.
    expect(created.email).toBe("ruisantos@gmail.com");
    expect(created.name).toBe("Rui Santos");
    expect(created.phone).toBe("+351 912 345 678");
    expect(created.termsAcceptedAt).toBeInstanceOf(Date);
    expect(created.marketingConsentAt).toBeInstanceOf(Date);
    expect(created.consentVersion).toBeTruthy();
    const voucher = voucherCreate.mock.calls[0][0].data;
    expect(voucher.code).toMatch(CODE_RE);
    expect(voucher.participantId).toBe("p1");
    expect(sendVoucherEmail).toHaveBeenCalledWith(expect.objectContaining({ to: "ruisantos@gmail.com", code: voucher.code, participantId: "p1" }));
    expect(voucherUpdate).toHaveBeenCalledWith(expect.objectContaining({ where: { code: voucher.code } }));
    // No ticket means no row lock.
    expect(queryRaw).not.toHaveBeenCalled();
  });

  it("email mode: shows the code only when delivery failed", async () => {
    participantFindUnique.mockResolvedValue(null);
    sendVoucherEmail.mockRejectedValue(new Error("smtp down 550 ok@x.pt"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const r = await playAction({ ...base, identity: { mode: "email", person: { name: "Ok", email: "ok@x.pt" } } });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.emailSent).toBe(false);
      expect(r.code).toMatch(CODE_RE);
    }
    // Recipient address must not reach the logs.
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain("ok@x.pt");
    errorSpy.mockRestore();
  });

  it("stores a null marketing consent when the opt-in is unchecked", async () => {
    participantFindUnique.mockResolvedValue(null);
    await playAction({ ...base, identity: { mode: "email", person: { name: "X Y", email: "x@y.pt" } } });
    expect(participantCreate.mock.calls[0][0].data.marketingConsentAt).toBeNull();
  });

  it("buyer mode uses the DB email, locks the ticket row and shows the code", async () => {
    ticketFindUnique.mockResolvedValue({ id: "ckt1", buyerEmail: "Owner@Example.com", buyerName: "Owner", seats: 1, status: "pending" });
    participantFindUnique.mockResolvedValue(null);
    const r = await playAction({ ...base, identity: { mode: "ticket", ticketId: "ckt1" } });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.code).toMatch(CODE_RE);
    expect(queryRaw).toHaveBeenCalledTimes(1);
    const created = participantCreate.mock.calls[0][0].data;
    expect(created.email).toBe("owner@example.com");
    expect(created.name).toBe("Owner");
    expect(created.ticketId).toBe("ckt1");
  });

  it("registers a companion against a multi-seat ticket and shows the code", async () => {
    ticketFindUnique.mockResolvedValue({ id: "ckt2", buyerEmail: "owner@x.pt", buyerName: "Owner", seats: 3, status: "pending" });
    participantFindUnique.mockResolvedValue(null);
    participantCount.mockResolvedValue(1);
    const r = await playAction({
      ...base,
      identity: { mode: "ticket", ticketId: "ckt2", companion: { name: "Bea Costa", email: "bea@x.pt" } },
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.code).toMatch(CODE_RE);
    expect(participantCreate.mock.calls[0][0].data).toMatchObject({ email: "bea@x.pt", name: "Bea Costa", ticketId: "ckt2" });
  });

  it("refuses a companion once the ticket's seats are all used", async () => {
    ticketFindUnique.mockResolvedValue({ id: "ckt2", buyerEmail: "owner@x.pt", buyerName: "Owner", seats: 2, status: "pending" });
    participantFindUnique.mockResolvedValue(null);
    participantCount.mockResolvedValue(2);
    const r = await playAction({
      ...base,
      identity: { mode: "ticket", ticketId: "ckt2", companion: { name: "Carla D", email: "carla@x.pt" } },
    });
    expect(r).toEqual({ ok: false, error: "ticket_exhausted" });
    expect(participantCreate).not.toHaveBeenCalled();
    expect(voucherCreate).not.toHaveBeenCalled();
  });

  it("validates companion details", async () => {
    ticketFindUnique.mockResolvedValue({ id: "ckt2", buyerEmail: "owner@x.pt", buyerName: "Owner", seats: 3, status: "pending" });
    const r = await playAction({ ...base, identity: { mode: "ticket", ticketId: "ckt2", companion: { name: "Bea", email: "nope" } } });
    expect(r).toEqual({ ok: false, error: "invalid_email" });
  });

  it("typed email that already played: re-sends the code, never shows it", async () => {
    participantFindUnique.mockResolvedValue({
      id: "p1",
      vouchers: [{ kind: "free_ticket_single_2026", code: "AC-AAAA-BBBB", validUntil: new Date("2026-12-31T23:59:59Z") }],
    });
    const r = await playAction({ ...base, identity: { mode: "email", person: { name: "Dup", email: "dup@x.pt" } } });
    expect(r).toEqual({
      ok: false,
      error: "already_played",
      kind: "free_ticket_single_2026",
      code: null,
      resent: true,
      maskedEmail: "d••@x.pt",
    });
    expect(sendVoucherEmail).toHaveBeenCalledWith(expect.objectContaining({ to: "dup@x.pt", code: "AC-AAAA-BBBB" }));
    expect(voucherCreate).not.toHaveBeenCalled();
  });

  it("ticket buyer who already played sees the existing code again", async () => {
    ticketFindUnique.mockResolvedValue({ id: "ckt1", buyerEmail: "owner@x.pt", buyerName: "Owner", seats: 1, status: "pending" });
    participantFindUnique.mockResolvedValue({
      id: "p1",
      vouchers: [{ kind: "two_for_one_all_2026", code: "AC-CCCC-DDDD", validUntil: new Date("2026-12-31T23:59:59Z") }],
    });
    const r = await playAction({ ...base, identity: { mode: "ticket", ticketId: "ckt1" } });
    expect(r).toMatchObject({ ok: false, error: "already_played", code: "AC-CCCC-DDDD", resent: false });
    expect(sendVoucherEmail).not.toHaveBeenCalled();
  });

  it("regenerates on a code collision but surfaces the winner on an email race", async () => {
    const { Prisma } = await import("@prisma/client");
    const p2002 = (target: string[]) =>
      new Prisma.PrismaClientKnownRequestError("dup", { code: "P2002", clientVersion: "x", meta: { target } });
    participantFindUnique.mockResolvedValueOnce(null);
    voucherCreate.mockRejectedValueOnce(p2002(["code"])).mockResolvedValueOnce({});
    const r = await playAction({ ...base, identity: { mode: "email", person } });
    expect(r.ok).toBe(true);
    expect(voucherCreate).toHaveBeenCalledTimes(2);

    vi.clearAllMocks();
    participantCount.mockResolvedValue(0);
    participantFindUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "p9", vouchers: [{ kind: "two_for_one_single_2026", code: "AC-EEEE-FFFF", validUntil: new Date() }] });
    participantCreate.mockRejectedValueOnce(p2002(["campaign", "email"]));
    const r2 = await playAction({ ...base, identity: { mode: "email", person } });
    expect(r2).toMatchObject({ ok: false, error: "already_played", code: null });
  });

  it("is locked when a kiosk key is configured and no cookie is present, and open with the cookie", async () => {
    process.env.GAME_KIOSK_ACCESS_KEY = "secret-kiosk";
    expect(await playAction({ ...base, identity: { mode: "email", person } })).toEqual({ ok: false, error: "locked" });
    cookieValue = kioskCookieValue();
    participantFindUnique.mockResolvedValue(null);
    const r = await playAction({ ...base, identity: { mode: "email", person } });
    expect(r.ok).toBe(true);
  });

  it("fails closed in production when no key and no GAME_PUBLIC are set", async () => {
    const prev = process.env.NODE_ENV;
    vi.stubEnv("NODE_ENV", "production");
    try {
      expect(await playAction({ ...base, identity: { mode: "email", person } })).toEqual({ ok: false, error: "locked" });
      vi.stubEnv("GAME_PUBLIC", "1");
      participantFindUnique.mockResolvedValue(null);
      expect((await playAction({ ...base, identity: { mode: "email", person } })).ok).toBe(true);
    } finally {
      vi.stubEnv("NODE_ENV", prev ?? "test");
      vi.unstubAllEnvs();
    }
  });
});
