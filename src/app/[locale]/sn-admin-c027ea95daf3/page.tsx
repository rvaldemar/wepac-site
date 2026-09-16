import { getLocale } from "next-intl/server";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { getSemNomeCopy } from "@/i18n/copy/institutional-sn";
import type { AppLocale } from "@/i18n/routing";
import { AdminForm } from "./admin-form";

export const dynamic = "force-dynamic";

export default async function SemNomeAdminPage() {
  const locale = (await getLocale()) as AppLocale;
  const copy = getSemNomeCopy(locale);
  const adminKey = process.env.SN_ADMIN_KEY ?? "";

  if (!adminKey) {
    return (
      <main style={{ padding: 40, fontFamily: "system-ui, sans-serif" }}>
        <LocaleSwitcher tone="light" />
        <p>{copy.admin.missingKey}</p>
      </main>
    );
  }

  return <AdminForm adminKey={adminKey} />;
}
