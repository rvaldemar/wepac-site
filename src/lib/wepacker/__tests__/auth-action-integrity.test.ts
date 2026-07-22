import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAuthenticatedUser = vi.fn();
const userFindUnique = vi.fn();
const userUpdateMany = vi.fn();
const betaSignupFindUnique = vi.fn();
const betaSignupUpdate = vi.fn();
const passwordResetFindUnique = vi.fn();
const txQueryRaw = vi.fn();
const agreementUpsert = vi.fn();
const txUserUpdate = vi.fn();
const resetDeleteMany = vi.fn();
const resetCount = vi.fn();
const resetFindFirst = vi.fn();
const resetUpdateMany = vi.fn();
const resetCreate = vi.fn();
const sendPasswordResetEmail = vi.fn();

const tx = {
  $queryRaw: (...args: unknown[]) => txQueryRaw(...args),
  agreement: { upsert: (...args: unknown[]) => agreementUpsert(...args) },
  user: { update: (...args: unknown[]) => txUserUpdate(...args) },
  passwordResetToken: {
    deleteMany: (...args: unknown[]) => resetDeleteMany(...args),
    count: (...args: unknown[]) => resetCount(...args),
    findFirst: (...args: unknown[]) => resetFindFirst(...args),
    updateMany: (...args: unknown[]) => resetUpdateMany(...args),
    create: (...args: unknown[]) => resetCreate(...args),
  },
};
const transaction = vi.fn(
  async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx),
);

vi.mock("@/lib/wepacker/guards", () => ({
  requireAuthenticatedUser: (...args: unknown[]) =>
    requireAuthenticatedUser(...args),
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => userFindUnique(...args),
      updateMany: (...args: unknown[]) => userUpdateMany(...args),
    },
    betaSignup: {
      findUnique: (...args: unknown[]) => betaSignupFindUnique(...args),
      update: (...args: unknown[]) => betaSignupUpdate(...args),
    },
    passwordResetToken: {
      findUnique: (...args: unknown[]) => passwordResetFindUnique(...args),
    },
    $transaction: (callback: (client: typeof tx) => Promise<unknown>) =>
      transaction(callback),
  },
}));
vi.mock("@/lib/email", () => ({
  sendPasswordResetEmail: (...args: unknown[]) =>
    sendPasswordResetEmail(...args),
}));

import {
  acceptAgreement,
  acceptInvite,
  requestPasswordReset,
  resetPassword,
} from "@/lib/wepacker/actions/invite";

const INVITE_TOKEN = "11111111-1111-4111-8111-111111111111";
const RESET_TOKEN = "22222222-2222-4222-8222-222222222222";

describe("invite, agreement and password reset integrity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("APP_URL", "https://wepac.example.test");
    requireAuthenticatedUser.mockResolvedValue({
      id: "person-1",
      role: "member",
    });
    txQueryRaw.mockResolvedValue([]);
    agreementUpsert.mockResolvedValue({ id: "agreement-1" });
    txUserUpdate.mockResolvedValue({ id: "person-1" });
    resetDeleteMany.mockResolvedValue({ count: 0 });
    resetCount.mockResolvedValue(0);
    resetFindFirst.mockResolvedValue(null);
    resetUpdateMany.mockResolvedValue({ count: 1 });
    resetCreate.mockResolvedValue({ token: RESET_TOKEN });
    sendPasswordResetEmail.mockResolvedValue(undefined);
    betaSignupFindUnique.mockResolvedValue(null);
  });

  it("conditionally consumes an invite token only once", async () => {
    userFindUnique.mockResolvedValue({
      id: "person-1",
      email: "person@example.test",
      inviteExpiresAt: new Date(Date.now() + 60_000),
    });
    userUpdateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });

    await expect(
      acceptInvite(INVITE_TOKEN, "correct horse battery staple"),
    ).resolves.toEqual({ userId: "person-1" });
    await expect(
      acceptInvite(INVITE_TOKEN, "correct horse battery staple"),
    ).rejects.toThrow("Convite inválido ou expirado");

    expect(userUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "person-1",
          inviteToken: INVITE_TOKEN,
        }),
        data: expect.objectContaining({ inviteToken: null }),
      }),
    );
  });

  it("upserts one immutable Agreement evidence row before onboarding", async () => {
    await acceptAgreement();

    expect(agreementUpsert).toHaveBeenCalledWith({
      where: {
        userId_version: { userId: "person-1", version: "1.0" },
      },
      update: {},
      create: { userId: "person-1", version: "1.0" },
    });
    expect(txUserUpdate).toHaveBeenCalledWith({
      where: { id: "person-1" },
      data: { onboarded: true },
    });
  });

  it("serializes reset issuance, revokes prior tokens and emails once", async () => {
    userFindUnique.mockResolvedValue({
      id: "person-1",
      email: "canonical@example.test",
    });

    await requestPasswordReset(" CANONICAL@EXAMPLE.TEST ");

    expect(txQueryRaw).toHaveBeenCalledOnce();
    expect(resetUpdateMany).toHaveBeenCalledWith({
      where: { userId: "person-1", usedAt: null, revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
    expect(resetCreate).toHaveBeenCalledWith({
      data: {
        userId: "person-1",
        token: expect.stringMatching(
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
        ),
        expiresAt: expect.any(Date),
      },
      select: { token: true },
    });
    expect(sendPasswordResetEmail).toHaveBeenCalledWith(
      "canonical@example.test",
      `https://wepac.example.test/wepacker/password/reset?token=${RESET_TOKEN}`,
    );
  });

  it("suppresses reset email inside the cooldown without revealing why", async () => {
    userFindUnique.mockResolvedValue({
      id: "person-1",
      email: "canonical@example.test",
    });
    resetFindFirst.mockResolvedValue({ id: "recent-token" });

    await expect(
      requestPasswordReset("canonical@example.test"),
    ).resolves.toBeUndefined();
    expect(resetCreate).not.toHaveBeenCalled();
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("atomically consumes a reset token and rejects a replay", async () => {
    passwordResetFindUnique.mockResolvedValue({
      id: "reset-1",
      userId: "person-1",
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: null,
      revokedAt: null,
    });
    resetUpdateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });

    await expect(
      resetPassword(RESET_TOKEN, "correct horse battery staple"),
    ).resolves.toBeUndefined();
    await expect(
      resetPassword(RESET_TOKEN, "correct horse battery staple"),
    ).rejects.toThrow("Token inválido ou expirado");
    expect(txUserUpdate).toHaveBeenCalledOnce();
    expect(txUserUpdate).toHaveBeenCalledWith({
      where: { id: "person-1" },
      data: {
        passwordHash: expect.any(String),
        sessionVersion: { increment: 1 },
      },
    });
  });

  it("rejects passwords beyond bcrypt's UTF-8 input boundary", async () => {
    await expect(acceptInvite(INVITE_TOKEN, "é".repeat(40))).rejects.toThrow(
      "72 bytes UTF-8",
    );
    await expect(resetPassword(RESET_TOKEN, "x".repeat(73))).rejects.toThrow(
      "72 bytes UTF-8",
    );
    expect(userFindUnique).not.toHaveBeenCalled();
    expect(passwordResetFindUnique).not.toHaveBeenCalled();
  });
});
