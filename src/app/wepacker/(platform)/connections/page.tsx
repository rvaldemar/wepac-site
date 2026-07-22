import { getMyConnections } from "@/lib/wepacker/actions/connection";
import { requirePageUser } from "@/lib/wepacker/page-guards";
import ConnectionsPageClient from "./page-client";

export default async function ConnectionsPage() {
  await requirePageUser();
  const connections = await getMyConnections();

  return <ConnectionsPageClient connections={connections} />;
}
