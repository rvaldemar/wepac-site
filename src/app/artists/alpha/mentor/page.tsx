"use client";

import Link from "next/link";
import { getArtists, mockTasks, mockSessions, mockConversations, computeAreaScores } from "@/data/artist-mock";
import { LEVEL_LABELS, PHASE_LABELS } from "@/lib/types/artist";

export default function MentorDashboard() {
  const artists = getArtists();

  // Pending actions
  const pendingSessions = mockSessions.filter((s) => s.status === "scheduled");
  const unreadMessages = mockConversations
    .flatMap((c) => c.messages)
    .filter((m) => !m.readAt && m.userId !== "m1");

  return (
    <div className="p-6 lg:p-8">
      <h1 className="font-cormorant text-2xl font-bold text-wepac-white">
        Painel do Mentor
      </h1>
      <p className="mt-1 text-sm text-wepac-text-tertiary">
        Visão geral dos artistas e ações pendentes.
      </p>

      {/* Quick stats */}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded border border-wepac-border bg-wepac-card p-4 text-center">
          <p className="font-cormorant text-2xl font-bold text-wepac-white">{artists.length}</p>
          <p className="text-xs text-wepac-text-tertiary">Artistas</p>
        </div>
        <div className="rounded border border-wepac-border bg-wepac-card p-4 text-center">
          <p className="font-cormorant text-2xl font-bold text-wepac-white">{pendingSessions.length}</p>
          <p className="text-xs text-wepac-text-tertiary">Sessões agendadas</p>
        </div>
        <div className="rounded border border-wepac-border bg-wepac-card p-4 text-center">
          <p className="font-cormorant text-2xl font-bold text-wepac-borgonha">{unreadMessages.length}</p>
          <p className="text-xs text-wepac-text-tertiary">Mensagens por ler</p>
        </div>
        <div className="rounded border border-wepac-border bg-wepac-card p-4 text-center">
          <p className="font-cormorant text-2xl font-bold text-wepac-white">
            {mockTasks.filter((t) => t.status !== "done").length}
          </p>
          <p className="text-xs text-wepac-text-tertiary">Tarefas pendentes</p>
        </div>
      </div>

      {/* Artists list */}
      <div className="mt-8">
        <h2 className="text-sm font-bold uppercase tracking-widest text-wepac-text-tertiary">
          Artistas
        </h2>
        <div className="mt-4 space-y-3">
          {artists.map((artist) => {
            const artistTasks = mockTasks.filter((t) => t.userId === artist.id && t.status !== "done");
            let scores;
            try {
              scores = computeAreaScores(artist.id, "mid");
            } catch {
              scores = null;
            }

            const avgScore = scores
              ? Object.values(scores).reduce((sum, s) => sum + s.composite, 0) / 6
              : 0;

            // Health indicator based on task completion and engagement
            const health =
              artistTasks.length === 0
                ? "green"
                : artistTasks.some((t) => new Date(t.deadline) < new Date())
                  ? "red"
                  : "yellow";

            return (
              <Link
                key={artist.id}
                href={`/artists/alpha/mentor/artists/${artist.id}`}
                className="flex items-center justify-between rounded border border-wepac-border bg-wepac-card p-4 transition-colors hover:border-wepac-borgonha/30"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-wepac-borgonha/20">
                    <span className="text-sm font-bold text-wepac-borgonha">
                      {artist.name.split(" ").map((n) => n[0]).join("")}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-wepac-white">{artist.name}</p>
                    <div className="mt-0.5 flex gap-2">
                      <span className="text-xs text-wepac-text-tertiary">
                        {LEVEL_LABELS[artist.level]}
                      </span>
                      <span className="text-xs text-wepac-text-tertiary">
                        · {PHASE_LABELS[artist.currentPhase]}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {avgScore > 0 && (
                    <span className="text-sm text-wepac-text-secondary">
                      {avgScore.toFixed(1)}
                    </span>
                  )}
                  <span className="text-xs text-wepac-text-tertiary">
                    {artistTasks.length} tarefas
                  </span>
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      health === "green"
                        ? "bg-green-500"
                        : health === "yellow"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Upcoming sessions */}
      <div className="mt-8">
        <h2 className="text-sm font-bold uppercase tracking-widest text-wepac-text-tertiary">
          Sessões esta semana
        </h2>
        <div className="mt-4 space-y-3">
          {pendingSessions.map((session) => {
            const attendeeNames = session.attendees
              .map((a) => {
                const u = [...getArtists()].find((u) => u.id === a.userId);
                return u?.name ?? "—";
              })
              .join(", ");
            return (
              <div key={session.id} className="rounded border border-wepac-border bg-wepac-card p-4">
                <div className="flex items-center justify-between">
                  <div>
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
                    <p className="mt-0.5 text-xs text-wepac-text-tertiary">
                      {session.sessionType === "individual" ? "Individual" : "Grupo"} · {attendeeNames}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          {pendingSessions.length === 0 && (
            <p className="text-sm text-wepac-text-tertiary">Sem sessões agendadas.</p>
          )}
        </div>
      </div>
    </div>
  );
}
