import { requireRole } from "@/lib/auth-helpers";
import { getLeads } from "@/lib/actions/lead";
import { AdminLeadsPageClient } from "./page-client";

export default async function AdminLeadsPage() {
 await requireRole(["admin"]);
 const leads = await getLeads();
 return <AdminLeadsPageClient leads={JSON.parse(JSON.stringify(leads))} />;
}
