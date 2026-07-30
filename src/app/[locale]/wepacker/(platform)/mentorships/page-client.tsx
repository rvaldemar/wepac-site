"use client";

import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { wp } from "@/i18n/copy/wepacker";
import { useRouter } from "@/i18n/navigation";
import {
  endMentorship,
  inviteMentee,
  respondToMentorship,
} from "@/lib/wepacker/actions/mentorship";

type MentorshipStatus = "pending" | "active" | "paused" | "declined" | "ended";

interface PersonSummary {
  id: string;
  name: string;
}

interface MentorshipSummary {
  id: string;
  status: MentorshipStatus;
  invitedById: string;
  invitedAt: string;
  activatedAt: string | null;
  endedAt: string | null;
  mentor: PersonSummary;
  mentee: PersonSummary;
}

interface Props {
  currentUserId: string;
  canInvite: boolean;
  writesEnabled: boolean;
  mentorships: MentorshipSummary[];
}

function StatusBadge({
  status,
  locale,
}: {
  status: MentorshipStatus;
  locale: string;
}) {
  const statusLabels: Record<MentorshipStatus, string> = {
    pending: wp(locale, "Pendente", "Pending"),
    active: wp(locale, "Ativa", "Active"),
    paused: wp(locale, "Pausada", "Paused"),
    declined: wp(locale, "Recusada", "Declined"),
    ended: wp(locale, "Terminada", "Ended"),
  };
  return (
    <span className="bg-wepac-input px-2 py-0.5 text-xs text-wepac-text-secondary">
      {statusLabels[status]}
    </span>
  );
}

