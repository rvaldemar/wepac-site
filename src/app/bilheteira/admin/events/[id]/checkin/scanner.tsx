"use client";

import { useEffect, useRef, useState, useCallback, useTransition } from "react";

type TicketInfo = {
  id: string;
  serial: string;
  buyerName: string;
  tierName: string;
  seats: number;
  status: string;
  checkedInAt: string | null;
  checkLogs: { action: string; createdAt: string }[];
};

type ScanResult =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "found"; ticket: TicketInfo; justActioned?: "checkin" | "checkout" }
  | { state: "error"; message: string };

const LISBON_TZ = "Europe/Lisbon";

function formatTime(d: string | Date): string {
  return new Intl.DateTimeFormat("pt-PT", {
    timeZone: LISBON_TZ,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(d));
}

function extractTicketId(raw: string): string {
  // QR codes contain "https://wepac.pt/bilheteira/ticket/<id>"
  try {
    const url = new URL(raw);
    const parts = url.pathname.split("/");
    const idx = parts.indexOf("ticket");
    if (idx !== -1 && parts[idx + 1]) return parts[idx + 1];
  } catch {
    // not a URL — treat as serial or id directly
  }
  return raw.trim();
}

async function lookupTicket(raw: string): Promise<TicketInfo> {
  const id = extractTicketId(raw);
  const res = await fetch(`/api/bilheteira/checkin?ticketId=${encodeURIComponent(id)}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || "Erro ao procurar bilhete");
  }
  return res.json();
}

async function performAction(
  ticketId: string,
  action: "checkin" | "checkout"
): Promise<TicketInfo> {
  const res = await fetch("/api/bilheteira/checkin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticketId, action }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || "Erro ao processar");
  }
  return res.json();
}

export function CheckinScanner({
  eventId,
  eventTitle,
  totalTickets,
  checkedInCount,
}: {
  eventId: string;
  eventTitle: string;
  totalTickets: number;
  checkedInCount: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<import("qr-scanner").default | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult>({ state: "idle" });
  const [cameraActive, setCameraActive] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [admittedCount, setAdmittedCount] = useState(checkedInCount);
  const [isPending, startTransition] = useTransition();
  const lastScannedRef = useRef<string>("");
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetScanner = useCallback(() => {
    setScanResult({ state: "idle" });
    lastScannedRef.current = "";
    setManualInput("");
  }, []);

  const handleTicketFound = useCallback(
    async (raw: string) => {
      if (lastScannedRef.current === raw) return;
      lastScannedRef.current = raw;

      setScanResult({ state: "loading" });
      try {
        const ticket = await lookupTicket(raw);
        setScanResult({ state: "found", ticket });

        // Auto check-in if not already admitted
        if (ticket.status !== "checked_in") {
          const updated = await performAction(ticket.id, "checkin");
          setAdmittedCount((c) => c + 1);
          setScanResult({ state: "found", ticket: updated, justActioned: "checkin" });
        }
      } catch (err) {
        setScanResult({ state: "error", message: String(err instanceof Error ? err.message : err) });
      }

      // Auto-reset after 4 seconds
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      resetTimerRef.current = setTimeout(() => {
        resetScanner();
        lastScannedRef.current = "";
      }, 4000);
    },
    [resetScanner]
  );

  const startCamera = useCallback(async () => {
    if (!videoRef.current) return;
    try {
      const QrScanner = (await import("qr-scanner")).default;
      const scanner = new QrScanner(
        videoRef.current,
        (result) => {
          void handleTicketFound(result.data);
        },
        {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: "environment",
        }
      );
      await scanner.start();
      scannerRef.current = scanner;
      setCameraActive(true);
    } catch {
      setScanResult({ state: "error", message: "Não foi possível aceder à câmara." });
    }
  }, [handleTicketFound]);

  const stopCamera = useCallback(() => {
    scannerRef.current?.destroy();
    scannerRef.current = null;
    setCameraActive(false);
    resetScanner();
  }, [resetScanner]);

  useEffect(() => {
    return () => {
      scannerRef.current?.destroy();
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    void handleTicketFound(manualInput.trim());
  };

  const handleUndo = () => {
    if (scanResult.state !== "found") return;
    const ticket = scanResult.ticket;
    startTransition(async () => {
      try {
        const updated = await performAction(ticket.id, "checkout");
        setAdmittedCount((c) => Math.max(0, c - 1));
        setScanResult({ state: "found", ticket: updated, justActioned: "checkout" });
      } catch (err) {
        setScanResult({ state: "error", message: String(err instanceof Error ? err.message : err) });
      }
    });
  };

  const handleReAdmit = (ticketId: string) => {
    startTransition(async () => {
      try {
        const updated = await performAction(ticketId, "checkin");
        setAdmittedCount((c) => c + 1);
        setScanResult({ state: "found", ticket: updated, justActioned: "checkin" });
      } catch (err) {
        setScanResult({ state: "error", message: String(err instanceof Error ? err.message : err) });
      }
    });
  };

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", fontFamily: "Inter, sans-serif" }}>
      {/* Stats bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "10px 16px",
          background: "#1b5e20",
          color: "#fff",
          borderRadius: 8,
          marginBottom: 16,
          fontSize: 14,
        }}
      >
        <span style={{ fontWeight: 700 }}>
          {admittedCount} admitidos
        </span>
        <span style={{ opacity: 0.7 }}>
          {totalTickets} bilhetes total
        </span>
      </div>

      {/* Camera toggle */}
      <div style={{ marginBottom: 12, display: "flex", gap: 8 }}>
        {!cameraActive ? (
          <button
            onClick={startCamera}
            style={{
              flex: 1,
              padding: "12px 16px",
              background: "#000",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              letterSpacing: 0.5,
            }}
          >
            Ligar câmara
          </button>
        ) : (
          <button
            onClick={stopCamera}
            style={{
              flex: 1,
              padding: "12px 16px",
              background: "#555",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Desligar câmara
          </button>
        )}
      </div>

      {/* Video feed */}
      <div
        style={{
          position: "relative",
          background: "#111",
          borderRadius: 8,
          overflow: "hidden",
          marginBottom: 16,
          aspectRatio: "4/3",
          display: cameraActive ? "block" : "none",
        }}
      >
        <video
          ref={videoRef}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          muted
          playsInline
        />
      </div>

      {/* Manual input */}
      <form onSubmit={handleManualSubmit} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          type="text"
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
          placeholder="Serial ou ID (ex: BT-001)"
          style={{
            flex: 1,
            padding: "10px 12px",
            border: "1px solid #ccc",
            borderRadius: 6,
            fontSize: 15,
            fontFamily: "monospace",
            textTransform: "uppercase",
          }}
          autoComplete="off"
          autoCapitalize="off"
        />
        <button
          type="submit"
          style={{
            padding: "10px 16px",
            background: "#000",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Verificar
        </button>
      </form>

      {/* Result panel */}
      {scanResult.state === "loading" && (
        <div
          style={{
            padding: 20,
            background: "#f5f5f5",
            borderRadius: 8,
            textAlign: "center",
            color: "#666",
          }}
        >
          A verificar...
        </div>
      )}

      {scanResult.state === "error" && (
        <div
          style={{
            padding: 20,
            background: "#ffebee",
            border: "2px solid #c62828",
            borderRadius: 8,
            color: "#c62828",
            fontWeight: 700,
            fontSize: 16,
          }}
        >
          {scanResult.message}
          <button
            onClick={resetScanner}
            style={{
              display: "block",
              marginTop: 12,
              padding: "8px 16px",
              background: "#c62828",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {scanResult.state === "found" && (
        <TicketResultCard
          ticket={scanResult.ticket}
          justActioned={scanResult.justActioned}
          onUndo={handleUndo}
          onReAdmit={handleReAdmit}
          onContinue={resetScanner}
          isPending={isPending}
        />
      )}
    </div>
  );
}

function TicketResultCard({
  ticket,
  justActioned,
  onUndo,
  onReAdmit,
  onContinue,
  isPending,
}: {
  ticket: TicketInfo;
  justActioned?: "checkin" | "checkout";
  onUndo: () => void;
  onReAdmit: (id: string) => void;
  onContinue: () => void;
  isPending: boolean;
}) {
  const isCheckedIn = ticket.status === "checked_in";
  const bgColor = isCheckedIn ? "#e8f5e9" : "#fff3e0";
  const borderColor = isCheckedIn ? "#2e7d32" : "#e65100";
  const textColor = isCheckedIn ? "#1b5e20" : "#bf360c";

  return (
    <div
      style={{
        border: `3px solid ${borderColor}`,
        borderRadius: 10,
        background: bgColor,
        padding: 20,
      }}
    >
      {/* Status banner */}
      <div
        style={{
          fontSize: 22,
          fontWeight: 900,
          color: textColor,
          letterSpacing: 0.5,
          marginBottom: 4,
          fontFamily: "'Barlow', sans-serif",
        }}
      >
        {isCheckedIn
          ? justActioned === "checkin"
            ? "✓ ADMITIDO"
            : "✓ JÁ ADMITIDO"
          : justActioned === "checkout"
            ? "↩ CHECK-OUT FEITO"
            : "PENDENTE"}
      </div>

      {/* Ticket details */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#000" }}>
          {ticket.buyerName}
        </div>
        <div style={{ fontSize: 13, color: "#555", marginTop: 2 }}>
          {ticket.serial} · {ticket.tierName} ·{" "}
          {ticket.seats === 1
            ? "1 lugar"
            : `${ticket.seats} lugares`}
        </div>
        {ticket.checkedInAt && (
          <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
            Admitido às {formatTime(ticket.checkedInAt)}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {isCheckedIn && (
          <button
            onClick={onUndo}
            disabled={isPending}
            style={{
              padding: "8px 14px",
              background: "#fff",
              color: "#c62828",
              border: "1px solid #c62828",
              borderRadius: 5,
              fontSize: 13,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Anular admissão
          </button>
        )}
        {!isCheckedIn && (
          <button
            onClick={() => onReAdmit(ticket.id)}
            disabled={isPending}
            style={{
              padding: "8px 14px",
              background: "#1b5e20",
              color: "#fff",
              border: "none",
              borderRadius: 5,
              fontSize: 13,
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Admitir agora
          </button>
        )}
        <button
          onClick={onContinue}
          style={{
            padding: "8px 14px",
            background: "#555",
            color: "#fff",
            border: "none",
            borderRadius: 5,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Continuar
        </button>
      </div>

      {/* Check log */}
      {ticket.checkLogs.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
            Histórico
          </div>
          {ticket.checkLogs.map((log, i) => (
            <div
              key={i}
              style={{
                fontSize: 12,
                color: "#555",
                padding: "3px 0",
                borderTop: i === 0 ? "none" : "1px solid #ddd",
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  color: log.action === "checkin" ? "#1b5e20" : "#bf360c",
                }}
              >
                {log.action === "checkin" ? "✓ Check-in" : "↩ Check-out"}
              </span>{" "}
              às {formatTime(log.createdAt)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
