import { requireRole } from "@/lib/auth-helpers";
import { getAllUsers } from "@/lib/actions/user";
import { AdminUsersPageClient } from "./page-client";

export default async function AdminUsersPage() {
  await requireRole(["admin"]);

  const users = await getAllUsers();

  return <AdminUsersPageClient users={users as any} />;
}
