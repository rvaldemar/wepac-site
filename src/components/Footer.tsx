import { getLocale, getTranslations } from "next-intl/server";
import { getLegalCopy } from "@/i18n/copy/institutional-legal";
import { Link } from "@/i18n/navigation";

export async function Footer() {
  const t = await getTranslations("SiteFooter");
  const legal = getLegalCopy(await getLocale());

  return (
    <footer className="bg-wepac-black border-t border-white/10">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:gap-12 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="font-barlow text-2xl font-bold text-wepac-white">
              wepac
            </Link>
            <p className="mt-2 text-sm text-wepac-white/50">{t("tagline")}</p>
            <p className="mt-4 text-sm text-wepac-white/50 leading-relaxed">
              {t("description")}
            </p>
          </div>

          {/* Áreas WEPAC */}
          <div>
            <h3 className="font-barlow text-sm font-bold uppercase tracking-wider text-wepac-white/60">
              {t("areas")}
            </h3>
            <ul className="mt-4 space-y-3">
              {[
                { name: "Wessex", href: "/servicos" },
                { name: "Arte à Capela", href: "/projetos/arte-a-capela" },
                { name: "WEPAC for Artists", href: "/artist" },
              ].map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-wepac-white/50 transition-colors hover:text-wepac-white"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Institucional */}
          <div>
            <h3 className="font-barlow text-sm font-bold uppercase tracking-wider text-wepac-white/60">
              {t("institutional")}
            </h3>
            <ul className="mt-4 space-y-3">
              {[
                { name: t("about"), href: "/sobre" },
                { name: t("agenda"), href: "/programacao" },
                { name: t("partnerships"), href: "/parcerias" },
                { name: t("contact"), href: "/contacto" },
              ].map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-wepac-white/50 transition-colors hover:text-wepac-white"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/society"
                  className="text-sm text-wepac-white/50 transition-colors hover:text-wepac-white"
                >
                  Society
                </Link>
              </li>
              <li>
                <Link
                  href="/wepacker/login"
                  className="text-sm font-semibold text-wepac-white/80 transition-colors hover:text-wepac-white"
                >
                  Login WEPACKER
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-barlow text-sm font-bold uppercase tracking-wider text-wepac-white/60">
              {t("contact")}
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-wepac-white/50">
              <li>
                <a href="mailto:info@wepac.pt" className="transition-colors hover:text-wepac-white">
                  info@wepac.pt
                </a>
              </li>
              <li>Carcavelos, Portugal</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-8 flex flex-col items-center gap-3">
          <nav aria-label={legal.footer.privacy} className="flex flex-wrap justify-center gap-x-5 gap-y-2">
            {[
              { name: legal.footer.privacy, href: "/privacidade" },
              { name: legal.footer.cookies, href: "/cookies" },
              { name: legal.footer.terms, href: "/termos" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-xs text-wepac-white/50 transition-colors hover:text-wepac-white"
              >
                {item.name}
              </Link>
            ))}
            <a
              href="https://www.livroreclamacoes.pt/Inicio/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-wepac-white/50 transition-colors hover:text-wepac-white"
            >
              {legal.footer.complaints}
            </a>
          </nav>
          <p className="text-xs text-wepac-white/50">
            &copy; {new Date().getFullYear()} WEPAC — Companhia de Artes, Lda · NIPC 518 267 342. {t("rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}
