import { requirePageUser } from "@/lib/wepacker/page-guards";
import {
  getFacilitatedCycles,
  getMentoredMembers,
  getMentoredSessions,
} from "@/lib/wepacker/actions/session";
import { MentorSessionsClient } from "./page-client";

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

export default async function MentorSessionsPage() {
  const actor = await requirePageUser();
  const [sessions, members, facilitatedCycles] = await Promise.all([
    getMentoredSessions(),
    getMentoredMembers(),
    getFacilitatedCycles(),
  ]);

  return (
    <MentorSessionsClient
      sessions={serialize(
        sessions.map((session) => ({
          ...session,
          attendeeCount: session.attendees.length,
        })),
      )}
      members={serialize(members)}
      facilitatedCycles={serialize(facilitatedCycles)}
      currentUserId={actor.id}
    />
  );
}
