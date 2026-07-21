import { requirePageUser } from "@/lib/wepacker/page-guards";
import { getMyContext } from "@/lib/wepacker/actions/user";
import ProfilePageClient from "./page-client";

export default async function ProfilePage() {
  await requirePageUser();
  const { user, membership, stage } = await getMyContext();

  return <ProfilePageClient user={user} membership={membership} stage={stage} />;
}
