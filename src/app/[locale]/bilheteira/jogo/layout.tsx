import { IBM_Plex_Serif, Rubik } from "next/font/google";
import "./game.css";

// Arte à Capela brandbook (PushUp Design, v1 2025-07-18): IBM Plex Serif
// Medium/Bold for titles, Rubik Regular/Medium/Bold for text. Scoped to this
// route so the files are not preloaded elsewhere.
const plexSerif = IBM_Plex_Serif({
  variable: "--font-plex-serif",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${plexSerif.variable} ${rubik.variable} game-root`}>{children}</div>;
}