export default function MentorshipsPageClient({
  currentUserId,
  canInvite,
  writesEnabled,
  mentorships,
}: Props) {
  const locale = useLocale();
  const router = useRouter();
  const [candidateEmail, setCandidateEmail] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const incoming = useMemo(
    () => mentorships.filter((row) => row.mentee.id === currentUserId),
    [currentUserId, mentorships]
  );
  const outgoing = useMemo(
    () => mentorships.filter((row) => row.mentor.id === currentUserId),
    [currentUserId, mentorships]
  );
  const pendingIncoming = incoming.filter((row) => row.status === "pending");

  async function runRelationshipAction(
    id: string,
    action: () => Promise<void>,
    success: string
  ) {
    setBusyId(id);
    setError("");
    setNotice("");
    try {
      await action();
      setNotice(success);
      router.refresh();
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : wp(
              locale,
              "Não foi possível atualizar a Mentorship.",
              "Could not update the Mentorship.",
            )
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!candidateEmail.trim()) return;
    setInviteBusy(true);
    setError("");
    setNotice("");
    try {
      await inviteMentee(candidateEmail.trim());
      setNotice(
        wp(
          locale,
          "Pedido submetido. Se o email corresponder a uma pessoa elegível, receberá o convite.",
          "Request submitted. If the email matches an eligible person, they will receive the invitation.",
        ),
      );
      setCandidateEmail("");
      router.refresh();
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : wp(
              locale,
              "Não foi possível enviar o convite.",
              "Could not send the invitation.",
            )
      );
    } finally {
      setInviteBusy(false);
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="font-barlow text-3xl font-bold text-wepac-white">
          Mentorships
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-wepac-text-tertiary">
          {wp(
            locale,
            "Uma Mentorship é uma relação direta entre Mentor e Mentee. Não exige inscrição num Cycle nem pertença a um Pack. Nesta fase, permite apenas descoberta mútua e agendamento de Sessions; não abre Life Map, Trails, Actions ou Messages.",
            "A Mentorship is a direct relationship between Mentor and Mentee. It requires neither Cycle Enrollment nor Pack Membership. At this stage, it only allows mutual discovery and Session scheduling; it does not open Life Map, Trails, Actions, or Messages.",
          )}
        </p>
        {!writesEnabled && (
          <p className="mt-4 border border-wepac-warning/40 bg-wepac-warning-bg p-4 text-sm text-wepac-warning">
            {wp(
              locale,
              "Novos convites e aceitações estão desativados até serem implementadas a verificação de idade e a política de consentimento parental. Um convite pode continuar a ser recusado e qualquer pessoa pode sempre terminar uma Mentorship existente.",
              "New invitations and acceptance are disabled until age verification and the Parent/Guardian consent policy are implemented. An invitation can still be declined, and either person can always end an existing Mentorship.",
            )}
          </p>
        )}

        {(error || notice) && (
          <p
            role={error ? "alert" : "status"}
            className={`mt-5 text-sm ${error ? "text-wepac-error" : "text-wepac-success"}`}
          >
            {error || notice}
          </p>
        )}

        {pendingIncoming.length > 0 && (
          <section className="mt-8 border border-wepac-white/30 bg-wepac-card p-6">
            <h2 className="font-barlow text-xl font-bold text-wepac-white">
              {wp(locale, "Convites para rever", "Invitations to review")}
            </h2>
            <div className="mt-4 space-y-3">
              {pendingIncoming.map((row) => (
                <div
                  key={row.id}
                  className="flex flex-col gap-3 border border-wepac-border bg-wepac-dark p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-wepac-white">{row.mentor.name}</p>
                    <p className="mt-1 text-xs text-wepac-text-tertiary">
                      {wp(
                        locale,
                        "convidou-te para ser teu Mentor",
                        "invited you to be their Mentee",
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {writesEnabled && (
                      <button
                        type="button"
                        disabled={busyId === row.id}
                        onClick={() =>
                          runRelationshipAction(
                            row.id,
                            () => respondToMentorship(row.id, "accept"),
                            wp(
                              locale,
                              "Mentorship aceite.",
                              "Mentorship accepted.",
                            )
                          )
                        }
                        className="bg-wepac-white px-4 py-2 text-xs font-bold text-wepac-black disabled:opacity-50"
                      >
                        {wp(locale, "Aceitar", "Accept")}
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={busyId === row.id}
                      onClick={() =>
                        runRelationshipAction(
                          row.id,
                          () => respondToMentorship(row.id, "decline"),
                          wp(
                            locale,
                            "Convite recusado.",
                            "Invitation declined.",
                          )
                        )
                      }
                      className="border border-wepac-border px-4 py-2 text-xs text-wepac-text-secondary disabled:opacity-50"
                    >
                      {wp(locale, "Recusar", "Decline")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {canInvite && (
          <section className="mt-8 border border-wepac-border bg-wepac-card p-6">
            <h2 className="font-barlow text-xl font-bold text-wepac-white">
              {wp(locale, "Convidar um Mentee", "Invite a Mentee")}
            </h2>
            <p className="mt-1 text-sm text-wepac-text-tertiary">
              {wp(
                locale,
                "A outra pessoa recebe o convite dentro da plataforma e por email.",
                "The other person receives the invitation in the platform and by email.",
              )}
            </p>
            <form onSubmit={handleInvite} className="mt-4 flex flex-col gap-3 sm:flex-row">
              <label className="sr-only" htmlFor="mentee-email">
                {wp(locale, "Email do Mentee", "Mentee email")}
              </label>
              <input
                id="mentee-email"
                type="email"
                value={candidateEmail}
                onChange={(event) => setCandidateEmail(event.target.value)}
                required
                placeholder="person@example.com"
                autoComplete="off"
                className="min-w-0 flex-1 bg-wepac-input px-3 py-2 text-sm text-wepac-white outline-none"
              />
              <button
                type="submit"
                disabled={inviteBusy || !candidateEmail.trim()}
                className="bg-wepac-white px-5 py-2 text-sm font-bold text-wepac-black disabled:opacity-50"
              >
                {inviteBusy
                  ? wp(locale, "A enviar…", "Sending…")
                  : wp(locale, "Enviar convite", "Send invitation")}
              </button>
            </form>
          </section>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <MentorshipList
            title={wp(locale, "Os meus Mentees", "My Mentees")}
            rows={outgoing}
            otherPerson={(row) => row.mentee}
            busyId={busyId}
            onEnd={(row) =>
              runRelationshipAction(
                row.id,
                () => endMentorship(row.id),
                wp(locale, "Mentorship terminada.", "Mentorship ended.")
              )
            }
            locale={locale}
          />
          <MentorshipList
            title={wp(locale, "Os meus Mentors", "My Mentors")}
            rows={incoming}
            otherPerson={(row) => row.mentor}
            busyId={busyId}
            onEnd={(row) =>
              runRelationshipAction(
                row.id,
                () => endMentorship(row.id),
                wp(locale, "Mentorship terminada.", "Mentorship ended.")
              )
            }
            locale={locale}
          />
        </div>
      </div>
    </div>
  );
}

function MentorshipList({
  title,
  rows,
  otherPerson,
  busyId,
  onEnd,
  locale,
}: {
  title: string;
  rows: MentorshipSummary[];
  otherPerson: (row: MentorshipSummary) => PersonSummary;
  busyId: string | null;
  onEnd: (row: MentorshipSummary) => void;
  locale: string;
}) {
  return (
    <section className="border border-wepac-border bg-wepac-card p-6">
      <h2 className="font-barlow text-xl font-bold text-wepac-white">{title}</h2>
      <div className="mt-4 space-y-3">
        {rows.length === 0 ? (
          <p className="text-sm text-wepac-text-tertiary">
            {wp(locale, "Ainda nenhuma.", "None yet.")}
          </p>
        ) : (
          rows.map((row) => (
            <div key={row.id} className="border border-wepac-border bg-wepac-dark p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-wepac-white">{otherPerson(row).name}</p>
                  <p className="mt-1 text-xs text-wepac-text-tertiary">
                    {wp(locale, "Convite", "Invitation")}:{" "}
                    {new Date(row.invitedAt).toLocaleDateString(locale)}
                  </p>
                </div>
                <StatusBadge status={row.status} locale={locale} />
              </div>
              {(["pending", "active", "paused"] as MentorshipStatus[]).includes(
                row.status
              ) && (
                <button
                  type="button"
                  disabled={busyId === row.id}
                  onClick={() => onEnd(row)}
                  className="mt-3 text-xs text-wepac-text-tertiary underline-offset-4 hover:text-wepac-white hover:underline disabled:opacity-50"
                >
                  {wp(locale, "Terminar Mentorship", "End Mentorship")}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
