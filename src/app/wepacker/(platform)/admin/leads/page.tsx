import { requirePageRole } from "@/lib/wepacker/page-guards";
import { getLeads } from "@/lib/wepacker/actions/lead";
import { getApplications } from "@/lib/wepacker/actions/application";
import { AdminLeadsPageClient } from "./page-client";

export const metadata = { title: "Leads" };

// Central inbox: Wessex leads (chat/form), /contacto submissions and
// WEPACKER pack applications, merged chronologically.
export default async function AdminLeadsPage() {
  await requirePageRole(["admin"]);
  const [leads, applications] = await Promise.all([
    getLeads(),
    getApplications(),
  ]);

  return (
    <AdminLeadsPageClient
      leads={JSON.parse(JSON.stringify(leads))}
      applications={JSON.parse(JSON.stringify(applications))}
    />
  );
}
