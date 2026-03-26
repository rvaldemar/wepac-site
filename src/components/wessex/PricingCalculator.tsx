"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ensembles,
  SERVICE_TYPE_LABELS,
  type ServiceType,
  type Ensemble,
} from "@/data/wessex-pricing";

const classicalEnsembles = ensembles.filter((e) => e.category === "classical");
const bandEnsembles = ensembles.filter((e) => e.category === "band");
const customEnsembles = ensembles.filter((e) => e.category === "custom");

export function PricingCalculator() {
  const [ensembleId, setEnsembleId] = useState("");
  const [serviceType, setServiceType] = useState<ServiceType | "">("");
  const [addSom, setAddSom] = useState(false);

  const selected: Ensemble | undefined = ensembles.find(
    (e) => e.id === ensembleId
  );
  const availableServices = selected
    ? (Object.keys(selected.prices) as ServiceType[])
    : [];

  // Reset service type if not available for selected ensemble
  const effectiveService =
    serviceType && availableServices.includes(serviceType) ? serviceType : "";

  const basePrice =
    selected && effectiveService ? selected.prices[effectiveService] ?? 0 : 0;
  const somPrice = addSom && selected?.id !== "som" ? 200 : 0;
  const totalPrice = basePrice + somPrice;
  const showPrice = selected && effectiveService && basePrice > 0;

  return (
    <div className="space-y-8">
      {/* Ensemble select */}
      <div>
        <label className="block text-sm font-bold uppercase tracking-wider text-wepac-white/40">
          Ensemble
        </label>
        <select
          value={ensembleId}
          onChange={(e) => {
            setEnsembleId(e.target.value);
            setServiceType("");
            setAddSom(false);
          }}
          className="mt-2 w-full border-b border-wepac-white/20 bg-transparent py-3 text-wepac-white outline-none transition-colors focus:border-wepac-white"
        >
          <option value="" className="bg-wepac-black">
            Selecione o ensemble
          </option>
          <optgroup label="Ensembles Classicos">
            {classicalEnsembles.map((e) => (
              <option key={e.id} value={e.id} className="bg-wepac-black">
                {e.name}
                {e.musicians ? ` (${e.musicians} Musicos)` : ""}
              </option>
            ))}
          </optgroup>
          <optgroup label="Bandas">
            {bandEnsembles.map((e) => (
              <option key={e.id} value={e.id} className="bg-wepac-black">
                {e.name}
                {e.musicians ? ` (${e.musicians} Musicos)` : ""}
              </option>
            ))}
          </optgroup>
          <optgroup label="Sob Consulta">
            {customEnsembles.map((e) => (
              <option key={e.id} value={e.id} className="bg-wepac-black">
                {e.name}
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      {/* Service type select */}
      {selected && !selected.quoteOnly && (
        <div>
          <label className="block text-sm font-bold uppercase tracking-wider text-wepac-white/40">
            Tipo de Servico
          </label>
          <select
            value={effectiveService}
            onChange={(e) => setServiceType(e.target.value as ServiceType)}
            className="mt-2 w-full border-b border-wepac-white/20 bg-transparent py-3 text-wepac-white outline-none transition-colors focus:border-wepac-white"
          >
            <option value="" className="bg-wepac-black">
              Selecione o tipo de servico
            </option>
            {availableServices.map((st) => (
              <option key={st} value={st} className="bg-wepac-black">
                {SERVICE_TYPE_LABELS[st]}
              </option>
            ))}
          </select>
          {selected.category === "band" && (
            <p className="mt-2 text-sm text-wepac-white/40">
              As bandas atuam apenas em formato Cocktails / Copo d&apos;Agua (2
              horas).
            </p>
          )}
        </div>
      )}

      {/* Add som */}
      {selected && selected.id !== "som" && !selected.quoteOnly && effectiveService && (
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={addSom}
            onChange={(e) => setAddSom(e.target.checked)}
            className="h-4 w-4 accent-wepac-white"
          />
          <span className="text-sm text-wepac-white/60">
            Adicionar Equipa de Som (+200€)
          </span>
        </label>
      )}

      {/* Quote-only display for custom services */}
      {selected?.quoteOnly && (
        <div className="border border-wepac-white/10 p-8 text-center">
          <p className="text-sm font-bold uppercase tracking-wider text-wepac-white/40">
            Orcamento sob consulta
          </p>
          <p className="mt-4 text-wepac-white/60 leading-relaxed">
            {selected.description}
          </p>
          <Link
            href={`/contacto?subject=servicos&message=${encodeURIComponent(
              `Pedido Wessex: ${selected.name} — gostaria de receber um orcamento personalizado.`
            )}`}
            className="mt-6 inline-block bg-wepac-white px-8 py-3 font-barlow text-sm font-bold uppercase tracking-wider text-wepac-black transition-opacity hover:opacity-90"
          >
            Pedir orcamento
          </Link>
        </div>
      )}

      {/* Price display */}
      {showPrice && (
        <div className="border border-wepac-white/10 p-8 text-center">
          <p className="text-sm font-bold uppercase tracking-wider text-wepac-white/40">
            Valor estimado
          </p>
          <p className="mt-3 font-barlow text-5xl font-bold text-wepac-white">
            {totalPrice}€
          </p>
          {selected.duration && (
            <p className="mt-2 text-sm text-wepac-white/40">
              Preco para {selected.duration} de performance
            </p>
          )}
          {addSom && (
            <p className="mt-1 text-sm text-wepac-white/40">
              Inclui Equipa de Som (200€)
            </p>
          )}
          <p className="mt-4 text-xs text-wepac-white/30">
            Eventos fora de Carcavelos/Lisboa sujeitos a taxa de deslocacao (custos Michelin + estadia se aplicavel).
          </p>

          <Link
            href={`/contacto?subject=servicos&message=${encodeURIComponent(
              `Orcamento Wessex: ${selected.name}${selected.musicians ? ` (${selected.musicians} musicos)` : ""} — ${SERVICE_TYPE_LABELS[effectiveService]} — ${totalPrice}€`
            )}`}
            className="mt-6 inline-block bg-wepac-white px-8 py-3 font-barlow text-sm font-bold uppercase tracking-wider text-wepac-black transition-opacity hover:opacity-90"
          >
            Pedir orcamento formal
          </Link>
        </div>
      )}
    </div>
  );
}
