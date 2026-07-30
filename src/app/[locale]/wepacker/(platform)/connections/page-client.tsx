"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { wp } from "@/i18n/copy/wepacker";
import { useRouter } from "@/i18n/navigation";
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

export default function ConnectionsPageClient({
  connections,
}: Props) {
  const locale = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [type, setType] = useState<ConnectionRequestType>("friend");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const typeLabels: Record<ConnectionRequestType, string> = {
    friend: wp(locale, "Amizade", "Friend"),
    family: wp(locale, "Família", "Family"),
    partner: wp(locale, "Parceiro", "Partner"),
    professional: wp(locale, "Profissional", "Professional"),
    collaborator: wp(locale, "Colaborador", "Collaborator"),
    other: wp(locale, "Outra", "Other"),
  };

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
      setError(
        wp(
          locale,
          "Não foi possível concluir esta operação.",
          "Could not complete this operation.",
        ),
      );
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
      wp(
        locale,
        "Pedido submetido. Por privacidade, não confirmamos se existe uma conta para esse email.",
        "Request submitted. For privacy, we do not confirm whether an account exists for that email.",
      ),
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
          {wp(
            locale,
            "Uma Connection é uma relação separada e mútua entre duas pessoas. Nunca resulta automaticamente de um Pack, Cycle, Session ou Mentorship, nem dá acesso ao My Journey da outra pessoa.",
            "A Connection is a separate, mutual relationship between two people. It never follows automatically from a Pack, Cycle, Session, or Mentorship and does not grant access to either person's My Journey.",
          )}
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
          {wp(locale, "Pedir uma Connection", "Request a Connection")}
        </h2>
        <p className="mt-1 text-sm text-wepac-text-tertiary">
          {wp(
            locale,
            "Usa o email exato da conta e escolhe o tipo de relação partilhada.",
            "Use the exact account email and choose the shared relationship type.",
          )}
        </p>
        <form onSubmit={handleRequest} className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem_auto]">
          <div>
            <label htmlFor="connection-email" className="sr-only">
              {wp(locale, "Email da pessoa", "Person email")}
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
              {wp(locale, "Tipo de relação", "Relationship type")}
            </label>
            <select
              id="connection-type"
              value={type}
              onChange={(event) =>
                setType(event.target.value as ConnectionRequestType)
              }
              className="w-full bg-wepac-input px-3 py-2.5 text-sm text-wepac-white outline-none"
            >
              {(Object.keys(typeLabels) as ConnectionRequestType[]).map((value) => (
                <option key={value} value={value}>
                  {typeLabels[value]}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={busy === "request" || !email.trim()}
            className="bg-wepac-white px-5 py-2.5 text-sm font-bold text-wepac-black disabled:opacity-50"
          >
            {busy === "request"
              ? wp(locale, "A enviar…", "Submitting…")
              : wp(locale, "Enviar pedido", "Send request")}
          </button>
        </form>
      </section>

      {incoming.length > 0 && (
        <section className="mt-8">
          <h2 className="font-barlow text-xl font-bold text-wepac-white">
            {wp(locale, "Pedidos para rever", "Requests to review")}
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
                    {typeLabels[connection.type]}
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
                        wp(
                          locale,
                          "Connection aceite.",
                          "Connection accepted.",
                        ),
                      )
                    }
                    className="bg-wepac-white px-4 py-2 text-xs font-bold text-wepac-black disabled:opacity-50"
                  >
                    {wp(locale, "Aceitar", "Accept")}
                  </button>
                  <button
                    type="button"
                    disabled={busy === connection.id}
                    onClick={() =>
                      run(
                        connection.id,
                        () => respondToConnection(connection.id, "decline"),
                        wp(
                          locale,
                          "Connection recusada.",
                          "Connection declined.",
                        ),
                      )
                    }
                    className="border border-wepac-border px-4 py-2 text-xs text-wepac-text-secondary disabled:opacity-50"
                  >
                    {wp(locale, "Recusar", "Decline")}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="font-barlow text-xl font-bold text-wepac-white">
          {wp(locale, "As minhas Connections", "My Connections")}
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {active.length === 0 ? (
            <p className="border border-dashed border-wepac-border p-6 text-sm text-wepac-text-tertiary md:col-span-2">
              {wp(
                locale,
                "Ainda sem Connections aceites.",
                "No accepted Connections yet.",
              )}
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
                      {typeLabels[connection.type]}
                    </p>
                  </div>
                  <span className="bg-wepac-success-bg px-2 py-1 text-xs text-wepac-success">
                    {wp(locale, "Ativa", "Active")}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={busy === connection.id}
                  onClick={() => {
                    if (
                      !window.confirm(
                        wp(
                          locale,
                          `Terminar a Connection com ${connection.otherPerson.name}?`,
                          `End Connection with ${connection.otherPerson.name}?`,
                        ),
                      )
                    )
                      return;
                    void run(
                      connection.id,
                      () => endConnection(connection.id),
                      wp(
                        locale,
                        "Connection terminada.",
                        "Connection ended.",
                      ),
                    );
                  }}
                  className="mt-4 text-xs text-wepac-text-tertiary underline-offset-4 hover:text-wepac-white hover:underline disabled:opacity-50"
                >
                  {wp(locale, "Terminar Connection", "End Connection")}
                </button>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
