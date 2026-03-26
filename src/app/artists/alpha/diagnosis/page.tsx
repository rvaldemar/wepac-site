import { getCurrentUser } from "@/lib/actions/user";
import { computeAreaScores } from "@/lib/actions/evaluation";
import DiagnosisPageClient from "./page-client";

export default async function DiagnosisPage() {
 const user = await getCurrentUser();

 const [entryScores, midScores] = await Promise.all([
  computeAreaScores(user.id, "entry"),
  computeAreaScores(user.id, "mid"),
 ]);

 return (
  <DiagnosisPageClient
   entryScores={entryScores}
   midScores={midScores}
  />
 );
}
