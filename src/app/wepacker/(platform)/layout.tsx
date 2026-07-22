import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import { PlatformSidebar } from "@/components/wepacker/PlatformSidebar";
import { requirePageUser } from "@/lib/wepacker/page-guards";
import { getSidebarCounts } from "@/lib/wepacker/actions/user";
import { canAccessMentorWorkspace } from "@/lib/wepacker/actions/session";

export const metadata: Metadata = {
  title: {
    default: "WEPACKER | WEPAC",
    template: "%s | WEPACKER",
  },
};

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePageUser();
  const [counts, mentorWorkspaceCapability] = await Promise.all([
    getSidebarCounts(),
    canAccessMentorWorkspace(),
  ]);

  return (
    <SessionProvider>
      <div className="min-h-screen bg-wepac-dark">
        <PlatformSidebar
          unreadMessages={counts.unreadMessages}
          pendingActions={counts.pendingActions}
          pendingMentorships={counts.pendingMentorships}
          unreadNotifications={counts.unreadNotifications}
          canAccessMentorWorkspace={mentorWorkspaceCapability}
        />
        <div className="pt-14 lg:ml-56 lg:pt-0">
          <div className="min-h-screen">{children}</div>
        </div>
      </div>
    </SessionProvider>
  );
}
