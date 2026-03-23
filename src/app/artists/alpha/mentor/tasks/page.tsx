import { requireRole } from "@/lib/auth-helpers";
import { getAllUsers } from "@/lib/actions/user";
import { getAllTasks } from "@/lib/actions/task";
import { MentorTasksPageClient } from "./page-client";

export default async function MentorTasksPage() {
  await requireRole(["mentor", "admin"]);

  const [tasks, users] = await Promise.all([
    getAllTasks(),
    getAllUsers(),
  ]);

  return (
    <MentorTasksPageClient
      tasks={tasks as any}
      users={users as any}
    />
  );
}
