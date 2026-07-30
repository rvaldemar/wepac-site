import { requirePageUser } from "@/lib/wepacker/page-guards";
import { getMyConversations } from "@/lib/wepacker/actions/message";
import MessagesPageClient from "./page-client";

export default async function MessagesPage() {
  const user = await requirePageUser();

  const conversations = await getMyConversations();

  return (
    <MessagesPageClient userId={user.id} conversations={conversations} />
  );
}
