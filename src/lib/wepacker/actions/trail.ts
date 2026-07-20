"use server";

import { prisma } from "@/lib/db";
import type { AreaKey, TrailStatus } from "@prisma/client";
import { assertUserAccess, assertUserOwner } from "@/lib/wepacker/guards";

// ===== TRAIL =====
//
// A Trail belongs to the person (User), not a CohortMembership — one
// WEPACker can run several personal transformation Trails across their
// life, standalone from any Cohort/Journey (see prisma/schema.prisma).

export async function getTrails(userId: string) {
  await assertUserAccess(userId);
  return prisma.trail.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createTrail(
  userId: string,
  data: {
    title: string;
    purpose: string;
    whyItMatters: string;
    destination: string;
    areas: AreaKey[];
  }
) {
  await assertUserOwner(userId);
  return prisma.trail.create({ data: { userId, ...data } });
}

// Mirrors assertPlanAccess in actions/plan.ts: resolve the owning userId
// from the trailId first, then run the same person-level owner guard.
async function assertTrailAccess(trailId: string) {
  const trail = await prisma.trail.findUnique({
    where: { id: trailId },
    select: { userId: true },
  });
  if (!trail) throw new Error("Trail não encontrado.");
  await assertUserOwner(trail.userId);
  return trail;
}

export async function updateTrail(
  trailId: string,
  data: {
    title?: string;
    purpose?: string;
    whyItMatters?: string;
    destination?: string;
    areas?: AreaKey[];
  }
) {
  await assertTrailAccess(trailId);
  return prisma.trail.update({ where: { id: trailId }, data });
}

export async function updateTrailStatus(trailId: string, status: TrailStatus) {
  await assertTrailAccess(trailId);
  return prisma.trail.update({ where: { id: trailId }, data: { status } });
}
