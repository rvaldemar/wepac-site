"use client";

import { useState } from "react";
import { resetCookieConsent } from "@/components/CookieConsent";

export function CookiePreferencesButton({ label, done }: { label: string; done: string }) {
  const [cleared, setCleared] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => {
          resetCookieConsent();
          setCleared(true);
        }}
        className="border border-wepac-white/30 px-5 py-2.5 text-sm font-semibold text-wepac-white transition hover:border-wepac-white"
      >
        {label}
      </button>
      {cleared && (
        <p role="status" className="mt-3 text-wepac-white/60">
          {done}
        </p>
      )}
    </div>
  );
}
