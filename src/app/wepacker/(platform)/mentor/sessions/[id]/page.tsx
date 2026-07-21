import { notFound } from "next/navigation";
import { requirePageRole } from "@/lib/wepacker/page-guards";
import { getMentoredSessionDetail } from "@/lib/wepacker/actions/session";
import { getSessionDebrief } from "@/lib/wepacker/actions/debrief";
import { getSessionPreparation } from "@/lib/wepacker/actions/session-prep";
import { SessionDebriefClient } from "./page-client";

// Dates coming out of Prisma need to cross the server/client boundary as
// plain JSON — this round-trip turns every Date into an ISO string.
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

export default async function MentorSessionDebriefPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePageRole(["mentor", "admin"]);
  const { id } = await params;

  const session = await getMentoredSessionDetail(id);
  if (!session) notFound();

  // getMentoredSessionDetail already includes `debrief` (full row), but
  // the review UI reads the typed SessionDebriefView shape everywhere
  // else — go through the same action so both callers agree on shape.
  const debrief = await getSessionDebrief(id);

  // Only relevant before there's a transcript/debrief to review — fetched
  // unconditionally anyway since it's cheap and harmless once the session
  // has moved past that point (the client only renders it before then).
  const preparation = await getSessionPreparation(id);

  return (
    <SessionDebriefClient
      session={serialize(session)}
      debrief={debrief ? serialize(debrief) : null}
      preparation={serialize(preparation)}
    />
  );
}
