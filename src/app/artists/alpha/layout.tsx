import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import { PlatformSidebar } from "@/components/artists/PlatformSidebar";
import { auth } from "@/lib/auth";
import { getSidebarCounts } from "@/lib/actions/sidebar-counts";

export const metadata: Metadata = {
 title: {
  default: "Artista Alpha | WEPAC",
  template: "%s | Artista Alpha",
 },
};

export default async function PlatformLayout({
 children,
}: {
 children: React.ReactNode;
}) {
 const session = await auth();
 const counts = session?.user?.id
  ? await getSidebarCounts(session.user.id)
  : { unreadMessages: 0, pendingTasks: 0 };

 return (
  <SessionProvider>
   <div className="min-h-screen bg-wepac-dark">
    <PlatformSidebar
     unreadMessages={counts.unreadMessages}
     pendingTasks={counts.pendingTasks}
    />
    <div className="pt-14 lg:ml-56 lg:pt-0">
     <div className="min-h-screen">{children}</div>
    </div>
   </div>
  </SessionProvider>
 );
}
