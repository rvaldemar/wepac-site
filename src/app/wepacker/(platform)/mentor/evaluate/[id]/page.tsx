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

  // `id` is the membershipId (route param) — resolve it to the person's
  // userId first, since evaluations now hang on the person, not the
  // membership (one Life Plan/diagnosis per person across every pack).
  const membership = await getMembershipDetail(id);
  const evaluations = await getEvaluations(membership.user.id);

  return (
    <MentorEvaluateClient
      membership={serialize(membership)}
      evaluations={serialize(evaluations)}
    />
  );
}
