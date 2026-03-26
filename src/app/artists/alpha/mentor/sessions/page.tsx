import { requireRole } from "@/lib/auth-helpers";
import { getAllUsers, getArtists } from "@/lib/actions/user";
import { getAllSessions } from "@/lib/actions/session";
import { MentorSessionsPageClient } from "./page-client";

export default async function MentorSessionsPage() {
 await requireRole(["mentor", "admin"]);

 const [sessions, users, artists] = await Promise.all([
  getAllSessions(),
  getAllUsers(),
  getArtists(),
 ]);

 return (
  <MentorSessionsPageClient
   sessions={sessions as any}
   users={users as any}
   artists={artists as any}
  />
 );
}
