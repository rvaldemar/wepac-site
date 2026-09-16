import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { authApiBasePath } from "@/lib/deployment-path";

export const metadata: Metadata = {
  title: {
    default: "Onboarding | WEPACKER",
    template: "%s | WEPACKER",
  },
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider basePath={authApiBasePath}>
      <LocaleSwitcher className="fixed right-5 top-5 z-[60]" />
      {children}
    </SessionProvider>
  );
}
