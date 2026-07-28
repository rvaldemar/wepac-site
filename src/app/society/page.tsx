import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FadeIn } from "@/components/FadeIn";
import { SocietyFooter } from "@/components/society/SocietyFooter";
import { SocietyHeader } from "@/components/society/SocietyHeader";

export const metadata: Metadata = {
  title: { absolute: "WEPAC Society — uma vida inteira em caminho" },
  description:
    "A casa comum da WEPAC: Academy, Companhia de Artes, Backpack e comunidade para uma vida inteira em caminho.",
  alternates: { canonical: "/society" },
  openGraph: {
    title: "WEPAC Society — uma vida inteira em caminho",
    description:
      "Uma cosmovisão. Três stages. Um caminho. From packers to WEPACkers.",
    images: [{ url: "/images/society/violin.jpg", width: 1228, height: 1792 }],
  },
};

const stages = [
  {
    range: "0—11",
    name: "Easy Peasy",
    movement: "Discovery",
    line: "Descobrir o mundo com o corpo, a curiosidade, o ritmo e uma família por perto.",
    state: "Em atividade",
  },
  {
    range: "12—21",
    name: "Step Up",
    movement: "Build",
    line: "Construir identidade, obra e responsabilidade através de projetos que contam.",
    state: "Em desenvolvimento",
  },
  {
    range: "22—∞",
    name: "YUP",
    movement: "Transform",
    line: "Converter potencial acumulado em autonomia, impacto, serviço e legado.",
    state: "Em construção",
  },
];

const pillars = [
  "Físico",
  "Emocional",
  "Carácter",
  "Espiritual",
  "Intelectual",
  "Social",
];

const packs = [
  {
    name: "Família+",
    line: "Famílias que escolhem uma linguagem comum e um caminho ajustado a pais e filhos.",
  },
  {
    name: "Cordada",
    line: "Duas pessoas ligadas pelo compromisso, sem perder a responsabilidade individual.",
  },
  {
    name: "Flotilha",
    line: "Pessoas que chegam sozinhas e escolhem avançar com comunidade por perto.",
  },
  {
    name: "Aldeia",
    line: "Uma comunidade territorial onde educação, cultura, trabalho e serviço se encontram.",
  },
];

const doors = [
  {
    name: "Famílias e cidadãos",
    line: "O caminho começa em casa: ambiente, rituais, compromisso e exemplo.",
  },
  {
    name: "Mercado",
    line: "Empresas que desenvolvem pessoas e emprestam capacidade à geração seguinte.",
  },
  {
    name: "Sector social",
    line: "Escolas, associações, paróquias, clubes e autarquias como alianças por fazer.",
  },
];

function Arrow() {
  return <span aria-hidden="true">↗</span>;
}

