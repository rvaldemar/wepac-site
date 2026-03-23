import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "artist" | "mentor" | "admin";
  onboarded: boolean;
};

export async function requireAuth(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user) {
    redirect("/artists/alpha/login");
  }
  return session.user as SessionUser;
}

export async function requireRole(
  roles: ("artist" | "mentor" | "admin")[]
): Promise<SessionUser> {
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    redirect("/artists/alpha/dashboard");
  }
  return user;
}
