import { prisma } from "@/lib/db";
import { requirePageRole } from "@/lib/wepacker/page-guards";
import { SessionCapacityAdmin } from "@/components/wepacker/SessionCapacityAdmin";

export const dynamic = "force-dynamic";

export default async function SessionCapacityPage() {
  await requirePageRole(["admin"]);
  const sessions = await prisma.session.findMany({
    where: { attendees: { some: {} } },
    select: {
      id: true,
      scheduledAt: true,
      organizer: { select: { id: true, name: true } },
      attendees: { select: { user: { select: { id: true, name: true } } } },
      consentCapacityAssurances: {
        select: { subjectUserId: true, status: true, verifiedAt: true },
        orderBy: [{ verifiedAt: "desc" }, { createdAt: "desc" }],
      },
    },
    orderBy: { scheduledAt: "desc" },
    take: 100,
  });
  const rows = sessions.map((session) => {
    const participants = [
      session.organizer,
      ...session.attendees.map(({ user }) => user),
    ].map((participant) => {
      const latest = session.consentCapacityAssurances.find(
        (entry) => entry.subjectUserId === participant.id,
      );
      return {
        ...participant,
        status: latest?.status ?? "unknown",
        verifiedAt: latest?.verifiedAt.toISOString() ?? null,
      };
    });
    return {
      sessionId: session.id,
      scheduledAt: session.scheduledAt.toISOString(),
      participants,
    };
  });
  return (
    <div className="p-6 lg:p-8">
      <h1 className="font-barlow text-2xl font-bold text-wepac-white">
        Capacidade para media de Sessions
      </h1>
      <p className="mb-6 mt-2 max-w-2xl text-sm text-wepac-text-tertiary">
        Regista apenas uma referência opaca de verificação adulta. Esta função
        administrativa não dá acesso à gravação, Transcript ou Debrief.
      </p>
      <SessionCapacityAdmin rows={rows} />
    </div>
  );
}
