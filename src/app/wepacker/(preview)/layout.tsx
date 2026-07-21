import type { Metadata } from "next";

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
  return <div className="min-h-screen bg-wepac-dark">{children}</div>;
}
