"use client";

import { useLocale } from "next-intl";
import { wp } from "@/i18n/copy/wepacker";
import { Link } from "@/i18n/navigation";

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

function formatDate(value: string | null, locale: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function CycleCard({
  cycle,
  edgeLabel,
  edgeStatus,
  locale,
}: {
  cycle: CycleSummary;
  edgeLabel: string;
  edgeStatus: string;
  locale: string;
}) {
  const startsAt = formatDate(cycle.startsAt, locale);
  const endsAt = formatDate(cycle.endsAt, locale);
  const statusLabels: Record<string, string> = {
    draft: wp(locale, "Rascunho", "Draft"),
    published: wp(locale, "Publicado", "Published"),
    active: wp(locale, "Ativo", "Active"),
    invited: wp(locale, "Convidado", "Invited"),
    paused: wp(locale, "Pausado", "Paused"),
    completed: wp(locale, "Concluído", "Completed"),
    withdrawn: wp(locale, "Desistiu", "Withdrawn"),
    removed: wp(locale, "Removido", "Removed"),
    declined: wp(locale, "Recusado", "Declined"),
    ended: wp(locale, "Terminado", "Ended"),
    archived: wp(locale, "Arquivado", "Archived"),
  };

  return (
    <article className="border border-wepac-border bg-wepac-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-medium text-wepac-white">{cycle.name}</h3>
          <p className="mt-1 text-xs text-wepac-text-tertiary">{edgeLabel}</p>
        </div>
        <span className="bg-wepac-input px-2 py-1 text-xs capitalize text-wepac-text-secondary">
          {statusLabels[edgeStatus] ?? edgeStatus.replaceAll("_", " ")}
        </span>
      </div>
      {cycle.description && (
        <p className="mt-4 text-sm leading-relaxed text-wepac-text-tertiary">
          {cycle.description}
        </p>
      )}
      <dl className="mt-5 grid gap-3 text-xs sm:grid-cols-3">
        <div>
          <dt className="uppercase tracking-wider text-wepac-text-tertiary">
            {wp(locale, "Etapa", "Stage")}
          </dt>
          <dd className="mt-1 text-wepac-white">
            {cycle.stage
              ? STAGE_LABELS[cycle.stage]
              : wp(locale, "Por definir", "Not set")}
          </dd>
        </div>
        <div>
          <dt className="uppercase tracking-wider text-wepac-text-tertiary">
            {wp(locale, "Disciplina", "Discipline")}
          </dt>
          <dd className="mt-1 text-wepac-white">
            {cycle.primaryDiscipline?.name ??
              wp(locale, "Prática aberta", "Open practice")}
          </dd>
        </div>
        <div>
          <dt className="uppercase tracking-wider text-wepac-text-tertiary">
            {wp(locale, "Datas", "Dates")}
          </dt>
          <dd className="mt-1 text-wepac-white">
            {startsAt || endsAt
              ? `${startsAt ?? "TBC"} — ${endsAt ?? "TBC"}`
              : wp(locale, "Por confirmar", "To be confirmed")}
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
  const locale = useLocale();

  return (
    <div className="p-6 lg:p-8">
      <div>
        <h1 className="font-barlow text-2xl font-bold text-wepac-white">
          Academy
        </h1>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-wepac-text-tertiary">
          {wp(
            locale,
            "A tua participação explícita em Cycles de aprendizagem com duração definida. A inscrição e a facilitação são separadas da pertença a Packs, Connections e Mentorships.",
            "Your explicit participation in time-bounded learning Cycles. Enrollment and Facilitation are separate from Pack Membership, Connections, and Mentorships.",
          )}
        </p>
        <p className="mt-3 text-xs text-wepac-text-tertiary">
          {wp(
            locale,
            "Esta vista é apenas de leitura. A participação num Cycle é gerida no seu próprio fluxo consentido da Academy.",
            "This view is read-only. Cycle participation is managed through its own consented Academy flow.",
          )}
        </p>
      </div>

      <section className="mt-8">
        <h2 className="font-barlow text-xl font-bold text-wepac-white">
          {wp(locale, "As minhas inscrições", "My Enrollments")}
        </h2>
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          {enrollments.length === 0 ? (
            <p className="border border-dashed border-wepac-border p-6 text-sm text-wepac-text-tertiary xl:col-span-2">
              {wp(
                locale,
                "Sem inscrições atuais em Cycles.",
                "No current Cycle Enrollments.",
              )}
            </p>
          ) : (
            enrollments.map((enrollment) => (
              <CycleCard
                key={enrollment.id}
                cycle={enrollment.cycle}
                edgeLabel={wp(locale, "Inscrição no Cycle", "Cycle Enrollment")}
                edgeStatus={enrollment.status}
                locale={locale}
              />
            ))
          )}
        </div>
      </section>

      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-barlow text-xl font-bold text-wepac-white">
            {wp(locale, "As minhas facilitações", "My Facilitations")}
          </h2>
          {facilitations.length > 0 && (
            <Link
              href="/wepacker/mentor/sessions"
              className="text-xs text-wepac-text-secondary underline-offset-4 hover:text-wepac-white hover:underline"
            >
              {wp(
                locale,
                "Gerir Sessions do Cycle →",
                "Manage Cycle Sessions →",
              )}
            </Link>
          )}
        </div>
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          {facilitations.length === 0 ? (
            <p className="border border-dashed border-wepac-border p-6 text-sm text-wepac-text-tertiary xl:col-span-2">
              {wp(
                locale,
                "Sem facilitações atuais de Cycles.",
                "No current Cycle Facilitations.",
              )}
            </p>
          ) : (
            facilitations.map((facilitation) => (
              <CycleCard
                key={facilitation.id}
                cycle={facilitation.cycle}
                edgeLabel={
                  facilitation.role === "lead"
                    ? wp(locale, "Facilitador principal", "Lead Facilitator")
                    : wp(locale, "Facilitador do Cycle", "Cycle Facilitator")
                }
                edgeStatus={facilitation.status}
                locale={locale}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
