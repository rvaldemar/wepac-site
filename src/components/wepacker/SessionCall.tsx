"use client";

import { useEffect, useRef, useState } from "react";
import {
  confirmSessionRecordingStarted,
  recordMySessionConsent,
  reportSessionRecordingCommandFailure,
  reportMySessionCallPresence,
  startSessionRecording,
  stopSessionRecording,
} from "@/lib/wepacker/actions/session-media";

type JitsiApi = {
  addListener: (event: string, listener: (payload?: unknown) => void) => void;
  executeCommand: (command: string, ...args: unknown[]) => void;
  dispose: () => void;
};

declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (
      domain: string,
      options: Record<string, unknown>,
    ) => JitsiApi;
  }
}

type Purpose = "recording" | "transcription" | "ai_debrief";
type Decision = "granted" | "denied" | "withdrawn";

export function SessionCall({
  sessionId,
  baseUrl,
  room,
  token,
  isOrganizer,
  initialCapacity,
  initialConsent,
  initialRecording,
}: {
  sessionId: string;
  baseUrl: string;
  room: string;
  token: string | null;
  isOrganizer: boolean;
  initialCapacity: string;
  initialConsent: Record<Purpose, Decision | null>;
  initialRecording: { id: string; status: string } | null;
}) {
  const container = useRef<HTMLDivElement>(null);
  const api = useRef<JitsiApi | null>(null);
  const pendingRecording = useRef<string | null>(null);
  const recordingRef = useRef(initialRecording);
  const confirmationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [consent, setConsent] = useState(initialConsent);
  const [recording, setRecording] = useState(initialRecording);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const host = new URL(baseUrl).host;
    const script = document.createElement("script");
    script.src = `${baseUrl.replace(/\/+$/, "")}/external_api.js`;
    script.async = true;
    script.onload = () => {
      if (!container.current || !window.JitsiMeetExternalAPI) return;
      const instance = new window.JitsiMeetExternalAPI(host, {
        roomName: room,
        ...(token ? { jwt: token } : {}),
        parentNode: container.current,
        width: "100%",
        height: 620,
        configOverwrite: {
          prejoinPageEnabled: false,
          disableThirdPartyRequests: true,
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            "microphone",
            "camera",
            "desktop",
            "fullscreen",
            "chat",
            "raisehand",
            "tileview",
            "settings",
          ],
        },
      });
      api.current = instance;
      let heartbeat: ReturnType<typeof setInterval> | null = null;
      instance.addListener("videoConferenceJoined", () => {
        void reportMySessionCallPresence(sessionId, "joined");
        heartbeat = setInterval(() => {
          void reportMySessionCallPresence(sessionId, "heartbeat").then(
            ({ stopRequested }) => {
              if (isOrganizer && stopRequested) {
                instance.executeCommand("stopRecording", "file");
                setRecording(null);
              }
            },
          );
        }, 10_000);
      });
      instance.addListener("videoConferenceLeft", () => {
        if (heartbeat) clearInterval(heartbeat);
        void reportMySessionCallPresence(sessionId, "left");
      });
      instance.addListener("recordingStatusChanged", (payload) => {
        const state = payload as { on?: boolean; mode?: string } | undefined;
        if (state?.mode !== "file") return;
        if (state.on) {
          const id =
            pendingRecording.current ??
            recordingRef.current?.id ??
            "provider-live-recording";
          if (pendingRecording.current) {
            pendingRecording.current = null;
            if (confirmationTimer.current) clearTimeout(confirmationTimer.current);
            void confirmSessionRecordingStarted(id);
          }
          const confirmed = { id, status: "recording" };
          setRecording(confirmed);
          recordingRef.current = confirmed;
        }
        if (state?.on === false) {
          setRecording(null);
          recordingRef.current = null;
          if (isOrganizer) void stopSessionRecording(sessionId);
        }
      });
    };
    script.onerror = () => setError("Não foi possível carregar a chamada.");
    document.head.appendChild(script);
    return () => {
      if (isOrganizer && recordingRef.current) {
        api.current?.executeCommand("stopRecording", "file");
        void stopSessionRecording(sessionId);
      }
      api.current?.dispose();
      api.current = null;
      void reportMySessionCallPresence(sessionId, "left");
      script.remove();
    };
  }, [baseUrl, isOrganizer, room, sessionId, token]);

  async function decide(purpose: Purpose, decision: Decision) {
    setBusy(true);
    setError(null);
    try {
      await recordMySessionConsent({ sessionId, purpose, decision });
      setConsent((current) => ({ ...current, [purpose]: decision }));
      if (
        decision !== "granted" &&
        (purpose === "recording" || purpose === "transcription")
      ) {
        if (isOrganizer && recordingRef.current) {
          api.current?.executeCommand("stopRecording", "file");
        }
        setRecording(null);
        recordingRef.current = null;
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível guardar.");
    } finally {
      setBusy(false);
    }
  }

  async function startRecording() {
    setBusy(true);
    setError(null);
    try {
      const result = await startSessionRecording(sessionId);
      setRecording({ id: result.recordingId, status: result.status });
      recordingRef.current = {
        id: result.recordingId,
        status: result.status,
      };
      if (result.status === "recording") return;
      pendingRecording.current = result.recordingId;
      api.current?.executeCommand("startRecording", {
        mode: "file",
        shouldShare: false,
      });
      confirmationTimer.current = setTimeout(() => {
        if (pendingRecording.current === result.recordingId) {
          pendingRecording.current = null;
          setRecording(null);
          recordingRef.current = null;
          setError("A chamada continua, mas a gravação não foi confirmada.");
          void reportSessionRecordingCommandFailure(result.recordingId);
        }
      }, 12_000);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Gravação indisponível.");
    } finally {
      setBusy(false);
    }
  }

  async function finishCall() {
    setBusy(true);
    if (isOrganizer && recording) {
      await stopSessionRecording(sessionId);
      api.current?.executeCommand("stopRecording", "file");
      setRecording(null);
      recordingRef.current = null;
    }
    api.current?.executeCommand("hangup");
    setBusy(false);
  }

  const mediaGranted =
    consent.recording === "granted" &&
    consent.transcription === "granted" &&
    initialCapacity === "adult_verified";

  return (
    <div className="space-y-4">
      <div className="border border-wepac-border bg-wepac-card p-4">
        <h2 className="text-sm font-bold text-wepac-white">
          Consentimento desta Session
        </h2>
        <p className="mt-1 text-xs text-wepac-text-tertiary">
          Cada finalidade é independente. A chamada funciona mesmo sem
          gravação.
        </p>
        {initialCapacity !== "adult_verified" && (
          <p className="mt-3 text-xs text-wepac-error">
            A capacidade adulta ainda não foi verificada pelo Admin. O Admin
            não recebe acesso à gravação ou transcript.
          </p>
        )}
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {(
            [
              ["recording", "Gravação"],
              ["transcription", "Transcrição"],
              ["ai_debrief", "Debrief por IA"],
            ] as const
          ).map(([purpose, label]) => (
            <div key={purpose} className="border border-wepac-border p-3">
              <p className="text-xs font-bold text-wepac-white">{label}</p>
              <p className="mt-1 text-[11px] text-wepac-text-tertiary">
                Estado: {consent[purpose] ?? "por decidir"}
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  disabled={busy || initialCapacity !== "adult_verified"}
                  onClick={() => void decide(purpose, "granted")}
                  className="bg-wepac-white px-2 py-1 text-xs text-wepac-black disabled:opacity-30"
                >
                  Aceitar
                </button>
                <button
                  disabled={busy || initialCapacity !== "adult_verified"}
                  onClick={() =>
                    void decide(
                      purpose,
                      consent[purpose] === "granted" ? "withdrawn" : "denied",
                    )
                  }
                  className="border border-wepac-border px-2 py-1 text-xs text-wepac-text-secondary disabled:opacity-30"
                >
                  {consent[purpose] === "granted" ? "Retirar" : "Recusar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {recording && (
        <div
          role="status"
          aria-live="polite"
          className="sticky top-3 z-20 flex items-center gap-3 border border-red-500 bg-red-950 px-4 py-3 text-sm font-bold text-white shadow-lg"
        >
          <span
            aria-hidden="true"
            className="h-3 w-3 shrink-0 animate-pulse rounded-full bg-red-400"
          />
          {recording.status === "recording"
            ? "Gravação e transcrição ativas"
            : recording.status === "finalizing"
              ? "Gravação e transcrição a finalizar"
              : "A iniciar gravação e transcrição"}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {isOrganizer && (
          <button
            onClick={() => void startRecording()}
            disabled={busy || !mediaGranted || Boolean(recording)}
            className="bg-wepac-white px-4 py-2 text-sm font-bold text-wepac-black disabled:opacity-30"
          >
            {recording ? "Gravação ativa" : "Iniciar gravação + transcrição"}
          </button>
        )}
        <button
          onClick={() => void finishCall()}
          disabled={busy}
          className="border border-wepac-border px-4 py-2 text-sm text-wepac-white"
        >
          {isOrganizer ? "Terminar chamada" : "Sair da chamada"}
        </button>
      </div>
      {error && <p className="text-xs text-wepac-error">{error}</p>}
      <div ref={container} className="min-h-[620px] overflow-hidden bg-black" />
    </div>
  );
}
