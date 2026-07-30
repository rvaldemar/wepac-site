import { getMyNotifications } from "@/lib/wepacker/actions/notification";
import { requirePageUser } from "@/lib/wepacker/page-guards";
import NotificationsPageClient from "./page-client";

export default async function NotificationsPage() {
  await requirePageUser();
  const notifications = await getMyNotifications();
  return <NotificationsPageClient notifications={notifications} />;
}
