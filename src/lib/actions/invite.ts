"use server";

import { prisma } from "@/lib/db";
import { hashSync } from "bcryptjs";
import { randomUUID } from "crypto";
import { sendInviteEmail } from "@/lib/email";
import type { UserRole } from "@prisma/client";

export async function createInvite(data: {
  name: string;
  email: string;
  phone?: string;
  role: string;
}) {
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existing) throw new Error("Email já registado.");

  const token = randomUUID();
  const inviteExpiresAt = new Date();
  inviteExpiresAt.setDate(inviteExpiresAt.getDate() + 7);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      role: data.role as UserRole,
      inviteToken: token,
      inviteExpiresAt,
      onboarded: false,
    },
  });

  const appUrl = process.env.APP_URL || "https://wepac.pt";
  const inviteUrl = `${appUrl}/artists/alpha/invite/${token}`;

  // Send email (best effort — don't fail the invite if email fails)
  try {
    await sendInviteEmail(data.email, data.name, inviteUrl);
  } catch (e) {
    console.error("Failed to send invite email:", e);
  }

  return {
    userId: user.id,
    inviteUrl,
    whatsappUrl: data.phone
      ? `https://wa.me/${data.phone.replace(/[\s\-()+"]/g, "")}?text=${encodeURIComponent(
          `Olá ${data.name.split(" ")[0]}, foste convidado/a para o programa Artista Alpha da WEPAC. Cria a tua conta aqui: ${inviteUrl}`
        )}`
      : null,
  };
}

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
  const user = await prisma.user.findUnique({
    where: { inviteToken: token },
  });

  if (!user) throw new Error("Convite inválido.");
  if (user.inviteExpiresAt && user.inviteExpiresAt < new Date()) {
    throw new Error("Convite expirado.");
  }

  const passwordHash = hashSync(password, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      inviteToken: null,
      inviteExpiresAt: null,
    },
  });

  return { userId: user.id };
}

export async function acceptAgreement(userId: string) {
  await prisma.agreement.create({
    data: { userId, version: "1.0" },
  });

  await prisma.user.update({
    where: { id: userId },
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
  const resetUrl = `${appUrl}/artists/alpha/password/reset?token=${token}`;

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

  const passwordHash = hashSync(newPassword, 10);

  await prisma.user.update({
    where: { id: resetToken.userId },
    data: { passwordHash },
  });

  await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
}
