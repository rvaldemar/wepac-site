"use client";

import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { useState } from "react";
import { useLocale } from "next-intl";
import { wp } from "@/i18n/copy/wepacker";
import {
  PILLAR_LABELS,
  TRAIL_STATUS_LABELS,
  type PillarKey,
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
  areas: PillarKey[];
  status: TrailStatus;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  trail: Trail;
}

const STATUS_OPTIONS: TrailStatus[] = ["active", "paused", "completed", "abandoned"];

export default function TrailDetailPageClient({ trail }: Props) {
  const locale = useLocale();
  const router = useRouter();
  const [status, setStatus] = useState<TrailStatus>(trail.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const statusLabels: Record<TrailStatus, string> = {
    active: wp(locale, "Ativo", "Active"),
    paused: wp(locale, "Pausado", "Paused"),
    completed: wp(locale, "Concluído", "Completed"),
    abandoned: wp(locale, "Abandonado", "Abandoned"),
  };

  async function handleStatusChange(next: TrailStatus) {
    setStatus(next);
    setSaving(true);
    setError(null);
    try {
      await updateTrailStatus(trail.id, next);
      router.refresh();
    } catch (e) {
      setStatus(trail.status);
      setError(
        friendlySubmitError(
          e,
          wp(
            locale,
            "Erro ao mudar o estado. Tenta novamente.",
            "Could not change the status. Please try again.",
          ),
        ),
      );
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
        ← {wp(locale, "Voltar aos Trails", "Back to Trails")}
      </Link>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-barlow text-2xl font-bold text-wepac-white">{trail.title}</h1>
        <div className="flex items-center gap-2">
          <label className="text-xs text-wepac-text-tertiary">
            {wp(locale, "Estado", "Status")}
          </label>
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value as TrailStatus)}
            disabled={saving}
            className="bg-wepac-input px-3 py-1.5 text-xs text-wepac-white outline-none disabled:opacity-50"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {statusLabels[s] ?? TRAIL_STATUS_LABELS[s]}
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
              {PILLAR_LABELS[a]}
            </span>
          ))}
        </div>
      )}

      <div className="mt-8 space-y-6">
        <div className="border border-wepac-border bg-wepac-card p-6">
          <h2 className="text-xs font-bold uppercase tracking-wide text-wepac-text-tertiary">
            {wp(locale, "Propósito", "Purpose")}
          </h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-wepac-text-secondary">
            {trail.purpose ||
              wp(locale, "Ainda por preencher.", "Not filled in yet.")}
          </p>
        </div>
        <div className="border border-wepac-border bg-wepac-card p-6">
          <h2 className="text-xs font-bold uppercase tracking-wide text-wepac-text-tertiary">
            {wp(locale, "Porque importa agora", "Why it matters now")}
          </h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-wepac-text-secondary">
            {trail.whyItMatters ||
              wp(locale, "Ainda por preencher.", "Not filled in yet.")}
          </p>
        </div>
        <div className="border border-wepac-border bg-wepac-card p-6">
          <h2 className="text-xs font-bold uppercase tracking-wide text-wepac-text-tertiary">
            {wp(
              locale,
              "Como seria progresso real",
              "What real progress looks like",
            )}
          </h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-wepac-text-secondary">
            {trail.destination ||
              wp(locale, "Ainda por preencher.", "Not filled in yet.")}
          </p>
        </div>
      </div>
    </div>
  );
}
