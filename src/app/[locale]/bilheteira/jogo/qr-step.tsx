"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GameCopy } from "@/i18n/copy/institutional-game";
import { lookupTicketForGame, type TicketLookupResult } from "@/lib/bilheteira/game/actions";

type Status = "idle" | "starting" | "scanning" | "looking" | "error";

export function QrStep({
  copy,
  onFound,
  onNoTicket,
  onBack,
}: {
  copy: GameCopy;
  onFound: (r: Extract<TicketLookupResult, { ok: true }>) => void;
  onNoTicket: () => void;
  onBack: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<import("qr-scanner").default | null>(null);
  const busyRef = useRef(false);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const handleData = useCallback(
    async (raw: string) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setStatus("looking");
      try {
        const result = await lookupTicketForGame(raw);
        if (result.ok) {
          scannerRef.current?.stop();
          onFound(result);
          return;
        }
        setStatus("error");
        setMessage(
          result.error === "rate_limited"
            ? copy.errors.rateLimited
            : result.error === "locked"
              ? copy.errors.locked
              : copy.identify.lookupError,
        );
      } catch {
        setStatus("error");
        setMessage(copy.errors.generic);
      }
      // Let the person re-present the ticket after a short pause.
      setTimeout(() => {
        busyRef.current = false;
        setStatus((s) => (s === "error" ? "scanning" : s));
      }, 2200);
    },
    [copy, onFound],
  );

  const start = useCallback(async () => {
    if (!videoRef.current || scannerRef.current) return;
    setStatus("starting");
    try {
      const QrScanner = (await import("qr-scanner")).default;
      const scanner = new QrScanner(
        videoRef.current,
        (result) => void handleData(result.data),
        {
          returnDetailedScanResult: true,
          highlightScanRegion: false,
          highlightCodeOutline: false,
          preferredCamera: "environment",
          maxScansPerSecond: 8,
        },
      );
      await scanner.start();
      scannerRef.current = scanner;
      setStatus("scanning");
    } catch {
      setStatus("error");
      setMessage(copy.identify.cameraError);
    }
  }, [copy.identify.cameraError, handleData]);

  // Kiosk: the camera opens as soon as the step mounts; permission is granted
  // once per browser profile and remembered.
  useEffect(() => {
    void start();
    return () => {
      scannerRef.current?.destroy();
      scannerRef.current = null;
    };
  }, [start]);

  return (
    <section className="step">
      <button type="button" className="game-btn game-btn--text step__back" onClick={onBack}>
        ← {copy.identify.back}
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="step__brand" src="/images/arte-a-capela/logo.png" alt="Arte à Capela" />
      <p className="game-eyebrow">{copy.campaignName}</p>
      <h2 className="game-serif game-h2">{copy.identify.title}</h2>
      <p className="game-body">{copy.identify.body}</p>

      <div className="scanner">
        <video ref={videoRef} muted playsInline />
        <div className="scanner__frame"><i /></div>
        {status === "scanning" && <div className="scanner__line" />}
        {status === "idle" && (
          <div className="scanner__placeholder">
            <button type="button" className="game-btn game-btn--cream" onClick={start}>
              {copy.identify.scanCta}
            </button>
          </div>
        )}
      </div>
      <p className={`scanner__status ${status === "error" ? "scanner__status--error" : ""}`}>
        {status === "error" ? message : status === "scanning" || status === "looking" ? copy.identify.scanning : ""}
      </p>

      <div className="game-actions">
        <button type="button" className="game-btn game-btn--ghost" onClick={onNoTicket}>
          {copy.identify.noTicket}
        </button>
      </div>
    </section>
  );
}
