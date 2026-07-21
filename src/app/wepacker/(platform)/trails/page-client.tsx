"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import {
  AREA_LABELS,
  TRAIL_STATUS_LABELS,
  type AreaKey,
  type TrailStatus,
} from "@/lib/wepacker/types";
import { createTrail } from "@/lib/wepacker/actions/trail";
import { friendlySubmitError } from "@/lib/stale-deployment";

interface Trail {
  id: string;
  title: string;
  purpose: string;
  whyItMatters: string;
  destination: string;
  areas: AreaKey[];
  status: TrailStatus;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  userId: string;
  trails: Trail[];
}

const STATUS_TABS: Array<{ key: TrailStatus; label: string }> = [
  { key: "active", label: "Ativos" },
  { key: "paused", label: "Pausados" },
  { key: "completed", label: "Concluídos" },
  { key: "abandoned", label: "Abandonados" },
];

const STATUS_COLORS: Record<TrailStatus, string> = {
  active: "bg-wepac-success-bg text-wepac-success",
  paused: "bg-wepac-white/10 text-wepac-white",
  completed: "bg-wepac-white/10 text-wepac-white",
  abandoned: "bg-wepac-input text-wepac-text-tertiary",
};

export default function TrailsPageClient({ userId, trails }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TrailStatus>("active");
  const [showForm, setShowForm] = useState(false);

  const tabTrails = trails.filter((t) => t.status === activeTab);

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-barlow text-2xl font-bold text-wepac-white">Trails</h1>
          <p className="mt-1 text-sm text-wepac-text-tertiary">
            As tuas travessias pessoais de transformação.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-wepac-white px-4 py-2 text-sm font-bold text-wepac-black transition-colors hover:bg-wepac-accent-muted"
        >
          {showForm ? "Cancelar" : "+ Novo Trail"}
        </button>
      </div>

      {showForm && (
        <div className="mt-6">
          <TrailSetupForm
            userId={userId}
            onCreated={() => {
              setShowForm(false);
              router.refresh();
            }}
          />
        </div>
      )}

      {/* Tab navigation */}
      <div className="mt-8 flex gap-1 overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`whitespace-nowrap px-4 py-2 text-sm transition-colors ${
              activeTab === tab.key
                ? "bg-wepac-white text-wepac-black"
                : "bg-wepac-card text-wepac-text-tertiary hover:text-wepac-text-secondary"
            }`}
          >
            {tab.label}
            <span className="ml-2 text-xs opacity-60">
              {trails.filter((t) => t.status === tab.key).length}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {tabTrails.length === 0 && (
          <p className="text-sm text-wepac-text-tertiary">
            Ainda sem Trails {STATUS_TABS.find((t) => t.key === activeTab)?.label.toLowerCase()}.
          </p>
        )}
        {tabTrails.map((trail) => (
          <Link
            key={trail.id}
            href={`/wepacker/trails/${trail.id}`}
            className="block border border-wepac-border bg-wepac-card p-5 transition-colors hover:border-wepac-white/30"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-barlow text-lg font-bold text-wepac-white">{trail.title}</h3>
              <span className={`whitespace-nowrap px-2 py-0.5 text-xs ${STATUS_COLORS[trail.status]}`}>
                {TRAIL_STATUS_LABELS[trail.status]}
              </span>
            </div>
            {trail.purpose && (
              <p className="mt-2 line-clamp-2 text-sm text-wepac-text-secondary">{trail.purpose}</p>
            )}
            {trail.areas.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {trail.areas.map((a) => (
                  <span key={a} className="bg-wepac-white/10 px-2 py-0.5 text-xs text-wepac-white">
                    {AREA_LABELS[a]}
                  </span>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

function TrailSetupForm({
  userId,
  onCreated,
}: {
  userId: string;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [purpose, setPurpose] = useState("");
  const [whyItMatters, setWhyItMatters] = useState("");
  const [destination, setDestination] = useState("");
  const [areas, setAreas] = useState<AreaKey[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleArea(area: AreaKey) {
    setAreas((prev) => (prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]));
  }

  return (
    <div className="space-y-4 border border-wepac-border bg-wepac-card p-6">
      <div>
        <label className="block text-sm text-wepac-text-secondary">Título</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Como se chama esta travessia?"
          className="mt-1 w-full bg-wepac-input px-4 py-3 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-white/50"
        />
      </div>
      <div>
        <label className="block text-sm text-wepac-text-secondary">Propósito</label>
        <textarea
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          rows={3}
          placeholder="O que estás a tentar alcançar?"
          className="mt-1 w-full bg-wepac-input px-4 py-3 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-white/50"
        />
      </div>
      <div>
        <label className="block text-sm text-wepac-text-secondary">Porque importa agora</label>
        <textarea
          value={whyItMatters}
          onChange={(e) => setWhyItMatters(e.target.value)}
          rows={3}
          placeholder="Porque é este o momento certo para esta travessia?"
          className="mt-1 w-full bg-wepac-input px-4 py-3 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-white/50"
        />
      </div>
      <div>
        <label className="block text-sm text-wepac-text-secondary">Como seria progresso real</label>
        <textarea
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          rows={3}
          placeholder="Como sabes que chegaste lá?"
          className="mt-1 w-full bg-wepac-input px-4 py-3 text-sm text-wepac-white outline-none focus:ring-1 focus:ring-wepac-white/50"
        />
      </div>
      <div>
        <label className="block text-sm text-wepac-text-secondary">Pillars touched</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {(Object.keys(AREA_LABELS) as AreaKey[]).map((area) => (
            <button
              key={area}
              type="button"
              onClick={() => toggleArea(area)}
              className={`px-3 py-1 text-xs transition-colors ${
                areas.includes(area)
                  ? "bg-wepac-white text-wepac-black"
                  : "bg-wepac-input text-wepac-text-tertiary"
              }`}
            >
              {AREA_LABELS[area]}
            </button>
          ))}
        </div>
      </div>
      {error && <p className="text-xs text-wepac-error">{error}</p>}
      <button
        disabled={saving || !title.trim()}
        onClick={async () => {
          setSaving(true);
          setError(null);
          try {
            await createTrail(userId, {
              title: title.trim(),
              purpose,
              whyItMatters,
              destination,
              areas,
            });
            onCreated();
          } catch (e) {
            setError(friendlySubmitError(e, "Erro ao criar Trail. Tenta novamente."));
          } finally {
            setSaving(false);
          }
        }}
        className="bg-wepac-white px-6 py-3 text-sm font-bold text-wepac-black transition-colors hover:bg-wepac-accent-muted disabled:opacity-50"
      >
        {saving ? "A criar..." : "Criar Trail"}
      </button>
    </div>
  );
}
