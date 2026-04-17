import { redirect } from "next/navigation";
import { getSessionAdmin } from "@/lib/bilheteira/session";
import { logoutAction } from "@/lib/bilheteira/auth-actions";
import { Shell, styles } from "../ui";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getSessionAdmin();
  if (!admin) redirect("/bilheteira/login");

  return (
    <Shell
      rightSlot={
        <>
          <span style={{ fontSize: 13, color: "#666" }}>{admin.email}</span>
          <form action={logoutAction} style={{ margin: 0 }}>
            <button type="submit" style={styles.buttonGhost}>
              Sair
            </button>
          </form>
        </>
      }
    >
      {children}
    </Shell>
  );
}
