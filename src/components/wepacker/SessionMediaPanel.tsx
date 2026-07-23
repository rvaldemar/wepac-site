"use client";

import { useState } from "react";
import {
  createSessionResultDocumentPreview,
  publishSessionResultDocument,
  revokeSessionResultDocument,
} from "@/lib/wepacker/actions/session-result-document";

type MediaWorkspace = {
  attendees: Array<{ id: string; userId: string; user: { name: string } }>;
  recordings: Array<{
    id: string;
    status: string;
    failureCode: string | null;
    assets: Array<{ id: string; mimeType: string | null; durationSeconds: number | null }>;
  }>;
  transcriptArtifacts: Array<{
    id: string;
    status: string;
    revision: number;
    text: string | null;
    language: string | null;
    failureCode: string | null;
  }>;
  resultDocuments: Array<{
    id: string;
    attendeeId: string;
    version: number;
    publishedAt: string;
    revokedAt: string | null;
  }>;
};

export function SessionMediaPanel({
  sessionId,
  workspace,
}: {
  sessionId: string;
  workspace: MediaWorkspace;
}) {
  const [preview, setPreview] = useState<{
    attendeeId: string;
    token: string;
    html: string;
    digest: string;
  } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function generate(attendeeId: string) {
    setBusy(true);
    setMessage(null);
    try {
      const result = await createSessionResultDocumentPreview(sessionId, attendeeId);
      setPreview({
        attendeeId,
        token: result.token,
        html: result.html,
        digest: result.contentSha256,
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Preview indisponível.");
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    if (!preview) return;
    setBusy(true);
    try {
      await publishSessionResultDocument({
        sessionId,
        attendeeId: preview.attendeeId,
        previewToken: preview.token,
        expectedSha256: preview.digest,
      });
      setPreview(null);
      setMessage("Documento publicado apenas para o mentorando exato.");
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Publicação indisponível.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-6 mb-8 border border-wepac-border bg-wepac-card p-6 lg:mx-8">
      <h2 className="text-sm font-bold text-wepac-white">
        Gravação, Transcript e documento
      </h2>
      <p className="mt-1 text-xs text-wepac-text-tertiary">
        Gravações e transcripts são privadas do mentor desta Session. O
        mentorando só recebe um documento depois de publicação explícita.
      </p>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div>
          <h3 className="text-xs font-bold uppercase text-wepac-text-tertiary">
            Gravações privadas
          </h3>
          {workspace.recordings.length === 0 ? (
            <p className="mt-2 text-xs text-wepac-text-tertiary">Sem gravações.</p>
          ) : (
            workspace.recordings.map((recording) => (
              <div key={recording.id} className="mt-2 border border-wepac-border p-3">
                <p className="text-xs text-wepac-white">{recording.status}</p>
                {recording.assets.map((asset) => (
                  <a
                    key={asset.id}
                    href={`/api/wepacker/session-media/recordings/${asset.id}`}
                    className="mt-2 block text-xs text-wepac-text-secondary hover:underline"
                  >
                    Download {asset.mimeType ?? "media"}
                  </a>
                ))}
              </div>
            ))
          )}
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase text-wepac-text-tertiary">
            Transcripts privadas
          </h3>
          {workspace.transcriptArtifacts.map((transcript) => (
            <div key={transcript.id} className="mt-2 border border-wepac-border p-3">
              <p className="text-xs text-wepac-white">
                v{transcript.revision} · {transcript.status}
              </p>
              {transcript.status === "ready" && (
                <a
                  href={`/api/wepacker/session-media/transcripts/${transcript.id}`}
                  className="mt-2 block text-xs text-wepac-text-secondary hover:underline"
                >
                  Download Transcript
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-6">
        <h3 className="text-xs font-bold uppercase text-wepac-text-tertiary">
          Documento para partilhar
        </h3>
        {workspace.attendees.map((attendee) => (
          <div key={attendee.id} className="mt-3 border border-wepac-border p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-wepac-white">{attendee.user.name}</p>
              <button
                disabled={busy}
                onClick={() => void generate(attendee.id)}
                className="bg-wepac-white px-3 py-1.5 text-xs font-bold text-wepac-black disabled:opacity-30"
              >
                Gerar preview
              </button>
            </div>
            {workspace.resultDocuments
              .filter((document) => document.attendeeId === attendee.id)
              .map((document) => (
                <div key={document.id} className="mt-2 flex gap-3 text-xs">
                  <a
                    href={`/api/wepacker/session-media/documents/${document.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-wepac-white hover:underline"
                  >
                    v{document.version}
                  </a>
                  {!document.revokedAt && (
                    <button
                      onClick={() => {
                        void revokeSessionResultDocument(document.id).then(() =>
                          window.location.reload(),
                        );
                      }}
                      className="text-wepac-error hover:underline"
                    >
                      Revogar partilha
                    </button>
                  )}
                </div>
              ))}
          </div>
        ))}
      </div>
      {preview && (
        <div className="mt-5 border border-wepac-white/30 p-4">
          <p className="text-xs text-wepac-text-tertiary">
            Revê exatamente este documento. Ainda não foi partilhado.
          </p>
          <iframe
            title="Preview do documento"
            sandbox=""
            srcDoc={preview.html}
            className="mt-3 h-[520px] w-full bg-white"
          />
          <div className="mt-3 flex gap-3">
            <button
              disabled={busy}
              onClick={() => void publish()}
              className="bg-wepac-white px-4 py-2 text-sm font-bold text-wepac-black disabled:opacity-30"
            >
              Partilhar com mentorando
            </button>
            <button
              onClick={() => setPreview(null)}
              className="border border-wepac-border px-4 py-2 text-sm text-wepac-white"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
      {message && <p className="mt-3 text-xs text-wepac-text-secondary">{message}</p>}
    </section>
  );
}
