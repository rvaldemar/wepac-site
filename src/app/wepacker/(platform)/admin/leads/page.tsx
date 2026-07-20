import { requirePageRole } from "@/lib/wepacker/page-guards";
import { getLeads } from "@/lib/wepacker/actions/lead";
import { AdminLeadsPageClient } from "./page-client";

export default async function AdminLeadsPage() {
  await requirePageRole(["admin"]);
  const leads = await getLeads();
  return <AdminLeadsPageClient leads={JSON.parse(JSON.stringify(leads))} />;
}
