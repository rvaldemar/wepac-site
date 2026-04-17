import Link from "next/link";
import { prisma } from "@/lib/db";
import { styles, formatEventDate, formatEventTime } from "../ui";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  draft: "Rascunho",
  published: "Publicado",
  cancelled: "Cancelado",
  completed: "Concluído",
};

export default async function AdminDashboard() {
  const events = await prisma.event.findMany({
    orderBy: { startsAt: "desc" },
    include: {
      department: true,
      brand: true,
      _count: { select: { tickets: true } },
    },
  });

  return (
    <main style={styles.container}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 24,
        }}
      >
        <div>
          <div style={styles.eyebrow}>Admin</div>
          <h1 style={styles.h1}>Eventos</h1>
        </div>
        <Link href="/bilheteira/admin/events/new" style={styles.buttonSecondary}>
          + Novo evento
        </Link>
      </div>

      {events.length === 0 ? (
        <div style={styles.card}>
          <p style={{ margin: 0 }}>
            Ainda não tens eventos. Clica em <strong>Novo evento</strong> para
            começar.
          </p>
        </div>
      ) : (
        <div style={styles.card}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Título</th>
                <th style={styles.th}>Departamento · Marca</th>
                <th style={styles.th}>Data</th>
                <th style={{ ...styles.th, textAlign: "center" }}>Bilhetes</th>
                <th style={styles.th}>Estado</th>
                <th style={styles.th}></th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id}>
                  <td style={styles.td}>
                    <strong>{e.title}</strong>
                    {e.subtitle && (
                      <div style={{ fontSize: 12, color: "#666" }}>
                        {e.subtitle}
                      </div>
                    )}
                  </td>
                  <td style={styles.td}>
                    {e.department.name}
                    {e.brand && ` · ${e.brand.name}`}
                  </td>
                  <td style={styles.td}>
                    {formatEventDate(e.startsAt)}
                    <div style={{ fontSize: 12, color: "#666" }}>
                      {formatEventTime(e.startsAt)}
                    </div>
                  </td>
                  <td style={{ ...styles.td, textAlign: "center" }}>
                    {e._count.tickets}
                  </td>
                  <td style={styles.td}>
                    <span style={styles.pill}>
                      {STATUS_LABEL[e.status] || e.status}
                    </span>
                  </td>
                  <td style={{ ...styles.td, textAlign: "right" }}>
                    <Link
                      href={`/bilheteira/admin/events/${e.id}`}
                      style={styles.buttonGhost}
                    >
                      Gerir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
