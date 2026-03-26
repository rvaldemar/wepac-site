import type { Metadata } from "next";
import { Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
import { FadeIn } from "@/components/FadeIn";
import { StaticRadar } from "@/components/artists/StaticRadar";
import { BetaSignupForm } from "@/components/artists/BetaSignupForm";

export const metadata: Metadata = {
  title: "Artistas WEPAC",
  description:
    "O sistema integrado de desenvolvimento artístico da WEPAC — Companhia de Artes. Excelência artística. Estrutura humana. Impacto real.",
};

const AREAS = [
  { name: "Físico", desc: "O corpo como instrumento de trabalho e presença" },
  { name: "Afetivo", desc: "Vida emocional e capacidade expressiva" },
  { name: "Caráter", desc: "Disciplina, ética e consistência profissional" },
  { name: "Espiritual", desc: "Profundidade, propósito e sentido" },
  { name: "Intelectual", desc: "Pensamento, estratégia e visão de mercado" },
  { name: "Social", desc: "Relação, rede, comunicação e comunidade" },
];

const PRINCIPIOS = [
  "Verdade",
  "Liberdade com responsabilidade",
  "Estrutura",
  "Vínculo",
  "Presença",
  "Caráter",
];

const VALORES = [
  "Educação",
  "Acessibilidade",
  "Inspiração",
  "Comunidade",
  "Sofisticação",
  "Proximidade",
];

const NIVEIS = [
  {
    name: "Semente",
    nameEn: "Seed",
    desc: "Base, estrutura, clarificação. O artista encontra direcção.",
  },
  {
    name: "Crescimento",
    nameEn: "Growth",
    desc: "Consistência, posicionamento, primeiras ativações. O artista ganha forma.",
  },
  {
    name: "Assinatura",
    nameEn: "Signature",
    desc: "Posicionamento premium, marca artística sólida. O artista impõe-se.",
  },
  {
    name: "Parceiro",
    nameEn: "Partner",
    desc: "Colaboração estratégica, liderança, influência. O artista lidera.",
  },
];

const EQUIPA_PERFIS = [
  "Psicólogos",
  "Psiquiatras",
  "Pedagogos",
  "Professores",
  "Músicos profissionais",
  "Gestores de carreira",
  "Administradores",
  "Gestores de tráfego pago",
  "Gestores de redes sociais",
  "Produtores de conteúdo",
  "Técnicos de som e luz",
  "Edição de som",
  "Edição de vídeo e imagem",
];

const PLATFORM_FEATURES = [
  {
    title: "Mapa de Desenvolvimento",
    desc: "Diagnóstico visual em 6 áreas: físico, afetivo, caráter, espiritual, intelectual e social. Compara a tua evolução ao longo do tempo.",
    hasRadar: true,
  },
  {
    title: "Plano de Projeto de Vida",
    desc: "Quem sou. Onde estou. Para onde vou. Porquê. O que me comprometo a fazer. Cinco reflexões que definem a tua direcção.",
    hasRadar: false,
  },
  {
    title: "Plano Estratégico",
    desc: "Visão a longo prazo, objetivos anuais, metas trimestrais e ações mensais. Estratégia com estrutura.",
    hasRadar: false,
  },
  {
    title: "Sessões com Mentor",
    desc: "Sessões individuais e de grupo com o teu mentor. Notas, pontos de discussão e acompanhamento contínuo.",
    hasRadar: false,
  },
  {
    title: "Tarefas e Ações",
    desc: "Tarefas do plano, da sessão, do mentor ou tuas. Tudo num sítio, com prazos e progresso.",
    hasRadar: false,
  },
  {
    title: "Mensagens",
    desc: "Comunicação directa com o teu mentor e equipa. Sem ruído, sem distrações.",
    hasRadar: false,
  },
];

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className="mt-0.5 flex-shrink-0"
      aria-hidden="true"
    >
      <path
        d="M3 8.5L6.5 12L13 4"
        stroke="#DEE0DB"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className="mt-0.5 flex-shrink-0"
      aria-hidden="true"
    >
      <path
        d="M4 4L12 12M12 4L4 12"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ArtistPage() {
  return (
    <div className="relative bg-black">

      {/* 1. HERO */}
      <section className="relative flex min-h-screen items-center justify-center px-6">
        <div className="absolute inset-0 overflow-hidden">
          <div className="pointer-events-none absolute left-0 top-0 hidden h-full w-[40vw] lg:block" aria-hidden="true">
            <Image
              src="/images/artist-bg.jpg"
              alt=""
              fill
              className="object-cover object-[30%_center] mix-blend-screen brightness-[2]"
              quality={75}
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent from-30% to-black" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black" />
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.02]">
            <span className="whitespace-nowrap font-barlow text-[18vw] font-bold">
              ARTISTAS
            </span>
          </div>
        </div>
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <FadeIn>
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-wepac-gray">
              Programa Artistas
            </p>
          </FadeIn>
          <FadeIn delay={0.15}>
            <h1 className="mt-6 font-barlow text-4xl font-bold leading-tight text-white sm:text-5xl md:text-7xl lg:text-[96px]">
              Excelência artística.
              <br />
              Estrutura humana.
              <br />
              Impacto real.
            </h1>
          </FadeIn>
          <FadeIn delay={0.3}>
            <p className="mt-8 text-lg text-white/80 md:text-xl">
              O sistema integrado de desenvolvimento artístico da WEPAC —
              Companhia de Artes.
            </p>
          </FadeIn>
          <FadeIn delay={0.45}>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-6">
              <a
                href="#plataforma"
                className="border border-wepac-gray/30 bg-white px-8 py-3 text-sm font-bold text-black transition-colors hover:bg-wepac-gray"
              >
                Ver como funciona
              </a>
              <a
                href="#candidatura"
                className="border border-white/30 px-8 py-3 text-sm font-bold text-white transition-colors hover:border-white"
              >
                Candidatar-me
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* 2. O QUE É */}
      <section className="relative z-10 px-6 py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-wepac-gray">
              O Programa
            </p>
            <h2 className="mt-3 font-barlow text-3xl font-bold text-white md:text-5xl">
              O que é o programa Artistas WEPAC
            </h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="mt-8 text-lg leading-relaxed text-white/80">
              Não é escola. Não é agência. Não é mentoria. É um sistema
              integrado de desenvolvimento, ativação e consolidação de artistas.
              Trabalhamos o artista como pessoa, profissional e marca — com
              método, estrutura e direcção.
            </p>
          </FadeIn>
          <FadeIn delay={0.2}>
            <blockquote className="mt-10 border-l-2 border-wepac-gray pl-6">
              <p className="text-2xl font-bold italic text-white md:text-3xl">
                Ajudamos artistas a tornarem-se artisticamente excelentes,
                humanamente estruturados e profissionalmente sustentáveis.
              </p>
            </blockquote>
          </FadeIn>
        </div>
      </section>

      {/* 3. A PLATAFORMA */}
      <section id="plataforma" className="relative z-10 scroll-mt-24 bg-[rgba(255,255,255,0.02)] px-6 py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <FadeIn>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-wepac-gray">
              Plataforma
            </p>
            <h2 className="mt-3 font-barlow text-3xl font-bold text-white md:text-5xl">
              A tua plataforma de desenvolvimento
            </h2>
            <p className="mt-4 text-lg text-white/60">
              Tudo o que precisas, num único lugar.
            </p>
          </FadeIn>

          <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Card 1: Mapa — full width */}
            <FadeIn className="lg:col-span-2">
              <div className="border border-wepac-gray/30 bg-black p-6 transition-colors hover:border-white">
                <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
                  <div>
                    <h3 className="font-barlow text-xl font-bold text-white">
                      {PLATFORM_FEATURES[0].title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-white/60">
                      {PLATFORM_FEATURES[0].desc}
                    </p>
                  </div>
                  <div className="flex justify-center">
                    <div className="w-full max-w-xs">
                      <StaticRadar className="w-full" />
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>

            {/* Cards 2-6 */}
            {PLATFORM_FEATURES.slice(1).map((feature, i) => (
              <FadeIn key={feature.title} delay={(i + 1) * 0.08} className="flex">
                <div className="flex flex-1 flex-col border border-wepac-gray/30 bg-black p-6 transition-colors hover:border-white">
                  <h3 className="font-barlow text-xl font-bold text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/60">
                    {feature.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* 4. METODOLOGIA */}
      <section className="relative z-10 px-6 py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <FadeIn>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-wepac-gray">
              Método
            </p>
            <h2 className="mt-3 font-barlow text-3xl font-bold text-white md:text-5xl">
              A nossa Metodologia
            </h2>
          </FadeIn>

          <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-2">
            {/* Left: 3 layers */}
            <div className="space-y-10">
              <FadeIn>
                <div className="border border-wepac-gray/30 bg-black p-6">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-wepac-gray">
                    Camada 1
                  </p>
                  <h3 className="mt-2 font-barlow text-2xl font-bold text-white">
                    Áreas do Saber
                  </h3>
                  <p className="mt-1 text-sm text-white/50">
                    Onde trabalhamos
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {AREAS.map((area) => (
                      <span
                        key={area.name}
                        className="border border-wepac-gray/20 bg-black px-3 py-1.5 text-sm text-wepac-gray"
                      >
                        {area.name}
                      </span>
                    ))}
                  </div>
                </div>
              </FadeIn>

              <FadeIn delay={0.1}>
                <div className="border border-wepac-gray/30 bg-black p-6">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-wepac-gray">
                    Camada 2
                  </p>
                  <h3 className="mt-2 font-barlow text-2xl font-bold text-white">
                    Princípios
                  </h3>
                  <p className="mt-1 text-sm text-white/50">
                    Como trabalhamos
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {PRINCIPIOS.map((p) => (
                      <span
                        key={p}
                        className="border border-wepac-gray/20 bg-black px-3 py-1.5 text-sm text-wepac-gray"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </FadeIn>

              <FadeIn delay={0.2}>
                <div className="border border-wepac-gray/30 bg-black p-6">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-wepac-gray">
                    Camada 3
                  </p>
                  <h3 className="mt-2 font-barlow text-2xl font-bold text-white">
                    Valores
                  </h3>
                  <p className="mt-1 text-sm text-white/50">
                    Para quê trabalhamos
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {VALORES.map((v) => (
                      <span
                        key={v}
                        className="border border-wepac-gray/20 bg-black px-3 py-1.5 text-sm text-wepac-gray"
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              </FadeIn>
            </div>

            {/* Right: Radar chart */}
            <FadeIn delay={0.15}>
              <div className="flex items-center justify-center">
                <div className="w-full max-w-sm">
                  <StaticRadar className="w-full" />
                  <p className="mt-4 text-center text-xs text-white/50">
                    Mapa de Desenvolvimento — 6 Áreas do Saber
                  </p>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* 5. O QUE RECEBES */}
      <section className="relative z-10 bg-[rgba(255,255,255,0.02)] px-6 py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <FadeIn>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-wepac-gray">
              Serviços
            </p>
            <h2 className="mt-3 font-barlow text-3xl font-bold text-white md:text-5xl">
              O que o artista recebe
            </h2>
          </FadeIn>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2">
            <FadeIn className="flex">
              <div className="flex flex-1 flex-col border border-wepac-gray/30 bg-black p-6 transition-colors hover:border-white">
                <h3 className="font-barlow text-xl font-bold text-white">
                  Desenvolvimento humano e artístico
                </h3>
                <ul className="mt-4 space-y-2 text-sm text-wepac-gray">
                  <li>Acompanhamento psicológico e emocional</li>
                  <li>Mentoria artística e de carreira</li>
                  <li>Formação contínua</li>
                  <li>Plano de Projeto de Vida (PPV)</li>
                  <li>Plano Estratégico de Carreira</li>
                </ul>
                <p className="mt-4 text-xs text-white/40">
                  Na plataforma: Diagnóstico, PPV e acompanhamento psicológico
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={0.1} className="flex">
              <div className="flex flex-1 flex-col border border-wepac-gray/30 bg-black p-6 transition-colors hover:border-white">
                <h3 className="font-barlow text-xl font-bold text-white">
                  Gestão e administração
                </h3>
                <ul className="mt-4 space-y-2 text-sm text-wepac-gray">
                  <li>Contabilidade</li>
                  <li>Fiscalidade</li>
                  <li>Gestão de carreira</li>
                </ul>
                <p className="mt-4 text-xs text-white/40">
                  Na plataforma: Plano estratégico, contabilidade e fiscalidade
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={0.15} className="flex">
              <div className="flex flex-1 flex-col border border-wepac-gray/30 bg-black p-6 transition-colors hover:border-white">
                <h3 className="font-barlow text-xl font-bold text-white">
                  Marketing e comunicação
                </h3>
                <ul className="mt-4 space-y-2 text-sm text-wepac-gray">
                  <li>Gestão de redes sociais</li>
                  <li>Gestão de tráfego pago</li>
                  <li>Produção de conteúdo</li>
                  <li>Branding e posicionamento</li>
                </ul>
                <p className="mt-4 text-xs text-white/40">
                  Na plataforma: Redes sociais, tráfego pago e branding
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={0.2} className="flex">
              <div className="flex flex-1 flex-col border border-wepac-gray/30 bg-black p-6 transition-colors hover:border-white">
                <h3 className="font-barlow text-xl font-bold text-white">
                  Ativação e mercado
                </h3>
                <ul className="mt-4 space-y-2 text-sm text-wepac-gray">
                  <li>Booking e representação</li>
                  <li>Integração em projetos WEPAC</li>
                  <li>Produção de materiais promocionais</li>
                </ul>
                <p className="mt-4 text-xs text-white/40">
                  Na plataforma: Booking, representação e materiais promocionais
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* 6. EQUIPA */}
      <section className="relative z-10 px-6 py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-wepac-gray">
              Equipa
            </p>
            <h2 className="mt-3 font-barlow text-3xl font-bold text-white md:text-5xl">
              Quem está por trás
            </h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="mt-8 text-lg leading-relaxed text-white/80">
              O programa é sustentado por uma equipa multidisciplinar que
              intervém diretamente no desenvolvimento do artista.
            </p>
          </FadeIn>
          <div className="mt-10 flex flex-wrap gap-4">
            {EQUIPA_PERFIS.map((perfil, i) => (
              <FadeIn key={perfil} delay={i * 0.05}>
                <span className="border border-wepac-gray/30 px-4 py-2 text-sm text-wepac-gray">
                  {perfil}
                </span>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* 7. PERCURSO */}
      <section className="relative z-10 px-6 py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <FadeIn>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-wepac-gray">
              Percurso
            </p>
            <h2 className="mt-3 font-barlow text-3xl font-bold text-white md:text-5xl">
              Percurso do artista
            </h2>
          </FadeIn>

          <div className="mt-16 flex flex-col items-stretch gap-0 lg:flex-row">
            {NIVEIS.map((nivel, i) => (
              <Fragment key={nivel.nameEn}>
                <FadeIn delay={i * 0.1} className="flex flex-1 flex-col">
                  <div className="flex flex-1 flex-col border border-wepac-gray/30 bg-black p-6 transition-colors hover:border-white">
                    <span className="text-xs font-medium uppercase tracking-[0.2em] text-white/50">
                      Nível {i + 1}
                    </span>
                    <h3 className="mt-2 font-barlow text-2xl font-bold text-wepac-gray">
                      {nivel.name}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-white/80">
                      {nivel.desc}
                    </p>
                  </div>
                </FadeIn>
                {i < NIVEIS.length - 1 && (
                  <>
                    <div className="flex items-center justify-center py-3 lg:hidden">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-white/40">
                        <path d="M8 3v10M4 9l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="hidden shrink-0 items-center justify-center px-3 lg:flex">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-white/40">
                        <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </>
                )}
              </Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* 7. PARA QUEM É */}
      <section className="relative z-10 bg-[rgba(255,255,255,0.02)] px-6 py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-5xl">
          <FadeIn>
            <h2 className="text-center font-barlow text-3xl font-bold text-white md:text-5xl">
              Isto é para ti?
            </h2>
          </FadeIn>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2">
            <FadeIn delay={0.1} className="flex">
              <div className="flex flex-1 flex-col border border-wepac-gray/30 bg-black p-6">
                <h3 className="font-barlow text-xl font-bold text-wepac-gray">
                  É para ti se:
                </h3>
                <ul className="mt-4 space-y-3 text-sm text-white/80">
                  <li className="flex gap-3">
                    <CheckIcon />
                    Tens talento e queres estrutura para o sustentar
                  </li>
                  <li className="flex gap-3">
                    <CheckIcon />
                    Aceitas processo, exigência e verdade
                  </li>
                  <li className="flex gap-3">
                    <CheckIcon />
                    Queres construir uma carreira, não só fazer concertos
                  </li>
                  <li className="flex gap-3">
                    <CheckIcon />
                    Estás disponível para te desenvolver como pessoa, não só como
                    performer
                  </li>
                </ul>
              </div>
            </FadeIn>

            <FadeIn delay={0.2} className="flex">
              <div className="flex flex-1 flex-col border border-wepac-gray/30 bg-black p-6">
                <h3 className="font-barlow text-xl font-bold text-white/50">
                  Não é para ti se:
                </h3>
                <ul className="mt-4 space-y-3 text-sm text-white/50">
                  <li className="flex gap-3">
                    <CrossIcon />
                    Procuras visibilidade rápida sem trabalho
                  </li>
                  <li className="flex gap-3">
                    <CrossIcon />
                    Não aceitas feedback nem confronto construtivo
                  </li>
                  <li className="flex gap-3">
                    <CrossIcon />
                    Não tens disponibilidade para compromisso real
                  </li>
                  <li className="flex gap-3">
                    <CrossIcon />
                    Queres só um agente, não um sistema de desenvolvimento
                  </li>
                </ul>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* 8. CANDIDATURA */}
      <section id="candidatura" className="relative z-10 scroll-mt-24 px-6 py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-2xl">
          <FadeIn>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-wepac-gray">
              Candidatura
            </p>
            <h2 className="mt-3 font-barlow text-3xl font-bold text-white md:text-5xl">
              Candidata-te ao Programa Artistas
            </h2>
            <p className="mt-4 text-lg text-white/60">
              Preenche o formulário. A equipa analisa o teu perfil e entra em contacto.
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="mt-10">
              <BetaSignupForm />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-wepac-gray/30 px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <FadeIn>
            <span className="font-barlow text-3xl font-bold text-white">
              wepac
            </span>
            <p className="mt-2 text-sm text-white/50">
              Companhia de Artes
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8">
              <Link
                href="/"
                className="text-sm text-white/80 transition-colors hover:text-white"
              >
                wepac.pt
              </Link>
              <span className="hidden text-wepac-gray/30 sm:inline">·</span>
              <a
                href="mailto:info@wepac.pt"
                className="text-sm text-white/80 transition-colors hover:text-white"
              >
                info@wepac.pt
              </a>
            </div>
          </FadeIn>
        </div>
      </footer>
    </div>
  );
}
