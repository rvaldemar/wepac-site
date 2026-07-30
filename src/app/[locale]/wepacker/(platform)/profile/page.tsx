import { requirePageUser } from "@/lib/wepacker/page-guards";
import { getMyContext } from "@/lib/wepacker/actions/user";
import ProfilePageClient from "./page-client";

export default async function ProfilePage() {
  await requirePageUser();
  const { user, stage } = await getMyContext();

  return <ProfilePageClient user={user} stage={stage} />;
}
