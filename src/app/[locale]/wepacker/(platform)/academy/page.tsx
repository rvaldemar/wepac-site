import { getMyAcademyParticipation } from "@/lib/wepacker/actions/academy";
import { requirePageUser } from "@/lib/wepacker/page-guards";
import AcademyPageClient from "./page-client";

export default async function AcademyPage() {
  await requirePageUser();
  const participation = await getMyAcademyParticipation();

  return <AcademyPageClient {...participation} />;
}
