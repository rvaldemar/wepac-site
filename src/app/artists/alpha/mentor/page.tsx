import { requireRole } from "@/lib/auth-helpers";
import { getArtists } from "@/lib/actions/user";
import { getAllTasks } from "@/lib/actions/task";
import { getAllSessions } from "@/lib/actions/session";
import { getAllConversations } from "@/lib/actions/message";
import { MentorDashboardClient } from "./page-client";

export default async function MentorDashboardPage() {
  await requireRole(["mentor", "admin"]);

  const [artists, tasks, sessions, conversations] = await Promise.all([
    getArtists(),
    getAllTasks(),
    getAllSessions(),
    getAllConversations(),
  ]);

  return (
    <MentorDashboardClient
      artists={artists as any}
      tasks={tasks as any}
      sessions={sessions as any}
      conversations={conversations as any}
    />
  );
}
