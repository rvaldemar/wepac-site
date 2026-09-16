import { Link } from "@/i18n/navigation";
import { redirect } from "next/navigation";
import { getSessionAdmin } from "@/lib/bilheteira/session";
import { logoutAction } from "@/lib/bilheteira/auth-actions";
import { Shell, styles } from "../ui";
import { getLocale } from "next-intl/server";
import { getTicketAdminCopy } from "@/i18n/copy/institutional-admin";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getSessionAdmin();
  if (!admin) redirect("/bilheteira/login");
  const copy = getTicketAdminCopy(await getLocale()).layout;

  return (
    <Shell
      rightSlot={
        <>
          <Link href="/bilheteira/admin" style={styles.buttonGhost}>
            {copy.events}
          </Link>
          <Link href="/bilheteira/admin/admins" style={styles.buttonGhost}>
            {copy.admins}
          </Link>
          <span style={{ fontSize: 13, color: "#666" }}>{admin.email}</span>
          <form action={logoutAction} style={{ margin: 0 }}>
            <button type="submit" style={styles.buttonGhost}>
              {copy.signOut}
            </button>
          </form>
        </>
      }
    >
      {children}
    </Shell>
  );
}
