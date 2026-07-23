"use client";

import { useState } from "react";
import {
  invalidateSessionParticipantCapacity,
  verifySessionParticipantAdultCapacity,
} from "@/lib/wepacker/actions/session-media";

export function SessionCapacityAdmin({
  rows,
}: {
  rows: Array<{
    sessionId: string;
    scheduledAt: string;
    participants: Array<{
      id: string;
      name: string;
      status: string;
      verifiedAt: string | null;
    }>;
  }>;
}) {
  const [evidence, setEvidence] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <div key={row.sessionId} className="border border-wepac-border bg-wepac-card p-4">
          <p className="text-sm font-bold text-wepac-white">
            {new Date(row.scheduledAt).toLocaleString("pt-PT")}
          </p>
          {row.participants.map((participant) => {
            const key = `${row.sessionId}:${participant.id}`;
            return (
              <div key={participant.id} className="mt-3 border-t border-wepac-border pt-3">
                <p className="text-sm text-wepac-white">{participant.name}</p>
                <p className="text-xs text-wepac-text-tertiary">
                  {participant.status}
                  {participant.verifiedAt
                    ? ` · ${new Date(participant.verifiedAt).toLocaleString("pt-PT")}`
                    : ""}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <input
                    value={evidence[key] ?? ""}
                    onChange={(event) =>
                      setEvidence((current) => ({
                        ...current,
                        [key]: event.target.value,
                      }))
                    }
                    placeholder="Referência opaca de verificação"
                    className="min-w-72 bg-wepac-input px-3 py-1.5 text-xs text-wepac-white"
                  />
                  <button
                    onClick={() => {
                      void verifySessionParticipantAdultCapacity({
                        sessionId: row.sessionId,
                        subjectUserId: participant.id,
                        evidenceRef: evidence[key] ?? "",
                      })
                        .then(() => window.location.reload())
                        .catch((error) =>
                          setMessage(
                            error instanceof Error
                              ? error.message
                              : "Verificação indisponível.",
                          ),
                        );
                    }}
                    className="bg-wepac-white px-3 py-1.5 text-xs font-bold text-wepac-black"
                  >
                    Verificar adulto
                  </button>
                  <button
                    onClick={() => {
                      void invalidateSessionParticipantCapacity({
                        sessionId: row.sessionId,
                        subjectUserId: participant.id,
                      }).then(() => window.location.reload());
                    }}
                    className="border border-wepac-border px-3 py-1.5 text-xs text-wepac-error"
                  >
                    Invalidar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ))}
      {message && <p className="text-xs text-wepac-error">{message}</p>}
    </div>
  );
}
