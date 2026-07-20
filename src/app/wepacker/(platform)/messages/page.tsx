import { requirePageUser } from "@/lib/wepacker/page-guards";
import { getMyConversations, getMessagingContacts } from "@/lib/wepacker/actions/message";
import MessagesPageClient from "./page-client";

export default async function MessagesPage() {
  const user = await requirePageUser();

  const [conversations, contacts] = await Promise.all([
    getMyConversations(),
    getMessagingContacts(),
  ]);

  return (
    <MessagesPageClient userId={user.id} conversations={conversations} contacts={contacts} />
  );
}
