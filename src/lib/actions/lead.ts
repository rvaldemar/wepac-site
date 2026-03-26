"use server";

import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";
import type { LeadStatus } from "@prisma/client";

export async function getLeads(status?: LeadStatus) {
  await requireRole(["admin"]);
  return prisma.lead.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
  });
}

export async function getLeadById(id: string) {
  await requireRole(["admin"]);
  return prisma.lead.findUnique({ where: { id } });
}

export async function updateLeadStatus(id: string, status: LeadStatus) {
  await requireRole(["admin"]);
  return prisma.lead.update({ where: { id }, data: { status } });
}

export async function deleteLead(id: string) {
  await requireRole(["admin"]);
  await prisma.lead.delete({ where: { id } });
}
