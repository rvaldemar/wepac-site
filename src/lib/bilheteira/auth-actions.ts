"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { hashSync, compareSync } from "bcryptjs";
import { prisma } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/bilheteira/ticket-email";
import {
  setSessionCookie,
  clearSessionCookie,
  getSessionAdmin,
  isAllowedEmail,
} from "./session";

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

function back(path: string, error: string): never {
  redirect(`${path}?error=${encodeURIComponent(error)}`);
}

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

async function issueVerification(admin: { id: string; email: string; name: string }) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MS);
  await prisma.ticketingAdmin.update({
    where: { id: admin.id },
    data: {
      verificationToken: token,
      verificationExpiresAt: expiresAt,
    },
  });
  const base = process.env.APP_URL || "https://wepac.pt";
  await sendVerificationEmail(admin.email, admin.name, `${base}/bilheteira/verify/${token}`);
}

export async function signupAction(formData: FormData): Promise<void> {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");

  if (!name || !email || !password) {
    back("/bilheteira/signup", "Preenche todos os campos.");
  }
  if (!isAllowedEmail(email)) {
    back("/bilheteira/signup", "Apenas emails @wepac.pt podem registar.");
  }
  if (password.length < 8) {
    back("/bilheteira/signup", "Password tem de ter pelo menos 8 caracteres.");
  }

  const existing = await prisma.ticketingAdmin.findUnique({ where: { email } });
  if (existing) {
    if (existing.emailVerifiedAt) {
      back("/bilheteira/signup", "Já existe uma conta verificada com este email. Entra em /bilheteira/login.");
    }
    // pending verification — re-send link
    await issueVerification(existing);
    redirect(`/bilheteira/verify-sent?email=${encodeURIComponent(email)}`);
  }

  const admin = await prisma.ticketingAdmin.create({
    data: { name, email, passwordHash: hashSync(password, 10) },
  });
  try {
    await issueVerification(admin);
  } catch (err) {
    console.error("[bilheteira] verification email failed", err);
    back(
      "/bilheteira/signup",
      "Conta criada mas não foi possível enviar o email. Contacta o admin."
    );
  }

  redirect(`/bilheteira/verify-sent?email=${encodeURIComponent(email)}`);
}

export async function resendVerificationAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  if (!email) back("/bilheteira/verify-sent", "Email em falta.");

  const admin = await prisma.ticketingAdmin.findUnique({ where: { email } });
  // Always redirect to the same confirmation screen — don't leak whether
  // the email is registered.
  if (admin && !admin.emailVerifiedAt) {
    try {
      await issueVerification(admin);
    } catch (err) {
      console.error("[bilheteira] resend failed", err);
    }
  }
  redirect(`/bilheteira/verify-sent?email=${encodeURIComponent(email)}&resent=1`);
}

export async function loginAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    back("/bilheteira/login", "Preenche email e password.");
  }

  const admin = await prisma.ticketingAdmin.findUnique({ where: { email } });
  if (!admin || !compareSync(password, admin.passwordHash)) {
    back("/bilheteira/login", "Credenciais inválidas.");
  }
  if (!admin.emailVerifiedAt) {
    back(
      "/bilheteira/login",
      "Confirma primeiro o teu email. Verifica a caixa de entrada."
    );
  }

  await prisma.ticketingAdmin.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  });
  await setSessionCookie(admin.id, admin.email);
  redirect("/bilheteira/admin");
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/bilheteira/login");
}

export async function deleteAdminAction(formData: FormData): Promise<void> {
  const current = await getSessionAdmin();
  if (!current) redirect("/bilheteira/login");

  const id = String(formData.get("id") || "");
  if (!id) back("/bilheteira/admin/admins", "Admin inválido.");
  if (id === current.id) {
    back("/bilheteira/admin/admins", "Não podes apagar a tua própria conta.");
  }

  const totalAdmins = await prisma.ticketingAdmin.count({
    where: { emailVerifiedAt: { not: null } },
  });
  const target = await prisma.ticketingAdmin.findUnique({ where: { id } });
  if (!target) back("/bilheteira/admin/admins", "Admin não encontrado.");
  if (target.emailVerifiedAt && totalAdmins <= 1) {
    back(
      "/bilheteira/admin/admins",
      "Não é possível apagar o último admin verificado."
    );
  }

  await prisma.ticketingAdmin.delete({ where: { id } });
  revalidatePath("/bilheteira/admin/admins");
  redirect("/bilheteira/admin/admins?deleted=1");
}
