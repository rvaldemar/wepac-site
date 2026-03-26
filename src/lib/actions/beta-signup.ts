"use server";

import { prisma } from "@/lib/db";
import { sendBetaSignupConfirmationEmail, sendBetaSignupNotificationEmail } from "@/lib/email";

export async function submitBetaSignup(data: {
  name: string;
  email: string;
  phone?: string;
  artisticArea?: string;
  socialLinks?: string;
  motivation?: string;
}) {
  if (!data.name || !data.email) {
    throw new Error("Nome e email são obrigatórios.");
  }

  // Upsert to avoid duplicates
  const signup = await prisma.betaSignup.upsert({
    where: { email: data.email },
    update: {
      name: data.name,
      phone: data.phone || undefined,
      artisticArea: data.artisticArea || undefined,
      socialLinks: data.socialLinks || undefined,
      motivation: data.motivation || undefined,
    },
    create: {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      artisticArea: data.artisticArea || null,
      socialLinks: data.socialLinks || null,
      motivation: data.motivation || null,
    },
  });

  // Fire-and-forget emails
  sendBetaSignupConfirmationEmail(data.name, data.email).catch(console.error);
  sendBetaSignupNotificationEmail(data.name, data.email, data.artisticArea).catch(console.error);

  return { id: signup.id };
}

export async function getBetaSignups(status?: string) {
  const where = status ? { status: status as any } : {};
  return prisma.betaSignup.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
}

export async function updateBetaSignupStatus(
  id: string,
  status: "pending" | "contacted" | "invited" | "rejected"
) {
  return prisma.betaSignup.update({
    where: { id },
    data: { status },
  });
}

export async function updateBetaSignupNotes(id: string, notes: string) {
  return prisma.betaSignup.update({
    where: { id },
    data: { notes },
  });
}

export async function deleteBetaSignup(id: string) {
  return prisma.betaSignup.delete({
    where: { id },
  });
}
