import { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { getLegalCopy } from "@/i18n/copy/institutional-legal";
import { LegalPageView } from "@/components/legal/LegalPageView";
import { CookiePreferencesButton } from "@/components/legal/CookiePreferencesButton";

export async function generateMetadata(): Promise<Metadata> {
  const { cookies } = getLegalCopy(await getLocale());
  return { title: cookies.metadataTitle, description: cookies.metadataDescription };
}

export default async function CookiesPage() {
  const { cookies } = getLegalCopy(await getLocale());
  return (
    <LegalPageView page={cookies}>
      <CookiePreferencesButton label={cookies.manage} done={cookies.manageDone} />
    </LegalPageView>
  );
}
