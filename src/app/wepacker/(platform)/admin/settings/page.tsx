import { requirePageRole } from "@/lib/wepacker/page-guards";
import { AdminSettingsPageClient } from "./page-client";

export default async function AdminSettingsPage() {
  await requirePageRole(["admin"]);
  return <AdminSettingsPageClient />;
}
