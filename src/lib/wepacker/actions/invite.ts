"use server";

import { prisma } from "@/lib/db";
import { hashSync } from "bcryptjs";
import { randomUUID } from "crypto";
import { requireUser } from "@/lib/wepacker/guards";

// Public, token-gated: the token itself is the credential.

export async function validateInviteToken(token: string) {
  const user = await prisma.user.findUnique({
    where: { inviteToken: token },
    select: { id: true, name: true, email: true, inviteExpiresAt: true },
  });
  if (!user) return null;
  if (user.inviteExpiresAt && user.inviteExpiresAt < new Date()) return null;
  return { id: user.id, name: user.name, email: user.email };
}

export async function acceptInvite(token: string, password: string) {
  const user = await prisma.user.findUnique({ where: { inviteToken: token } });
  if (!user) throw new Error("Convite inválido.");
  if (user.inviteExpiresAt && user.inviteExpiresAt < new Date()) {
    throw new Error("Convite expirado.");
  }
  if (password.length < 8) {
    throw new Error("A password deve ter pelo menos 8 caracteres.");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: hashSync(password, 10),
      inviteToken: null,
      inviteExpiresAt: null,
    },
  });
  return { userId: user.id };
}

// Agreement acceptance always applies to the signed-in user.
export async function acceptAgreement() {
  const user = await requireUser();
  await prisma.agreement.create({ data: { userId: user.id, version: "1.0" } });
  await prisma.user.update({
    where: { id: user.id },
    data: { onboarded: true },
  });
}

export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return; // Don't reveal if email exists

  const token = randomUUID();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);

  await prisma.passwordResetToken.create({
    data: { userId: user.id, token, expiresAt },
  });

  const appUrl = process.env.APP_URL || "https://wepac.pt";
  const resetUrl = `${appUrl}/wepacker/password/reset?token=${token}`;

  try {
    const { sendPasswordResetEmail } = await import("@/lib/email");
    await sendPasswordResetEmail(email, resetUrl);
  } catch (e) {
    console.error("Failed to send reset email:", e);
  }
}

export async function resetPassword(token: string, newPassword: string) {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  });
  if (!resetToken) throw new Error("Token inválido.");
  if (resetToken.expiresAt < new Date()) throw new Error("Token expirado.");
  if (newPassword.length < 8) {
    throw new Error("A password deve ter pelo menos 8 caracteres.");
  }

  await prisma.user.update({
    where: { id: resetToken.userId },
    data: { passwordHash: hashSync(newPassword, 10) },
  });
  await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
}
