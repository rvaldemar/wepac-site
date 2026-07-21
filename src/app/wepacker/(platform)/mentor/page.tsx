import { requirePageRole } from "@/lib/wepacker/page-guards";
import { getMentoredSessions } from "@/lib/wepacker/actions/session";
import { getMyMentorships } from "@/lib/wepacker/actions/mentorship";
import { MentorDashboardClient } from "./page-client";

export default async function MentorDashboardPage() {
  const user = await requirePageRole(["mentor", "admin"]);

  const [sessions, mentorships] = await Promise.all([
    getMentoredSessions(),
    getMyMentorships(),
  ]);

  return (
    <MentorDashboardClient
      sessions={sessions.map((session) => ({
        id: session.id,
        sessionType: session.sessionType,
        status: session.status,
        scheduledAt: session.scheduledAt.toISOString(),
        durationMinutes: session.durationMinutes,
        attendees: session.attendees.map((attendee) => ({
          id: attendee.id,
          user: attendee.user,
        })),
      }))}
      activeMentorships={mentorships.filter(
        (row) =>
          row.mentor.id === user.id &&
          row.status === "active" &&
          !row.reviewRequired
      ).length}
    />
  );
}
