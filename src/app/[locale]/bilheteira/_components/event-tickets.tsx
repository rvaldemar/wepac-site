"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import ReactMarkdown from "react-markdown";
import { Link } from "@/i18n/navigation";
import { reserveAction } from "@/lib/bilheteira/reserve-action";
import { joinWaitlistAction } from "@/lib/bilheteira/request-actions";
import { getBilheteiraCopy, type BilheteiraCopy } from "@/i18n/copy/institutional-bilheteira";
import type { TierOffer } from "@/lib/bilheteira/offers";
import { formatEuro, formatOfferPrice, stateLabel } from "./offer-format";
import { readUtmRaw, trackPixel, UTM_KEYS } from "./tracking";

type Props = {
  eventSlug: string;
  eventTitle: string;
  offers: TierOffer[];
  locale: string;
  preselectedId?: string;
  waitlistJoinedId?: string;
};

const DEFAULT_SECTION = "";
const noopSubscribe = () => () => {};

export function EventTickets({
  eventSlug,
  eventTitle,
  offers,
  locale,
  preselectedId,
  waitlistJoinedId,
}: Props) {
  // Copy holds formatter functions, which cannot cross the server/client
  // boundary as props; resolve it here from the locale instead.
  const copy = getBilheteiraCopy(locale);
  const purchasable = offers.filter((o) => o.state === "on_sale");
  const initial =
    purchasable.find((o) => o.id === preselectedId) ??
    purchasable.find((o) => o.featured) ??
    purchasable[0];
  const [selectedId, setSelectedId] = useState<string | undefined>(initial?.id);
  const selected = purchasable.find((o) => o.id === selectedId);
  const [units, setUnits] = useState<number>(selected?.minUnits ?? 1);
  const [waitlistOpen, setWaitlistOpen] = useState<string | null>(null);
  // Session attribution lives in sessionStorage; the server render has none.
  const utmRaw = useSyncExternalStore(noopSubscribe, readUtmRaw, () => "{}");
  const utm = useMemo(() => {
    try {
      return JSON.parse(utmRaw) as Record<string, string>;
    } catch {
      return {};
    }
  }, [utmRaw]);

  const sections = useMemo(() => {
    const map = new Map<string, TierOffer[]>();
    for (const o of offers) {
      const key = o.section ?? DEFAULT_SECTION;
      map.set(key, [...(map.get(key) ?? []), o]);
    }
    return [...map.entries()];
  }, [offers]);

  const total = selected ? selected.priceCents * units : 0;
  const seats = selected ? units * selected.seatsPerUnit : 0;

  function choose(offer: TierOffer) {
    setSelectedId(offer.id);
    setUnits(offer.minUnits);
    trackPixel("ViewContent", { content_name: `${eventTitle} — ${offer.name}`, value: offer.startingPriceCents / 100, currency: "EUR" });
    if (window.matchMedia("(max-width: 1023px)").matches) {
      document.getElementById("finalizar")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-14">
      <div className="space-y-12">
        {sections.map(([section, items]) => (
          <div key={section || "default"}>
            {section && (
              <h3 className="mb-5 text-[11px] uppercase tracking-[0.2em] text-[var(--ev-faint)]">{section}</h3>
            )}
            <ul className="space-y-4">
              {items.map((offer) => (
                <TierCard
                  key={offer.id}
                  offer={offer}
                  eventSlug={eventSlug}
                  locale={locale}
                  copy={copy}
                  selected={offer.id === selectedId}
                  onChoose={() => choose(offer)}
                  waitlistOpen={waitlistOpen === offer.id}
                  onToggleWaitlist={() => setWaitlistOpen(waitlistOpen === offer.id ? null : offer.id)}
                  waitlistJoined={waitlistJoinedId === offer.id}
                />
              ))}
            </ul>
          </div>
        ))}
      </div>

      <aside id="finalizar" className="lg:sticky lg:top-6 self-start scroll-mt-6">
        <div className="border border-[var(--ev-ink)] bg-[var(--ev-card)] p-6">
          <h3 className="font-barlow text-[22px] font-black tracking-[-0.01em]">{copy.checkout.title}</h3>
          {!selected ? (
            <p className="mt-4 text-[14px] text-[var(--ev-faint)]">{copy.checkout.chooseTicket}</p>
          ) : (
            <form
              action={reserveAction}
              className="mt-5 space-y-5"
              onSubmit={() =>
                trackPixel("InitiateCheckout", {
                  content_name: `${eventTitle} — ${selected.name}`,
                  value: total / 100,
                  currency: "EUR",
                  num_items: seats,
                })
              }
            >
              <input type="hidden" name="eventSlug" value={eventSlug} />
              <input type="hidden" name="tierId" value={selected.id} />
              <input type="hidden" name="units" value={units} />
              {UTM_KEYS.map((k) => (utm[k] ? <input key={k} type="hidden" name={k} value={utm[k]} /> : null))}

              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--ev-faint)]">{copy.checkout.selected}</div>
                <div className="mt-1 text-[15px] font-semibold leading-snug">{selected.name}</div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--ev-faint)]">
                  {selected.unit === "bundle" ? copy.checkout.quantityBundles : copy.checkout.quantitySeats}
                </span>
                <div className="flex items-center border border-[var(--ev-line)]">
                  <button
                    type="button"
                    aria-label="−"
                    className="h-11 w-11 text-[18px] disabled:opacity-30"
                    disabled={units <= selected.minUnits}
                    onClick={() => setUnits((u) => Math.max(selected.minUnits, u - 1))}
                  >
                    −
                  </button>
                  <output aria-live="polite" className="w-12 text-center text-[16px] font-semibold tabular-nums">
                    {units}
                  </output>
                  <button
                    type="button"
                    aria-label="+"
                    className="h-11 w-11 text-[18px] disabled:opacity-30"
                    disabled={units >= selected.maxUnits}
                    onClick={() => setUnits((u) => Math.min(selected.maxUnits, u + 1))}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex items-baseline justify-between border-t border-[var(--ev-line)] pt-4">
                <span className="text-[13px] text-[var(--ev-faint)]">
                  {copy.checkout.total} · {copy.checkout.seatsTotal(seats)}
                </span>
                <span className="font-barlow text-[26px] font-black tabular-nums">
                  {total === 0 ? copy.tier.free : formatEuro(total, locale)}
                </span>
              </div>

              <Field label={copy.checkout.name} name="buyerName" autoComplete="name" required />
              <Field label={copy.checkout.email} name="buyerEmail" type="email" autoComplete="email" required />
              <Field label={copy.checkout.phone} name="buyerPhone" type="tel" autoComplete="tel" />

              <label className="flex gap-3 text-[13px] leading-snug text-[var(--ev-muted)]">
                <input type="checkbox" name="marketingConsent" className="mt-0.5 h-4 w-4 accent-[var(--ev-accent)]" />
                <span>{copy.checkout.marketing}</span>
              </label>

              <button
                type="submit"
                className="h-[52px] w-full bg-[var(--ev-cta)] text-[12px] font-bold uppercase tracking-[0.2em] text-[var(--ev-cta-ink)] transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ev-ink)]"
              >
                {total === 0 ? copy.checkout.reserveFree : copy.checkout.pay}
              </button>

              <p className="text-[12px] leading-relaxed text-[var(--ev-faint)]">
                {total > 0 && <>{copy.checkout.discountCodes} </>}
                {copy.checkout.privacyLead}{" "}
                <Link href="/privacidade" className="underline">
                  {copy.checkout.privacyLink}
                </Link>
                .
              </p>
            </form>
          )}
        </div>
        <p className="mt-4 text-[12px] leading-relaxed text-[var(--ev-faint)]">
          {copy.event.paymentMethods} {copy.event.vatExempt}
        </p>
      </aside>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--ev-faint)]">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        className="mt-1.5 h-12 w-full border border-[var(--ev-line)] bg-[var(--ev-card)] px-3 text-[15px] outline-none focus:border-[var(--ev-ink)]"
      />
    </label>
  );
}

