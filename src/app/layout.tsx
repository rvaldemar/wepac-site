import type { Metadata } from "next";
import { Barlow, Inter, PT_Serif } from "next/font/google";
import { CookieConsent } from "@/components/CookieConsent";
import "./globals.css";

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

export const metadata: Metadata = {
  title: {
    default: "WEPAC",
    template: "%s | WEPAC",
  },
  description:
    "Unimos arte, formação e impacto social para valorizar o património e transformar vidas. Sons que inspiram.",
  keywords: [
    "WEPAC",
    "companhia de artes",
    "música",
    "educação artística",
    "impacto social",
    "Carcavelos",
    "Lisboa",
    "Portugal",
    "Easy Peasy",
    "Arte à Capela",
    "Wessex",
    "músicos para eventos",
    "música para casamentos",
    "quarteto de cordas",
    "concertos em igrejas",
    "educação musical",
    "desenvolvimento artístico",
    "programa artistas",
    "curadoria artística",
    "música clássica",
    "jazz",
    "fado",
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
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180" },
    ],
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "WEPAC",
    description: "Sons que inspiram. Arte, formação e impacto social.",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" className={`${barlow.variable} ${inter.variable} ${ptSerif.variable}`}>
      <body className="font-inter antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded focus:bg-wepac-white focus:px-4 focus:py-2 focus:text-wepac-black focus:font-semibold"
        >
          Saltar para o conteúdo
        </a>
        <main id="main">{children}</main>
        <CookieConsent />
      </body>
    </html>
  );
}
