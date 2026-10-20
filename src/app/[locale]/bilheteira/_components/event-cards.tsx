import type { Brand, Department, Event } from "@prisma/client";
import { Link } from "@/i18n/navigation";
import type { BilheteiraCopy } from "@/i18n/copy/institutional-bilheteira";
import { formatEventDate, formatEventTime } from "../ui";
import { formatEuro } from "./offer-format";

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
    <ul className={`grid gap-6 ${large ? "md:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
      {cards.map(({ event, fromPrice }) => (
        <li key={event.id}>
          <Link
            href={`/bilheteira/${event.slug}`}
            className="group block h-full border border-black/12 bg-white transition hover:border-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-black"
          >
            <div className="aspect-[16/10] overflow-hidden bg-[#e9e6df]">
              {event.coverImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={event.coverImage}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                />
              )}
            </div>
            <div className="p-5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-black/55">
                {event.brand?.name || event.department.name}
              </p>
              <h3
                className={`mt-2 font-barlow font-black leading-[1.08] tracking-[-0.01em] ${large ? "text-[28px]" : "text-[22px]"}`}
              >
                {event.title}
              </h3>
              {event.subtitle && <p className="mt-2 line-clamp-2 text-[14px] text-black/65">{event.subtitle}</p>}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-black/10 pt-3 text-[13px]">
                <span className="font-semibold">
                  {formatEventDate(event.startsAt, locale)} · {formatEventTime(event.startsAt, locale)}
                </span>
                <span className="text-black/65">
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
      ))}
    </ul>
  );
}
