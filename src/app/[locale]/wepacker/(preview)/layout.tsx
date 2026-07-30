import type { Metadata } from "next";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";

export const metadata: Metadata = {
  title: {
    default: "Preview | WEPACKER",
    template: "%s | WEPACKER Preview",
  },
  robots: { index: false, follow: false, noarchive: true },
};

export default function PreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-wepac-dark">
      <LocaleSwitcher className="fixed right-5 top-5 z-[60]" />
      {children}
    </div>
  );
}
