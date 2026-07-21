import Link from "next/link";
import { requirePageRole } from "@/lib/wepacker/page-guards";

export default async function CrossPersonTasksUnavailablePage() {
  await requirePageRole(["admin"]);
  return (
    <div className="p-6 lg:p-8">
      <h1 className="font-barlow text-2xl font-bold text-wepac-white">
        Cross-person Tasks unavailable
      </h1>
      <p className="mt-4 max-w-2xl text-sm text-wepac-text-tertiary">
        Tasks remain private to their owner until an explicit, revocable Task
        grant exists. Admin access is not such a grant.
      </p>
      <Link href="/wepacker/admin/users" className="mt-6 inline-block text-sm text-wepac-white hover:underline">
        Back to Users →
      </Link>
    </div>
  );
}
