"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  endConnection,
  requestConnection,
  respondToConnection,
  type ConnectionRequestType,
} from "@/lib/wepacker/actions/connection";

interface ConnectionSummary {
  id: string;
  type: ConnectionRequestType;
  status: "pending" | "active" | "declined" | "ended" | "blocked";
  requestedById: string | null;
  requestedAt: string;
  acceptedAt: string | null;
  otherPerson: { id: string; name: string };
}

interface Props {
  connections: ConnectionSummary[];
}

const TYPE_LABELS: Record<ConnectionRequestType, string> = {
  friend: "Friend",
  family: "Family",
  partner: "Partner",
  professional: "Professional",
  collaborator: "Collaborator",
  other: "Other",
};

export default function ConnectionsPageClient({
  connections,
}: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [type, setType] = useState<ConnectionRequestType>("friend");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const incoming = connections.filter(
    (connection) => connection.status === "pending",
  );
  const active = connections.filter((connection) => connection.status === "active");

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

  async function handleRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;
    await run(
      "request",
      () => requestConnection(email, type),
      "Pedido submetido. Por privacidade, não confirmamos se existe uma conta para esse email.",
    );
    setEmail("");
  }

  return (
    <div className="p-6 lg:p-8">
      <div>
        <h1 className="font-barlow text-2xl font-bold text-wepac-white">
          Connections
        </h1>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-wepac-text-tertiary">
          A Connection is a separate, mutual relationship between two People.
          It never follows automatically from a Pack, Cycle, Session or Mentorship
          and does not grant access to either Person&apos;s My Journey.
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
        <h2 className="font-barlow text-xl font-bold text-wepac-white">
          Request a Connection
        </h2>
        <p className="mt-1 text-sm text-wepac-text-tertiary">
          Use the exact account email and choose the shared relationship type.
        </p>
        <form onSubmit={handleRequest} className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem_auto]">
          <div>
            <label htmlFor="connection-email" className="sr-only">
              Person email
            </label>
            <input
              id="connection-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="off"
              placeholder="person@example.com"
              className="w-full bg-wepac-input px-3 py-2.5 text-sm text-wepac-white outline-none"
            />
          </div>
          <div>
            <label htmlFor="connection-type" className="sr-only">
              Relationship type
            </label>
            <select
              id="connection-type"
              value={type}
              onChange={(event) =>
                setType(event.target.value as ConnectionRequestType)
              }
              className="w-full bg-wepac-input px-3 py-2.5 text-sm text-wepac-white outline-none"
            >
              {(Object.keys(TYPE_LABELS) as ConnectionRequestType[]).map((value) => (
                <option key={value} value={value}>
                  {TYPE_LABELS[value]}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={busy === "request" || !email.trim()}
            className="bg-wepac-white px-5 py-2.5 text-sm font-bold text-wepac-black disabled:opacity-50"
          >
            {busy === "request" ? "Submitting…" : "Send request"}
          </button>
        </form>
      </section>

      {incoming.length > 0 && (
        <section className="mt-8">
          <h2 className="font-barlow text-xl font-bold text-wepac-white">
            Requests to review
          </h2>
          <div className="mt-4 space-y-3">
            {incoming.map((connection) => (
              <article
                key={connection.id}
                className="flex flex-col gap-4 border border-wepac-white/30 bg-wepac-card p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <h3 className="font-medium text-wepac-white">
                    {connection.otherPerson.name}
                  </h3>
                  <p className="mt-1 text-xs text-wepac-text-tertiary">
                    {TYPE_LABELS[connection.type]}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busy === connection.id}
                    onClick={() =>
                      run(
                        connection.id,
                        () => respondToConnection(connection.id, "accept"),
                        "Connection accepted.",
                      )
                    }
                    className="bg-wepac-white px-4 py-2 text-xs font-bold text-wepac-black disabled:opacity-50"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    disabled={busy === connection.id}
                    onClick={() =>
                      run(
                        connection.id,
                        () => respondToConnection(connection.id, "decline"),
                        "Connection declined.",
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
          My Connections
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {active.length === 0 ? (
            <p className="border border-dashed border-wepac-border p-6 text-sm text-wepac-text-tertiary md:col-span-2">
              No accepted Connections yet.
            </p>
          ) : (
            active.map((connection) => (
              <article key={connection.id} className="border border-wepac-border bg-wepac-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-medium text-wepac-white">
                      {connection.otherPerson.name}
                    </h3>
                    <p className="mt-1 text-xs text-wepac-text-tertiary">
                      {TYPE_LABELS[connection.type]}
                    </p>
                  </div>
                  <span className="bg-wepac-success-bg px-2 py-1 text-xs text-wepac-success">
                    Active
                  </span>
                </div>
                <button
                  type="button"
                  disabled={busy === connection.id}
                  onClick={() => {
                    if (!window.confirm(`End Connection with ${connection.otherPerson.name}?`)) return;
                    void run(
                      connection.id,
                      () => endConnection(connection.id),
                      "Connection ended.",
                    );
                  }}
                  className="mt-4 text-xs text-wepac-text-tertiary underline-offset-4 hover:text-wepac-white hover:underline disabled:opacity-50"
                >
                  End Connection
                </button>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
