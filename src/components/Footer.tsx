import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function Footer() {
  const t = await getTranslations("SiteFooter");

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
                { name: "Easy Peasy", href: "/projetos/easy-peasy" },
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
                  className="text-xs text-wepac-white/50 transition-colors hover:text-wepac-white/60"
                >
                  Society
                </Link>
              </li>
              <li>
                <Link
                  href="/wepacker/login"
                  className="text-xs text-wepac-white/50 transition-colors hover:text-wepac-white/60"
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

        <div className="mt-12 border-t border-white/10 pt-8 flex flex-col items-center gap-2">
          <Link
            href="/privacidade"
            className="text-xs text-wepac-white/50 transition-colors hover:text-wepac-white/60"
          >
            {t("privacy")}
          </Link>
          <p className="text-xs text-wepac-white/50">
            &copy; {new Date().getFullYear()} WEPAC. {t("rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}
