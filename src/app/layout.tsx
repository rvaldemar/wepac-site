import type { Metadata } from "next";
import { Barlow, Inter, Cormorant_Garamond } from "next/font/google";
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
  weight: ["300", "400", "700"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "WEPAC — Companhia de Artes",
    template: "%s | WEPAC",
  },
  description:
    "Unimos arte, formação e impacto social para valorizar o património e transformar vidas. Sons que inspiram.",
  keywords: [
    "WEPAC",
    "companhia de artes",
    "música",
    "educação",
    "impacto social",
    "Braga",
    "Easy Peasy",
    "Arte à Capela",
    "Wessex",
  ],
  openGraph: {
    title: "WEPAC — Companhia de Artes",
    description: "Sons que inspiram. Arte, formação e impacto social.",
    type: "website",
    locale: "pt_PT",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" className={`${barlow.variable} ${inter.variable} ${cormorant.variable}`}>
      <body className="font-inter antialiased">
        {children}
      </body>
    </html>
  );
}
