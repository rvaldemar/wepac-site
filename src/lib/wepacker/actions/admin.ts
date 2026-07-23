"use server";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { sendInviteEmail } from "@/lib/email";
import { requireAdmin } from "@/lib/wepacker/guards";
import { logSafeError } from "@/lib/wepacker/log-safe-error";
import { anonymizeSupportPreviewForUser } from "@/lib/wepacker/support-preview-retention";
import { anonymizeSessionMediaForUser } from "@/lib/wepacker/session-media/retention";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_ID_LENGTH = 191;
const ID_PATTERN = /^[A-Za-z0-9_-]+$/;

function parseId(value: unknown, label: string): string {
  if (typeof value !== "string") throw new Error(`${label} must be a string.`);
  const id = value.trim();
  if (!id || id.length > MAX_ID_LENGTH || !ID_PATTERN.test(id)) {
    throw new Error(`Invalid ${label}.`);
  }
  return id;
}

export async function getAllUsers() {
  await requireAdmin();
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      onboarded: true,
      phone: true,
      createdAt: true,
    },
    orderBy: { name: "asc" },
  });

  // Keep this projection explicit: invite/reset tokens and password hashes are
  // bearer credentials and must never cross the admin list Server Action.
  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    onboarded: user.onboarded,
    phone: user.phone,
    createdAt: user.createdAt.toISOString(),
  }));
}

export async function deleteUser(userIdValue: unknown) {
  const actor = await requireAdmin();
  const userId = parseId(userIdValue, "Person ID");
  if (actor.id === userId) {
    throw new Error("Não podes eliminar a tua própria conta.");
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Serialize every Admin deletion. A check outside this transaction lets
      // two concurrent requests both observe two Admins and delete both.
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended('wepac-admin-account-delete', 0))`;

      const freshActor = await tx.user.findUnique({
        where: { id: actor.id },
        select: { role: true },
      });
      if (!freshActor || freshActor.role !== "admin") {
        throw new Error("Sem permissão.");
      }

      const target = await tx.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      if (!target) throw new Error("Utilizador não encontrado.");
      if (target.role === "admin") {
        const adminCount = await tx.user.count({ where: { role: "admin" } });
        if (adminCount <= 1) {
          throw new Error("Não é possível eliminar o último admin.");
        }
      }

      // Support grants cannot survive erasure as active capabilities. Their
      // content-free audit links are detached under the reviewed maintenance
      // flag before the Person deletion is attempted in the same transaction.
      await anonymizeSupportPreviewForUser(tx, userId);
      await anonymizeSessionMediaForUser(tx, userId);
      await tx.user.delete({ where: { id: userId } });
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      throw new Error(
        "Esta Person ainda tem relações ou registos de auditoria que têm de ser encerrados antes da eliminação.",
      );
    }
    throw error;
  }
}

// Account creation is deliberately separate from every relationship. A Person
// may later accept independent Mentorship, Pack Membership or Cycle Enrollment
// invitations; none is bundled into an account invite.
export async function createInvite(data: {
  name: string;
  email: string;
  phone?: string;
  role: "member" | "admin";
  message?: string;
  applicationId?: string;
}) {
  await requireAdmin();

  const name = data.name.trim();
  const email = data.email.trim().toLowerCase();
  if (!name) throw new Error("Nome obrigatório.");
  if (!EMAIL_PATTERN.test(email)) throw new Error("Email inválido.");
  // TypeScript does not protect the serialized Server Action boundary.
  // `mentor` is a relationship capability, never a global account grant.
  if (data.role !== "member" && data.role !== "admin") {
    throw new Error("Invalid account access.");
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) throw new Error("Email já registado.");

  const token = randomUUID();
  const inviteExpiresAt = new Date();
  inviteExpiresAt.setDate(inviteExpiresAt.getDate() + 7);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone: data.phone?.trim() || null,
      role: data.role,
      inviteToken: token,
      inviteExpiresAt,
      onboarded: false,
    },
    select: { id: true },
  });

  const appUrl = process.env.APP_URL || "https://wepac.pt";
  const inviteUrl = `${appUrl}/wepacker/invite/${token}`;

  try {
    await sendInviteEmail(email, name, inviteUrl, data.message);
  } catch (error) {
    console.error("[wepacker invite] delivery_failed", logSafeError(error));
  }

  if (data.applicationId) {
    try {
      await prisma.betaSignup.update({
        where: { id: data.applicationId },
        data: { status: "invited" },
      });
    } catch (error) {
      console.error(
        "[wepacker invite] application_status_update_failed",
        logSafeError(error),
      );
    }
  }

  return {
    userId: user.id,
    inviteUrl,
    whatsappUrl: data.phone
      ? `https://wa.me/${data.phone.replace(/[\s\-()+"]/g, "")}?text=${encodeURIComponent(
          `Olá ${name.split(" ")[0]}, foste convidado/a para o WEPACKER. Cria a tua conta aqui: ${inviteUrl}`,
        )}`
      : null,
  };
}
