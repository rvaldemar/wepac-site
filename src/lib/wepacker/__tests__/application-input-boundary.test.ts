import { beforeEach, describe, expect, it, vi } from "vitest";

const headers = vi.fn();
const betaSignupCreate = vi.fn();
const betaSignupFindUniqueOrThrow = vi.fn();
const betaSignupFindMany = vi.fn();
const betaSignupSubmissionCreate = vi.fn();
const requireAdmin = vi.fn();
const sendBetaSignupConfirmationEmail = vi.fn();
const sendBetaSignupNotificationEmail = vi.fn();

vi.mock("next/headers", () => ({
  headers: (...args: unknown[]) => headers(...args),
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    betaSignup: {
      create: (...args: unknown[]) => betaSignupCreate(...args),
      findUniqueOrThrow: (...args: unknown[]) =>
        betaSignupFindUniqueOrThrow(...args),
      findMany: (...args: unknown[]) => betaSignupFindMany(...args),
    },
    betaSignupSubmission: {
      create: (...args: unknown[]) => betaSignupSubmissionCreate(...args),
    },
  },
}));
vi.mock("@/lib/email", () => ({
  sendBetaSignupConfirmationEmail: (...args: unknown[]) =>
    sendBetaSignupConfirmationEmail(...args),
  sendBetaSignupNotificationEmail: (...args: unknown[]) =>
    sendBetaSignupNotificationEmail(...args),
}));
vi.mock("@/lib/wepacker/guards", () => ({
  requireAdmin: (...args: unknown[]) => requireAdmin(...args),
}));

import {
  getApplications,
  submitApplication,
} from "@/lib/wepacker/actions/application";

describe("public WEPACKER intake boundary", () => {
  let ipCounter = 1;

  beforeEach(() => {
    vi.clearAllMocks();
    const ip = `192.0.2.${ipCounter++}`;
    headers.mockResolvedValue(new Headers({ "x-real-ip": ip }));
    betaSignupCreate.mockResolvedValue({ id: "application-1" });
    betaSignupFindUniqueOrThrow.mockResolvedValue({
      id: "application-1",
      name: "Alex Person",
      email: "alex@example.test",
    });
    betaSignupSubmissionCreate.mockResolvedValue({ id: "submission-2" });
    betaSignupFindMany.mockResolvedValue([]);
    requireAdmin.mockResolvedValue(undefined);
    sendBetaSignupConfirmationEmail.mockResolvedValue(undefined);
    sendBetaSignupNotificationEmail.mockResolvedValue(undefined);
  });

  it("creates one normalized append-only application", async () => {
    await expect(
      submitApplication({
        name: "  Alex Person  ",
        email: "  ALEX@EXAMPLE.TEST ",
        phone: "  +351 900 000 000 ",
        artisticArea: "  Arts ",
        socialLinks: "  https://example.test/alex ",
        motivation: "  Build a serious practice. ",
        source: "society",
      }),
    ).resolves.toEqual({ submitted: true });

    expect(betaSignupCreate).toHaveBeenCalledWith({
      data: {
        name: "Alex Person",
        email: "alex@example.test",
        phone: "+351 900 000 000",
        artisticArea: "Arts",
        socialLinks: "https://example.test/alex",
        motivation: "Build a serious practice.",
        submissions: {
          create: {
            submittedAt: expect.any(Date),
            source: "society",
            state: "canonical",
            name: "Alex Person",
            email: "alex@example.test",
            phone: "+351 900 000 000",
            artisticArea: "Arts",
            socialLinks: "https://example.test/alex",
            motivation: "Build a serious practice.",
          },
        },
      },
      select: { id: true },
    });
    expect(sendBetaSignupConfirmationEmail).toHaveBeenCalledOnce();
    expect(sendBetaSignupNotificationEmail).toHaveBeenCalledOnce();
  });

  it("acknowledges a duplicate without overwriting PII or sending email", async () => {
    betaSignupCreate.mockRejectedValue({ code: "P2002" });

    await expect(
      submitApplication({
        name: "Attacker Replacement",
        email: "alex@example.test",
        motivation: "Overwrite attempt",
        source: "academy",
      }),
    ).resolves.toEqual({ submitted: true });
    expect(betaSignupFindUniqueOrThrow).toHaveBeenCalledWith({
      where: { email: "alex@example.test" },
      select: { id: true, name: true, email: true },
    });
    expect(betaSignupSubmissionCreate).toHaveBeenCalledWith({
      data: {
        betaSignupId: "application-1",
        submittedAt: expect.any(Date),
        source: "academy",
        state: "unverified",
        name: "Alex Person",
        email: "alex@example.test",
        phone: null,
        artisticArea: null,
        socialLinks: null,
        motivation: null,
      },
      select: { id: true },
    });
    expect(sendBetaSignupConfirmationEmail).not.toHaveBeenCalled();
    expect(sendBetaSignupNotificationEmail).not.toHaveBeenCalled();
  });

  it.each([
    [
      {
        name: "Alex",
        email: "alex@example.test",
        source: "society",
        status: "joined",
      },
      "unsupported field",
    ],
    [
      { name: "Alex", email: "not-an-email", source: "society" },
      "Email inválido",
    ],
    [
      { name: "Alex", email: "alex@example.test", source: "admin" },
      "source inválida",
    ],
    [
      { name: "Alex", email: "alex@example.test" },
      "source inválida",
    ],
    [
      {
        name: "Alex",
        email: "alex@example.test",
        motivation: "x".repeat(501),
        source: "society",
      },
      "motivation não pode exceder",
    ],
  ])("rejects hostile or oversized input %#", async (input, message) => {
    await expect(submitApplication(input)).rejects.toThrow(message as string);
    expect(betaSignupCreate).not.toHaveBeenCalled();
  });

  it("rate-limits one trusted proxy address before database or email work", async () => {
    headers.mockResolvedValue(new Headers({ "x-real-ip": "198.51.100.44" }));
    betaSignupCreate.mockRejectedValue({ code: "P2002" });
    const input = {
      name: "Alex",
      email: "alex@example.test",
      source: "society",
    };

    for (let attempt = 0; attempt < 10; attempt += 1) {
      await expect(submitApplication(input)).resolves.toEqual({
        submitted: true,
      });
    }
    await expect(submitApplication(input)).rejects.toThrow(
      "Demasiadas tentativas",
    );
  });

  it("includes ordered submission history in the admin lead projection", async () => {
    await expect(getApplications()).resolves.toEqual([]);

    expect(requireAdmin).toHaveBeenCalledOnce();
    expect(betaSignupFindMany).toHaveBeenCalledWith({
      where: undefined,
      orderBy: { createdAt: "desc" },
      include: {
        submissions: { orderBy: { submittedAt: "desc" } },
      },
    });
  });
});
