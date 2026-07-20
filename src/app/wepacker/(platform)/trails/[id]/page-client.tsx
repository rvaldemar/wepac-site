"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import {
  AREA_LABELS,
  TRAIL_STATUS_LABELS,
  type AreaKey,
  type TrailStatus,
} from "@/lib/wepacker/types";
import { updateTrailStatus } from "@/lib/wepacker/actions/trail";
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
  trail: Trail;
}

const STATUS_OPTIONS: TrailStatus[] = ["active", "paused", "completed", "abandoned"];

export default function TrailDetailPageClient({ trail }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<TrailStatus>(trail.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStatusChange(next: TrailStatus) {
    setStatus(next);
    setSaving(true);
    setError(null);
    try {
      await updateTrailStatus(trail.id, next);
      router.refresh();
    } catch (e) {
      setStatus(trail.status);
      setError(friendlySubmitError(e, "Erro ao mudar o estado. Tenta novamente."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <Link
        href="/wepacker/trails"
        className="text-sm text-wepac-text-tertiary hover:text-wepac-text-secondary"
      >
        ← Voltar aos Trails
      </Link>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-barlow text-2xl font-bold text-wepac-white">{trail.title}</h1>
        <div className="flex items-center gap-2">
          <label className="text-xs text-wepac-text-tertiary">Estado</label>
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value as TrailStatus)}
            disabled={saving}
            className="bg-wepac-input px-3 py-1.5 text-xs text-wepac-white outline-none disabled:opacity-50"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {TRAIL_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-wepac-error">{error}</p>}

      {trail.areas.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {trail.areas.map((a) => (
            <span key={a} className="bg-wepac-white/10 px-2 py-0.5 text-xs text-wepac-white">
              {AREA_LABELS[a]}
            </span>
          ))}
        </div>
      )}

      <div className="mt-8 space-y-6">
        <div className="border border-wepac-border bg-wepac-card p-6">
          <h2 className="text-xs font-bold uppercase tracking-wide text-wepac-text-tertiary">
            Propósito
          </h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-wepac-text-secondary">
            {trail.purpose || "Ainda por preencher."}
          </p>
        </div>
        <div className="border border-wepac-border bg-wepac-card p-6">
          <h2 className="text-xs font-bold uppercase tracking-wide text-wepac-text-tertiary">
            Porque importa agora
          </h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-wepac-text-secondary">
            {trail.whyItMatters || "Ainda por preencher."}
          </p>
        </div>
        <div className="border border-wepac-border bg-wepac-card p-6">
          <h2 className="text-xs font-bold uppercase tracking-wide text-wepac-text-tertiary">
            Como seria progresso real
          </h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-wepac-text-secondary">
            {trail.destination || "Ainda por preencher."}
          </p>
        </div>
      </div>
    </div>
  );
}
