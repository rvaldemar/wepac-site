import type { Metadata } from "next";
import { getLocale } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const isEnglish = (await getLocale()) === "en-US";
  return {
    title: {
      absolute: isEnglish
        ? "Reset password | WEPACKER"
        : "Recuperar palavra-passe | WEPACKER",
    },
    description: isEnglish
      ? "Request or complete a WEPACKER password reset."
      : "Peça ou conclua a recuperação da palavra-passe WEPACKER.",
  };
}

export default function PasswordResetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
