import type { Metadata } from "next";
import { getLocale } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const isEnglish = (await getLocale()) === "en-US";
  return {
    title: { absolute: isEnglish ? "Sign in | WEPACKER" : "Entrar | WEPACKER" },
    description: isEnglish
      ? "Sign in to your WEPACKER personal area."
      : "Entre na sua área pessoal WEPACKER.",
  };
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
