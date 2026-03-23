"use client";

import { useState } from "react";
import { mockSessions, mockUsers, getArtists } from "@/data/artist-mock";

export default function MentorSessionsPage() {
  const [showCreate, setShowCreate] = useState(false);

  const sessions = [...mockSessions].sort(
    (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
  );

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-barlow text-2xl font-bold text-wepac-white">
            Sessões
          </h1>
          <p className="mt-1 text-sm text-wepac-text-tertiary">
            Gestão de sessões com artistas.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded bg-wepac-white px-4 py-2 text-sm font-bold text-wepac-black"
        >
          + Nova Sessão
        </button>
      </div>

      {showCreate && (
        <div className="mt-6 rounded border border-wepac-white/20 bg-wepac-card p-6">
          <h3 className="text-sm font-bold text-wepac-white">Criar Sessão</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-wepac-text-tertiary">Tipo</label>
              <select className="mt-1 w-full rounded bg-wepac-input px-3 py-2 text-sm text-wepac-white">
                <option>Individual</option>
                <option>Grupo</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-wepac-text-tertiary">Data e hora</label>
              <input
                type="datetime-local"
                className="mt-1 w-full rounded bg-wepac-input px-3 py-2 text-sm text-wepac-white"
              />
            </div>
            <div>
              <label className="block text-xs text-wepac-text-tertiary">Duração (min)</label>
              <input
                type="number"
                defaultValue={60}
                className="mt-1 w-full rounded bg-wepac-input px-3 py-2 text-sm text-wepac-white"
              />
            </div>
            <div>
              <label className="block text-xs text-wepac-text-tertiary">Artista(s)</label>
              <select className="mt-1 w-full rounded bg-wepac-input px-3 py-2 text-sm text-wepac-white">
                {getArtists().map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button className="rounded bg-wepac-white px-4 py-2 text-sm font-bold text-wepac-black">
              Criar
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="rounded border border-wepac-border px-4 py-2 text-sm text-wepac-text-secondary"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="mt-8 space-y-3">
        {sessions.map((session) => {
          const attendeeNames = session.attendees
            .map((a) => mockUsers.find((u) => u.id === a.userId)?.name ?? "—")
            .join(", ");
          return (
            <div key={session.id} className="rounded border border-wepac-border bg-wepac-card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-wepac-white">
                    {new Date(session.scheduledAt).toLocaleDateString("pt-PT", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    ·{" "}
                    {new Date(session.scheduledAt).toLocaleTimeString("pt-PT", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="mt-0.5 text-xs text-wepac-text-tertiary">
                    {session.sessionType === "individual" ? "Individual" : "Grupo"} · {attendeeNames} · {session.durationMinutes} min
                  </p>
                </div>
                <span
                  className={`rounded px-2 py-0.5 text-xs ${
                    session.status === "scheduled"
                      ? "bg-wepac-white/10 text-wepac-white"
                      : session.status === "completed"
                        ? "bg-wepac-success-bg text-wepac-success"
                        : "bg-wepac-input text-wepac-text-tertiary"
                  }`}
                >
                  {session.status === "scheduled" ? "Agendada" : session.status === "completed" ? "Realizada" : session.status}
                </span>
              </div>
              {session.status === "completed" && session.notes && (
                <p className="mt-3 border-t border-wepac-border pt-3 text-xs text-wepac-text-tertiary">
                  {session.notes}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
