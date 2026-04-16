"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type TicketInfo = {
  token: string;
  serialCode: string;
  name: string;
  seats: number;
  checkedInAt: string | null;
};

type CheckinResult = {
  alreadyCheckedIn: boolean;
  token: string;
  serialCode: string;
  name: string;
  seats: number;
  checkedInAt: string;
};

type Mode = "scanning" | "peek" | "result" | "error";

function extractToken(raw: string): string | null {
  const trimmed = raw.trim();
  const match = trimmed.match(/\/bilhete\/([a-z0-9]+)/i);
  if (match) return match[1];
  if (/^[a-z0-9]{20,}$/i.test(trimmed)) return trimmed;
  return null;
}

export function Scanner({ initialPin }: { initialPin: string }) {
  const [pin, setPin] = useState(initialPin);
  const [pinConfirmed, setPinConfirmed] = useState(!!initialPin);
  const [mode, setMode] = useState<Mode>("scanning");
  const [ticket, setTicket] = useState<TicketInfo | null>(null);
  const [result, setResult] = useState<CheckinResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [manualUrl, setManualUrl] = useState("");
  const [cameraActive, setCameraActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<{ detect: (v: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> } | null>(null);
  const loopRef = useRef<number | null>(null);

  const stopCamera = useCallback(() => {
    if (loopRef.current !== null) {
      cancelAnimationFrame(loopRef.current);
      loopRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const handleToken = useCallback(
    async (token: string) => {
      stopCamera();
      setMode("peek");
      setErrorMsg("");
      try {
        const res = await fetch("/api/sn/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, pin }),
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
      }
    },
    [pin, stopCamera]
  );

  const startCamera = useCallback(async () => {
    setErrorMsg("");
    try {
      const win = window as unknown as {
        BarcodeDetector?: new (opts: { formats: string[] }) => {
          detect: (v: HTMLVideoElement) => Promise<Array<{ rawValue: string }>>;
        };
      };
      if (!win.BarcodeDetector) {
        setErrorMsg(
          "Scanner nativo indisponível neste browser. Cola a URL do bilhete abaixo."
        );
        return;
      }
      detectorRef.current = new win.BarcodeDetector({ formats: ["qr_code"] });

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);

      const tick = async () => {
        if (!detectorRef.current || !videoRef.current) return;
        try {
          const codes = await detectorRef.current.detect(videoRef.current);
          if (codes.length > 0) {
            const token = extractToken(codes[0].rawValue);
            if (token) {
              await handleToken(token);
              return;
            }
          }
        } catch {
          // ignore detect errors
        }
        loopRef.current = requestAnimationFrame(tick);
      };
      loopRef.current = requestAnimationFrame(tick);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "erro a aceder à câmara");
    }
  }, [handleToken]);

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
    setManualUrl("");
    setMode("scanning");
  }

  async function submitManual(e: React.FormEvent) {
    e.preventDefault();
    const token = extractToken(manualUrl);
    if (!token) {
      setErrorMsg("URL inválida");
      return;
    }
    await handleToken(token);
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
                <span style={styles.labelText}>Colar URL / token</span>
                <input
                  type="text"
                  value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                  placeholder="https://wepac.pt/bilhete/…"
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
};
