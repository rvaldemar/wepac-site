import Link from "next/link";
import { prisma } from "@/lib/db";
import { PrintButton } from "./print-button";

export const dynamic = "force-dynamic";

export default async function SemNomeImprimirPage() {
  const adminKey = process.env.SN_ADMIN_KEY ?? "";
  if (!adminKey) {
    return (
      <main style={{ padding: 40, fontFamily: "system-ui, sans-serif" }}>
        <p>SN_ADMIN_KEY not configured.</p>
      </main>
    );
  }

  const tickets = await prisma.semNomeTicket.findMany({
    orderBy: { serial: "asc" },
  });

  const totalTickets = tickets.length;
  const totalSeats = tickets.reduce((s, t) => s + t.seats, 0);
  const checkedInCount = tickets.filter((t) => t.checkedInAt).length;
  const checkedInSeats = tickets
    .filter((t) => t.checkedInAt)
    .reduce((s, t) => s + t.seats, 0);

  const now = new Date();
  const generatedAt = now.toLocaleString("pt-PT", {
    dateStyle: "short",
    timeStyle: "short",
  });

  return (
    <>
      <style>{printCss}</style>
      <main className="sn-print-main">
        <div className="sn-print-wrap">
          <div className="sn-print-controls no-print">
            <Link href="/sn-admin-c027ea95daf3" className="sn-print-back">
              ← Admin
            </Link>
            <PrintButton />
          </div>

          <header className="sn-print-header">
            <div>
              <h1 className="sn-print-h1">Sem Nome · Lista de convidados</h1>
              <p className="sn-print-sub">
                Jotta Pê · 21 ABR 2026 · 19H · Aquiraz
              </p>
            </div>
            <div className="sn-print-meta">Gerado {generatedAt}</div>
          </header>

          <section className="sn-print-totals">
            <div>
              <strong>{totalTickets}</strong> bilhetes
            </div>
            <div>
              <strong>{totalSeats}</strong> lugares
            </div>
            <div>
              <strong>{checkedInCount}</strong> admitidos
            </div>
            <div>
              <strong>{checkedInSeats}</strong> lug. in
            </div>
          </section>

          <table className="sn-print-table">
            <thead>
              <tr>
                <th style={{ width: "12%" }}>Serial</th>
                <th>Nome</th>
                <th style={{ width: "10%", textAlign: "center" }}>Lug.</th>
                <th style={{ width: "18%", textAlign: "center" }}>Admitido</th>
                <th style={{ width: "18%" }} className="no-print">
                  Entrada
                </th>
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: 40 }}>
                    Sem bilhetes emitidos.
                  </td>
                </tr>
              )}
              {tickets.map((t) => {
                const serialCode = `SN-${String(t.serial).padStart(3, "0")}`;
                const checkIn = t.checkedInAt
                  ? t.checkedInAt.toLocaleTimeString("pt-PT", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "";
                return (
                  <tr
                    key={t.id}
                    className={t.checkedInAt ? "sn-print-in" : ""}
                  >
                    <td className="sn-print-serial">{serialCode}</td>
                    <td>{t.name}</td>
                    <td style={{ textAlign: "center" }}>{t.seats}</td>
                    <td style={{ textAlign: "center" }}>
                      {checkIn ? `✓ ${checkIn}` : "☐"}
                    </td>
                    <td className="no-print" style={{ color: "#888" }}>
                      {t.id.slice(0, 10)}…
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <footer className="sn-print-footer">
            <p>
              Intransmissível. Cada bilhete admite o número indicado de
              lugares. Conferir identidade do portador quando possível.
            </p>
          </footer>
        </div>
      </main>
    </>
  );
}

const printCss = `
  .sn-print-main {
    min-height: 100vh;
    background: #f5f4f0;
    font-family: 'Inter', system-ui, sans-serif;
    color: #000;
    padding: 32px 16px;
  }
  .sn-print-wrap {
    max-width: 820px;
    margin: 0 auto;
    background: #fff;
    padding: 32px 36px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  }
  .sn-print-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    gap: 12px;
  }
  .sn-print-back {
    padding: 8px 12px;
    background: #fff;
    color: #000;
    border: 1px solid #000;
    font-family: 'Barlow', sans-serif;
    font-size: 11px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    font-weight: 700;
    text-decoration: none;
  }
  .sn-print-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 20px;
    border-bottom: 2px solid #000;
    padding-bottom: 12px;
    margin-bottom: 20px;
  }
  .sn-print-h1 {
    font-family: 'Barlow', sans-serif;
    font-weight: 900;
    font-size: 22px;
    letter-spacing: -0.5px;
    margin: 0;
  }
  .sn-print-sub {
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #333;
    margin: 4px 0 0;
  }
  .sn-print-meta {
    font-size: 10px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #666;
  }
  .sn-print-totals {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    padding: 12px 16px;
    background: #fafaf7;
    border: 1px solid #e5e3de;
    margin-bottom: 20px;
    font-size: 13px;
    text-align: center;
  }
  .sn-print-totals strong {
    font-family: 'Barlow', sans-serif;
    font-size: 20px;
    font-weight: 900;
    display: block;
    letter-spacing: -0.5px;
  }
  .sn-print-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }
  .sn-print-table th {
    text-align: left;
    padding: 8px 8px;
    font-size: 9px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #333;
    border-bottom: 1px solid #000;
    font-weight: 700;
  }
  .sn-print-table td {
    padding: 8px 8px;
    border-bottom: 1px solid #eee;
    vertical-align: middle;
  }
  .sn-print-serial {
    font-family: 'Barlow', sans-serif;
    font-weight: 700;
    letter-spacing: 1px;
  }
  .sn-print-in {
    background: #f1f8e9;
  }
  .sn-print-footer {
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid #ddd;
    font-size: 11px;
    color: #666;
    line-height: 1.5;
  }

  @media print {
    .sn-print-main {
      background: #fff;
      padding: 0;
    }
    .sn-print-wrap {
      max-width: none;
      margin: 0;
      padding: 0;
      box-shadow: none;
    }
    .no-print {
      display: none !important;
    }
    .sn-print-table {
      font-size: 11px;
    }
    .sn-print-table th {
      padding: 6px 6px;
    }
    .sn-print-table td {
      padding: 6px 6px;
    }
    .sn-print-header {
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    .sn-print-totals {
      padding: 8px 12px;
      margin-bottom: 12px;
    }
    .sn-print-in {
      background: #eee !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @page {
      size: A4 portrait;
      margin: 12mm;
    }
    thead {
      display: table-header-group;
    }
    tr {
      page-break-inside: avoid;
    }
  }
`;
