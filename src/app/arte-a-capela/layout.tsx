import { Cormorant_Garamond } from "next/font/google";

// Cormorant Garamond is used only by this route (the serif treatment in
// page.tsx, applied via the `--font-cormorant` variable). Registering it
// here instead of the root layout keeps its two woff2 files (~77 KB) off
// every other route — including the authenticated WEPACKER platform, which
// never renders serif type — rather than preloading them on every page.
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

export default function ArteACapelaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={cormorant.variable}>{children}</div>;
}
