import { requireRole } from "@/lib/auth-helpers";
import { getAllUsers, getArtists } from "@/lib/actions/user";
import { getAllConversations } from "@/lib/actions/message";
import { MentorMessagesPageClient } from "./page-client";

export default async function MentorMessagesPage() {
  const session = await requireRole(["mentor", "admin"]);

  const [conversations, users] = await Promise.all([
    getAllConversations(),
    getAllUsers(),
  ]);

  return (
    <MentorMessagesPageClient
      conversations={conversations as any}
      users={users as any}
      currentUserId={session.id}
    />
  );
}
