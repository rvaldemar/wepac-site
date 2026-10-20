import { Barlow_Condensed } from "next/font/google";

// Campaign display face, loaded only by the event pages that use a
// condensed title theme.
export const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

export const CONDENSED = "font-[family-name:var(--font-barlow-condensed)]";
