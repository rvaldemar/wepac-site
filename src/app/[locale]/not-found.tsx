import { getLocale } from "next-intl/server";
import { BrandedStatusPage, statusPrimaryAction, statusSecondaryAction } from "@/components/BrandedStatusPage";
import { getErrorCopy } from "@/i18n/copy/errors";
import { Link } from "@/i18n/navigation";

export default async function LocaleNotFound() {
  const locale = await getLocale();
  const copy = getErrorCopy(locale).notFound;

  return (
    <BrandedStatusPage
      eyebrow={copy.eyebrow}
      title={copy.title}
      body={copy.body}
      homeHref={locale === "en-US" ? "/en" : "/"}
    >
      <Link href="/" style={statusPrimaryAction}>
        {copy.home}
      </Link>
      <Link href="/programacao" style={statusSecondaryAction}>
        {copy.programme}
      </Link>
    </BrandedStatusPage>
  );
}
