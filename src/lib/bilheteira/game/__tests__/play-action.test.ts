import { beforeEach, describe, expect, it, vi } from "vitest";

const ticketFindUnique = vi.fn();
const participantFindUnique = vi.fn();
const participantCount = vi.fn();
const participantCreate = vi.fn();
const voucherCreate = vi.fn();
const voucherUpdate = vi.fn();
const sendVoucherEmail = vi.fn();

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
        gameParticipant: {
          create: (...a: unknown[]) => participantCreate(...a),
          count: (...a: unknown[]) => participantCount(...a),
        },
        prizeVoucher: { create: (...a: unknown[]) => voucherCreate(...a) },
      }),
  },
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-forwarded-for": "203.0.113.7" }),
  cookies: async () => ({ get: () => undefined, set: () => undefined }),
}));

vi.mock("../voucher-email", () => ({
  sendVoucherEmail: (...a: unknown[]) => sendVoucherEmail(...a),
}));

import { lookupTicketForGame, playAction } from "../actions";
import { resetRateLimits } from "../rate-limit";

beforeEach(() => {
  vi.clearAllMocks();
  resetRateLimits();
  participantCount.mockResolvedValue(0);
  delete process.env.GAME_KIOSK_ACCESS_KEY;
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
    // Full email must never leave the server on this path.
    expect(JSON.stringify(r)).not.toContain("ana.silva@");
  });

  it("treats cancelled or unknown tickets as not found", async () => {
    ticketFindUnique.mockResolvedValue(null);
    expect(await lookupTicketForGame("nope")).toEqual({ ok: false, error: "ticket_not_found" });
    ticketFindUnique.mockResolvedValue({ id: "x", buyerName: "A", buyerEmail: "a@b.pt", status: "cancelled", event: { title: "T" } });
    expect(await lookupTicketForGame("x")).toEqual({ ok: false, error: "ticket_not_found" });
  });
});

