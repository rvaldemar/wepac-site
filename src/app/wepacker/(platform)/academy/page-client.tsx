"use client";

import Link from "next/link";

type StageKey = "easy_peasy" | "step_up" | "yup";

interface CycleSummary {
  id: string;
  name: string;
  description: string;
  status: "draft" | "published" | "active" | "completed" | "archived";
  stage: StageKey | null;
  startsAt: string | null;
  endsAt: string | null;
  primaryDiscipline: { slug: string; name: string } | null;
}

interface Enrollment {
  id: string;
  status: "invited" | "active" | "paused" | "completed" | "withdrawn" | "removed";
  invitedAt: string;
  joinedAt: string | null;
  completedAt: string | null;
  cycle: CycleSummary;
}

interface Facilitation {
  id: string;
  role: "lead" | "facilitator";
  status: "invited" | "active" | "paused" | "declined" | "ended" | "removed";
  invitedAt: string;
  acceptedAt: string | null;
  cycle: CycleSummary;
}

interface Props {
  enrollments: Enrollment[];
  facilitations: Facilitation[];
}

const STAGE_LABELS: Record<StageKey, string> = {
  easy_peasy: "Easy Peasy",
  step_up: "Step Up",
  yup: "YUP",
};

function formatDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function CycleCard({
  cycle,
  edgeLabel,
  edgeStatus,
}: {
  cycle: CycleSummary;
  edgeLabel: string;
  edgeStatus: string;
}) {
  const startsAt = formatDate(cycle.startsAt);
  const endsAt = formatDate(cycle.endsAt);

  return (
    <article className="border border-wepac-border bg-wepac-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-medium text-wepac-white">{cycle.name}</h3>
          <p className="mt-1 text-xs text-wepac-text-tertiary">{edgeLabel}</p>
        </div>
        <span className="bg-wepac-input px-2 py-1 text-xs capitalize text-wepac-text-secondary">
          {edgeStatus.replaceAll("_", " ")}
        </span>
      </div>
      {cycle.description && (
        <p className="mt-4 text-sm leading-relaxed text-wepac-text-tertiary">
          {cycle.description}
        </p>
      )}
      <dl className="mt-5 grid gap-3 text-xs sm:grid-cols-3">
        <div>
          <dt className="uppercase tracking-wider text-wepac-text-tertiary">Stage</dt>
          <dd className="mt-1 text-wepac-white">
            {cycle.stage ? STAGE_LABELS[cycle.stage] : "Not set"}
          </dd>
        </div>
        <div>
          <dt className="uppercase tracking-wider text-wepac-text-tertiary">
            Discipline
          </dt>
          <dd className="mt-1 text-wepac-white">
            {cycle.primaryDiscipline?.name ?? "Open practice"}
          </dd>
        </div>
        <div>
          <dt className="uppercase tracking-wider text-wepac-text-tertiary">Dates</dt>
          <dd className="mt-1 text-wepac-white">
            {startsAt || endsAt
              ? `${startsAt ?? "TBC"} — ${endsAt ?? "TBC"}`
              : "To be confirmed"}
          </dd>
        </div>
      </dl>
    </article>
  );
}

export default function AcademyPageClient({
  enrollments,
  facilitations,
}: Props) {
  return (
    <div className="p-6 lg:p-8">
      <div>
        <h1 className="font-barlow text-2xl font-bold text-wepac-white">
          Academy
        </h1>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-wepac-text-tertiary">
          Your explicit participation in time-bounded learning Cycles. Enrollment
          and Facilitation are separate from Pack Membership, Connections and
          Mentorships.
        </p>
        <p className="mt-3 text-xs text-wepac-text-tertiary">
          This view is read-only. Cycle participation is managed through its own
          consented Academy flow.
        </p>
      </div>

      <section className="mt-8">
        <h2 className="font-barlow text-xl font-bold text-wepac-white">
          My Enrollments
        </h2>
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          {enrollments.length === 0 ? (
            <p className="border border-dashed border-wepac-border p-6 text-sm text-wepac-text-tertiary xl:col-span-2">
              No current Cycle Enrollments.
            </p>
          ) : (
            enrollments.map((enrollment) => (
              <CycleCard
                key={enrollment.id}
                cycle={enrollment.cycle}
                edgeLabel="Cycle Enrollment"
                edgeStatus={enrollment.status}
              />
            ))
          )}
        </div>
      </section>

      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-barlow text-xl font-bold text-wepac-white">
            My Facilitations
          </h2>
          {facilitations.length > 0 && (
            <Link
              href="/wepacker/mentor/sessions"
              className="text-xs text-wepac-text-secondary underline-offset-4 hover:text-wepac-white hover:underline"
            >
              Manage Cycle Sessions →
            </Link>
          )}
        </div>
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          {facilitations.length === 0 ? (
            <p className="border border-dashed border-wepac-border p-6 text-sm text-wepac-text-tertiary xl:col-span-2">
              No current Cycle Facilitations.
            </p>
          ) : (
            facilitations.map((facilitation) => (
              <CycleCard
                key={facilitation.id}
                cycle={facilitation.cycle}
                edgeLabel={
                  facilitation.role === "lead"
                    ? "Lead Facilitator"
                    : "Cycle Facilitator"
                }
                edgeStatus={facilitation.status}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
