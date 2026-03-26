import { requireRole } from "@/lib/auth-helpers";
import { getUser } from "@/lib/actions/user";
import { EvaluatePageClient } from "./page-client";

export default async function EvaluatePage({
 params,
}: {
 params: Promise<{ id: string }>;
}) {
 await requireRole(["mentor", "admin"]);
 const { id } = await params;

 const artist = await getUser(id);

 return <EvaluatePageClient artist={artist as any} />;
}
