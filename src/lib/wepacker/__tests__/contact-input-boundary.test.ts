import { beforeEach, describe, expect, it, vi } from "vitest";

const headers = vi.fn();
const leadCreate = vi.fn();
const sendLeadNotificationEmail = vi.fn();

vi.mock("next/headers", () => ({
  headers: (...args: unknown[]) => headers(...args),
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    lead: { create: (...args: unknown[]) => leadCreate(...args) },
  },
}));
vi.mock("@/lib/email", () => ({
  sendLeadNotificationEmail: (...args: unknown[]) =>
    sendLeadNotificationEmail(...args),
}));

import { submitContactLead } from "@/lib/wepacker/actions/contact";

describe("public contact boundary", () => {
  let ipCounter = 1;

  beforeEach(() => {
    vi.clearAllMocks();
    headers.mockResolvedValue(
      new Headers({ "x-real-ip": `203.0.113.${ipCounter++}` }),
    );
    leadCreate.mockResolvedValue({ id: "lead-1" });
    sendLeadNotificationEmail.mockResolvedValue(undefined);
  });

  it("stores a normalized request without inventing consent", async () => {
    await expect(
      submitContactLead({
        name: "  Alex  ",
        email: "  ALEX@EXAMPLE.TEST ",
        subject: "parcerias",
        message: "  Quero falar convosco.  ",
        ensemble: "  Trio  ",
        service: "  Evento  ",
        total: "  500 EUR  ",
      }),
    ).resolves.toEqual({ submitted: true });

    expect(leadCreate).toHaveBeenCalledWith({
      data: {
        name: "Alex",
        email: "alex@example.test",
        eventType: "Evento",
        ensemble: "Trio",
        estimatedBudget: "500 EUR",
        notes: "parcerias\n\nQuero falar convosco.",
        source: "contact",
        consentGiven: false,
        consentTimestamp: null,
      },
      select: { id: true },
    });
    expect(sendLeadNotificationEmail).toHaveBeenCalledOnce();
  });

  it("quietly acknowledges a filled honeypot without persisting PII", async () => {
    await expect(
      submitContactLead({
        name: "Bot",
        email: "bot@example.test",
        message: "spam",
        honey: "filled",
      }),
    ).resolves.toEqual({ submitted: true });
    expect(leadCreate).not.toHaveBeenCalled();
    expect(sendLeadNotificationEmail).not.toHaveBeenCalled();
  });

  it.each([
    [{ name: "Alex", email: "alex@example.test", message: "Hi", role: "admin" }],
    [{ name: "Alex", email: "invalid", message: "Hi" }],
    [{ name: "Alex", email: "alex@example.test", message: "x".repeat(10_001) }],
    [{ name: "Alex", email: "alex@example.test", message: "Hi", subject: "other" }],
  ])("rejects hostile or oversized input %#", async (input) => {
    await expect(submitContactLead(input)).rejects.toThrow();
    expect(leadCreate).not.toHaveBeenCalled();
  });

  it("rate-limits one trusted proxy address before persistence", async () => {
    headers.mockResolvedValue(new Headers({ "x-real-ip": "198.51.100.88" }));
    const input = {
      name: "Alex",
      email: "alex@example.test",
      message: "Hello",
    };
    for (let attempt = 0; attempt < 10; attempt += 1) {
      await expect(submitContactLead(input)).resolves.toEqual({ submitted: true });
    }
    await expect(submitContactLead(input)).rejects.toThrow("Demasiadas tentativas");
    expect(leadCreate).toHaveBeenCalledTimes(10);
  });
});
