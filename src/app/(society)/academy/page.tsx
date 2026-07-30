import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FadeIn } from "@/components/FadeIn";

export const metadata: Metadata = {
  title: { absolute: "WEPAC Academy — do 0 ao infinito e mais além" },
  description:
    "Educação para uma vida inteira: Easy Peasy, Step Up e YUP, com a família por perto e a pessoa inteira sempre à vista.",
  alternates: { canonical: "/academy" },
  openGraph: {
    title: "WEPAC Academy — do 0 ao infinito e mais além",
    description:
      "Educação que cresce com cada pessoa e cada família, da descoberta ao legado.",
    url: "/academy",
    type: "website",
    locale: "pt_PT",
    images: [
      {
        url: "/logo/og-image.png",
        width: 1200,
        height: 630,
        alt: "WEPAC",
      },
    ],
  },
};

const stages = [
  {
    years: "0—11",
    name: "Easy Peasy",
    mode: "Discovery",
    state: "Em atividade",
    copy: "Primeiros trilhos: corpo, ritmo, curiosidade, arte e uma família que aprende a ser o primeiro ambiente.",
  },
  {
    years: "12—21",
    name: "Step Up",
    mode: "Build",
    state: "Em desenvolvimento",
    copy: "Projetos reais, comunidade exigente e liberdade que cresce com responsabilidade demonstrada.",
  },
  {
    years: "22—∞",
    name: "YUP",
    mode: "Transform",
    state: "Em construção",
    copy: "Your Unlocked Potential: autonomia adulta, obra, maestria, serviço e legado.",
  },
];

const curriculum = [
  ["Físico", "Corpo, energia, ritmo e hábitos como base de presença."],
  ["Emocional", "Nomear, regular, reparar e comunicar com verdade."],
  ["Carácter", "Hábitos, integridade e capacidade de terminar."],
  ["Espiritual", "Interioridade, sentido e reverência sem imposição de crença."],
  ["Intelectual", "Atenção, linguagem, curiosidade e qualidade de pensamento."],
  ["Social", "Convivência, conflito reparado, colaboração e serviço."],
];

