import { AdminForm } from "./admin-form";

export const dynamic = "force-dynamic";

export default function SemNomeAdminPage() {
  const adminKey = process.env.SN_ADMIN_KEY ?? "";

  if (!adminKey) {
    return (
      <main style={{ padding: 40, fontFamily: "system-ui, sans-serif" }}>
        <p>SN_ADMIN_KEY not configured.</p>
      </main>
    );
  }

  return <AdminForm adminKey={adminKey} />;
}
