import { getMyCommunities } from "@/lib/wepacker/actions/community";
import { requirePageUser } from "@/lib/wepacker/page-guards";
import CommunitiesPageClient from "./page-client";

export default async function CommunitiesPage() {
  await requirePageUser();
  const communities = await getMyCommunities();

  return <CommunitiesPageClient {...communities} />;
}
