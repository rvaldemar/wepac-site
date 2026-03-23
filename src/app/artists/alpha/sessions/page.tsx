import { getCurrentUser, getAllUsers } from "@/lib/actions/user";
import { getUserSessions } from "@/lib/actions/session";
import SessionsPageClient from "./page-client";

export default async function SessionsPage() {
  const user = await getCurrentUser();

  const [sessions, allUsers] = await Promise.all([
    getUserSessions(user.id),
    getAllUsers(),
  ]);

  const usersMap: Record<string, string> = {};
  for (const u of allUsers) {
    usersMap[u.id] = u.name;
  }

  const serializedSessions = sessions.map((s) => ({
    id: s.id,
    scheduledAt: s.scheduledAt.toISOString(),
    durationMinutes: s.durationMinutes,
    sessionType: s.sessionType,
    status: s.status,
    mentorId: s.mentorId,
    notes: s.notes,
    notesPublished: s.notesPublished,
    discussionPoints: s.discussionPoints,
  }));

  return <SessionsPageClient sessions={serializedSessions} usersMap={usersMap} />;
}
