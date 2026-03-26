import { getCurrentUser, getAllUsers } from "@/lib/actions/user";
import { getUserConversations } from "@/lib/actions/message";
import MessagesPageClient from "./page-client";

export default async function MessagesPage() {
 const user = await getCurrentUser();

 const [conversations, allUsers] = await Promise.all([
  getUserConversations(user.id),
  getAllUsers(),
 ]);

 const usersMap: Record<string, string> = {};
 for (const u of allUsers) {
  usersMap[u.id] = u.name;
 }

 return (
  <MessagesPageClient
   userId={user.id}
   conversations={conversations}
   usersMap={usersMap}
  />
 );
}
