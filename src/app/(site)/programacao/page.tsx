import { Metadata } from "next";
import Link from "next/link";
import { FadeIn } from "@/components/FadeIn";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Programação",
  description: "Agenda de eventos, concertos e atividades da WEPAC.",
};

export default async function ProgramacaoPage() {
  const now = new Date();
  const events = await prisma.event.findMany({
    where: { status: "published", startsAt: { gte: now } },
    include: { department: true, brand: true },
    orderBy: { startsAt: "asc" },
  });

  return (
    <div className="pt-20">
      <section className="bg-wepac-black px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <p className="text-sm font-bold uppercase tracking-widest text-wepac-white/40">
              Programação
            </p>
            <h1 className="mt-4 font-barlow text-4xl font-bold text-wepac-white md:text-6xl">
              Agenda
            </h1>
          </FadeIn>
        </div>
      </section>

      <section className="bg-wepac-gray px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-4xl space-y-0">
          {events.length === 0 && (
            <FadeIn>
              <p className="py-8 text-wepac-black/60">
                Sem eventos publicados de momento. Volta em breve.
              </p>
            </FadeIn>
          )}
          {events.map((event, i) => {
            const projectName = event.brand?.name || event.department.name;
            const location = event.address
              ? `${event.venue}, ${event.address}`
              : event.venue;
            return (
              <FadeIn key={event.id} delay={i * 0.1}>
                <Link
                  href={`/bilheteira/${event.slug}`}
                  className="group grid grid-cols-1 gap-4 border-b border-wepac-black/10 py-8 transition-opacity hover:opacity-70 md:grid-cols-[120px_1fr_200px] md:items-start"
                >
                  <div>
                    <p className="font-barlow text-3xl font-bold text-wepac-black">
                      {event.startsAt.toLocaleDateString("pt-PT", {
                        day: "numeric",
                      })}
                    </p>
                    <p className="text-sm uppercase text-wepac-black/50">
                      {event.startsAt.toLocaleDateString("pt-PT", {
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-wepac-black/40">
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
                      {event.startsAt.toLocaleTimeString("pt-PT", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="text-sm text-wepac-black/50">{location}</p>
                  </div>
                </Link>
              </FadeIn>
            );
          })}
        </div>
      </section>
    </div>
  );
}
