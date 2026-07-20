import { requirePageRole } from "@/lib/wepacker/page-guards";
import {
  getMentoredMembers,
  getMentoredSessions,
} from "@/lib/wepacker/actions/session";
import { getCohorts } from "@/lib/wepacker/actions/admin";
import { MentorSessionsClient } from "./page-client";

// Dates coming out of Prisma need to cross the server/client boundary as
// plain JSON — this round-trip turns every Date into an ISO string. The
// client-side props are typed with `string` dates, so the return type is
// intentionally loose here.
function serialize(data: unknown): any {
  return JSON.parse(JSON.stringify(data));
}

export default async function MentorSessionsPage() {
  await requirePageRole(["mentor", "admin"]);

  const [sessions, cohorts, members] = await Promise.all([
    getMentoredSessions(),
    getCohorts(),
    getMentoredMembers(),
  ]);

  return (
    <MentorSessionsClient
      sessions={serialize(sessions)}
      cohorts={serialize(cohorts)}
      members={serialize(members)}
    />
  );
}
