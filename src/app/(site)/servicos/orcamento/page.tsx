import { Metadata } from "next";
import { FadeIn } from "@/components/FadeIn";
import { OrcamentoTabs } from "@/components/wessex/OrcamentoTabs";

export const metadata: Metadata = {
  title: "Orçamento | Serviços Wessex",
  description:
    "Simulador de orçamento para serviços musicais Wessex da WEPAC.",
};

export default function OrcamentoPage() {
  return (
    <div className="pt-20">
      <section className="bg-wepac-black px-6 py-12 md:py-16 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <p className="text-sm font-bold uppercase tracking-widest text-wepac-white/40">
              Serviços &middot; Wessex
            </p>
            <h1 className="mt-3 font-barlow text-3xl font-bold text-wepac-white md:text-5xl">
              Orçamento
            </h1>
            <p className="mt-3 text-base text-wepac-white/60">
              Simule o investimento ou fale com o nosso assistente.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="bg-wepac-dark px-6 py-8 md:py-12 lg:px-8 pb-16 md:pb-24">
        <div className="mx-auto max-w-4xl">
          <OrcamentoTabs />
        </div>
      </section>
    </div>
  );
}
