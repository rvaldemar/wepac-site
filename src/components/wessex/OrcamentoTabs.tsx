"use client";

import { useState, useRef, useEffect } from "react";
import { PricingCalculator } from "./PricingCalculator";
import { ChatAssistant } from "./ChatAssistant";

type Tab = "simulador" | "assistente";

export function OrcamentoTabs() {
  const [activeTab, setActiveTab] = useState<Tab>("simulador");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === "assistente" && containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [activeTab]);

  return (
    <div ref={containerRef} className="scroll-mt-20">
      <div className="sticky top-20 z-10 bg-wepac-dark flex border-b border-wepac-white/10">
        <button
          onClick={() => setActiveTab("simulador")}
          className={`px-4 md:px-6 py-3 font-barlow text-xs md:text-sm font-bold uppercase tracking-wider transition-colors ${
            activeTab === "simulador"
              ? "border-b-2 border-wepac-white text-wepac-white"
              : "text-wepac-white/40 hover:text-wepac-white/70"
          }`}
        >
          Simulador
        </button>
        <button
          onClick={() => setActiveTab("assistente")}
          className={`px-4 md:px-6 py-3 font-barlow text-xs md:text-sm font-bold uppercase tracking-wider transition-colors ${
            activeTab === "assistente"
              ? "border-b-2 border-wepac-white text-wepac-white"
              : "text-wepac-white/40 hover:text-wepac-white/70"
          }`}
        >
          Assistente
        </button>
      </div>

      <div className="mt-6">
        {activeTab === "simulador" ? <PricingCalculator /> : <ChatAssistant />}
      </div>
    </div>
  );
}