function TierCard({
  offer,
  eventSlug,
  locale,
  copy,
  selected,
  onChoose,
  waitlistOpen,
  onToggleWaitlist,
  waitlistJoined,
}: {
  offer: TierOffer;
  eventSlug: string;
  locale: string;
  copy: BilheteiraCopy;
  selected: boolean;
  onChoose: () => void;
  waitlistOpen: boolean;
  onToggleWaitlist: () => void;
  waitlistJoined: boolean;
}) {
  const price = formatOfferPrice(offer, copy.tier, locale);
  const unavailable = offer.state === "sold_out" || offer.state === "locked" || offer.state === "closed";
  const isRequest = offer.state === "request";

  return (
    <li
      className={[
        "border bg-[var(--ev-card)] p-5 sm:p-6 transition",
        selected ? "border-[var(--ev-ink)] ring-1 ring-[var(--ev-ink)]" : "border-[var(--ev-line)]",
        unavailable ? "bg-[var(--ev-card-dim)]" : "",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
        <div className="min-w-0">
          {offer.state !== "on_sale" && (
            <span
              className={[
                "mb-2 inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em]",
                offer.state === "sold_out" || offer.state === "closed"
                  ? "bg-[var(--ev-line)] text-[var(--ev-muted)]"
                  : "bg-[var(--ev-cta)] text-[var(--ev-cta-ink)]",
              ].join(" ")}
            >
              {offer.state === "locked" && <LockIcon />}
              {stateLabel(offer.state, copy.tier)}
            </span>
          )}
          <h4
            className={[
              "font-barlow text-[19px] font-bold leading-tight sm:text-[21px]",
              unavailable ? "text-[var(--ev-faint)]" : "",
            ].join(" ")}
          >
            {offer.name}
          </h4>
        </div>
        <div className="text-right">
          <div
            className={[
              "font-barlow text-[22px] font-black tabular-nums leading-none",
              offer.state === "sold_out" ? "text-[var(--ev-faint)] line-through" : "",
              offer.state === "locked" || offer.state === "closed" ? "text-[var(--ev-faint)]" : "",
            ].join(" ")}
          >
            {price.main}
          </div>
          {price.detail && <div className="mt-1 text-[12px] text-[var(--ev-faint)]">{price.detail}</div>}
        </div>
      </div>

      {offer.state === "locked" && offer.lockedNote && (
        <p className="mt-3 text-[13px] text-[var(--ev-faint)]">{offer.lockedNote}</p>
      )}
      {offer.showRemaining && offer.remainingSeats != null && (
        <p className="mt-3 text-[13px] font-semibold text-[var(--ev-ink)]">{copy.tier.remaining(offer.remainingSeats)}</p>
      )}

      {offer.description && (
        <details className="group mt-4" open={selected || isRequest}>
          <summary className="cursor-pointer list-none text-[12px] uppercase tracking-[0.16em] text-[var(--ev-faint)] hover:text-[var(--ev-ink)]">
            <span className="group-open:hidden">+ {copy.tier.details}</span>
            <span className="hidden group-open:inline">− {copy.tier.details}</span>
          </summary>
          <div className="bilheteira-prose mt-3 text-[14px] text-[var(--ev-muted)]">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-3 last:mb-0 leading-[1.65]">{children}</p>,
                ul: ({ children }) => <ul className="mb-3 list-disc pl-5 space-y-1">{children}</ul>,
                strong: ({ children }) => <strong className="font-semibold text-[var(--ev-ink)]">{children}</strong>,
              }}
            >
              {offer.description}
            </ReactMarkdown>
          </div>
        </details>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {offer.state === "on_sale" && (
          <button
            type="button"
            onClick={onChoose}
            aria-pressed={selected}
            className={[
              "h-11 px-6 text-[11px] font-bold uppercase tracking-[0.2em] transition",
              selected ? "bg-[var(--ev-cta)] text-[var(--ev-cta-ink)]" : "border border-[var(--ev-ink)] text-[var(--ev-ink)] hover:bg-[var(--ev-ink)] hover:text-[var(--ev-bg)]",
            ].join(" ")}
          >
            {selected ? copy.tier.chosen : copy.tier.choose}
          </button>
        )}
        {isRequest && offer.ctaHref && (
          <Link
            href={offer.ctaHref}
            className="inline-flex h-11 items-center bg-[var(--ev-cta)] px-6 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--ev-cta-ink)] hover:opacity-90"
          >
            {offer.ctaLabel || copy.request.submit}
          </Link>
        )}
        {(offer.state === "locked" || offer.state === "sold_out") && offer.waitlistEnabled && !waitlistJoined && (
          <button
            type="button"
            onClick={onToggleWaitlist}
            aria-expanded={waitlistOpen}
            className="h-11 border border-[var(--ev-line)] px-5 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--ev-muted)] hover:border-[var(--ev-ink)] hover:text-[var(--ev-ink)]"
          >
            {copy.tier.notifyMe}
          </button>
        )}
        {waitlistJoined && <p className="text-[13px] font-semibold">{copy.event.waitlistJoined}</p>}
      </div>

      {waitlistOpen && !waitlistJoined && (
        <form action={joinWaitlistAction} className="mt-4 flex flex-col gap-3 border-t border-[var(--ev-line)] pt-4 sm:flex-row sm:items-end">
          <input type="hidden" name="eventSlug" value={eventSlug} />
          <input type="hidden" name="tierId" value={offer.id} />
          <input type="text" name="website_confirm" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
          <label className="block flex-1">
            <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--ev-faint)]">{copy.tier.notifyEmail}</span>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              className="mt-1.5 h-11 w-full border border-[var(--ev-line)] px-3 text-[15px] outline-none focus:border-[var(--ev-ink)]"
            />
          </label>
          <button type="submit" className="h-11 bg-[var(--ev-cta)] px-5 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--ev-cta-ink)]">
            {copy.tier.notifySubmit}
          </button>
        </form>
      )}
    </li>
  );
}

function LockIcon() {
  return (
    <svg width="10" height="11" viewBox="0 0 10 11" aria-hidden="true" fill="currentColor">
      <path d="M2 4.5V3a3 3 0 0 1 6 0v1.5h.5A1.5 1.5 0 0 1 10 6v3.5A1.5 1.5 0 0 1 8.5 11h-7A1.5 1.5 0 0 1 0 9.5V6a1.5 1.5 0 0 1 1.5-1.5H2Zm1.5 0h3V3a1.5 1.5 0 0 0-3 0v1.5Z" />
    </svg>
  );
}
