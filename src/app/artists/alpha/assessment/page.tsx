import { getCurrentUser } from "@/lib/actions/user";
import AssessmentPageClient from "./page-client";

export default async function AssessmentPage() {
 const user = await getCurrentUser();

 return <AssessmentPageClient userId={user.id} />;
}
