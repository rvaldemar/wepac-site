import { getMyActions } from "@/lib/wepacker/actions/action";
import { requirePageUser } from "@/lib/wepacker/page-guards";
import ActionsPageClient from "./page-client";

export default async function ActionsPage() {
  await requirePageUser();
  const actions = await getMyActions();

  return (
    <ActionsPageClient
      actions={actions.map((action) => ({
        id: action.id,
        title: action.title,
        description: action.description,
        status: action.status,
        origin: action.origin,
        dueAt: action.dueAt?.toISOString() ?? null,
        createdAt: action.createdAt.toISOString(),
      }))}
    />
  );
}
