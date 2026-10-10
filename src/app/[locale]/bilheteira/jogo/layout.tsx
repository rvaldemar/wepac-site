import { Cormorant_Garamond } from "next/font/google";
import "./game.css";

// Same serif as the Arte à Capela landing; scoped to this route so the woff2
// files are not preloaded on every page.
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${cormorant.variable} game-root`}>{children}</div>;
}
