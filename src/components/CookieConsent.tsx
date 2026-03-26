"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) setVisible(true);
  }, []);

  function handleAccept() {
    localStorage.setItem("cookie_consent", "accepted");
    setVisible(false);
  }

  function handleReject() {
    localStorage.setItem("cookie_consent", "rejected");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-wepac-white/10 bg-wepac-black/95 backdrop-blur-md px-6 py-4">
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-wepac-white/60 leading-relaxed">
          Utilizamos cookies essenciais para o funcionamento do site.{" "}
          <Link
            href="/privacidade"
            className="text-wepac-gray underline hover:text-wepac-white"
          >
            Politica de Privacidade
          </Link>
        </p>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={handleReject}
            className="border border-wepac-white/20 px-4 py-1.5 text-xs text-wepac-white/50 transition-colors hover:text-wepac-white"
          >
            Recusar
          </button>
          <button
            onClick={handleAccept}
            className="bg-wepac-white px-4 py-1.5 text-xs font-bold text-wepac-black transition-opacity hover:opacity-90"
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
}
