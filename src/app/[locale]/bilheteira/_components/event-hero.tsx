import type { EventTheme } from "@/lib/bilheteira/event-theme";
import { CONDENSED } from "./fonts";

type Fact = { label: string; value: string };

type Props = {
  theme: EventTheme;
  title: string;
  subtitle: string | null;
  brandName: string;
  coverImage: string | null;
  facts: Fact[];
  dateLine: string;
  placeLine: string;
  primary: { href: string; label: string; price: string } | null;
  seeTicketsLabel: string;
};

// «|» in the hero title forces a line break (campaign line breaks); a
// trailing «?» or «!» takes the accent, as in the campaign artwork.
function AccentTitle({ text, accent }: { text: string; accent: string | null }) {
  const lines = text.split("|").map((l) => l.trim()).filter(Boolean);
  return (
    <>
      {lines.map((line, i) => {
        const last = i === lines.length - 1;
        const match = last && accent ? /^(.*?)([?!])$/.exec(line) : null;
        return (
          <span key={i} className="block">
            {match ? (
              <>
                {match[1]}
                <span style={{ color: accent ?? undefined }}>{match[2]}</span>
              </>
            ) : (
              line
            )}
          </span>
        );
      })}
    </>
  );
}

export function EventHero(props: Props) {
  const { theme } = props;
  if (theme.titleStyle === "condensed" || theme.schedule.length > 0) return <CampaignHero {...props} />;
  return <DefaultHero {...props} />;
}

