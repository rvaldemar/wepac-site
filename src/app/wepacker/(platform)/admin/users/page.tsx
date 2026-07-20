import { requirePageRole } from "@/lib/wepacker/page-guards";
import { getAllUsers, getCohorts } from "@/lib/wepacker/actions/admin";
import { AdminUsersPageClient } from "./page-client";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    name?: string;
    email?: string;
    phone?: string;
    applicationId?: string;
  }>;
}) {
  const currentUser = await requirePageRole(["admin"]);

  const [users, cohorts, params] = await Promise.all([
    getAllUsers(),
    getCohorts(),
    searchParams,
  ]);

  return (
    <AdminUsersPageClient
      users={JSON.parse(JSON.stringify(users))}
      cohorts={JSON.parse(JSON.stringify(cohorts))}
      currentUserId={currentUser.id}
      prefill={
        params.name || params.email
          ? {
              name: params.name ?? "",
              email: params.email ?? "",
              phone: params.phone ?? "",
              applicationId: params.applicationId,
            }
          : null
      }
    />
  );
}
