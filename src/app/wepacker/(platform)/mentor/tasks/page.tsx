import { requirePageRole } from "@/lib/wepacker/page-guards";
import { getMentoredTasks } from "@/lib/wepacker/actions/task";
import { getMemberships } from "@/lib/wepacker/actions/admin";
import { MentorTasksClient } from "./page-client";

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