export default function SocietyPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-wepac-gray selection:text-black">
      <SocietyHeader />
      <main>
      <section className="relative isolate min-h-[860px] overflow-hidden border-b border-white/10 px-5 pb-20 pt-32 sm:px-8 lg:min-h-screen lg:px-12 lg:pb-24 lg:pt-40">
        <div className="absolute inset-0 -z-20 bg-black" />
        <div className="absolute inset-y-0 right-0 -z-10 hidden w-[47%] lg:block">
          <Image
            src="/images/society/violin.jpg"
            alt=""
            fill
            priority
            sizes="47vw"
            className="object-cover object-center opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-black/5" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />
        </div>

        <div className="mx-auto grid min-h-[680px] max-w-[1440px] items-end gap-16 lg:grid-cols-[1.2fr_0.8fr]">
          <FadeIn>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/50">
              WEPAC Society · Carcavelos
            </p>
            <h1 className="mt-8 max-w-5xl text-balance font-barlow text-[clamp(3.6rem,8.2vw,8.6rem)] font-black uppercase leading-[0.82] tracking-[-0.055em] text-white">
              Uma vida inteira em caminho.
            </h1>
            <p className="mt-10 max-w-2xl text-balance text-lg leading-relaxed text-white/65 sm:text-xl">
              A casa comum de pessoas, famílias e organizações que escolhem carregar o que lhes
              cabe — e entregar valor aos outros.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/wepacker/intake"
                className="inline-flex min-h-14 items-center justify-center bg-white px-7 text-xs font-bold uppercase tracking-[0.18em] text-black transition-colors hover:bg-wepac-gray"
              >
                Encontrar o ponto de partida
              </Link>
              <Link
                href="/wepacker/login"
                className="inline-flex min-h-14 items-center justify-center border border-white/30 px-7 text-xs font-bold uppercase tracking-[0.18em] text-white transition-colors hover:border-white hover:bg-white hover:text-black"
              >
                Abrir Backpack
              </Link>
            </div>
          </FadeIn>

          <div className="relative aspect-[4/5] overflow-hidden border border-white/10 lg:hidden">
            <Image
              src="/images/society/violin.jpg"
              alt="Violino e a frase Não é só arte. Existe método."
              fill
              priority
              sizes="(max-width: 1023px) 100vw, 1px"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-wepac-gray px-5 py-20 text-black sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-[1440px]">
          <FadeIn className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-black/50">
              A ideia inteira
            </p>
            <p className="text-balance font-barlow text-4xl font-black uppercase leading-[0.95] tracking-[-0.035em] sm:text-6xl lg:text-7xl">
              Uma cosmovisão.
              <br />
              Três stages.
              <br />
              Um caminho.
            </p>
          </FadeIn>
          <div className="mt-16 grid border-y border-black/15 sm:grid-cols-3">
            {[
              ["01", "Pessoa inteira", "Não somos departamentos: somos uma vida vista de seis ângulos."],
              ["03", "Stages", "A mesma metodologia, calibrada do nascimento ao legado."],
              ["06", "Pilares", "Físico, emocional, carácter, espiritual, intelectual e social."],
            ].map(([number, title, line]) => (
              <div key={number} className="border-b border-black/15 py-8 sm:border-b-0 sm:border-r sm:px-8 sm:first:pl-0 sm:last:border-r-0">
                <p className="font-barlow text-5xl font-black tracking-[-0.04em]">{number}</p>
                <h2 className="mt-5 font-barlow text-xl font-bold uppercase">{title}</h2>
                <p className="mt-3 max-w-sm text-sm leading-relaxed text-black/65">{line}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="society" className="scroll-mt-20 border-b border-white/10 px-5 py-24 sm:px-8 lg:px-12 lg:py-36">
        <div className="mx-auto grid max-w-[1440px] gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24">
          <FadeIn>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">
              O WE faz a diferença
            </p>
            <h2 className="mt-7 text-balance font-barlow text-5xl font-black uppercase leading-[0.9] tracking-[-0.04em] sm:text-7xl">
              From packers
              <br />
              to WEPACkers.
            </h2>
          </FadeIn>
          <FadeIn delay={0.1} className="lg:pt-16">
            <p className="text-balance text-2xl leading-snug text-white sm:text-3xl">
              Sozinho, és um packer: carregas o teu próprio peso. Quando acrescentas o WE —
              a comunidade — tornas-te WEPACker.
            </p>
            <div className="mt-10 space-y-5 text-base leading-relaxed text-white/60">
              <p>
                A Society é o pack alargado. Não uma membership, um catálogo de atividades ou
                uma promessa de acesso: uma casa onde pertença se prova em proximidade, exigência
                e verdade.
              </p>
              <p>
                Cada pessoa mantém responsabilidade própria. Ninguém é deixado a caminhar sem
                base, linguagem ou companhia.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#080808] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-[1440px]">
          <FadeIn className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">
                Duas casas. A mesma obra.
              </p>
              <h2 className="mt-6 max-w-4xl text-balance font-barlow text-4xl font-black uppercase leading-[0.95] tracking-[-0.035em] sm:text-6xl">
                Educação que dá caminho. Cultura que o põe à prova.
              </h2>
            </div>
          </FadeIn>

          <div className="mt-16 grid gap-px bg-white/15 lg:grid-cols-2">
            <Link href="/academy" className="group relative min-h-[620px] overflow-hidden bg-black">
              <Image
                src="/images/society/easy-peasy.jpg"
                alt="Easy Peasy — grandes apresentações começam com pequenas aulas"
                fill
                sizes="(max-width: 1023px) 100vw, 50vw"
                className="object-cover transition duration-700 group-hover:scale-[1.025]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-7 sm:p-10">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/60">
                  Discovery · Build · Transform
                </p>
                <h3 className="mt-4 font-barlow text-4xl font-black uppercase tracking-[-0.03em] sm:text-5xl">
                  WEPAC Academy
                </h3>
                <p className="mt-4 max-w-lg leading-relaxed text-white/70">
                  Easy Peasy, Step Up e YUP: o caminho educativo dos 0 ao infinito.
                </p>
                <span className="mt-7 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em]">
                  Conhecer a Academy <Arrow />
                </span>
              </div>
            </Link>

            <Link
              href="/companhia-de-artes"
              className="group relative min-h-[620px] overflow-hidden bg-black"
            >
              <Image
                src="/images/society/arte-a-capela.jpg"
                alt="Arte à Capela — patrimónios ganham vida com a arte"
                fill
                sizes="(max-width: 1023px) 100vw, 50vw"
                className="object-cover transition duration-700 group-hover:scale-[1.025]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-7 sm:p-10">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/60">
                  Criação · Produção · Programação
                </p>
                <h3 className="mt-4 font-barlow text-4xl font-black uppercase tracking-[-0.03em] sm:text-5xl">
                  Companhia de Artes
                </h3>
                <p className="mt-4 max-w-lg leading-relaxed text-white/70">
                  Wessex e Arte à Capela: duas marcas com porta própria e uma régua comum.
                </p>
                <span className="mt-7 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em]">
                  Entrar na Companhia <Arrow />
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <section id="caminho" className="scroll-mt-20 border-b border-white/10 px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-[1440px]">
          <FadeIn className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">
                Uma vida inteira
              </p>
              <h2 className="mt-6 font-barlow text-5xl font-black uppercase leading-[0.92] tracking-[-0.04em] sm:text-7xl">
                O caminho muda.
                <br />
                A pessoa não acaba.
              </h2>
            </div>
            <p className="max-w-2xl self-end text-lg leading-relaxed text-white/60">
              A mesma metodologia atravessa as idades. O imaginário e a responsabilidade mudam;
              as seis dimensões da pessoa continuam sempre à vista.
            </p>
          </FadeIn>

          <div className="mt-16 border-t border-white/15">
            {stages.map((stage, index) => (
              <FadeIn
                key={stage.name}
                delay={index * 0.06}
                className="grid gap-6 border-b border-white/15 py-9 sm:grid-cols-[0.35fr_0.8fr_0.8fr_1.4fr]"
              >
                <p className="font-barlow text-4xl font-black tracking-[-0.04em] text-white/35">
                  {stage.range}
                </p>
                <div>
                  <p className="font-barlow text-2xl font-bold uppercase">{stage.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/45">
                    {stage.state}
                  </p>
                </div>
                <p className="font-barlow text-2xl font-black uppercase text-wepac-gray">
                  {stage.movement}
                </p>
                <p className="max-w-xl leading-relaxed text-white/60">{stage.line}</p>
              </FadeIn>
            ))}
          </div>

          <div className="mt-12 grid grid-cols-2 gap-px bg-white/15 sm:grid-cols-3 lg:grid-cols-6">
            {pillars.map((pillar, index) => (
              <FadeIn
                key={pillar}
                delay={index * 0.04}
                className="bg-black px-5 py-7"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
                  0{index + 1}
                </p>
                <p className="mt-5 font-barlow text-lg font-bold uppercase">{pillar}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section id="plataformas" className="scroll-mt-20 border-b border-black/15 bg-white px-5 py-24 text-black sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto grid max-w-[1440px] gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <FadeIn>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-black/45">
              Plataformas
            </p>
            <h2 className="mt-6 text-balance font-barlow text-5xl font-black uppercase leading-[0.9] tracking-[-0.045em] sm:text-7xl">
              O caminho cabe no teu Backpack.
            </h2>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-black/65">
              WEPACKER é a plataforma pessoal. O Backpack é o teu espaço: Life Map, Basecamp,
              Trails, Actions, Sessions e relações de Mentorship. A Bilheteira põe a obra pública
              em circulação — agenda, reserva e acesso no mesmo ecossistema.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/wepacker/login"
                className="inline-flex min-h-14 items-center justify-center bg-black px-7 text-xs font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-black/80"
              >
                Abrir Backpack
              </Link>
              <Link
                href="/bilheteira"
                className="inline-flex min-h-14 items-center justify-center border border-black/25 px-7 text-xs font-bold uppercase tracking-[0.18em] transition-colors hover:border-black hover:bg-black hover:text-white"
              >
                Abrir Bilheteira
              </Link>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="border border-black/15 bg-[#f4f4f1] p-4 shadow-[0_30px_90px_rgba(0,0,0,0.18)] sm:p-6">
              <div className="flex items-center justify-between border-b border-black/10 pb-5">
                <Image
                  src="/logo/email/wepacker-lockup-black.png"
                  alt="WEPACKER"
                  width={180}
                  height={90}
                  className="h-9 w-auto"
                />
                <span className="rounded-full border border-black/15 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.16em]">
                  My Journey
                </span>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-[1.3fr_0.7fr]">
                <div className="bg-black p-6 text-white">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/45">
                    Basecamp
                  </p>
                  <p className="mt-10 font-barlow text-3xl font-black uppercase">
                    Para onde devo ir?
                  </p>
                  <div className="mt-8 h-1.5 overflow-hidden bg-white/15">
                    <div className="h-full w-[62%] bg-wepac-gray" />
                  </div>
                  <p className="mt-3 text-xs text-white/50">Life Map · em movimento</p>
                </div>
                <div className="grid gap-4">
                  {["Trails", "Actions", "Sessions"].map((label, index) => (
                    <div key={label} className="border border-black/10 bg-white p-4">
                      <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-black/40">
                        0{index + 1}
                      </p>
                      <p className="mt-4 font-barlow text-lg font-bold uppercase">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="border-b border-white/10 px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-[1440px]">
          <FadeIn>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">
              Como se começa
            </p>
            <h2 className="mt-6 max-w-4xl text-balance font-barlow text-5xl font-black uppercase leading-[0.92] tracking-[-0.04em] sm:text-7xl">
              Uma porta real. Sem promessas maiores do que a casa.
            </h2>
          </FadeIn>

          <div className="mt-16 grid gap-px bg-white/15 lg:grid-cols-3">
            {[
              {
                index: "01",
                state: "Aberto",
                name: "Ponto de Partida",
                line: "Uma candidatura curta para percebermos quem és, onde estás e qual é o primeiro passo que conseguimos abrir.",
                href: "/wepacker/intake",
                cta: "Encontrar o meu ponto",
              },
              {
                index: "02",
                state: "Para WEPACkers",
                name: "Backpack",
                line: "O teu espaço pessoal dentro do WEPACKER. O caminho, os compromissos e a evidência ficam ligados à mesma pessoa.",
                href: "/wepacker/login",
                cta: "Abrir Backpack",
              },
              {
                index: "03",
                state: "Por candidatura",
                name: "Upgraded Backpack",
                line: "PPV anual, acompanhamento e materiais WEPAC quando houver capacidade e enquadramento para os cumprir a sério.",
                href: "/wepacker/intake",
                cta: "Manifestar interesse",
              },
            ].map((item) => (
              <div key={item.name} className="flex min-h-[380px] flex-col bg-black p-7 sm:p-9">
                <div className="flex items-center justify-between">
                  <span className="font-barlow text-4xl font-black text-white/25">{item.index}</span>
                  <span className="border border-white/15 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-white/55">
                    {item.state}
                  </span>
                </div>
                <h3 className="mt-14 font-barlow text-3xl font-black uppercase tracking-[-0.025em]">
                  {item.name}
                </h3>
                <p className="mt-5 flex-1 leading-relaxed text-white/60">{item.line}</p>
                <Link
                  href={item.href}
                  className="mt-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.17em] text-white"
                >
                  {item.cta} <span aria-hidden="true">→</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#080808] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto grid max-w-[1440px] gap-16 lg:grid-cols-[0.7fr_1.3fr]">
          <FadeIn>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">
              Pack é comunidade
            </p>
            <h2 className="mt-6 font-barlow text-5xl font-black uppercase leading-[0.92] tracking-[-0.04em] sm:text-7xl">
              Não é plano.
              <br />
              Não é pacote.
            </h2>
            <p className="mt-8 max-w-lg leading-relaxed text-white/60">
              Estes nomes desenham comunidades a construir — não subscrições disponíveis hoje.
              Um pack só existe quando há pessoas, responsáveis, calendário e obra comum.
            </p>
          </FadeIn>

          <div className="grid gap-px bg-white/15 sm:grid-cols-2">
            {packs.map((pack, index) => (
              <FadeIn key={pack.name} delay={index * 0.05} className="min-h-[260px] bg-black p-7 sm:p-9">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/35">
                  Comunidade em desenho · 0{index + 1}
                </p>
                <h3 className="mt-10 font-barlow text-3xl font-black uppercase">Pack {pack.name}</h3>
                <p className="mt-5 max-w-md leading-relaxed text-white/60">{pack.line}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto grid max-w-[1440px] gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <FadeIn className="relative aspect-square overflow-hidden">
            <Image
              src="/images/society/alex-florindo.jpg"
              alt="Atleta WEPACker com medalhas"
              fill
              sizes="(max-width: 1023px) 100vw, 45vw"
              className="object-cover"
            />
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">
              Prova com o tamanho certo
            </p>
            <h2 className="mt-6 text-balance font-barlow text-5xl font-black uppercase leading-[0.92] tracking-[-0.04em] sm:text-7xl">
              Medido, não anunciado.
            </h2>
            <p className="mt-8 text-xl leading-relaxed text-white/75">
              Concertos, formação e famílias já são obra visitável. O método completo num adulto
              tem hoje um primeiro caso real — um, não mil.
            </p>
            <p className="mt-6 leading-relaxed text-white/55">
              O resto é hipótese honesta em teste. Visão dita como visão, piloto dito como piloto,
              prova dita como prova. Não pedimos que acreditem em nós. Pedimos que nos meçam.
            </p>
            <Link
              href="/artist"
              className="mt-9 inline-flex items-center gap-2 border-b border-white pb-2 text-xs font-bold uppercase tracking-[0.18em]"
            >
              Conhecer o primeiro caso <span aria-hidden="true">→</span>
            </Link>
          </FadeIn>
        </div>
      </section>

      <section id="mission" className="scroll-mt-20 border-b border-white/10 bg-wepac-gray px-5 py-24 text-black sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-[1440px]">
          <FadeIn className="grid gap-14 lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-black/45">
                WEPAC Mission
              </p>
              <h2 className="mt-6 font-barlow text-5xl font-black uppercase leading-[0.92] tracking-[-0.04em] sm:text-7xl">
                A porta não pode ter o tamanho da carteira.
              </h2>
            </div>
            <div className="space-y-8 lg:pt-16">
              <p className="text-2xl leading-snug text-black/80 sm:text-3xl">
                A Mission é a vertente cívica da WEPAC: dádiva com destino, responsável e contas
                à vista.
              </p>
              <p className="leading-relaxed text-black/60">
                O primeiro concerto solidário foi um gesto real, não uma prova de escala. Bolsas,
                serviço e novos acessos abrem à medida da capacidade — uma porta verdadeira vale
                mais do que dez anunciadas.
              </p>
            </div>
          </FadeIn>

          <div className="mt-16 grid gap-px bg-black/15 lg:grid-cols-3">
            {doors.map((door, index) => (
              <div key={door.name} className="bg-wepac-gray p-7 sm:p-9">
                <p className="font-barlow text-4xl font-black text-black/20">0{index + 1}</p>
                <h3 className="mt-8 font-barlow text-2xl font-black uppercase">{door.name}</h3>
                <p className="mt-4 leading-relaxed text-black/60">{door.line}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden px-5 py-28 sm:px-8 lg:px-12 lg:py-44">
        <div className="absolute inset-0 -z-20">
          <Image
            src="/images/society/wessex.jpg"
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-center opacity-25"
          />
        </div>
        <div className="absolute inset-0 -z-10 bg-black/65" />
        <FadeIn className="mx-auto max-w-5xl text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/50">
            Atelier → Casa → Aldeia
          </p>
          <h2 className="mt-8 text-balance font-barlow text-5xl font-black uppercase leading-[0.88] tracking-[-0.045em] sm:text-7xl lg:text-8xl">
            A mochila é tua.
            <br />
            O trilho faz-se em grupo.
          </h2>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-white/65">
            Casa, Aldeia, cowork e coliving são horizonte — não infraestrutura anunciada. O
            primeiro passo, esse, já pode ser teu.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/wepacker/intake"
              className="inline-flex min-h-14 items-center justify-center bg-white px-7 text-xs font-bold uppercase tracking-[0.18em] text-black transition-colors hover:bg-wepac-gray"
            >
              Encontrar o meu ponto de partida
            </Link>
            <Link
              href="/wepacker/login"
              className="inline-flex min-h-14 items-center justify-center border border-white/30 px-7 text-xs font-bold uppercase tracking-[0.18em] transition-colors hover:border-white hover:bg-white hover:text-black"
            >
              Abrir Backpack
            </Link>
          </div>
        </FadeIn>
      </section>
      </main>
      <SocietyFooter />
    </div>
  );
}
