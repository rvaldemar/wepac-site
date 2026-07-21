import Link from "next/link";
import { requirePageRole } from "@/lib/wepacker/page-guards";

export default async function LegacyMemberDetailUnavailablePage() {
  await requirePageRole(["admin"]);
  return (
    <div className="p-6 lg:p-8">
      <h1 className="font-barlow text-2xl font-bold text-wepac-white">
        Private Journey access unavailable
      </h1>
      <p className="mt-4 max-w-2xl text-sm text-wepac-text-tertiary">
        Admin access is not an Artifact Grant. Life Map, Trails, Assessments
        and Tasks remain private to their owner until explicit grants exist.
      </p>
      <Link href="/wepacker/admin/users" className="mt-6 inline-block text-sm text-wepac-white hover:underline">
        Back to Users →
      </Link>
    </div>
  );
}
