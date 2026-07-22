"use server";

import { prisma } from "@/lib/db";
import { hashSync } from "bcryptjs";
import { randomUUID } from "crypto";
import { requireAuthenticatedUser } from "@/lib/wepacker/guards";
import { logSafeError } from "@/lib/wepacker/log-safe-error";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_TOKEN_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_EMAIL_LENGTH = 320;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_BYTES = 72;
const RESET_COOLDOWN_MS = 10 * 60 * 1000;
const RESET_WINDOW_MS = 24 * 60 * 60 * 1000;
const RESET_MAX_PER_WINDOW = 5;
const RESET_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

function parseOpaqueToken(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const token = value.trim();
  return UUID_TOKEN_PATTERN.test(token) ? token : null;
}

function parsePassword(value: unknown): string {
  if (typeof value !== "string") throw new Error("Password inválida.");
  if (value.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `A password deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`,
    );
  }
  if (Buffer.byteLength(value, "utf8") > MAX_PASSWORD_BYTES) {
    throw new Error(
      `A password não pode exceder ${MAX_PASSWORD_BYTES} bytes UTF-8.`,
    );
  }
  return value;
}

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (
    !email ||
    email.length > MAX_EMAIL_LENGTH ||
    !EMAIL_PATTERN.test(email)
  ) {
    return null;
  }
  return email;
}

// Public, token-gated: the token itself is the credential.

export async function validateInviteToken(tokenValue: unknown) {
  const token = parseOpaqueToken(tokenValue);
  if (!token) return null;
  const user = await prisma.user.findUnique({
    where: { inviteToken: token },
    select: { id: true, name: true, email: true, inviteExpiresAt: true },
  });
  if (!user) return null;
  if (user.inviteExpiresAt && user.inviteExpiresAt < new Date()) return null;
  return { id: user.id, name: user.name, email: user.email };
}

export async function acceptInvite(tokenValue: unknown, passwordValue: unknown) {
  const token = parseOpaqueToken(tokenValue);
  if (!token) throw new Error("Convite inválido.");
  const password = parsePassword(passwordValue);
  const now = new Date();
  const user = await prisma.user.findUnique({
    where: { inviteToken: token },
    select: { id: true, email: true, inviteExpiresAt: true },
  });
  if (!user) throw new Error("Convite inválido.");
  if (user.inviteExpiresAt && user.inviteExpiresAt < now) {
    throw new Error("Convite expirado.");
  }

  // Consume the credential and set the password in one conditional write.
  // Two concurrent submissions can both read the token, but only one can
  // match the still-present inviteToken here.
  const consumed = await prisma.user.updateMany({
    where: {
      id: user.id,
      inviteToken: token,
      OR: [{ inviteExpiresAt: null }, { inviteExpiresAt: { gte: now } }],
    },
    data: {
      passwordHash: hashSync(password, 10),
      inviteToken: null,
      inviteExpiresAt: null,
      sessionVersion: { increment: 1 },
    },
  });
  if (consumed.count !== 1) throw new Error("Convite inválido ou expirado.");

  // Best effort: close the loop candidatura -> convite -> conta criada.
  // Matched by email (unique on BetaSignup) — a missing/already-rejected
  // application never blocks account creation.
  try {
    const application = await prisma.betaSignup.findUnique({
      where: { email: user.email },
      select: { status: true },
    });
    if (application && application.status !== "rejected") {
      await prisma.betaSignup.update({
        where: { email: user.email },
        data: { status: "joined" },
      });
    }
  } catch (error) {
    console.error(
      "[wepacker invite] application_status_update_failed",
      logSafeError(error),
    );
  }

  return { userId: user.id };
}

// Agreement acceptance always applies to the signed-in user.
export async function acceptAgreement() {
  const user = await requireAuthenticatedUser();
  await prisma.$transaction(async (tx) => {
    await tx.agreement.upsert({
      where: { userId_version: { userId: user.id, version: "1.0" } },
      update: {},
      create: { userId: user.id, version: "1.0" },
    });
    await tx.user.update({
      where: { id: user.id },
      data: { onboarded: true },
    });
  });
}

export async function requestPasswordReset(emailValue: unknown) {
  const email = normalizeEmail(emailValue);
  if (!email) return;
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });
  if (!user) return; // Don't reveal if email exists

  const now = new Date();
  const issued = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`password-reset:${user.id}`}, 0))`;

    await tx.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
        createdAt: { lt: new Date(now.getTime() - RESET_RETENTION_MS) },
      },
    });
    const recentCount = await tx.passwordResetToken.count({
      where: {
        userId: user.id,
        createdAt: { gte: new Date(now.getTime() - RESET_WINDOW_MS) },
      },
    });
    if (recentCount >= RESET_MAX_PER_WINDOW) return null;

    const cooldownToken = await tx.passwordResetToken.findFirst({
      where: {
        userId: user.id,
        createdAt: { gte: new Date(now.getTime() - RESET_COOLDOWN_MS) },
      },
      select: { id: true },
    });
    if (cooldownToken) return null;

    await tx.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null, revokedAt: null },
      data: { revokedAt: now },
    });
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);
    return tx.passwordResetToken.create({
      data: { userId: user.id, token: randomUUID(), expiresAt },
      select: { token: true },
    });
  });
  if (!issued) return;

  const appUrl = process.env.APP_URL || "https://wepac.pt";
  const resetUrl = `${appUrl}/wepacker/password/reset?token=${issued.token}`;

  try {
    const { sendPasswordResetEmail } = await import("@/lib/email");
    await sendPasswordResetEmail(user.email, resetUrl);
  } catch (error) {
    console.error(
      "[wepacker password reset] delivery_failed",
      logSafeError(error),
    );
  }
}

export async function resetPassword(tokenValue: unknown, passwordValue: unknown) {
  const token = parseOpaqueToken(tokenValue);
  if (!token) throw new Error("Token inválido.");
  const newPassword = parsePassword(passwordValue);
  const now = new Date();
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      usedAt: true,
      revokedAt: true,
    },
  });
  if (!resetToken) throw new Error("Token inválido.");
  if (
    resetToken.expiresAt < now ||
    resetToken.usedAt ||
    resetToken.revokedAt
  ) {
    throw new Error("Token inválido ou expirado.");
  }

  const passwordHash = hashSync(newPassword, 10);
  await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`password-reset:${resetToken.userId}`}, 0))`;
    const consumed = await tx.passwordResetToken.updateMany({
      where: {
        id: resetToken.id,
        usedAt: null,
        revokedAt: null,
        expiresAt: { gte: now },
      },
      data: { usedAt: now },
    });
    if (consumed.count !== 1) {
      throw new Error("Token inválido ou expirado.");
    }
    await tx.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash, sessionVersion: { increment: 1 } },
    });
    await tx.passwordResetToken.updateMany({
      where: {
        userId: resetToken.userId,
        id: { not: resetToken.id },
        usedAt: null,
        revokedAt: null,
      },
      data: { revokedAt: now },
    });
  });
}
