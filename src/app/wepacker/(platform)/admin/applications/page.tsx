import { requirePageRole } from "@/lib/wepacker/page-guards";
import { getApplications } from "@/lib/wepacker/actions/application";
import { AdminApplicationsPageClient } from "./page-client";

export default async function AdminApplicationsPage() {
  await requirePageRole(["admin"]);
  const applications = await getApplications();
  return (
    <AdminApplicationsPageClient applications={JSON.parse(JSON.stringify(applications))} />
  );
}
