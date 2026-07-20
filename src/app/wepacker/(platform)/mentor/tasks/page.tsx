import { requirePageRole } from "@/lib/wepacker/page-guards";
import { getMentoredTasks } from "@/lib/wepacker/actions/task";
import { getMemberships } from "@/lib/wepacker/actions/admin";
import { MentorTasksClient } from "./page-client";

// Dates coming out of Prisma need to cross the server/client boundary as
// plain JSON — this round-trip turns every Date into an ISO string. The
// client-side props are typed with `string` dates, so the return type is
// intentionally loose here.
function serialize(data: unknown): any {
  return JSON.parse(JSON.stringify(data));
}

export default async function MentorTasksPage() {
  await requirePageRole(["mentor", "admin"]);

  const [tasks, memberships] = await Promise.all([
    getMentoredTasks(),
    getMemberships(),
  ]);

  return (
    <MentorTasksClient tasks={serialize(tasks)} memberships={serialize(memberships)} />
  );
}
