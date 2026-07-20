import { requirePageRole } from "@/lib/wepacker/page-guards";
import { getMembershipDetail } from "@/lib/wepacker/actions/admin";
import { getEvaluations } from "@/lib/wepacker/actions/evaluation";
import { MentorEvaluateClient } from "./page-client";

// Dates coming out of Prisma need to cross the server/client boundary as
// plain JSON — this round-trip turns every Date into an ISO string. The
// client-side props are typed with `string` dates, so the return type
// mirrors the input shape with every `Date` swapped for `string`.
type Serialized<T> = T extends Date
  ? string
  : T extends (infer U)[]
    ? Serialized<U>[]
    : T extends object
      ? { [K in keyof T]: Serialized<T[K]> }
      : T;

function serialize<T>(data: T): Serialized<T> {
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
      // `EvaluationType` at the DB level allows more variants than the
      // client's narrower `"self" | "mentor"` union — a pre-existing gap
      // unrelated to this serialization helper.
      evaluations={
        serialize(evaluations) as Parameters<typeof MentorEvaluateClient>[0]["evaluations"]
      }
    />
  );
}