function CampaignHero({ theme, title, subtitle, brandName, facts, dateLine, placeLine, primary, seeTicketsLabel }: Props) {
  const heading = theme.heroTitle ?? title;
  return (
    <section className="relative isolate overflow-hidden bg-[var(--ev-bg)] text-[var(--ev-ink)]">
      {theme.heroImage && (
        <div className="absolute inset-y-0 right-0 -z-10 w-full sm:w-[62%] lg:left-[38%] lg:right-[22%] lg:w-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={theme.heroImage}
            alt=""
            className="h-full w-full object-cover object-[center_20%] opacity-55 sm:opacity-80"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--ev-bg)_0%,transparent_35%,transparent_65%,var(--ev-bg)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(0deg,var(--ev-bg)_0%,transparent_40%)]" />
        </div>
      )}
      <div className="mx-auto grid max-w-[1200px] gap-10 px-5 pb-12 pt-16 sm:px-8 sm:pb-16 sm:pt-24 lg:grid-cols-[1fr_420px] lg:items-end lg:pt-28">
        <div>
          <h1
            className={`${CONDENSED} text-[64px] font-bold uppercase leading-[0.9] tracking-[-0.01em] sm:text-[104px] lg:text-[128px]`}
          >
            <AccentTitle text={heading} accent={theme.accent} />
          </h1>
          <p className="mt-10 text-[13px] font-semibold uppercase tracking-[0.32em]">
            {theme.eyebrow ?? brandName}
          </p>
          {(theme.tagline ?? subtitle) && (
            <p className="mt-2 max-w-[460px] text-[17px] leading-snug text-[var(--ev-muted)]">
              {theme.tagline ?? subtitle}
            </p>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            {primary && (
              <a
                href={primary.href}
                className="inline-flex min-h-[52px] items-center gap-3 bg-[var(--ev-cta)] px-7 py-3 text-[12px] font-bold uppercase tracking-[0.2em] text-[var(--ev-cta-ink)] hover:opacity-90"
              >
                {primary.label}
                <span className={`${CONDENSED} text-[20px] font-bold normal-case tracking-normal`}>{primary.price}</span>
              </a>
            )}
            <a
              href="#bilhetes"
              className="inline-flex min-h-[52px] items-center border border-[var(--ev-ink)] px-7 text-[12px] font-bold uppercase tracking-[0.2em] hover:bg-[var(--ev-ink)] hover:text-[var(--ev-bg)]"
            >
              {seeTicketsLabel}
            </a>
          </div>
        </div>

        <div>
          {theme.schedule.length > 0 ? (
            <dl className="border-b border-[var(--ev-line)]">
              {theme.schedule.map((row, i) => (
                <div
                  key={`${i}-${row.label}`}
                  className={`grid grid-cols-[150px_1fr] gap-4 py-3 sm:grid-cols-[175px_1fr] ${row.time ? "border-t border-[var(--ev-line)]" : "-mt-1 pt-0"}`}
                >
                  <dt
                    className={`${CONDENSED} whitespace-nowrap font-bold leading-none ${
                      // Longer formats (e.g. «10am–6:30pm») step down so the
                      // column never runs into the label.
                      row.time.length > 9 ? "text-[26px] sm:text-[32px]" : "text-[34px] sm:text-[42px]"
                    }`}
                  >
                    {row.time || <span className="sr-only">{theme.schedule[i - 1]?.time}</span>}
                  </dt>
                  <dd className="self-center">
                    <div className="font-barlow text-[18px] font-bold leading-tight">{row.label}</div>
                    {row.highlight && (
                      <div className="font-barlow text-[18px] font-bold leading-tight" style={{ color: "var(--ev-accent)" }}>
                        {row.highlight}
                      </div>
                    )}
                    {row.detail && <div className="mt-0.5 text-[14px] text-[var(--ev-muted)]">{row.detail}</div>}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <dl className="grid gap-3">
              {facts.map((f) => (
                <div key={f.label} className="border-t border-[var(--ev-line)] pt-3">
                  <dt className="text-[10px] uppercase tracking-[0.2em] text-[var(--ev-faint)]">{f.label}</dt>
                  <dd className="mt-1 text-[15px] font-semibold">{f.value}</dd>
                </div>
              ))}
            </dl>
          )}
          <div className="mt-4">
            <div className={`${CONDENSED} text-[30px] font-bold leading-tight sm:text-[34px]`}>{dateLine}</div>
            <div className="text-[15px] font-medium">{placeLine}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DefaultHero({ title, subtitle, brandName, coverImage, facts, primary, seeTicketsLabel }: Props) {
  const dark = Boolean(coverImage);
  return (
    <section className={dark ? "relative isolate overflow-hidden bg-black text-white" : "bg-[#f0ede6] text-black"}>
      {dark && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverImage as string} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-60" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black via-black/60 to-black/20" />
        </>
      )}
      <div className="mx-auto max-w-[1200px] px-5 pb-12 pt-20 sm:px-8 sm:pb-16 sm:pt-28 lg:pt-36">
        <p className={`text-[11px] uppercase tracking-[0.22em] ${dark ? "text-white/75" : "text-black/55"}`}>{brandName}</p>
        <h1 className="mt-3 max-w-[900px] font-barlow text-[40px] font-black leading-[1.02] tracking-[-0.02em] sm:text-[64px] lg:text-[80px]">
          {title}
        </h1>
        {subtitle && (
          <p className={`mt-4 max-w-[720px] text-[18px] leading-snug sm:text-[21px] ${dark ? "text-white/85" : "text-black/70"}`}>
            {subtitle}
          </p>
        )}
        <dl className="mt-8 grid max-w-[900px] gap-4 sm:grid-cols-3">
          {facts.map((f) => (
            <div key={f.label} className={`border-t pt-3 ${dark ? "border-white/30" : "border-black/15"}`}>
              <dt className={`text-[10px] uppercase tracking-[0.2em] ${dark ? "text-white/65" : "text-black/50"}`}>{f.label}</dt>
              <dd className="mt-1 text-[15px] font-semibold leading-snug">{f.value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-9 flex flex-wrap gap-3">
          {primary && (
            <a
              href={primary.href}
              className={`inline-flex min-h-[52px] items-center gap-3 px-7 py-3 text-[12px] font-bold uppercase tracking-[0.2em] ${dark ? "bg-white text-black hover:bg-white/90" : "bg-black text-white hover:bg-black/85"}`}
            >
              {primary.label}
              <span className="font-barlow text-[16px] normal-case tracking-normal">{primary.price}</span>
            </a>
          )}
          <a
            href="#bilhetes"
            className={`inline-flex min-h-[52px] items-center border px-7 text-[12px] font-bold uppercase tracking-[0.2em] ${dark ? "border-white/70 text-white hover:bg-white/10" : "border-black text-black hover:bg-black hover:text-white"}`}
          >
            {seeTicketsLabel}
          </a>
        </div>
      </div>
    </section>
  );
}
