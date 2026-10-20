import { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { getLegalCopy } from "@/i18n/copy/institutional-legal";
import { LegalPageView } from "@/components/legal/LegalPageView";

export async function generateMetadata(): Promise<Metadata> {
  const { terms } = getLegalCopy(await getLocale());
  return { title: terms.metadataTitle, description: terms.metadataDescription };
}

export default async function TermosPage() {
  const { terms } = getLegalCopy(await getLocale());
  return <LegalPageView page={terms} />;
}
