import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/wepacker/page-guards";
import { getMentoredSessionDetail } from "@/lib/wepacker/actions/session";
import { getSessionDebrief } from "@/lib/wepacker/actions/debrief";
import { DEBRIEF_CONTRACT_VERSION } from "@/lib/wepacker/debrief/types";
import { SessionDebriefClient } from "./page-client";
import { SessionMediaPanel } from "@/components/wepacker/SessionMediaPanel";
import { getSessionMediaWorkspace } from "@/lib/wepacker/actions/session-media";

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
  await requirePageUser();
  const { id } = await params;

  const session = await getMentoredSessionDetail(id);
  if (!session) notFound();

  // Session detail deliberately omits its physical Debrief relation. Only the
  // sanitized, contract-versioned view crosses the server/client boundary.
  const debrief = await getSessionDebrief(id);
  const mediaWorkspace = await getSessionMediaWorkspace(id);
  const transcriptWritesEnabled =
    process.env.SESSION_TRANSCRIPT_WRITES_ENABLED === "true";
  const debriefGenerationEnabled =
    process.env.DEBRIEF_ENGINE?.trim() === "hub" &&
    Boolean(process.env.HUB_API_URL?.trim()) &&
    Boolean(process.env.HUB_DEBRIEF_API_KEY?.trim()) &&
    Boolean(process.env.HUB_DEBRIEF_PLAYBOOK_ID?.trim()) &&
    process.env.HUB_DEBRIEF_CONTRACT_VERSION?.trim() ===
      DEBRIEF_CONTRACT_VERSION;

  return (
    <>
      <SessionDebriefClient
        session={serialize(session)}
        debrief={debrief ? serialize(debrief) : null}
        transcriptWritesEnabled={transcriptWritesEnabled}
        debriefGenerationEnabled={debriefGenerationEnabled}
      />
      <SessionMediaPanel sessionId={id} workspace={serialize(mediaWorkspace)} />
    </>
  );
}
