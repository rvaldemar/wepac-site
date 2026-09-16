"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/wepacker/guards";

/**
 * Academy is a read projection over explicit Cycle edges. It never infers an
 * Enrollment or Facilitation from a Pack, Mentorship, role or shared Session.
 */
export async function getMyAcademyParticipation() {
  const actor = await requireUser();
  const [enrollments, facilitations] = await Promise.all([
    prisma.cycleEnrollment.findMany({
      where: {
        userId: actor.id,
        status: { in: ["active", "paused", "completed"] },
      },
      select: {
        id: true,
        status: true,
        invitedAt: true,
        joinedAt: true,
        completedAt: true,
        cycle: {
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
            stage: true,
            startsAt: true,
            endsAt: true,
            primaryDiscipline: {
              select: { slug: true, name: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.cycleFacilitator.findMany({
      where: {
        userId: actor.id,
        status: { in: ["active", "paused"] },
        acceptedAt: { not: null },
      },
      select: {
        id: true,
        role: true,
        status: true,
        invitedAt: true,
        acceptedAt: true,
        cycle: {
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
            stage: true,
            startsAt: true,
            endsAt: true,
            primaryDiscipline: {
              select: { slug: true, name: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    enrollments: enrollments.map((edge) => ({
      ...edge,
      invitedAt: edge.invitedAt.toISOString(),
      joinedAt: edge.joinedAt?.toISOString() ?? null,
      completedAt: edge.completedAt?.toISOString() ?? null,
      cycle: {
        ...edge.cycle,
        startsAt: edge.cycle.startsAt?.toISOString() ?? null,
        endsAt: edge.cycle.endsAt?.toISOString() ?? null,
      },
    })),
    facilitations: facilitations.map((edge) => ({
      ...edge,
      invitedAt: edge.invitedAt.toISOString(),
      acceptedAt: edge.acceptedAt?.toISOString() ?? null,
      cycle: {
        ...edge.cycle,
        startsAt: edge.cycle.startsAt?.toISOString() ?? null,
        endsAt: edge.cycle.endsAt?.toISOString() ?? null,
      },
    })),
  };
}
