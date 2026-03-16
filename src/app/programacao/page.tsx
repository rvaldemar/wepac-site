import { Metadata } from "next";
import { FadeIn } from "@/components/FadeIn";
import { events } from "@/data/events";

export const metadata: Metadata = {
  title: "Programação",
  description: "Agenda de eventos, concertos e atividades da WEPAC.",
};

export default function ProgramacaoPage() {
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
          {events.map((event, i) => (
            <FadeIn key={event.id} delay={i * 0.1}>
              <div className="grid grid-cols-1 gap-4 border-b border-wepac-black/10 py-8 md:grid-cols-[120px_1fr_200px] md:items-start">
                <div>
                  <p className="font-barlow text-3xl font-bold text-wepac-black">
                    {new Date(event.date).toLocaleDateString("pt-PT", {
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-sm uppercase text-wepac-black/50">
                    {new Date(event.date).toLocaleDateString("pt-PT", {
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-wepac-black/40">
                    {event.project}
                  </p>
                  <h3 className="mt-1 font-barlow text-lg font-bold text-wepac-black">
                    {event.title}
                  </h3>
                  <p className="mt-2 text-sm text-wepac-black/60">
                    {event.description}
                  </p>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-sm font-bold text-wepac-black">
                    {event.time}
                  </p>
                  <p className="text-sm text-wepac-black/50">{event.location}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>
    </div>
  );
}
