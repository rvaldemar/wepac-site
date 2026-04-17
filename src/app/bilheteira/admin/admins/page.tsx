import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSessionAdmin } from "@/lib/bilheteira/session";
import { deleteAdminAction } from "@/lib/bilheteira/auth-actions";
import { styles } from "../../ui";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ deleted?: string; error?: string }>;
};

function formatDateTime(d: Date | null): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export default async function AdminsPage({ searchParams }: Props) {
  const current = await getSessionAdmin();
  if (!current) return null; // layout already redirects, satisfies TS
  const { deleted, error } = await searchParams;

  const admins = await prisma.ticketingAdmin.findMany({
    orderBy: { createdAt: "asc" },
  });

  return (
    <main style={styles.container}>
      <div style={styles.eyebrow}>
        <Link href="/bilheteira/admin" style={{ color: "#666" }}>
          ← Eventos
        </Link>
      </div>
      <h1 style={styles.h1}>Administradores</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>
        Todos os administradores têm as mesmas permissões. Para adicionar
        alguém novo, partilha o link da{" "}
        <Link href="/bilheteira/signup" style={styles.link}>
          página de registo
        </Link>{" "}
        — a conta só é activada após confirmação do email @wepac.pt.
      </p>

      {error && <div style={styles.error}>{error}</div>}
      {deleted && (
        <div
          style={{
            padding: 12,
            background: "#e8f5e9",
            border: "1px solid #1b5e20",
            color: "#1b5e20",
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          Admin apagado.
        </div>
      )}

      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Nome</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Estado</th>
              <th style={styles.th}>Criado em</th>
              <th style={styles.th}>Último login</th>
              <th style={styles.th}></th>
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => {
              const isSelf = a.id === current.id;
              const verified = !!a.emailVerifiedAt;
              return (
                <tr key={a.id}>
                  <td style={styles.td}>
                    <strong>{a.name}</strong>
                    {isSelf && (
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: 10,
                          letterSpacing: 1.5,
                          textTransform: "uppercase",
                          color: "#666",
                        }}
                      >
                        (tu)
                      </span>
                    )}
                  </td>
                  <td style={styles.td}>{a.email}</td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.pill,
                        background: verified ? "#DEE0DB" : "#fff3cd",
                      }}
                    >
                      {verified ? "Verificado" : "Pendente"}
                    </span>
                  </td>
                  <td style={{ ...styles.td, fontSize: 13, color: "#666" }}>
                    {formatDateTime(a.createdAt)}
                  </td>
                  <td style={{ ...styles.td, fontSize: 13, color: "#666" }}>
                    {formatDateTime(a.lastLoginAt)}
                  </td>
                  <td style={{ ...styles.td, textAlign: "right" }}>
                    {isSelf ? (
                      <span style={{ color: "#999", fontSize: 12 }}>—</span>
                    ) : (
                      <form action={deleteAdminAction} style={{ margin: 0 }}>
                        <input type="hidden" name="id" value={a.id} />
                        <button
                          type="submit"
                          style={styles.buttonDanger}
                          title="Apagar admin"
                        >
                          Apagar
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
