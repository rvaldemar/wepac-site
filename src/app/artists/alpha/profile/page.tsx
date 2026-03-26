import { getCurrentUser } from "@/lib/actions/user";
import ProfilePageClient from "./page-client";

export default async function ProfilePage() {
 const user = await getCurrentUser();

 return <ProfilePageClient user={user} />;
}
