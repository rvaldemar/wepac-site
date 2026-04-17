"use server";

import { redirect } from "next/navigation";
import { hashSync, compareSync } from "bcryptjs";
import { prisma } from "@/lib/db";
import {
  setSessionCookie,
  clearSessionCookie,
  isAllowedEmail,
} from "./session";

function back(path: string, error: string): never {
  redirect(`${path}?error=${encodeURIComponent(error)}`);
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
    back("/bilheteira/signup", "Já existe uma conta com este email.");
  }

  const admin = await prisma.ticketingAdmin.create({
    data: { name, email, passwordHash: hashSync(password, 10) },
  });

  await setSessionCookie(admin.id, admin.email);
  redirect("/bilheteira/admin");
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
