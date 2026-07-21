import { requirePageUser } from "@/lib/wepacker/page-guards";
import { getMyContext } from "@/lib/wepacker/actions/user";
import { getMySessions } from "@/lib/wepacker/actions/session";
import SessionsPageClient from "./page-client";

export default async function SessionsPage() {
  await requirePageUser();
  const { membership } = await getMyContext();

  if (!membership) {
    return (
      <div className="p-6 lg:p-8">
        <h1 className="font-barlow text-2xl font-bold text-wepac-white">Sessões</h1>
        <p className="mt-4 max-w-md text-sm text-wepac-text-tertiary">
          A tua conta ainda não está associada a uma Journey — contacta a
          equipa WEPAC.
        </p>
      </div>
    );
  }

  const sessions = await getMySessions();

  const serializedSessions = sessions.map((s) => {
    // getMySessions scopes `attendees` to the requesting user's own row —
    // at most one entry, already masked server-side.
    const own = s.attendees[0];
    return {
      id: s.id,
      scheduledAt: s.scheduledAt.toISOString(),
      durationMinutes: s.durationMinutes,
      sessionType: s.sessionType,
      kind: s.kind,
      status: s.status,
      mentorName: s.mentor.name,
      notes: s.notes,
      notesPublished: s.notesPublished,
      discussionPoints: s.discussionPoints,
      outcome: own?.outcome ?? null,
      sharedNote: own?.sharedNote ?? null,
      meetingUrl: s.meetingUrl,
    };
  });

  return <SessionsPageClient sessions={serializedSessions} />;
}
