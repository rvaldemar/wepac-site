import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import { PlatformSidebar } from "@/components/artists/PlatformSidebar";

export const metadata: Metadata = {
  title: {
    default: "Artista Alpha | WEPAC",
    template: "%s | Artista Alpha",
  },
};

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-wepac-dark">
        <PlatformSidebar />
        <div className="pt-14 lg:ml-56 lg:pt-0">
          <div className="min-h-screen">{children}</div>
        </div>
      </div>
    </SessionProvider>
  );
}
