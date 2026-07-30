import { redirect } from "next/navigation";
import { requirePageUser } from "@/lib/wepacker/page-guards";
import {
  getFacilitatedCycles,
  getMentoredMembers,
  getMentoredSessions,
} from "@/lib/wepacker/actions/session";
import { MentorDashboardClient } from "./page-client";

export default async function MentorDashboardPage() {
  await requirePageUser();

  const [sessions, mentees, facilitatedCycles] = await Promise.all([
    getMentoredSessions(),
    getMentoredMembers(),
    getFacilitatedCycles(),
  ]);
  if (
    sessions.length === 0 &&
    mentees.length === 0 &&
    facilitatedCycles.length === 0
  ) {
    redirect("/wepacker/dashboard");
  }

  return (
    <MentorDashboardClient
      sessions={sessions.map((session) => ({
        id: session.id,
        status: session.status,
        scheduledAt: session.scheduledAt.toISOString(),
        durationMinutes: session.durationMinutes,
        attendeeCount: session.attendees.length,
        attendees: session.attendees.map((attendee) => ({
          id: attendee.id,
          user: attendee.user,
        })),
      }))}
      activeMentorships={mentees.length}
      activeFacilitations={facilitatedCycles.length}
    />
  );
}
