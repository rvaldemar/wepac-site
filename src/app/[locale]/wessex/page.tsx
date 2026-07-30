import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { getWessexCopy } from "@/i18n/copy/institutional-wessex";

export async function generateMetadata(): Promise<Metadata> {
  const copy = getWessexCopy(await getLocale()).page;
  return {
    title: copy.metadataTitle,
    description: copy.metadataDescription,
  };
}

const serif = "font-[family-name:var(--font-pt-serif)]";

export default async function WessexPage() {
  const copy = getWessexCopy(await getLocale()).page;
  return (
    <div className="bg-black text-white overflow-x-hidden">
      {/* HEADER */}
      <header className="absolute top-0 left-0 right-0 z-50 h-[80px] lg:h-[100px]">
        <div className="h-full px-6 md:px-10 xl:px-16 flex items-center justify-between max-w-[1600px] mx-auto">
          <Link href="/wessex" className="flex items-center text-white">
            <img
              src="/images/wessex/logo/main-white.png"
              alt="Wessex"
              className="h-9 sm:h-11 lg:h-[52px] w-auto"
            />
          </Link>
          <div className="flex items-center gap-4">
            <nav className="hidden lg:flex items-center gap-8 xl:gap-14 text-[15px] xl:text-[18px] font-medium tracking-wider text-white">
              <a href="#quem-somos" className="hover:text-[#B8A042] transition">{copy.navAbout}</a>
              <a href="#eventos" className="hover:text-[#B8A042] transition">{copy.navEvents}</a>
              <a href="#big-ideia" className="hover:text-[#B8A042] transition">{copy.navIdea}</a>
              <a href="#depoimentos" className="hover:text-[#B8A042] transition">{copy.navTestimonials}</a>
            </nav>
            <LocaleSwitcher />
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative w-full min-h-[640px] sm:min-h-[720px] lg:min-h-screen overflow-hidden flex flex-col">
        <div className="absolute inset-0">
          <img
            src="/images/wessex/hero.jpg"
            alt=""
            className="absolute w-full h-full object-cover object-center"
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "linear-gradient(83.62deg, rgb(0,0,0) 31.9%, rgba(0,0,0,0) 82.65%)",
            }}
          />
        </div>

        <div className="relative z-10 flex-1 max-w-[1600px] w-full mx-auto px-6 md:px-10 lg:px-16 xl:px-24 pt-[140px] lg:pt-[160px] xl:pt-[200px] pb-10">
          <p className={`${serif} font-bold text-white text-[26px] sm:text-[36px] md:text-[48px] lg:text-[60px] leading-[1.15] max-w-full lg:max-w-[640px] mb-5 lg:mb-10 break-words`}>
            {copy.heroLead}{" "}
            <em className="italic font-normal">{copy.heroEmphasis}</em>.
          </p>
          <p className="font-light text-white text-[13px] sm:text-[16px] lg:text-[22px] leading-[1.5] max-w-full lg:max-w-[600px] mb-5 lg:mb-10 break-words">
            {copy.heroBody}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/servicos/orcamento"
              className="flex items-center justify-center bg-[#B8A042] text-black font-medium text-[16px] lg:text-[18px] w-full sm:w-[260px] h-[52px] lg:h-[56px] rounded-[12px] hover:bg-[#c9b04f] transition"
            >
              {copy.calculate}
            </Link>
            <Link
              href="/contacto"
              className="flex items-center justify-center border border-white text-white font-medium text-[16px] lg:text-[18px] w-full sm:w-[260px] h-[52px] lg:h-[56px] rounded-[12px] hover:bg-white hover:text-black transition"
            >
              {copy.contact}
            </Link>
          </div>
        </div>

        {/* TRUST BAR — at bottom of hero viewport */}
        <div className="relative z-10 bg-[#540000] flex-shrink-0">
          <div className="max-w-[1600px] mx-auto h-auto md:h-[88px] flex flex-col md:flex-row items-center justify-around gap-2 md:gap-8 px-6 md:px-10 py-5 md:py-0 text-center">
            {copy.trust.map((item) => (
              <p
                key={item}
                className="font-light text-[12px] md:text-[16px] lg:text-[22px] text-white uppercase"
              >
                {item}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* QUEM SOMOS Hero — dramatic with image + big text */}
      <section
        id="quem-somos"
        className="relative bg-black overflow-hidden py-16 lg:py-0 lg:h-[900px]"
      >
        {/* Mobile/Tablet — same composition as desktop, scaled */}
        <div className="lg:hidden relative w-full" style={{ height: "115vw" }}>
          {/* Dark rectangle */}
          <div className="absolute left-[30vw] top-[10vw] w-[60vw] h-[90vw] bg-[#2c2d2e]">
            {/* Subtitle in gray area below image */}
            <div className="absolute left-[40%] right-[6%] bottom-[6%]">
              <p className="text-[#9ca0a3] font-light" style={{ fontSize: "3.2vw", lineHeight: 1.3 }}>
                {copy.aboutLead}{" "}
                <span className="font-bold text-white">
                  {copy.aboutEmphasis}
                </span>
              </p>
            </div>
          </div>

          {/* Image — overlaps left edge of dark box */}
          <div className="absolute left-[8vw] top-[22vw] w-[34vw] aspect-[448/750]">
            <img
              src="/images/wessex/quem-somos.jpg"
              alt="Wessex performance"
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
          </div>

          {/* Big "Quem somos" text */}
          <h2
            className={`${serif} absolute left-[42vw] top-[2vw] text-[#d3d2d1] font-normal leading-[0.92]`}
            style={{ fontSize: "16vw" }}
          >
            {copy.about}
          </h2>
        </div>

        {/* Desktop dramatic absolute */}
        <div className="hidden lg:block w-full h-full relative">
          {/* Dark rectangle — small, behind right edge of image + subtitle */}
          <div className="absolute left-[30vw] top-[16vh] w-[35vw] h-[70vh] bg-[#2c2d2e]">
            {/* Subtitle in available gray area (right of image), equal margins all sides */}
            <div className="absolute left-[33%] top-[12%] right-0 bottom-0 flex items-center justify-center">
              <p className="text-[#9ca0a3] font-light" style={{ fontSize: "2.08vw", lineHeight: 1.3, maxWidth: "19.4vw" }}>
                {copy.aboutLead}{" "}
                <span className="font-bold text-white">
                  {copy.aboutEmphasis}
                </span>
              </p>
            </div>
          </div>

          {/* Image — overlaps left edge of dark box */}
          <div className="absolute left-[18vw] top-[20vh] w-[24%] aspect-[448/750]">
            <img
              src="/images/wessex/quem-somos.jpg"
              alt="Wessex performance"
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
          </div>

          {/* Big "Quem somos" text — partially overlaps top-right of dark box */}
          <h2
            className={`${serif} absolute text-[#d3d2d1] font-normal leading-[0.92]`}
            style={{ fontSize: "11vw", left: "48.6vw", top: "5vh" }}
          >
            {copy.about}
          </h2>

        </div>
      </section>

      {/* QUEM SOMOS Detail */}
      <section className="bg-black py-12 lg:py-20">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-16">
          <p className={`${serif} text-[#FCFCFC] text-[20px] md:text-[24px] uppercase mb-8 lg:mb-12`}>
            {copy.about}
          </p>

          <div className="grid lg:grid-cols-[400px_1fr_1fr] gap-8 lg:gap-12 items-start">
            <div className="relative w-full max-w-[400px] mx-auto lg:mx-0 aspect-[4/3]">
              <img
                src="/images/wessex/detail.jpg"
                alt=""
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
            </div>

            <p className="text-[#FCFCFC] text-[15px] md:text-[16px] lg:text-[18px] leading-[1.55]">
              {copy.aboutBody[0]}
            </p>

            <p className="text-[#FCFCFC] text-[15px] md:text-[16px] lg:text-[18px] leading-[1.55]">
              {copy.aboutBody[1]}
            </p>
          </div>
        </div>
      </section>

      {/* EVENTOS Title */}
      <section id="eventos" className="bg-black pt-12 lg:pt-20">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-16">
          <h2 className={`${serif} text-[#EFEFF0] text-[28px] sm:text-[36px] md:text-[44px] lg:text-[56px] leading-[1.15] font-normal max-w-[1100px]`}>
            {copy.eventsLead}
          </h2>
        </div>
      </section>

      {/* 3 Cards */}
      <section className="bg-black py-12 lg:py-16">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
            {copy.eventCards.map((card) => (
              <div key={card.title} className="space-y-5">
                <div className="relative aspect-[16/10]">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
                <h3 className={`${serif} text-[22px] lg:text-[24px] text-[#FCFCFC]`}>
                  {card.title}
                </h3>
                <p className="font-bold text-[14px] lg:text-[15px] text-[#FCFCFC] leading-[1.3]">
                  {card.subtitle}
                </p>
                <ul className="list-disc pl-5 space-y-1 text-[13px] lg:text-[14px] text-[#FCFCFC] leading-[1.5]">
                  {card.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BIG IDEIA */}
      <section id="big-ideia" className="bg-black py-12 lg:py-20">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-16 space-y-0">
          <div className="bg-[#2c2d2e] py-10 lg:py-14 px-8 lg:px-14 grid lg:grid-cols-[1fr_360px] gap-10 lg:gap-14 items-center">
            <div className="space-y-6 lg:space-y-7">
              {copy.features.map((feature) => (
                <div key={feature.title} className="space-y-2">
                  <h3 className="text-white text-[18px] sm:text-[20px] lg:text-[24px] leading-[1.2] font-normal">
                    {feature.title}
                  </h3>
                  <p className="text-[#EFEFF0] text-[13px] sm:text-[14px] lg:text-[15px] leading-[1.55]">
                    {feature.text}
                  </p>
                </div>
              ))}
            </div>

            <div className="relative w-full max-w-[360px] mx-auto lg:mx-0 aspect-[9/16]">
              <img
                src="/images/wessex/features.jpg"
                alt=""
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
            </div>
          </div>

          {/* Banner */}
          <div className="relative w-full h-[200px] sm:h-[280px] lg:h-[340px]">
            <img
              src="/images/wessex/banner.jpg"
              alt=""
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section id="depoimentos" className="bg-[#540000] py-12 lg:py-20">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-16">
          <h2 className={`${serif} italic text-white text-[36px] sm:text-[44px] lg:text-[56px] mb-10 lg:mb-14`}>
            {copy.testimonials}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-7">
            {copy.testimonialItems.map((t) => (
              <div key={t.name} className="border border-white/40 rounded-2xl p-6 lg:p-8 relative">
                <span className={`${serif} italic absolute -top-4 left-6 bg-[#540000] px-2 text-white text-[40px] leading-none`}>
                  &ldquo;
                </span>
                <p className={`${serif} italic text-white/90 text-[14px] lg:text-[16px] leading-[1.55] mb-4`}>
                  {t.quote}
                </p>
                <p className={`${serif} italic text-white text-[14px] lg:text-[16px]`}>
                  {t.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="bg-black py-12 lg:py-20">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-16">
          <div className="bg-[#2c2d2e] relative grid lg:grid-cols-[360px_1fr] items-center gap-8 lg:gap-12 px-6 sm:px-8 lg:pl-0 lg:pr-12 py-10 lg:py-12 lg:min-h-[420px]">
            <div className="relative w-full max-w-[320px] mx-auto lg:mx-0 lg:ml-12 aspect-[3/4] lg:-mt-16 lg:-mb-16 lg:max-w-none lg:w-[320px] lg:h-[520px]">
              <img
                src="/images/wessex/cta.jpg"
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>

            <div className="space-y-5 max-w-[560px]">
              <p className="text-[#EFEFF0] text-[18px] sm:text-[20px] md:text-[24px] lg:text-[26px] leading-[1.35]">
                <span className="font-semibold text-white">
                  {copy.nextLead}
                </span>
                . {copy.nextBody}
              </p>

              <ul className="list-disc pl-6 space-y-1 text-[14px] sm:text-[15px] lg:text-[16px] text-[#EFEFF0]">
                {copy.benefits.map((benefit) => (
                  <li key={benefit}>{benefit}</li>
                ))}
              </ul>

              <Link
                href="/servicos/orcamento"
                className="inline-flex items-center justify-center bg-[#B8A042] text-black font-medium text-[16px] lg:text-[18px] w-full sm:w-[260px] h-[52px] lg:h-[56px] rounded-[12px] hover:bg-[#c9b04f] transition"
              >
                {copy.calculate}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#d3d2d1] text-black py-10 lg:py-14">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-16">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
            <Link href="/wessex" className="flex items-center">
              <img
                src="/images/wessex/logo/main-black.png"
                alt="Wessex"
                className="h-9 lg:h-11 w-auto"
              />
            </Link>
            <SocialIcons />
          </div>
          <div className="border-t border-black/20 pt-5 flex flex-col md:flex-row items-center justify-between gap-3 text-[14px] lg:text-[15px]">
            <p>{copy.copyright}</p>
            <Link href="/privacidade" className="hover:opacity-60 transition">
              {copy.privacy}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SocialIcons() {
  const socials = [
    {
      label: "Instagram",
      url: "https://www.instagram.com/wessex.pt/",
      path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z",
    },
  ];
  return (
    <div className="flex items-center gap-4 text-black">
      {socials.map((s) => (
        <a
          key={s.label}
          href={s.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={s.label}
          className="hover:opacity-60 transition"
        >
          <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d={s.path} />
          </svg>
        </a>
      ))}
    </div>
  );
}
