"use client";

import { getCurrentUser, mockSessions, mockUsers } from "@/data/artist-mock";

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Agendada",
  completed: "Realizada",
  cancelled: "Cancelada",
  no_show: "Não compareceu",
};

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-wepac-white/10 text-wepac-white",
  completed: "bg-wepac-success-bg text-wepac-success",
  cancelled: "bg-wepac-input text-wepac-text-tertiary",
  no_show: "bg-wepac-error-bg text-wepac-error",
};

export default function SessionsPage() {
  const user = getCurrentUser();
  const userSessions = mockSessions
    .filter((s) => s.attendees.some((a) => a.userId === user.id))
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

  const upcoming = userSessions.filter((s) => s.status === "scheduled");
  const past = userSessions.filter((s) => s.status !== "scheduled");

  return (
    <div className="p-6 lg:p-8">
      <h1 className="font-barlow text-2xl font-bold text-wepac-white">
        Sessões
      </h1>
      <p className="mt-1 text-sm text-wepac-text-tertiary">
        Sessões passadas e futuras com o teu mentor.
      </p>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-bold uppercase tracking-widest text-wepac-text-tertiary">
            Próximas
          </h2>
          <div className="mt-4 space-y-3">
            {upcoming.map((session) => {
              const mentor = mockUsers.find((u) => u.id === session.mentorId);
              return (
                <div key={session.id} className="rounded border border-wepac-white/20 bg-wepac-card p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-wepac-white">
                        {new Date(session.scheduledAt).toLocaleDateString("pt-PT", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                      <p className="mt-1 text-sm text-wepac-text-secondary">
                        {new Date(session.scheduledAt).toLocaleTimeString("pt-PT", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        · {session.durationMinutes} min
                      </p>
                    </div>
                    <span className={`rounded px-2 py-0.5 text-xs ${STATUS_COLORS[session.status]}`}>
                      {STATUS_LABELS[session.status]}
                    </span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <span className="rounded bg-wepac-input px-2 py-0.5 text-xs text-wepac-text-tertiary">
                      {session.sessionType === "individual" ? "Individual" : "Grupo"}
                    </span>
                    {mentor && (
                      <span className="rounded bg-wepac-input px-2 py-0.5 text-xs text-wepac-text-tertiary">
                        {mentor.name}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Past */}
      <div className="mt-8">
        <h2 className="text-sm font-bold uppercase tracking-widest text-wepac-text-tertiary">
          Passadas
        </h2>
        <div className="mt-4 space-y-3">
          {past.map((session) => {
            const mentor = mockUsers.find((u) => u.id === session.mentorId);
            return (
              <div key={session.id} className="rounded border border-wepac-border bg-wepac-card p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-wepac-white">
                      {new Date(session.scheduledAt).toLocaleDateString("pt-PT", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <p className="mt-1 text-sm text-wepac-text-secondary">
                      {new Date(session.scheduledAt).toLocaleTimeString("pt-PT", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      · {session.durationMinutes} min
                    </p>
                  </div>
                  <span className={`rounded px-2 py-0.5 text-xs ${STATUS_COLORS[session.status]}`}>
                    {STATUS_LABELS[session.status]}
                  </span>
                </div>
                <div className="mt-3 flex gap-2">
                  <span className="rounded bg-wepac-input px-2 py-0.5 text-xs text-wepac-text-tertiary">
                    {session.sessionType === "individual" ? "Individual" : "Grupo"}
                  </span>
                  {mentor && (
                    <span className="rounded bg-wepac-input px-2 py-0.5 text-xs text-wepac-text-tertiary">
                      {mentor.name}
                    </span>
                  )}
                </div>
                {session.notesPublished && session.notes && (
                  <div className="mt-4 border-t border-wepac-border pt-4">
                    <h4 className="text-xs font-bold uppercase text-wepac-text-tertiary">
                      Notas do Mentor
                    </h4>
                    <p className="mt-2 text-sm leading-relaxed text-wepac-text-secondary">
                      {session.notes}
                    </p>
                    {session.discussionPoints && (
                      <>
                        <h4 className="mt-3 text-xs font-bold uppercase text-wepac-text-tertiary">
                          Pontos discutidos
                        </h4>
                        <p className="mt-1 text-sm text-wepac-text-secondary">
                          {session.discussionPoints}
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
