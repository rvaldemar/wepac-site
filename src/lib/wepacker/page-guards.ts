import { redirect } from "next/navigation";
import { getSessionUser, type SessionUser } from "@/lib/wepacker/guards";
import type { UserRole } from "@/lib/wepacker/types";

// Page-level guards: redirect (middleware is the first line of defense,
// these keep pages safe if middleware config drifts).

export async function requirePageUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/wepacker/login");
  return user;
}

export async function requirePageRole(roles: UserRole[]): Promise<SessionUser> {
  const user = await requirePageUser();
  if (!roles.includes(user.role)) redirect("/wepacker/dashboard");
  return user;
}
