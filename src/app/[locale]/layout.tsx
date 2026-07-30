import type { Metadata } from "next";
import { Barlow, Inter, PT_Serif } from "next/font/google";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { notFound } from "next/navigation";
import { CookieConsent } from "@/components/CookieConsent";
import { routing } from "@/i18n/routing";
import "../globals.css";

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["700", "900"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const ptSerif = PT_Serif({
  variable: "--font-pt-serif",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

type LocaleLayoutProps = Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: Pick<LocaleLayoutProps, "params">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const t = await getTranslations({ locale, namespace: "Metadata" });
  const openGraphLocale = locale === "pt-PT" ? "pt_PT" : "en_US";
  const alternateOpenGraphLocale = locale === "pt-PT" ? "en_US" : "pt_PT";

  return {
    metadataBase: new URL("https://wepac.pt"),
    title: {
      default: t("title"),
      template: `%s | ${t("title")}`,
    },
    description: t("description"),
    keywords: [
      "WEPAC",
      "Life Plan",
      "WEPAC Society",
      "WEPAC Academy",
      "WEPACKER",
      "education",
      "educação",
      "family",
      "família",
      "Carcavelos",
      "Portugal",
      "Easy Peasy",
      "Arte à Capela",
      "Wessex",
    ],
    alternates: {
      types: {
        "text/plain": [
          { url: "/llms.txt", title: "LLM documentation" },
          { url: "/llms-full.txt", title: "LLM full documentation" },
        ],
      },
    },
    icons: {
      icon: [{ url: "/favicon.ico", sizes: "48x48" }],
      apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
    },
    manifest: "/manifest.json",
    openGraph: {
      title: t("openGraphTitle"),
      description: t("openGraphDescription"),
      type: "website",
      locale: openGraphLocale,
      alternateLocale: [alternateOpenGraphLocale],
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
}

export default async function RootLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);
  const [messages, t] = await Promise.all([
    getMessages({ locale }),
    getTranslations({ locale, namespace: "Common" }),
  ]);

  return (
    <html
      lang={locale}
      className={`${barlow.variable} ${inter.variable} ${ptSerif.variable}`}
    >
      <body className="font-inter antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded focus:bg-wepac-white focus:px-4 focus:py-2 focus:text-wepac-black focus:font-semibold"
          >
            {t("skipToContent")}
          </a>
          {/* Skip-link target only — several routes render their own <main>,
              so this wrapper must not be a landmark itself. */}
          <div id="main">{children}</div>
          <CookieConsent />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
