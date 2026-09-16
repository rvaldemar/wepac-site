"use server";

import { prisma } from "@/lib/db";
import type { LeadStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/wepacker/guards";

export async function getLeads(status?: LeadStatus) {
  await requireAdmin();
  return prisma.lead.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
  });
}

export async function getLeadById(id: string) {
  await requireAdmin();
  return prisma.lead.findUnique({ where: { id } });
}

export async function updateLeadStatus(id: string, status: LeadStatus) {
  await requireAdmin();
  return prisma.lead.update({ where: { id }, data: { status } });
}

export async function deleteLead(id: string) {
  await requireAdmin();
  await prisma.lead.delete({ where: { id } });
}
