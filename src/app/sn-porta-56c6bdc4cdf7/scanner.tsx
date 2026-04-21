"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";

if (typeof window !== "undefined") {
  QrScanner.WORKER_PATH = "/qr-scanner-worker.min.js";
}

type Reservation = {
  name: string;
  role: string;
  org: string;
};

type TicketInfo = {
  token: string;
  serialCode: string;
  name: string;
  seats: number;
  checkedInAt: string | null;
  reservation: Reservation | null;
};

type CheckinResult = {
  alreadyCheckedIn: boolean;
  token: string;
  serialCode: string;
  name: string;
  seats: number;
  checkedInAt: string;
  reservation: Reservation | null;
};

type Mode = "scanning" | "peek" | "result" | "error";

type ParsedInput = { token?: string; serial?: number };

function parseInput(raw: string): ParsedInput {
  const s = raw.trim();
  if (!s) return {};

  const urlMatch = s.match(/\/bilhete\/([A-Za-z0-9_-]+)/);
  if (urlMatch) return { token: urlMatch[1] };

  const serialMatch = s.match(/^SN-?0*(\d+)$/i);
  if (serialMatch) return { serial: Number(serialMatch[1]) };

  if (/^\d+$/.test(s)) return { serial: Number(s) };

  if (/^[a-z0-9]{20,}$/i.test(s)) return { token: s };

  return {};
}

