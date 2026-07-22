"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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

const STATUS_LABELS: Record<MentorshipStatus, string> = {
  pending: "Pending",
  active: "Active",
  paused: "Paused",
  declined: "Declined",
  ended: "Ended",
};

function StatusBadge({ status }: { status: MentorshipStatus }) {
  return (
    <span className="bg-wepac-input px-2 py-0.5 text-xs text-wepac-text-secondary">
      {STATUS_LABELS[status]}
    </span>
  );
}

export default function MentorshipsPageClient({
  currentUserId,
  canInvite,
  writesEnabled,
  mentorships,
}: Props) {
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
          : "Não foi possível atualizar a Mentorship."
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
        "Request submitted. If the email matches an eligible Person, they will receive the invitation.",
      );
      setCandidateEmail("");
      router.refresh();
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Não foi possível enviar a invitation."
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
          Uma Mentorship é uma relação direta entre Mentor e Mentee. Não exige
          Cycle Enrollment nem Pack Membership. Nesta fase, permite apenas
          descoberta mútua e agendamento de Sessions; não abre Life Map, Trails,
          Actions ou Messages.
        </p>
        {!writesEnabled && (
          <p className="mt-4 border border-wepac-warning/40 bg-wepac-warning-bg p-4 text-sm text-wepac-warning">
            New invitations and acceptance are disabled until age verification and
            the Parent/Guardian consent policy are implemented. An invitation can
            still be declined, and either person can always end an existing
            Mentorship.
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
              Invitations to review
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
                      convidou-te para ser teu Mentor
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
                            "Mentorship accepted."
                          )
                        }
                        className="bg-wepac-white px-4 py-2 text-xs font-bold text-wepac-black disabled:opacity-50"
                      >
                        Accept
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={busyId === row.id}
                      onClick={() =>
                        runRelationshipAction(
                          row.id,
                          () => respondToMentorship(row.id, "decline"),
                          "Invitation declined."
                        )
                      }
                      className="border border-wepac-border px-4 py-2 text-xs text-wepac-text-secondary disabled:opacity-50"
                    >
                      Decline
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
              Invite a Mentee
            </h2>
            <p className="mt-1 text-sm text-wepac-text-tertiary">
              A outra pessoa recebe a invitation dentro da plataforma e por email.
            </p>
            <form onSubmit={handleInvite} className="mt-4 flex flex-col gap-3 sm:flex-row">
              <label className="sr-only" htmlFor="mentee-email">
                Mentee email
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
                {inviteBusy ? "Sending…" : "Send invitation"}
              </button>
            </form>
          </section>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <MentorshipList
            title="My Mentees"
            rows={outgoing}
            otherPerson={(row) => row.mentee}
            busyId={busyId}
            onEnd={(row) =>
              runRelationshipAction(
                row.id,
                () => endMentorship(row.id),
                "Mentorship ended."
              )
            }
          />
          <MentorshipList
            title="My Mentors"
            rows={incoming}
            otherPerson={(row) => row.mentor}
            busyId={busyId}
            onEnd={(row) =>
              runRelationshipAction(
                row.id,
                () => endMentorship(row.id),
                "Mentorship ended."
              )
            }
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
}: {
  title: string;
  rows: MentorshipSummary[];
  otherPerson: (row: MentorshipSummary) => PersonSummary;
  busyId: string | null;
  onEnd: (row: MentorshipSummary) => void;
}) {
  return (
    <section className="border border-wepac-border bg-wepac-card p-6">
      <h2 className="font-barlow text-xl font-bold text-wepac-white">{title}</h2>
      <div className="mt-4 space-y-3">
        {rows.length === 0 ? (
          <p className="text-sm text-wepac-text-tertiary">None yet.</p>
        ) : (
          rows.map((row) => (
            <div key={row.id} className="border border-wepac-border bg-wepac-dark p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-wepac-white">{otherPerson(row).name}</p>
                  <p className="mt-1 text-xs text-wepac-text-tertiary">
                    Invitation: {new Date(row.invitedAt).toLocaleDateString("pt-PT")}
                  </p>
                </div>
                <StatusBadge status={row.status} />
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
                  End Mentorship
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
