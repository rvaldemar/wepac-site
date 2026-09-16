import { getLocale } from "next-intl/server";
import { BrandedStatusPage, statusPrimaryAction, statusSecondaryAction } from "@/components/BrandedStatusPage";
import { getErrorCopy } from "@/i18n/copy/errors";
import { Link } from "@/i18n/navigation";

export default async function TicketNotFound() {
  const locale = await getLocale();
  const copy = getErrorCopy(locale).ticketNotFound;

  return (
    <BrandedStatusPage
      eyebrow={copy.eyebrow}
      title={copy.title}
      body={copy.body}
      homeHref={locale === "en-US" ? "/en" : "/"}
    >
      <Link href="/bilheteira" style={statusPrimaryAction}>
        {copy.ticketOffice}
      </Link>
      <Link href="/" style={statusSecondaryAction}>
        {copy.home}
      </Link>
    </BrandedStatusPage>
  );
}