export function Scanner({ initialPin }: { initialPin: string }) {
  const [pin, setPin] = useState(initialPin);
  const [pinConfirmed, setPinConfirmed] = useState(!!initialPin);
  const [mode, setMode] = useState<Mode>("scanning");
  const [ticket, setTicket] = useState<TicketInfo | null>(null);
  const [result, setResult] = useState<CheckinResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [manualInput, setManualInput] = useState("");
  const [cameraActive, setCameraActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const busyRef = useRef<boolean>(false);

  const stopCamera = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current.destroy();
      scannerRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const handleInput = useCallback(
    async (parsed: ParsedInput) => {
      if (busyRef.current) return;
      if (!parsed.token && parsed.serial === undefined) {
        setErrorMsg("Código inválido.");
        setMode("error");
        return;
      }
      busyRef.current = true;
      stopCamera();
      setMode("peek");
      setErrorMsg("");
      try {
        const res = await fetch("/api/sn/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...parsed, pin }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `HTTP ${res.status}`);
        }
        const data = (await res.json()) as TicketInfo;
        setTicket(data);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "erro desconhecido");
        setMode("error");
      } finally {
        busyRef.current = false;
      }
    },
    [pin, stopCamera]
  );

  const startCamera = useCallback(async () => {
    setErrorMsg("");
    if (!videoRef.current) return;

    try {
      const scanner = new QrScanner(
        videoRef.current,
        (scanResult) => {
          const parsed = parseInput(scanResult.data);
          if (parsed.token || parsed.serial !== undefined) {
            handleInput(parsed);
          }
        },
        {
          preferredCamera: "environment",
          highlightScanRegion: true,
          highlightCodeOutline: true,
          maxScansPerSecond: 5,
        }
      );
      scannerRef.current = scanner;
      await scanner.start();
      setCameraActive(true);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "erro a aceder à câmara"
      );
    }
  }, [handleInput]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  async function submitPin(e: React.FormEvent) {
    e.preventDefault();
    setPinConfirmed(true);
  }

  async function confirmCheckin() {
    if (!ticket) return;
    setErrorMsg("");
    try {
      const res = await fetch("/api/sn/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: ticket.token, pin }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as CheckinResult;
      setResult(data);
      setMode("result");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "erro desconhecido");
      setMode("error");
    }
  }

  function reset() {
    setTicket(null);
    setResult(null);
    setErrorMsg("");
    setManualInput("");
    setMode("scanning");
  }

  async function submitManual(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseInput(manualInput);
    if (!parsed.token && parsed.serial === undefined) {
      setErrorMsg("Formato inválido. Usa URL do bilhete, SN-001 ou número.");
      return;
    }
    await handleInput(parsed);
  }

  if (!pinConfirmed) {
    return (
      <main style={styles.main}>
        <div style={styles.box}>
          <h1 style={styles.h1}>Porta · Sem Nome</h1>
          <form onSubmit={submitPin} style={styles.form}>
            <label style={styles.label}>
              <span style={styles.labelText}>PIN</span>
              <input
                type="password"
                required
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                autoFocus
                style={styles.input}
              />
            </label>
            <button type="submit" style={styles.button}>
              Entrar
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.main}>
      <div style={styles.box}>
        <h1 style={styles.h1}>Porta · Sem Nome</h1>

        {mode === "scanning" && (
          <div>
            <div style={styles.videoWrap}>
              <video ref={videoRef} style={styles.video} playsInline muted />
              {!cameraActive && (
                <div style={styles.videoPlaceholder}>
                  <button onClick={startCamera} style={styles.button}>
                    Ligar câmara
                  </button>
                </div>
              )}
            </div>

            <div style={styles.divider}>ou</div>

            <form onSubmit={submitManual} style={styles.form}>
              <label style={styles.label}>
                <span style={styles.labelText}>
                  Colar URL · SN-001 · token
                </span>
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="SN-001 ou https://wepac.pt/bilhete/…"
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  style={styles.input}
                />
              </label>
              <button type="submit" style={styles.buttonOutline}>
                Verificar
              </button>
            </form>

            {errorMsg && <div style={styles.error}>{errorMsg}</div>}
          </div>
        )}

        {mode === "peek" && ticket && (
          <div>
            {ticket.reservation && (
              <ReservationBanner reservation={ticket.reservation} />
            )}
            <div
              style={{
                ...styles.banner,
                background: ticket.checkedInAt ? "#ffe0e0" : "#e8f5e9",
                borderColor: ticket.checkedInAt ? "#c00" : "#2e7d32",
                color: ticket.checkedInAt ? "#900" : "#1b5e20",
              }}
            >
              {ticket.checkedInAt
                ? `JÁ ADMITIDO às ${formatTime(ticket.checkedInAt)}`
                : "PRONTO A ADMITIR"}
            </div>
            <div style={styles.serial}>{ticket.serialCode}</div>
            <div style={styles.name}>{ticket.name}</div>
            <div style={styles.seats}>
              {ticket.seats} {ticket.seats === 1 ? "lugar" : "lugares"}
            </div>

            {!ticket.checkedInAt && (
              <button onClick={confirmCheckin} style={styles.buttonBig}>
                Admitir
              </button>
            )}
            <button onClick={reset} style={styles.buttonOutline}>
              Scan seguinte
            </button>

            {errorMsg && <div style={styles.error}>{errorMsg}</div>}
          </div>
        )}

        {mode === "result" && result && (
          <div>
            {result.reservation && (
              <ReservationBanner reservation={result.reservation} />
            )}
            <div
              style={{
                ...styles.banner,
                background: result.alreadyCheckedIn ? "#ffe0e0" : "#e8f5e9",
                borderColor: result.alreadyCheckedIn ? "#c00" : "#2e7d32",
                color: result.alreadyCheckedIn ? "#900" : "#1b5e20",
              }}
            >
              {result.alreadyCheckedIn
                ? `JÁ ADMITIDO às ${formatTime(result.checkedInAt)}`
                : "✓ ADMITIDO"}
            </div>
            <div style={styles.serial}>{result.serialCode}</div>
            <div style={styles.name}>{result.name}</div>
            <div style={styles.seats}>
              {result.seats} {result.seats === 1 ? "lugar" : "lugares"}
            </div>
            <button onClick={reset} style={styles.buttonBig}>
              Scan seguinte
            </button>
          </div>
        )}

        {mode === "error" && (
          <div>
            <div
              style={{
                ...styles.banner,
                background: "#ffe0e0",
                borderColor: "#c00",
                color: "#900",
              }}
            >
              Erro
            </div>
            <div style={{ marginBottom: 20, fontSize: 14 }}>{errorMsg}</div>
            <button onClick={reset} style={styles.buttonBig}>
              Tentar novamente
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function ReservationBanner({ reservation }: { reservation: Reservation }) {
  return (
    <div style={styles.reservedBanner}>
      <div style={styles.reservedLabel}>★ Lugar reservado</div>
      <div style={styles.reservedName}>{reservation.name}</div>
      <div style={styles.reservedRole}>{reservation.role}</div>
      <div style={styles.reservedOrg}>{reservation.org}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: "100vh",
    background: "#0a0a0a",
    color: "#fff",
    fontFamily: "'Inter', system-ui, sans-serif",
    padding: 16,
  },
  box: {
    maxWidth: 480,
    margin: "0 auto",
    padding: "24px 20px",
  },
  h1: {
    fontFamily: "'Barlow', sans-serif",
    fontWeight: 900,
    fontSize: 24,
    letterSpacing: "-0.5px",
    marginBottom: 24,
  },
  form: { display: "flex", flexDirection: "column", gap: 16 },
  label: { display: "flex", flexDirection: "column", gap: 6 },
  labelText: {
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#aaa",
  },
  input: {
    padding: "12px 14px",
    background: "#1a1a1a",
    border: "1px solid #333",
    color: "#fff",
    fontSize: 15,
    fontFamily: "inherit",
    outline: "none",
  },
  button: {
    padding: "14px 20px",
    background: "#fff",
    color: "#000",
    border: "none",
    fontFamily: "'Barlow', sans-serif",
    fontWeight: 700,
    fontSize: 14,
    letterSpacing: 2,
    textTransform: "uppercase",
    cursor: "pointer",
  },
  buttonBig: {
    width: "100%",
    padding: "18px 20px",
    background: "#2e7d32",
    color: "#fff",
    border: "none",
    fontFamily: "'Barlow', sans-serif",
    fontWeight: 900,
    fontSize: 18,
    letterSpacing: 2,
    textTransform: "uppercase",
    cursor: "pointer",
    marginBottom: 10,
  },
  buttonOutline: {
    width: "100%",
    padding: "14px 20px",
    background: "transparent",
    color: "#fff",
    border: "1px solid #666",
    fontFamily: "'Barlow', sans-serif",
    fontWeight: 700,
    fontSize: 13,
    letterSpacing: 2,
    textTransform: "uppercase",
    cursor: "pointer",
  },
  videoWrap: {
    position: "relative",
    width: "100%",
    aspectRatio: "1 / 1",
    background: "#1a1a1a",
    overflow: "hidden",
    marginBottom: 16,
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  videoPlaceholder: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    textAlign: "center",
    fontSize: 10,
    letterSpacing: 3,
    textTransform: "uppercase",
    color: "#666",
    margin: "16px 0",
  },
  banner: {
    padding: "16px 20px",
    border: "2px solid",
    fontFamily: "'Barlow', sans-serif",
    fontWeight: 900,
    fontSize: 16,
    letterSpacing: 2,
    textTransform: "uppercase",
    textAlign: "center",
    marginBottom: 20,
  },
  serial: {
    fontFamily: "'Barlow', sans-serif",
    fontWeight: 900,
    fontSize: 28,
    letterSpacing: 1,
    textAlign: "center",
    marginBottom: 4,
  },
  name: {
    fontSize: 20,
    fontWeight: 700,
    textAlign: "center",
    marginBottom: 4,
  },
  seats: {
    fontSize: 14,
    color: "#aaa",
    textAlign: "center",
    letterSpacing: 1,
    marginBottom: 24,
  },
  error: {
    marginTop: 16,
    padding: 12,
    background: "#3a0a0a",
    border: "1px solid #c00",
    color: "#f99",
    fontSize: 13,
  },
  reservedBanner: {
    padding: "16px 18px 18px",
    background: "#fff6d6",
    border: "2px solid #d4af37",
    color: "#4a3600",
    marginBottom: 14,
    textAlign: "center",
  },
  reservedLabel: {
    fontFamily: "'Barlow', sans-serif",
    fontWeight: 900,
    fontSize: 12,
    letterSpacing: 3,
    textTransform: "uppercase",
    color: "#8a6d00",
    marginBottom: 8,
  },
  reservedName: {
    fontFamily: "'Barlow', sans-serif",
    fontWeight: 900,
    fontSize: 22,
    letterSpacing: "-0.3px",
    lineHeight: 1.1,
    color: "#2a1f00",
    marginBottom: 4,
  },
  reservedRole: {
    fontSize: 13,
    fontStyle: "italic",
    color: "#4a3600",
    lineHeight: 1.2,
  },
  reservedOrg: {
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#6a5100",
    marginTop: 4,
  },
};