export default function AcademyPage() {
  return (
    <>
      <section className="relative isolate min-h-[800px] overflow-hidden border-b border-white/10 px-5 pb-20 pt-32 sm:px-8 lg:px-12 lg:pt-40">
        <div className="absolute inset-0 -z-20">
          <Image
            src="/images/society/easy-peasy.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="origin-top -translate-y-[12%] scale-[2] object-cover object-top opacity-55 lg:translate-y-0 lg:scale-100 lg:object-[50%_31%]"
          />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black via-black/85 to-black/35" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black via-transparent to-black/40" />

        <FadeIn className="mx-auto flex min-h-[640px] max-w-[1440px] items-end">
          <div className="max-w-5xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/55">
              WEPAC Society · Via educativa
            </p>
            <h1 className="mt-8 text-balance font-barlow text-[clamp(3.5rem,8vw,8rem)] font-black uppercase leading-[0.84] tracking-[-0.05em]">
              Do 0 ao infinito — e mais além.
            </h1>
            <p className="mt-9 max-w-2xl text-lg leading-relaxed text-white/70 sm:text-xl">
              Educação que cresce com cada pessoa e cada família. Easy Peasy, Step Up e YUP
              acompanham o caminho da descoberta ao legado, com prática real e a pessoa inteira
              sempre à vista.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/wepacker/intake?source=academy"
                className="inline-flex min-h-14 items-center justify-center bg-white px-7 text-xs font-bold uppercase tracking-[0.18em] text-black transition-colors hover:bg-wepac-gray"
              >
                Começar o meu Life Plan
              </Link>
              <Link
                href="#stages"
                className="inline-flex min-h-14 items-center justify-center border border-white/30 px-7 text-xs font-bold uppercase tracking-[0.18em] text-white transition-colors hover:border-white hover:bg-white hover:text-black"
              >
                Conhecer os stages
              </Link>
            </div>
          </div>
        </FadeIn>
      </section>

      <section className="border-b border-white/10 bg-wepac-gray px-5 py-24 text-black sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto grid max-w-[1440px] gap-16 lg:grid-cols-[0.8fr_1.2fr]">
          <FadeIn>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-black/45">
              A pessoa antes do programa
            </p>
            <h2 className="mt-6 font-barlow text-5xl font-black uppercase leading-[0.92] tracking-[-0.04em] sm:text-7xl">
              Uma vida.
              <br />
              Seis pilares.
              <br />
              Muitas práticas.
            </h2>
          </FadeIn>
          <FadeIn delay={0.1} className="lg:pt-14">
            <p className="text-2xl leading-snug text-black/80 sm:text-3xl">
              A música é uma disciplina. A pessoa é física, emocional, de carácter, espiritual,
              intelectual e social.
            </p>
            <p className="mt-8 max-w-2xl leading-relaxed text-black/60">
              O currículo não separa desenvolvimento humano de aprendizagem académica ou prática.
              Cada stage muda a linguagem, o grau de autonomia e a forma de prestar contas — sem
              reduzir ninguém a notas, talento ou performance.
            </p>
          </FadeIn>
        </div>
      </section>

      <section
        id="stages"
        className="scroll-mt-20 border-b border-white/10 px-5 py-24 sm:px-8 lg:px-12 lg:py-32"
      >
        <div className="mx-auto max-w-[1440px]">
          <FadeIn>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">
              Três stages
            </p>
            <h2 className="mt-6 max-w-4xl font-barlow text-5xl font-black uppercase leading-[0.92] tracking-[-0.04em] sm:text-7xl">
              Discovery. Build. Transform.
            </h2>
          </FadeIn>
          <div className="mt-16 grid gap-px bg-white/15 lg:grid-cols-3">
            {stages.map((stage, index) => (
              <FadeIn key={stage.name} delay={index * 0.06} className="flex min-h-[430px] flex-col bg-black p-8">
                <div className="flex items-start justify-between">
                  <p className="font-barlow text-5xl font-black tracking-[-0.04em] text-white/25">
                    {stage.years}
                  </p>
                  <span className="border border-white/15 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-white/50">
                    {stage.state}
                  </span>
                </div>
                <div className="mt-auto">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-wepac-gray">
                    {stage.mode}
                  </p>
                  <h3 className="mt-3 font-barlow text-3xl font-black uppercase">{stage.name}</h3>
                  <p className="mt-5 leading-relaxed text-white/60">{stage.copy}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#080808] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-[1440px]">
          <FadeIn className="grid gap-12 lg:grid-cols-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">
                Currículo integral
              </p>
              <h2 className="mt-6 font-barlow text-5xl font-black uppercase leading-[0.92] tracking-[-0.04em] sm:text-7xl">
                Se não é observável, não é avaliável.
              </h2>
            </div>
            <p className="max-w-2xl self-end text-lg leading-relaxed text-white/60">
              Os pilares não são etiquetas. São ângulos de leitura do momento, vistos na prática
              e revistos em ciclos: ponto de partida, foco, ação, obra, feedback e movimento.
            </p>
          </FadeIn>
          <div className="mt-16 grid gap-px bg-white/15 sm:grid-cols-2 lg:grid-cols-3">
            {curriculum.map(([name, line], index) => (
              <div key={name} className="min-h-[220px] bg-black p-7">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/35">
                  Pilar 0{index + 1}
                </p>
                <h3 className="mt-9 font-barlow text-2xl font-black uppercase">{name}</h3>
                <p className="mt-4 leading-relaxed text-white/55">{line}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto grid max-w-[1440px] gap-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <FadeIn className="relative aspect-[4/5] overflow-hidden">
            <Image
              src="/images/society/easy-peasy.jpg"
              alt="Criança a tocar violino numa peça Easy Peasy"
              fill
              sizes="(max-width: 1023px) 100vw, 50vw"
              className="origin-top scale-[2] object-cover object-top"
            />
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">
              A primeira porta
            </p>
            <h2 className="mt-6 font-barlow text-5xl font-black uppercase leading-[0.92] tracking-[-0.04em] sm:text-7xl">
              Easy Peasy
            </h2>
            <p className="mt-7 text-2xl leading-snug text-white/80">
              Grandes apresentações começam com pequenas aulas — e com um ambiente que deixa
              descobrir sem abandonar.
            </p>
            <p className="mt-6 leading-relaxed text-white/55">
              Música e artes performativas para crianças, famílias, escolas e comunidades. A
              família participa no caminho: linguagem comum, rituais simples e prática que
              continua em casa.
            </p>
            <Link
              href="/projetos/easy-peasy"
              className="mt-9 inline-flex items-center gap-2 border-b border-white pb-2 text-xs font-bold uppercase tracking-[0.18em]"
            >
              Conhecer Easy Peasy <span aria-hidden="true">→</span>
            </Link>
          </FadeIn>
        </div>
      </section>

      <section className="bg-wepac-gray px-5 py-24 text-black sm:px-8 lg:px-12 lg:py-32">
        <FadeIn className="mx-auto max-w-5xl text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-black/45">
            O primeiro passo
          </p>
          <h2 className="mt-7 text-balance font-barlow text-5xl font-black uppercase leading-[0.9] tracking-[-0.04em] sm:text-7xl">
            Começa em casa. O Life Plan dá direção.
          </h2>
          <p className="mx-auto mt-8 max-w-2xl leading-relaxed text-black/60">
            O Life Plan ajuda-nos a compreender a pessoa, a família e o momento de vida antes de
            escolher um percurso. Nem todas as portas estão abertas na mesma fase: respondemos com
            verdade sobre o que já existe e o que ainda está a ganhar capacidade.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/wepacker/intake?source=academy"
              className="inline-flex min-h-14 items-center justify-center bg-black px-7 text-xs font-bold uppercase tracking-[0.18em] text-white hover:bg-black/80"
            >
              Começar o meu Life Plan
            </Link>
            <Link
              href="/society/familias"
              className="inline-flex min-h-14 items-center justify-center border border-black/25 px-7 text-xs font-bold uppercase tracking-[0.18em] hover:border-black hover:bg-black hover:text-white"
            >
              Conhecer o caminho das famílias
            </Link>
          </div>
        </FadeIn>
      </section>
    </>
  );
}
