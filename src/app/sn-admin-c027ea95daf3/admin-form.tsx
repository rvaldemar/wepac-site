"use client";

import { useState } from "react";

type TicketResult = {
  token: string;
  serial: number;
  serialCode: string;
  name: string;
  seats: number;
  url: string;
};

export function AdminForm({ adminKey }: { adminKey: string }) {
  const [name, setName] = useState("");
  const [seats, setSeats] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<TicketResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);
    setCopied(false);
    try {
      const res = await fetch("/api/sn/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-sn-admin-key": adminKey,
        },
        body: JSON.stringify({ name: name.trim(), seats }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as TicketResult;
      setResult(data);
      setName("");
      setSeats(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "erro desconhecido");
    } finally {
      setSubmitting(false);
    }
  }

  async function copyLink() {
    if (!result) return;
    await navigator.clipboard.writeText(result.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function whatsappLink() {
    if (!result) return "";
    const msg = `Olá ${result.name}, aqui está o teu bilhete para o concerto privado de Jotta Pê — Sem Nome.\n\n${result.url}`;
    return `https://wa.me/?text=${encodeURIComponent(msg)}`;
  }

  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <h1 style={styles.h1}>Sem Nome · Gerar Bilhete</h1>
        <p style={styles.sub}>Jotta Pê · 21 ABR 2026 · Aquiraz</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            <span style={styles.labelText}>Nome</span>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Maria Silva"
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            <span style={styles.labelText}>Lugares (total)</span>
            <input
              type="number"
              min={1}
              max={20}
              required
              value={seats}
              onChange={(e) => setSeats(Number(e.target.value))}
              style={styles.input}
            />
          </label>

          <button type="submit" disabled={submitting} style={styles.button}>
            {submitting ? "A gerar…" : "Gerar bilhete"}
          </button>
        </form>

        {error && <div style={styles.error}>Erro: {error}</div>}

        {result && (
          <div style={styles.result}>
            <div style={styles.resultSerial}>{result.serialCode}</div>
            <div style={styles.resultName}>
              {result.name} · {result.seats} {result.seats === 1 ? "lugar" : "lugares"}
            </div>
            <div style={styles.urlBox}>{result.url}</div>
            <div style={styles.actions}>
              <button onClick={copyLink} style={styles.actionBtn}>
                {copied ? "Copiado" : "Copiar link"}
              </button>
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.actionBtn}
              >
                Abrir WhatsApp
              </a>
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.actionBtn}
              >
                Pré-visualizar
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: "100vh",
    background: "#f5f4f0",
    fontFamily: "'Inter', system-ui, sans-serif",
    padding: "40px 20px",
    color: "#000",
  },
  container: {
    maxWidth: 520,
    margin: "0 auto",
    background: "#fff",
    padding: "40px 36px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
  },
  h1: {
    fontFamily: "'Barlow', sans-serif",
    fontWeight: 900,
    fontSize: 28,
    letterSpacing: "-0.5px",
    marginBottom: 4,
  },
  sub: {
    fontSize: 12,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#666",
    marginBottom: 32,
  },
  form: { display: "flex", flexDirection: "column", gap: 20 },
  label: { display: "flex", flexDirection: "column", gap: 6 },
  labelText: {
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#333",
  },
  input: {
    padding: "12px 14px",
    border: "1px solid #ccc",
    borderRadius: 0,
    fontSize: 15,
    fontFamily: "inherit",
    outline: "none",
  },
  button: {
    padding: "14px 20px",
    background: "#000",
    color: "#fff",
    border: "none",
    fontFamily: "'Barlow', sans-serif",
    fontWeight: 700,
    fontSize: 14,
    letterSpacing: 2,
    textTransform: "uppercase",
    cursor: "pointer",
    marginTop: 8,
  },
  error: {
    marginTop: 24,
    padding: 16,
    background: "#fee",
    border: "1px solid #c00",
    color: "#900",
    fontSize: 14,
  },
  result: {
    marginTop: 32,
    padding: 24,
    background: "#fafaf7",
    border: "1px solid #e5e3de",
  },
  resultSerial: {
    fontFamily: "'Barlow', sans-serif",
    fontWeight: 900,
    fontSize: 32,
    letterSpacing: 1,
    marginBottom: 8,
  },
  resultName: {
    fontSize: 14,
    color: "#333",
    marginBottom: 16,
  },
  urlBox: {
    fontFamily: "ui-monospace, Menlo, monospace",
    fontSize: 12,
    padding: 10,
    background: "#fff",
    border: "1px solid #ddd",
    wordBreak: "break-all",
    marginBottom: 16,
  },
  actions: { display: "flex", gap: 8, flexWrap: "wrap" },
  actionBtn: {
    padding: "10px 14px",
    background: "#fff",
    color: "#000",
    border: "1px solid #000",
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    fontFamily: "'Barlow', sans-serif",
    fontWeight: 700,
    cursor: "pointer",
    textDecoration: "none",
  },
};
