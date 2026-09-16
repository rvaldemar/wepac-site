import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db";
import { getSessionAdmin } from "@/lib/bilheteira/session";
import { deleteAdminAction } from "@/lib/bilheteira/auth-actions";
import { styles } from "../../ui";
import { getLocale } from "next-intl/server";
import { getTicketAdminCopy } from "@/i18n/copy/institutional-admin";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ deleted?: string; error?: string }>;
};

function formatDateTime(d: Date | null, locale: string): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export default async function AdminsPage({ searchParams }: Props) {
  const locale = await getLocale();
  const copy = getTicketAdminCopy(locale).admins;
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
          {copy.back}
        </Link>
      </div>
      <h1 style={styles.h1}>{copy.title}</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>
        {copy.introductionBefore}{" "}
        <Link href="/bilheteira/signup" style={styles.link}>
          {copy.registrationPage}
        </Link>{" "}
        {copy.introductionAfter}
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
          {copy.deleted}
        </div>
      )}

      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>{copy.name}</th>
              <th style={styles.th}>{copy.email}</th>
              <th style={styles.th}>{copy.status}</th>
              <th style={styles.th}>{copy.createdAt}</th>
              <th style={styles.th}>{copy.lastLogin}</th>
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
                        {copy.self}
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
                      {verified ? copy.verified : copy.pending}
                    </span>
                  </td>
                  <td style={{ ...styles.td, fontSize: 13, color: "#666" }}>
                    {formatDateTime(a.createdAt, locale)}
                  </td>
                  <td style={{ ...styles.td, fontSize: 13, color: "#666" }}>
                    {formatDateTime(a.lastLoginAt, locale)}
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
                          title={copy.deleteTitle}
                        >
                          {copy.delete}
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
