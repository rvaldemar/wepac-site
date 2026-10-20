import type { BilheteiraCopy } from "@/i18n/copy/institutional-bilheteira";
import type { TierOffer } from "@/lib/bilheteira/offers";

export function formatEuro(cents: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export type OfferPrice = { main: string; detail: string | null };

// One price line per tier kind:
// single «25 €» · bundle «15 €» + «2 lugares» · group «a partir de 150 €»
// · phase «35 €» + «−53 % face a 75 €» · request «Gratuito» + «sujeito a validação».
export function formatOfferPrice(
  offer: TierOffer,
  copy: BilheteiraCopy["tier"],
  locale: string,
): OfferPrice {
  if (offer.kind === "request") {
    return {
      main: offer.priceCents === 0 ? copy.free : formatEuro(offer.priceCents, locale),
      detail: copy.subjectToValidation,
    };
  }
  if (offer.priceCents === 0) return { main: copy.free, detail: null };
  if (offer.kind === "group" || offer.hideUnitPrice) {
    return {
      main: copy.fromPrice(formatEuro(offer.startingPriceCents, locale)),
      detail: offer.minUnits > 1 ? copy.minSeats(offer.minUnits) : null,
    };
  }
  if (offer.kind === "bundle") {
    return { main: formatEuro(offer.priceCents, locale), detail: copy.seatsBundle(offer.seatsPerUnit) };
  }
  if (offer.discountPct && offer.referencePriceCents) {
    return {
      main: formatEuro(offer.priceCents, locale),
      detail: copy.discount(offer.discountPct, formatEuro(offer.referencePriceCents, locale)),
    };
  }
  return { main: formatEuro(offer.priceCents, locale), detail: null };
}

export function stateLabel(state: TierOffer["state"], copy: BilheteiraCopy["tier"]): string {
  switch (state) {
    case "sold_out":
      return copy.soldOut;
    case "locked":
      return copy.comingSoon;
    case "closed":
      return copy.closed;
    case "request":
      return copy.request;
    default:
      return copy.onSale;
  }
}
