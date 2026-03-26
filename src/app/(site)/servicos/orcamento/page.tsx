import { Metadata } from "next";
import { FadeIn } from "@/components/FadeIn";
import { OrcamentoTabs } from "@/components/wessex/OrcamentoTabs";

export const metadata: Metadata = {
  title: "Orcamento | Servicos Wessex",
  description:
    "Simulador de orcamento para servicos musicais Wessex da WEPAC.",
};

export default function OrcamentoPage() {
  return (
    <div className="pt-20">
      <section className="bg-wepac-black px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <p className="text-sm font-bold uppercase tracking-widest text-wepac-white/40">
              Servicos &middot; Wessex
            </p>
            <h1 className="mt-4 font-barlow text-4xl font-bold text-wepac-white md:text-6xl">
              Simule o seu orcamento
            </h1>
            <p className="mt-6 text-lg text-wepac-white/60">
              Calcule o investimento para a musica do seu evento ou fale com o
              nosso assistente.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="bg-wepac-dark px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-4xl">
          <OrcamentoTabs />
        </div>
      </section>
    </div>
  );
}
