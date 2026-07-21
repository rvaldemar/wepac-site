import { requirePageUser } from "@/lib/wepacker/page-guards";
import { getMyContext } from "@/lib/wepacker/actions/user";
import { getMyTasks } from "@/lib/wepacker/actions/task";
import TasksPageClient from "./page-client";

export default async function TasksPage() {
  await requirePageUser();
  const { membership } = await getMyContext();

  if (!membership) {
    return (
      <div className="p-6 lg:p-8">
        <h1 className="font-barlow text-2xl font-bold text-wepac-white">
          Legacy Tasks
        </h1>
        <p className="mt-4 max-w-md text-sm text-wepac-text-tertiary">
          Legacy Tasks still depend on a legacy delivery record. My Journey
          and Sessions do not require one.
        </p>
      </div>
    );
  }

  const tasks = await getMyTasks();

  const serializedTasks = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    origin: t.origin,
    deadline: t.deadline,
  }));

  return <TasksPageClient membershipId={membership.membershipId} tasks={serializedTasks} />;
}
