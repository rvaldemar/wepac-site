import { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { FadeIn } from "@/components/FadeIn";
import { prisma } from "@/lib/db";
import { getLocale } from "next-intl/server";
import { getInstitutionalPagesCopy } from "@/i18n/copy/institutional-pages";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const copy = getInstitutionalPagesCopy(await getLocale()).programme;
  return {
    title: copy.metadataTitle,
    description: copy.metadataDescription,
  };
}

export default async function ProgramacaoPage() {
  const locale = await getLocale();
  const copy = getInstitutionalPagesCopy(locale).programme;
  const now = new Date();
  const [events, pastEvents] = await Promise.all([
    prisma.event.findMany({
      where: { status: "published", startsAt: { gte: now } },
      include: { department: true, brand: true },
      orderBy: { startsAt: "asc" },
    }),
    prisma.event.findMany({
      where: { status: "published", startsAt: { lt: now } },
      include: { department: true, brand: true },
      orderBy: { startsAt: "desc" },
      take: 6,
    }),
  ]);

  const renderEvents = (items: typeof events, delayOffset = 0) =>
    items.map((event, i) => {
      const projectName = event.brand?.name || event.department.name;
      const location = event.address
        ? `${event.venue}, ${event.address}`
        : event.venue;
      return (
        <FadeIn key={event.id} delay={(i + delayOffset) * 0.1}>
          <Link
            href={`/bilheteira/${event.slug}`}
            className="group grid grid-cols-1 gap-4 border-b border-wepac-black/10 py-8 transition-opacity hover:opacity-70 md:grid-cols-[120px_1fr_200px] md:items-start"
          >
            <div>
              <p className="font-barlow text-3xl font-bold text-wepac-black">
                {event.startsAt.toLocaleDateString(locale, { day: "numeric" })}
              </p>
              <p className="text-sm uppercase text-wepac-black/60">
                {event.startsAt.toLocaleDateString(locale, {
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-wepac-black/60">
                {projectName}
              </p>
              <h3 className="mt-1 font-barlow text-lg font-bold text-wepac-black">
                {event.title}
              </h3>
              {event.subtitle && (
                <p className="mt-1 text-sm font-medium text-wepac-black/70">
                  {event.subtitle}
                </p>
              )}
              <p className="mt-2 text-sm text-wepac-black/60">
                {event.description}
              </p>
            </div>
            <div className="text-left md:text-right">
              <p className="text-sm font-bold text-wepac-black">
                {event.startsAt.toLocaleTimeString(locale, {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <p className="text-sm text-wepac-black/60">{location}</p>
            </div>
          </Link>
        </FadeIn>
      );
    });

  return (
    <div className="pt-20">
      <section className="bg-wepac-black px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <p className="text-sm font-bold uppercase tracking-widest text-wepac-white/40">
              {copy.eyebrow}
            </p>
            <h1 className="mt-4 font-barlow text-4xl font-bold text-wepac-white md:text-6xl">
              {copy.title}
            </h1>
          </FadeIn>
        </div>
      </section>

      <section className="bg-wepac-gray px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-4xl space-y-0">
          {events.length === 0 && (
            <FadeIn>
              <div className="border-b border-wepac-black/10 py-10">
                <h2 className="font-barlow text-2xl font-bold text-wepac-black">
                  {copy.empty}
                </h2>
                <p className="mt-3 max-w-xl text-wepac-black/70">{copy.emptyBody}</p>
                <Link
                  href="/projetos"
                  className="mt-6 inline-flex bg-wepac-black px-6 py-3 text-sm font-bold text-wepac-white"
                >
                  {copy.emptyCta}
                </Link>
              </div>
            </FadeIn>
          )}
          {renderEvents(events)}
          {pastEvents.length > 0 && (
            <section className="pt-16" aria-labelledby="programme-archive-title">
              <h2
                id="programme-archive-title"
                className="font-barlow text-2xl font-bold text-wepac-black"
              >
                {copy.archive}
              </h2>
              <div className="mt-4">{renderEvents(pastEvents, events.length)}</div>
            </section>
          )}
        </div>
      </section>
    </div>
  );
}
