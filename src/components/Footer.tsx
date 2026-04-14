import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-wepac-black border-t border-white/10">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:gap-12 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="font-barlow text-2xl font-bold text-wepac-white">
              wepac
            </Link>
            <p className="mt-2 text-sm text-wepac-white/50">Companhia de Artes</p>
            <p className="mt-4 text-sm text-wepac-white/40 leading-relaxed">
              Arte, educação e impacto social.
            </p>
          </div>

          {/* Departamentos */}
          <div>
            <h3 className="font-barlow text-sm font-bold uppercase tracking-wider text-wepac-white/60">
              Departamentos
            </h3>
            <ul className="mt-4 space-y-3">
              {[
                { name: "Wessex", href: "/servicos" },
                { name: "Easy Peasy", href: "/projetos/easy-peasy" },
                { name: "Arte à Capela", href: "/projetos/arte-a-capela" },
                { name: "Programa Artistas", href: "/artist" },
              ].map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-wepac-white/40 transition-colors hover:text-wepac-white"
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
              Institucional
            </h3>
            <ul className="mt-4 space-y-3">
              {[
                { name: "A WEPAC", href: "/sobre" },
                { name: "Agenda", href: "/programacao" },
                { name: "Parcerias", href: "/parcerias" },
                { name: "Contacto", href: "/contacto" },
              ].map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-wepac-white/40 transition-colors hover:text-wepac-white"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/artists/alpha/login"
                  className="text-sm text-wepac-white/30 transition-colors hover:text-wepac-white/60"
                >
                  Login Artistas
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-barlow text-sm font-bold uppercase tracking-wider text-wepac-white/60">
              Contacto
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-wepac-white/40">
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
            className="text-xs text-wepac-white/30 transition-colors hover:text-wepac-white/60"
          >
            Política de Privacidade
          </Link>
          <p className="text-xs text-wepac-white/30">
            &copy; {new Date().getFullYear()} WEPAC — Companhia de Artes. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
