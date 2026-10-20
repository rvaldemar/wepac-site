"use client";

import { useEffect, useState } from "react";

// Mobile-only buy bar. Hides while the ticket section itself is on screen so
// it never covers the form it points to.
export function StickyCta({ label, price }: { label: string; price: string | null }) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const target = document.getElementById("bilhetes");
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => setHidden(entry.isIntersecting), {
      rootMargin: "0px 0px -20% 0px",
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={[
        "fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/95 px-4 py-3 backdrop-blur lg:hidden",
        "transition-transform duration-200",
        hidden ? "translate-y-full" : "translate-y-0",
      ].join(" ")}
      aria-hidden={hidden}
    >
      <a
        href="#bilhetes"
        tabIndex={hidden ? -1 : 0}
        className="flex h-12 w-full items-center justify-between bg-black px-5 text-white"
      >
        <span className="text-[12px] font-bold uppercase tracking-[0.2em]">{label}</span>
        {price && <span className="font-barlow text-[18px] font-black">{price}</span>}
      </a>
    </div>
  );
}
