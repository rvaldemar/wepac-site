"use client";

import Link from "next/link";

interface SessionRow {
  id: string;
  sessionType: "individual" | "group";
  status: "scheduled" | "completed" | "cancelled" | "no_show";
  scheduledAt: string;
  durationMinutes: number;
  attendees: Array<{
    id: string;
    user: { id: string; name: string };
  }>;
}

interface MentorDashboardProps {
  sessions: SessionRow[];
  activeMentorships: number;
}

export function MentorDashboardClient({
  sessions,
  activeMentorships,
}: MentorDashboardProps) {
  const upcoming = sessions
    .filter((session) => session.status === "scheduled")
    .sort(
      (first, second) =>
        new Date(first.scheduledAt).getTime() -
        new Date(second.scheduledAt).getTime()
    );

  return (
    <div className="p-6 lg:p-8">
      <h1 className="font-barlow text-2xl font-bold text-wepac-white">
        Mentor Dashboard
      </h1>
      <p className="mt-1 max-w-3xl text-sm leading-relaxed text-wepac-text-tertiary">
        This workspace shows explicit Mentorships and the Sessions you are
        authorized to manage. A Mentorship does not open a Mentee&apos;s Life Map,
        Trails, Assessments, Tasks, or Messages.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          href="/wepacker/mentorships"
          className="border border-wepac-border bg-wepac-card p-5 transition-colors hover:border-wepac-white/40"
        >
          <p className="font-barlow text-3xl font-bold text-wepac-white">
            {activeMentorships}
          </p>
          <p className="mt-1 text-sm text-wepac-text-tertiary">
            Active Mentorships
          </p>
        </Link>
        <Link
          href="/wepacker/mentor/sessions"
          className="border border-wepac-border bg-wepac-card p-5 transition-colors hover:border-wepac-white/40"
        >
          <p className="font-barlow text-3xl font-bold text-wepac-white">
            {upcoming.length}
          </p>
          <p className="mt-1 text-sm text-wepac-text-tertiary">
            Scheduled Sessions
          </p>
        </Link>
      </div>

      <section className="mt-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-wepac-text-tertiary">
            Upcoming Sessions
          </h2>
          <Link
            href="/wepacker/mentor/sessions"
            className="text-xs text-wepac-white hover:underline"
          >
            Manage Sessions →
          </Link>
        </div>
        <div className="mt-4 space-y-3">
          {upcoming.slice(0, 5).map((session) => (
            <div
              key={session.id}
              className="border border-wepac-border bg-wepac-card p-4"
            >
              <p className="text-sm text-wepac-white">
                {new Date(session.scheduledAt).toLocaleDateString("pt-PT", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}{" "}
                ·{" "}
                {new Date(session.scheduledAt).toLocaleTimeString("pt-PT", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <p className="mt-1 text-xs text-wepac-text-tertiary">
                {session.sessionType === "individual" ? "Individual" : "Group"}
                {" · "}
                {session.attendees.map((attendee) => attendee.user.name).join(", ")}
              </p>
            </div>
          ))}
          {upcoming.length === 0 && (
            <p className="text-sm text-wepac-text-tertiary">
              No scheduled Sessions.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
