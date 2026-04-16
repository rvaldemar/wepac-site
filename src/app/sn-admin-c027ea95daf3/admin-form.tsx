"use client";

import { useCallback, useEffect, useState } from "react";

type TicketResult = {
  token: string;
  serial: number;
  serialCode: string;
  name: string;
  seats: number;
  url: string;
};

type ListTicket = TicketResult & {
  createdAt: string;
  checkedInAt: string | null;
};

type Totals = {
  count: number;
  seats: number;
  checkedInCount: number;
  checkedInSeats: number;
};

export function AdminForm({ adminKey }: { adminKey: string }) {
  const [name, setName] = useState("");
  const [seats, setSeats] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<TicketResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [tickets, setTickets] = useState<ListTicket[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);

  const loadList = useCallback(async () => {
    try {
      const res = await fetch("/api/sn/list", {
        headers: { "x-sn-admin-key": adminKey },
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        tickets: ListTicket[];
        totals: Totals;
      };
      setTickets(data.tickets);
      setTotals(data.totals);
    } catch {
      // silent
    }
  }, [adminKey]);

  useEffect(() => {
    loadList();
    const id = setInterval(loadList, 10000);
    return () => clearInterval(id);
  }, [loadList]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);
    setCopied(null);
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
      loadList();
    } catch (err) {
      setError(err instanceof Error ? err.message : "erro desconhecido");
    } finally {
      setSubmitting(false);
    }
  }

  async function copyLink(token: string, url: string) {
    await navigator.clipboard.writeText(url);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  }

  function whatsappLink(name: string, url: string) {
    const msg = `Olá ${name}, aqui está o teu bilhete para o concerto privado de Jotta Pê — Sem Nome.\n\n${url}`;
    return `https://wa.me/?text=${encodeURIComponent(msg)}`;
  }

  function formatTime(iso: string | null) {
    if (!iso) return "—";
    const d = new Date(iso);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <h1 style={styles.h1}>Sem Nome · Admin</h1>
        <p style={styles.sub}>Jotta Pê · 21 ABR 2026 · Aquiraz</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formRow}>
            <label style={{ ...styles.label, flex: 2 }}>
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
            <label style={{ ...styles.label, flex: 1 }}>
              <span style={styles.labelText}>Lugares</span>
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
          </div>

          <button type="submit" disabled={submitting} style={styles.button}>
            {submitting ? "A gerar…" : "Gerar bilhete"}
          </button>
        </form>

        {error && <div style={styles.error}>Erro: {error}</div>}

        {result && (
          <div style={styles.result}>
            <div style={styles.resultSerial}>{result.serialCode}</div>
            <div style={styles.resultName}>
              {result.name} · {result.seats}{" "}
              {result.seats === 1 ? "lugar" : "lugares"}
            </div>
            <div style={styles.urlBox}>{result.url}</div>
            <div style={styles.actions}>
              <button
                onClick={() => copyLink(result.token, result.url)}
                style={styles.actionBtn}
              >
                {copied === result.token ? "Copiado" : "Copiar link"}
              </button>
              <a
                href={whatsappLink(result.name, result.url)}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.actionBtn}
              >
                WhatsApp
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

        {totals && tickets.length > 0 && (
          <>
            <div style={styles.totalsBar}>
              <div style={styles.totalsCell}>
                <div style={styles.totalsNum}>{totals.count}</div>
                <div style={styles.totalsLabel}>bilhetes</div>
              </div>
              <div style={styles.totalsCell}>
                <div style={styles.totalsNum}>{totals.seats}</div>
                <div style={styles.totalsLabel}>lugares</div>
              </div>
              <div style={styles.totalsCell}>
                <div style={{ ...styles.totalsNum, color: "#1b5e20" }}>
                  {totals.checkedInCount}
                </div>
                <div style={styles.totalsLabel}>admitidos</div>
              </div>
              <div style={styles.totalsCell}>
                <div style={{ ...styles.totalsNum, color: "#1b5e20" }}>
                  {totals.checkedInSeats}
                </div>
                <div style={styles.totalsLabel}>lugares in</div>
              </div>
            </div>

            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>SN</th>
                    <th style={styles.th}>Nome</th>
                    <th style={{ ...styles.th, textAlign: "center" }}>Lug.</th>
                    <th style={{ ...styles.th, textAlign: "center" }}>
                      Admitido
                    </th>
                    <th style={styles.th}></th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr
                      key={t.token}
                      style={{
                        ...styles.tr,
                        background: t.checkedInAt ? "#f1f8e9" : "transparent",
                      }}
                    >
                      <td style={{ ...styles.td, ...styles.tdSerial }}>
                        {t.serialCode}
                      </td>
                      <td style={styles.td}>{t.name}</td>
                      <td style={{ ...styles.td, textAlign: "center" }}>
                        {t.seats}
                      </td>
                      <td
                        style={{
                          ...styles.td,
                          textAlign: "center",
                          color: t.checkedInAt ? "#1b5e20" : "#999",
                          fontWeight: t.checkedInAt ? 700 : 400,
                        }}
                      >
                        {t.checkedInAt ? `✓ ${formatTime(t.checkedInAt)}` : "—"}
                      </td>
                      <td style={{ ...styles.td, textAlign: "right" }}>
                        <div style={styles.rowActions}>
                          <button
                            onClick={() => copyLink(t.token, t.url)}
                            style={styles.rowBtn}
                            title="Copiar link"
                          >
                            {copied === t.token ? "✓" : "⧉"}
                          </button>
                          <a
                            href={whatsappLink(t.name, t.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={styles.rowBtn}
                            title="WhatsApp"
                          >
                            WA
                          </a>
                          <a
                            href={t.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={styles.rowBtn}
                            title="Ver"
                          >
                            ↗
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={styles.refreshNote}>
              Atualiza automaticamente a cada 10s
            </div>
          </>
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
    maxWidth: 760,
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
  formRow: { display: "flex", gap: 16 },
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
    width: "100%",
    boxSizing: "border-box",
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
  totalsBar: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 12,
    marginTop: 40,
    padding: "20px 16px",
    background: "#fafaf7",
    border: "1px solid #e5e3de",
  },
  totalsCell: { textAlign: "center" },
  totalsNum: {
    fontFamily: "'Barlow', sans-serif",
    fontWeight: 900,
    fontSize: 28,
    letterSpacing: "-0.5px",
    lineHeight: 1,
  },
  totalsLabel: {
    fontSize: 9,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#666",
    marginTop: 6,
  },
  tableWrap: {
    marginTop: 20,
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 14,
  },
  th: {
    textAlign: "left",
    padding: "10px 8px",
    fontSize: 9,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#666",
    borderBottom: "1px solid #ddd",
    fontWeight: 400,
  },
  tr: { borderBottom: "1px solid #eee" },
  td: { padding: "12px 8px", verticalAlign: "middle" },
  tdSerial: {
    fontFamily: "'Barlow', sans-serif",
    fontWeight: 700,
    letterSpacing: 1,
    fontSize: 13,
  },
  rowActions: { display: "inline-flex", gap: 4 },
  rowBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 30,
    height: 30,
    padding: "0 6px",
    background: "#fff",
    color: "#000",
    border: "1px solid #ccc",
    fontSize: 12,
    fontFamily: "'Barlow', sans-serif",
    fontWeight: 700,
    cursor: "pointer",
    textDecoration: "none",
  },
  refreshNote: {
    marginTop: 12,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: "#999",
    textAlign: "right",
  },
};
