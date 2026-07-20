import { requirePageRole } from "@/lib/wepacker/page-guards";
import { getMembershipDetail } from "@/lib/wepacker/actions/admin";
import { getEvaluations } from "@/lib/wepacker/actions/evaluation";
import { MentorEvaluateClient } from "./page-client";

// Dates coming out of Prisma need to cross the server/client boundary as
// plain JSON — this round-trip turns every Date into an ISO string. The
// client-side props are typed with `string` dates, so the return type is
// intentionally loose here.
function serialize(data: unknown): any {
  return JSON.parse(JSON.stringify(data));
}

export default async function MentorEvaluatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePageRole(["mentor", "admin"]);
  const { id } = await params;

  const [membership, evaluations] = await Promise.all([
    getMembershipDetail(id),
    getEvaluations(id),
  ]);

  return (
    <MentorEvaluateClient
      membership={serialize(membership)}
      evaluations={serialize(evaluations)}
    />
  );
}
