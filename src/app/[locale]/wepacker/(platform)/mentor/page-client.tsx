"use client";

import { useLocale } from "next-intl";
import { wp } from "@/i18n/copy/wepacker";
import { Link } from "@/i18n/navigation";

interface SessionRow {
  id: string;
  status: "scheduled" | "completed" | "cancelled" | "no_show";
  scheduledAt: string;
  durationMinutes: number;
  attendeeCount: number;
  attendees: Array<{
    id: string;
    user: { id: string; name: string };
  }>;
}

interface MentorDashboardProps {
  sessions: SessionRow[];
  activeMentorships: number;
  activeFacilitations: number;
}

export function MentorDashboardClient({
  sessions,
  activeMentorships,
  activeFacilitations,
}: MentorDashboardProps) {
  const locale = useLocale();
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
        Organizer Workspace
      </h1>
      <p className="mt-1 max-w-3xl text-sm leading-relaxed text-wepac-text-tertiary">
        {wp(
          locale,
          "Este espaço mostra Mentorships explícitas e as Sessions que estás autorizado a gerir. Uma Mentorship não abre o Life Map, Trails, Actions ou Messages de um Mentee.",
          "This workspace shows explicit Mentorships and the Sessions you are authorized to manage. A Mentorship does not open a Mentee's Life Map, Trails, Actions, or Messages.",
        )}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link
          href="/wepacker/mentorships"
          className="border border-wepac-border bg-wepac-card p-5 transition-colors hover:border-wepac-white/40"
        >
          <p className="font-barlow text-3xl font-bold text-wepac-white">
            {activeMentorships}
          </p>
          <p className="mt-1 text-sm text-wepac-text-tertiary">
            {wp(locale, "Mentorships ativas", "Active Mentorships")}
          </p>
        </Link>
        <Link
          href="/wepacker/academy"
          className="border border-wepac-border bg-wepac-card p-5 transition-colors hover:border-wepac-white/40"
        >
          <p className="font-barlow text-3xl font-bold text-wepac-white">
            {activeFacilitations}
          </p>
          <p className="mt-1 text-sm text-wepac-text-tertiary">
            {wp(locale, "Facilitações ativas", "Active Facilitations")}
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
            {wp(locale, "Sessions agendadas", "Scheduled Sessions")}
          </p>
        </Link>
      </div>

      <section className="mt-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-wepac-text-tertiary">
            {wp(locale, "Próximas Sessions", "Upcoming Sessions")}
          </h2>
          <Link
            href="/wepacker/mentor/sessions"
            className="text-xs text-wepac-white hover:underline"
          >
            {wp(locale, "Gerir Sessions →", "Manage Sessions →")}
          </Link>
        </div>
        <div className="mt-4 space-y-3">
          {upcoming.slice(0, 5).map((session) => (
            <div
              key={session.id}
              className="border border-wepac-border bg-wepac-card p-4"
            >
              <p className="text-sm text-wepac-white">
                {new Date(session.scheduledAt).toLocaleDateString(locale, {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}{" "}
                ·{" "}
                {new Date(session.scheduledAt).toLocaleTimeString(locale, {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <p className="mt-1 text-xs text-wepac-text-tertiary">
                {session.attendeeCount === 1
                  ? "Individual"
                  : wp(locale, "Grupo", "Group")}
                {" · "}
                {session.attendees.map((attendee) => attendee.user.name).join(", ")}
              </p>
            </div>
          ))}
          {upcoming.length === 0 && (
            <p className="text-sm text-wepac-text-tertiary">
              {wp(locale, "Sem Sessions agendadas.", "No scheduled Sessions.")}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
