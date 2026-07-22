"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createMyPack,
  inviteToMyPack,
  leavePack,
  respondToPackInvitation,
} from "@/lib/wepacker/actions/community";

type PackStatus = "draft" | "active" | "archived";
type MembershipStatus =
  | "invited"
  | "active"
  | "paused"
  | "declined"
  | "left"
  | "removed";

interface OwnedPack {
  id: string;
  description: string;
  status: PackStatus;
  createdAt: string;
  memberships: Array<{
    id: string;
    status: MembershipStatus;
    role: "owner" | "moderator" | "member";
    user: { id: string; name: string };
  }>;
}

interface JoinedPack {
  id: string;
  status: MembershipStatus;
  invitedAt: string;
  joinedAt: string | null;
  pack: {
    id: string;
    name: string;
    description: string;
    status: PackStatus;
    personalOwner: { id: string; name: string } | null;
  };
}

interface Props {
  ownedPack: OwnedPack | null;
  joinedPacks: JoinedPack[];
}

const STATUS_LABELS: Record<PackStatus, string> = {
  draft: "Draft",
  active: "Active",
  archived: "Archived",
};

function packDisplayName(pack: JoinedPack["pack"]): string {
  return pack.personalOwner ? `${pack.personalOwner.name}'s Pack` : pack.name;
}

export default function CommunitiesPageClient({ ownedPack, joinedPacks }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const invitations = joinedPacks.filter((item) => item.status === "invited");
  const activeMemberships = joinedPacks.filter((item) => item.status === "active");

  async function run(key: string, action: () => Promise<unknown>, success: string) {
    setBusy(key);
    setError(null);
    setNotice(null);
    try {
      await action();
      setNotice(success);
      router.refresh();
    } catch {
      setError("Não foi possível concluir esta operação.");
    } finally {
      setBusy(null);
    }
  }

  async function handleInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ownedPack || !email.trim()) return;
    await run(
      "invite",
      () => inviteToMyPack(ownedPack.id, email),
      "Pedido submetido. Por privacidade, não confirmamos se existe uma conta para esse email.",
    );
    setEmail("");
  }

  return (
    <div className="p-6 lg:p-8">
      <div>
        <h1 className="font-barlow text-2xl font-bold text-wepac-white">
          Communities
        </h1>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-wepac-text-tertiary">
          Packs are communities you explicitly choose to belong to. They do not
          open My Journey, create a Connection, start a Mentorship or enrol anyone
          in an Academy Cycle.
        </p>
      </div>

      {(error || notice) && (
        <p
          role={error ? "alert" : "status"}
          className={`mt-5 text-sm ${error ? "text-wepac-error" : "text-wepac-success"}`}
        >
          {error || notice}
        </p>
      )}

      <section className="mt-8 border border-wepac-border bg-wepac-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-barlow text-xl font-bold text-wepac-white">
              My Pack
            </h2>
            <p className="mt-1 text-sm text-wepac-text-tertiary">
              Your personal community. It becomes Active with two accepted people.
            </p>
          </div>
          {ownedPack && (
            <span className="bg-wepac-input px-2 py-1 text-xs text-wepac-text-secondary">
              {STATUS_LABELS[ownedPack.status]}
            </span>
          )}
        </div>

        {!ownedPack ? (
          <button
            type="button"
            disabled={busy === "create"}
            onClick={() =>
              run("create", () => createMyPack(), "My Pack created.")
            }
            className="mt-5 bg-wepac-white px-5 py-2 text-sm font-bold text-wepac-black disabled:opacity-50"
          >
            {busy === "create" ? "Creating…" : "Create My Pack"}
          </button>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-wepac-text-tertiary">
                People
              </h3>
              <div className="mt-3 space-y-2">
                {ownedPack.memberships.map((membership) => (
                  <div
                    key={membership.id}
                    className="flex items-center justify-between gap-3 border border-wepac-border bg-wepac-dark px-4 py-3"
                  >
                    <div>
                      <p className="text-sm text-wepac-white">{membership.user.name}</p>
                      <p className="mt-0.5 text-xs capitalize text-wepac-text-tertiary">
                        {membership.role}
                      </p>
                    </div>
                    <span className="text-xs capitalize text-wepac-text-tertiary">
                      {membership.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleInvite}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-wepac-text-tertiary">
                Invite a Person
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-wepac-text-tertiary">
                Use their exact account email. The invitation creates only a Pack
                Membership after they accept.
              </p>
              <label htmlFor="pack-invite-email" className="sr-only">
                Person email
              </label>
              <input
                id="pack-invite-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="off"
                placeholder="person@example.com"
                className="mt-4 w-full bg-wepac-input px-3 py-2.5 text-sm text-wepac-white outline-none"
              />
              <button
                type="submit"
                disabled={busy === "invite" || !email.trim()}
                className="mt-3 bg-wepac-white px-5 py-2 text-sm font-bold text-wepac-black disabled:opacity-50"
              >
                {busy === "invite" ? "Submitting…" : "Send invitation"}
              </button>
            </form>
          </div>
        )}
      </section>

      {invitations.length > 0 && (
        <section className="mt-8">
          <h2 className="font-barlow text-xl font-bold text-wepac-white">
            Invitations
          </h2>
          <div className="mt-4 space-y-3">
            {invitations.map((membership) => (
              <article
                key={membership.id}
                className="flex flex-col gap-4 border border-wepac-white/30 bg-wepac-card p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <h3 className="font-medium text-wepac-white">
                    {packDisplayName(membership.pack)}
                  </h3>
                  <p className="mt-1 text-xs text-wepac-text-tertiary">
                    Separate community invitation · no other relationship is created
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busy === membership.id}
                    onClick={() =>
                      run(
                        membership.id,
                        () => respondToPackInvitation(membership.id, "accept"),
                        "Pack invitation accepted.",
                      )
                    }
                    className="bg-wepac-white px-4 py-2 text-xs font-bold text-wepac-black disabled:opacity-50"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    disabled={busy === membership.id}
                    onClick={() =>
                      run(
                        membership.id,
                        () => respondToPackInvitation(membership.id, "decline"),
                        "Pack invitation declined.",
                      )
                    }
                    className="border border-wepac-border px-4 py-2 text-xs text-wepac-text-secondary disabled:opacity-50"
                  >
                    Decline
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="font-barlow text-xl font-bold text-wepac-white">
          Packs I belong to
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {activeMemberships.length === 0 ? (
            <p className="border border-dashed border-wepac-border p-6 text-sm text-wepac-text-tertiary md:col-span-2">
              No other accepted Packs yet.
            </p>
          ) : (
            activeMemberships.map((membership) => (
              <article key={membership.id} className="border border-wepac-border bg-wepac-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-medium text-wepac-white">
                      {packDisplayName(membership.pack)}
                    </h3>
                    {membership.pack.description && (
                      <p className="mt-2 text-sm text-wepac-text-tertiary">
                        {membership.pack.description}
                      </p>
                    )}
                  </div>
                  <span className="bg-wepac-input px-2 py-1 text-xs text-wepac-text-secondary">
                    {STATUS_LABELS[membership.pack.status]}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={busy === membership.id}
                  onClick={() => {
                    if (!window.confirm(`Leave ${packDisplayName(membership.pack)}?`)) return;
                    void run(
                      membership.id,
                      () => leavePack(membership.id),
                      "You left the Pack.",
                    );
                  }}
                  className="mt-4 text-xs text-wepac-text-tertiary underline-offset-4 hover:text-wepac-white hover:underline disabled:opacity-50"
                >
                  Leave Pack
                </button>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
