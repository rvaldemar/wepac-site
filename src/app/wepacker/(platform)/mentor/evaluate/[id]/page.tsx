import Link from "next/link";
import { requirePageRole } from "@/lib/wepacker/page-guards";

export default async function LegacyEvaluateUnavailablePage() {
  await requirePageRole(["admin"]);
  return (
    <div className="p-6 lg:p-8">
      <h1 className="font-barlow text-2xl font-bold text-wepac-white">
        Assessment access unavailable
      </h1>
      <p className="mt-4 max-w-2xl text-sm text-wepac-text-tertiary">
        Admin access is not an Artifact Grant. Cross-person Assessment review
        remains disabled until the Person can grant and revoke that capability.
      </p>
      <Link href="/wepacker/admin/users" className="mt-6 inline-block text-sm text-wepac-white hover:underline">
        Back to Users →
      </Link>
    </div>
  );
}
