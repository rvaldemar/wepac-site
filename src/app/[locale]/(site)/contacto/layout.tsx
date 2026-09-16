import type { Metadata } from "next";
import { getLocale } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const isEnglish = (await getLocale()) === "en-US";
  return {
    title: { absolute: isEnglish ? "Contact | WEPAC" : "Contacto | WEPAC" },
    description: isEnglish
      ? "Contact WEPAC about cultural projects, partnerships and music services."
      : "Contacte a WEPAC sobre projetos culturais, parcerias e serviços musicais.",
  };
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
