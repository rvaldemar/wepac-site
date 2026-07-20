import { requirePageRole } from "@/lib/wepacker/page-guards";
import { getPacks, getAllUsers } from "@/lib/wepacker/actions/admin";
import { AdminCohortsPageClient } from "./page-client";

export default async function AdminCohortsPage() {
  await requirePageRole(["admin"]);

  const [packs, users] = await Promise.all([getPacks(), getAllUsers()]);

  return (
    <AdminCohortsPageClient
      packs={JSON.parse(JSON.stringify(packs))}
      users={JSON.parse(JSON.stringify(users))}
    />
  );
}