describe("playAction", () => {
  const base = { termsAccepted: true, marketingConsent: false, locale: "pt-PT" };

  it("refuses without accepted terms before touching the DB", async () => {
    const r = await playAction({ ...base, termsAccepted: false, identity: { mode: "email", person: { name: "A B", email: "a@b.pt" } } });
    expect(r).toEqual({ ok: false, error: "terms_required" });
    expect(participantFindUnique).not.toHaveBeenCalled();
  });

  it("validates name, email and phone in email mode", async () => {
    expect(await playAction({ ...base, identity: { mode: "email", person: { name: "Ana", email: "not-an-email" } } }))
      .toEqual({ ok: false, error: "invalid_email" });
    expect(await playAction({ ...base, identity: { mode: "email", person: { name: " ", email: "a@b.pt" } } }))
      .toEqual({ ok: false, error: "invalid_name" });
    expect(await playAction({ ...base, identity: { mode: "email", person: { name: "Ana", email: "a@b.pt", phone: "abc" } } }))
      .toEqual({ ok: false, error: "invalid_phone" });
    expect(participantFindUnique).not.toHaveBeenCalled();
  });

  it("creates participant + voucher, records consent timestamps and emails the code", async () => {
    participantFindUnique.mockResolvedValue(null);
    const r = await playAction({
      ...base,
      marketingConsent: true,
      identity: { mode: "email", person: { name: "  Rui   Santos ", email: " Rui@WEPAC.pt ", phone: "+351 912 345 678" } },
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.code).toMatch(/^AC-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect(r.maskedEmail).toBe("r••@wepac.pt");
    expect(r.emailSent).toBe(true);
    const created = participantCreate.mock.calls[0][0].data;
    expect(created.email).toBe("rui@wepac.pt");
    expect(created.name).toBe("Rui Santos");
    expect(created.phone).toBe("+351 912 345 678");
    expect(created.termsAcceptedAt).toBeInstanceOf(Date);
    expect(created.marketingConsentAt).toBeInstanceOf(Date);
    expect(created.consentVersion).toBeTruthy();
    expect(voucherCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ code: r.code, kind: r.kind, participantId: "p1" }) }),
    );
    expect(sendVoucherEmail).toHaveBeenCalledWith(expect.objectContaining({ to: "rui@wepac.pt", code: r.code }));
    expect(voucherUpdate).toHaveBeenCalledWith(expect.objectContaining({ where: { code: r.code } }));
  });

  it("stores a null marketing consent when the opt-in is unchecked", async () => {
    participantFindUnique.mockResolvedValue(null);
    await playAction({ ...base, identity: { mode: "email", person: { name: "X Y", email: "x@y.pt" } } });
    expect(participantCreate.mock.calls[0][0].data.marketingConsentAt).toBeNull();
  });

  it("in ticket mode uses the DB email, never a client-supplied one", async () => {
    ticketFindUnique.mockResolvedValue({ id: "ckt1", buyerEmail: "Owner@Example.com", buyerName: "Owner", seats: 1, status: "pending" });
    participantFindUnique.mockResolvedValue(null);
    participantCount.mockResolvedValue(0);
    const r = await playAction({ ...base, identity: { mode: "ticket", ticketId: "ckt1" } });
    expect(r.ok).toBe(true);
    const created = participantCreate.mock.calls[0][0].data;
    expect(created.email).toBe("owner@example.com");
    expect(created.name).toBe("Owner");
    expect(created.ticketId).toBe("ckt1");
  });

  it("registers a companion against a multi-seat ticket", async () => {
    ticketFindUnique.mockResolvedValue({ id: "ckt2", buyerEmail: "owner@x.pt", buyerName: "Owner", seats: 3, status: "pending" });
    participantFindUnique.mockResolvedValue(null);
    participantCount.mockResolvedValue(1);
    const r = await playAction({
      ...base,
      identity: { mode: "ticket", ticketId: "ckt2", companion: { name: "Bea Costa", email: "bea@x.pt" } },
    });
    expect(r.ok).toBe(true);
    const created = participantCreate.mock.calls[0][0].data;
    expect(created).toMatchObject({ email: "bea@x.pt", name: "Bea Costa", ticketId: "ckt2" });
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
    const r = await playAction({
      ...base,
      identity: { mode: "ticket", ticketId: "ckt2", companion: { name: "Bea", email: "nope" } },
    });
    expect(r).toEqual({ ok: false, error: "invalid_email" });
  });

  it("returns the existing prize when the email already played", async () => {
    participantFindUnique.mockResolvedValue({
      id: "p1",
      vouchers: [{ kind: "free_ticket_single_2026", code: "AC-AAAA-BBBB" }],
    });
    const r = await playAction({ ...base, identity: { mode: "email", person: { name: "Dup", email: "dup@x.pt" } } });
    expect(r).toEqual({
      ok: false,
      error: "already_played",
      kind: "free_ticket_single_2026",
      code: "AC-AAAA-BBBB",
      maskedEmail: "d••@x.pt",
    });
    expect(voucherCreate).not.toHaveBeenCalled();
  });

  it("still returns the prize when the email fails to send", async () => {
    participantFindUnique.mockResolvedValue(null);
    sendVoucherEmail.mockRejectedValue(new Error("smtp down 550 dup@x.pt"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const r = await playAction({ ...base, identity: { mode: "email", person: { name: "Ok", email: "ok@x.pt" } } });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.emailSent).toBe(false);
    // Recipient address must not reach the logs.
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain("dup@x.pt");
    errorSpy.mockRestore();
  });

  it("is locked when a kiosk key is configured and no cookie is present", async () => {
    process.env.GAME_KIOSK_ACCESS_KEY = "secret-kiosk";
    const r = await playAction({ ...base, identity: { mode: "email", person: { name: "A B", email: "a@b.pt" } } });
    expect(r).toEqual({ ok: false, error: "locked" });
  });
});
