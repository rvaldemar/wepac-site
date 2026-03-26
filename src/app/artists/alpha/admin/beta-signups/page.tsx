import { requireRole } from "@/lib/auth-helpers";
import { getBetaSignups } from "@/lib/actions/beta-signup";
import { BetaSignupsPageClient } from "./page-client";

export default async function AdminBetaSignupsPage() {
 await requireRole(["admin"]);
 const signups = await getBetaSignups();
 return <BetaSignupsPageClient signups={JSON.parse(JSON.stringify(signups))} />;
}
