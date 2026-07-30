"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { getWessexCopy } from "@/i18n/copy/institutional-wessex";
import {
  ensembles,
  type ServiceType,
  type Ensemble,
} from "@/data/wessex-pricing";

const classicalEnsembles = ensembles.filter((e) => e.category === "classical");
const bandEnsembles = ensembles.filter((e) => e.category === "band");
const customEnsembles = ensembles.filter((e) => e.category === "custom");

export function PricingCalculator() {
  const locale = useLocale();
  const copy = getWessexCopy(locale).calculator;
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
  const ensembleName = (ensemble: Ensemble) =>
    copy.ensembleNames[ensemble.id] ?? ensemble.name;
  const ensembleDescription = (ensemble: Ensemble) =>
    copy.ensembleDescriptions[ensemble.id] ?? ensemble.description;
  const serviceLabel = (service: ServiceType) =>
    selected?.category === "band" && service === "cocktails"
      ? copy.bandCocktail
      : copy.serviceLabels[service];
  const formattedTotal = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(totalPrice);

  return (
    <div className="space-y-8">
      {/* Ensemble select */}
      <div>
        <label className="block text-sm font-bold uppercase tracking-wider text-wepac-white/50">
          {copy.ensemble}
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
            {copy.selectEnsemble}
          </option>
          <optgroup label={copy.classical}>
            {classicalEnsembles.map((e) => (
              <option key={e.id} value={e.id} className="bg-wepac-black">
                {ensembleName(e)}
                {e.musicians ? ` (${copy.musicians(e.musicians)})` : ""}
              </option>
            ))}
          </optgroup>
          <optgroup label={copy.bands}>
            {bandEnsembles.map((e) => (
              <option key={e.id} value={e.id} className="bg-wepac-black">
                {ensembleName(e)}
                {e.musicians ? ` (${copy.musicians(e.musicians)})` : ""}
              </option>
            ))}
          </optgroup>
          <optgroup label={copy.onRequest}>
            {customEnsembles.map((e) => (
              <option key={e.id} value={e.id} className="bg-wepac-black">
                {ensembleName(e)}
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      {/* Service type select */}
      {selected && !selected.quoteOnly && (
        <div>
          <label className="block text-sm font-bold uppercase tracking-wider text-wepac-white/50">
            {copy.serviceType}
          </label>
          <select
            value={effectiveService}
            onChange={(e) => setServiceType(e.target.value as ServiceType)}
            className="mt-2 w-full border-b border-wepac-white/20 bg-transparent py-3 text-wepac-white outline-none transition-colors focus:border-wepac-white"
          >
            <option value="" className="bg-wepac-black">
              {copy.selectService}
            </option>
            {availableServices.map((st) => {
              return (
                <option key={st} value={st} className="bg-wepac-black">
                  {serviceLabel(st)}
                </option>
              );
            })}
          </select>
          {selected.category === "band" && (
            <p className="mt-2 text-sm text-wepac-white/50">
              {copy.bandNote}
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
            {copy.addSound}
          </span>
        </label>
      )}

      {/* Quote-only display for custom services */}
      {selected?.quoteOnly && (
        <div className="border border-wepac-white/10 p-5 md:p-8 text-center">
          <p className="text-sm font-bold uppercase tracking-wider text-wepac-white/50">
            {copy.quoteOnRequest}
          </p>
          <p className="mt-4 text-wepac-white/60 leading-relaxed">
            {ensembleDescription(selected)}
          </p>
          <Link
            href={`/contacto?subject=servicos&message=${encodeURIComponent(
              copy.customRequest(ensembleName(selected))
            )}`}
            className="mt-6 inline-block bg-wepac-white px-8 py-3 font-barlow text-sm font-bold uppercase tracking-wider text-wepac-black transition-opacity hover:opacity-90"
          >
            {copy.requestQuote}
          </Link>
        </div>
      )}

      {/* Price display */}
      {showPrice && (
        <div className="border border-wepac-white/10 p-5 md:p-8 text-center">
          <p className="text-sm font-bold uppercase tracking-wider text-wepac-white/50">
            {copy.estimated}
          </p>
          <p className="mt-3 font-barlow text-4xl md:text-5xl font-bold text-wepac-white">
            {formattedTotal}
          </p>
          {selected.duration && (
            <p className="mt-2 text-sm text-wepac-white/50">
              {copy.performancePrice(
                selected.duration === "2 horas"
                  ? copy.durationTwoHours
                  : selected.duration,
              )}
            </p>
          )}
          {addSom && (
            <p className="mt-1 text-sm text-wepac-white/50">
              {copy.includesSound}
            </p>
          )}
          <p className="mt-4 text-xs text-wepac-white/50">
            {copy.travel}
          </p>

          <Link
            href={`/contacto?subject=servicos&ensemble=${encodeURIComponent(
              `${ensembleName(selected)}${selected.musicians ? ` (${copy.musicians(selected.musicians)})` : ""}`
            )}&service=${encodeURIComponent(serviceLabel(effectiveService))}&som=${addSom ? "1" : "0"}&total=${totalPrice}&message=${encodeURIComponent(
              copy.orderMessage(
                ensembleName(selected),
                selected.musicians
                  ? ` (${copy.musicians(selected.musicians)})`
                  : "",
                serviceLabel(effectiveService),
                addSom,
                totalPrice,
              )
            )}`}
            className="mt-6 inline-block bg-wepac-white px-8 py-3 font-barlow text-sm font-bold uppercase tracking-wider text-wepac-black transition-opacity hover:opacity-90"
          >
            {copy.order}
          </Link>
        </div>
      )}
    </div>
  );
}
