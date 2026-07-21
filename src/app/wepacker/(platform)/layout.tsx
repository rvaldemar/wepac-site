import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import { PlatformSidebar } from "@/components/wepacker/PlatformSidebar";
import { getSessionUser } from "@/lib/wepacker/guards";
import { getSidebarCounts } from "@/lib/wepacker/actions/user";

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
  const user = await getSessionUser();
  const counts = user
    ? await getSidebarCounts()
    : { unreadMessages: 0, pendingTasks: 0, pendingMentorships: 0 };

  return (
    <SessionProvider>
      <div className="min-h-screen bg-wepac-dark">
        <PlatformSidebar
          unreadMessages={counts.unreadMessages}
          pendingTasks={counts.pendingTasks}
          pendingMentorships={counts.pendingMentorships}
        />
        <div className="pt-14 lg:ml-56 lg:pt-0">
          <div className="min-h-screen">{children}</div>
        </div>
      </div>
    </SessionProvider>
  );
}
