"use server";

import { prisma } from "@/lib/db";
import type { BetaSignupStatus } from "@prisma/client";
import {
  sendBetaSignupConfirmationEmail,
  sendBetaSignupNotificationEmail,
} from "@/lib/email";
import { requireAdmin } from "@/lib/wepacker/guards";

// Public candidatura — feeds the existing beta_signups pipeline, now
// tagged with the target pack.
export async function submitApplication(data: {
  packSlug: string;
  name: string;
  email: string;
  phone?: string;
  area?: string;
  socialLinks?: string;
  motivation?: string;
}) {
  const name = data.name?.trim();
  const email = data.email?.trim().toLowerCase();
  if (!name || !email) throw new Error("Nome e email são obrigatórios.");

  const pack = await prisma.pack.findUnique({
    where: { slug: data.packSlug },
    select: { slug: true, active: true },
  });
  if (!pack || !pack.active) throw new Error("Pack inválido.");

  const signup = await prisma.betaSignup.upsert({
    where: { email },
    update: {
      name,
      phone: data.phone || undefined,
      artisticArea: data.area || undefined,
      socialLinks: data.socialLinks || undefined,
      motivation: data.motivation || undefined,
      packSlug: pack.slug,
    },
    create: {
      name,
      email,
      phone: data.phone || null,
      artisticArea: data.area || null,
      socialLinks: data.socialLinks || null,
      motivation: data.motivation || null,
      packSlug: pack.slug,
    },
  });

  sendBetaSignupConfirmationEmail(name, email).catch(console.error);
  sendBetaSignupNotificationEmail(name, email, data.area).catch(console.error);

  return { id: signup.id };
}

// ===== ADMIN PIPELINE =====

export async function getApplications(status?: BetaSignupStatus) {
  await requireAdmin();
  return prisma.betaSignup.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
  });
}

export async function updateApplicationStatus(
  id: string,
  status: BetaSignupStatus
) {
  await requireAdmin();
  return prisma.betaSignup.update({ where: { id }, data: { status } });
}

export async function updateApplicationNotes(id: string, notes: string) {
  await requireAdmin();
  return prisma.betaSignup.update({ where: { id }, data: { notes } });
}

export async function deleteApplication(id: string) {
  await requireAdmin();
  await prisma.betaSignup.delete({ where: { id } });
}
