import { getCurrentUser } from "@/lib/actions/user";
import { getUserTasks } from "@/lib/actions/task";
import TasksPageClient from "./page-client";

export default async function TasksPage() {
 const user = await getCurrentUser();
 const tasks = await getUserTasks(user.id);

 const serializedTasks = tasks.map((t) => ({
  id: t.id,
  title: t.title,
  description: t.description,
  status: t.status as "todo" | "in_progress" | "done",
  origin: t.origin,
  deadline: t.deadline,
 }));

 return <TasksPageClient tasks={serializedTasks} />;
}
