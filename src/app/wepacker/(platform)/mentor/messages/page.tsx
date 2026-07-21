import { requirePageRole } from "@/lib/wepacker/page-guards";
import { getMyConversations, getMessagingContacts } from "@/lib/wepacker/actions/message";
import { MentorMessagesClient } from "./page-client";

export default async function MentorMessagesPage() {
  const user = await requirePageRole(["admin"]);

  const [conversations, contacts] = await Promise.all([
    getMyConversations(),
    getMessagingContacts(),
  ]);

  return (
    <MentorMessagesClient
      conversations={conversations}
      contacts={contacts}
      currentUserId={user.id}
    />
  );
}
