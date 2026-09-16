import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db";
import { styles, formatEventDate, formatEventTime } from "../ui";
import { getLocale } from "next-intl/server";
import { getTicketAdminCopy } from "@/i18n/copy/institutional-admin";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ verified?: string }>;
};

export default async function AdminDashboard({ searchParams }: Props) {
  const locale = await getLocale();
  const copy = getTicketAdminCopy(locale).dashboard;
  const { verified } = await searchParams;
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
      {verified && (
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
          {copy.verifiedWelcome}
        </div>
      )}
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
          <h1 style={styles.h1}>{copy.title}</h1>
        </div>
        <Link href="/bilheteira/admin/events/new" style={styles.buttonSecondary}>
          {copy.newEvent}
        </Link>
      </div>

      {events.length === 0 ? (
        <div style={styles.card}>
          <p style={{ margin: 0 }}>{copy.empty}</p>
        </div>
      ) : (
        <div style={styles.card}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>{copy.tableTitle}</th>
                <th style={styles.th}>{copy.departmentBrand}</th>
                <th style={styles.th}>{copy.date}</th>
                <th style={{ ...styles.th, textAlign: "center" }}>{copy.tickets}</th>
                <th style={styles.th}>{copy.status}</th>
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
                    {formatEventDate(e.startsAt, locale)}
                    <div style={{ fontSize: 12, color: "#666" }}>
                      {formatEventTime(e.startsAt, locale)}
                    </div>
                  </td>
                  <td style={{ ...styles.td, textAlign: "center" }}>
                    {e._count.tickets}
                  </td>
                  <td style={styles.td}>
                    <span style={styles.pill}>
                      {copy.statusLabels[e.status] || e.status}
                    </span>
                  </td>
                  <td style={{ ...styles.td, textAlign: "right" }}>
                    <Link
                      href={`/bilheteira/admin/events/${e.id}`}
                      style={styles.buttonGhost}
                    >
                      {copy.manage}
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
