import type { Brand, Department, Event } from "@prisma/client";
import { Link } from "@/i18n/navigation";
import type { BilheteiraCopy } from "@/i18n/copy/institutional-bilheteira";
import { formatEventDate, formatEventTime } from "../ui";
import { formatEuro } from "./offer-format";
import { parseEventTheme } from "@/lib/bilheteira/event-theme";
import { barlowCondensed, CONDENSED } from "./fonts";

export type EventCard = {
  event: Event & { brand: Brand | null; department: Department };
  fromPrice: number | null;
};

export function EventCards({
  cards,
  locale,
  copy,
  large = false,
}: {
  cards: EventCard[];
  locale: string;
  copy: BilheteiraCopy;
  large?: boolean;
}) {
  return (
    <ul className={`grid gap-6 ${large ? "grid-cols-1" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
      {cards.map(({ event, fromPrice }) => {
        // Campaign events keep their identity on the card too.
        const theme = parseEventTheme(event.theme);
        const dark = theme.mode === "dark";
        const condensed = theme.titleStyle === "condensed";
        const title = (theme.heroTitle ?? event.title).replace(/\s*\|\s*/g, " ");
        const match = condensed && theme.accent ? /^(.*?)([?!])$/.exec(title) : null;
        return (
          <li key={event.id}>
            <Link
              href={`/bilheteira/${event.slug}`}
              className={`group block h-full border transition focus-visible:outline focus-visible:outline-2 ${barlowCondensed.variable} ${
                dark
                  ? "border-white/10 bg-[#0A0A0A] text-white hover:border-white/60 focus-visible:outline-white"
                  : "border-black/12 bg-white text-black hover:border-black focus-visible:outline-black"
              } ${large ? "md:grid md:h-[400px] md:grid-cols-[1.3fr_1fr]" : ""}`}
            >
              <div
                className={`overflow-hidden ${dark ? "bg-[#0A0A0A]" : "bg-[#e9e6df]"} ${large ? "aspect-[16/10] md:aspect-auto md:h-full" : "aspect-[16/10]"}`}
              >
                {event.coverImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={event.coverImage}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover object-[center_25%] transition duration-500 group-hover:scale-[1.03]"
                  />
                )}
              </div>
              <div className={large ? "flex flex-col justify-end p-6 md:p-8" : "p-5"}>
                <p className={`text-[10px] uppercase tracking-[0.2em] ${dark ? "text-white/60" : "text-black/55"}`}>
                  {theme.eyebrow ?? event.brand?.name ?? event.department.name}
                </p>
                <h3
                  className={
                    condensed
                      ? `${CONDENSED} mt-2 font-bold uppercase leading-[0.95] ${large ? "text-[44px]" : "text-[32px]"}`
                      : `mt-2 font-barlow font-black leading-[1.08] tracking-[-0.01em] ${large ? "text-[28px]" : "text-[22px]"}`
                  }
                >
                  {match ? (
                    <>
                      {match[1]}
                      <span style={{ color: theme.accent ?? undefined }}>{match[2]}</span>
                    </>
                  ) : (
                    title
                  )}
                </h3>
                {(theme.tagline ?? event.subtitle) && (
                  <p className={`mt-2 line-clamp-2 text-[14px] ${dark ? "text-white/70" : "text-black/65"}`}>
                    {theme.tagline ?? event.subtitle}
                  </p>
                )}
                <div
                  className={`mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-3 text-[13px] ${dark ? "border-white/15" : "border-black/10"}`}
                >
                  <span className="font-semibold">
                    {formatEventDate(event.startsAt, locale)} · {formatEventTime(event.startsAt, locale)}
                  </span>
                  <span className={dark ? "text-white/75" : "text-black/65"}>
                    {fromPrice == null
                      ? copy.index.seeEvent
                      : fromPrice === 0
                        ? copy.tier.free
                        : copy.tier.fromPrice(formatEuro(fromPrice, locale))}
                  </span>
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
