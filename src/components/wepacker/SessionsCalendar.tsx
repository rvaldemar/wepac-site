"use client";

import { useMemo, useState } from "react";
import {
  SESSION_KIND_COLOR,
  SESSION_KIND_GLYPH,
  SESSION_KIND_KEYS,
  SESSION_KIND_LABELS,
  type SessionKind,
} from "@/lib/wepacker/types";

// Minimal shape a session needs to appear on the calendar — both the
// member's and the mentor's session lists carry more fields, but only
// these are needed to place a pill on the right day and style it.
export interface CalendarSession {
  id: string;
  scheduledAt: string;
  kind: SessionKind;
  status: string;
}

interface SessionsCalendarProps {
  sessions: CalendarSession[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const WEEKDAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Monday-first weekday index (0=Mon .. 6=Sun) — JS Date.getDay() is
// Sunday-first (0=Sun .. 6=Sat).
function mondayFirstDay(d: Date): number {
  return (d.getDay() + 6) % 7;
}

export function SessionsCalendar({ sessions, selectedId, onSelect }: SessionsCalendarProps) {
  const today = new Date();
  const [cursor, setCursor] = useState(() => startOfMonth(today));

  const monthLabel = capitalize(
    cursor.toLocaleDateString("pt-PT", { month: "long", year: "numeric" })
  );

  const cells = useMemo(() => {
    const first = startOfMonth(cursor);
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const leadingBlanks = mondayFirstDay(first);
    const totalCells = Math.ceil((leadingBlanks + daysInMonth) / 7) * 7;

    return Array.from({ length: totalCells }, (_, i) => {
      const dayNumber = i - leadingBlanks + 1;
      const date = new Date(cursor.getFullYear(), cursor.getMonth(), dayNumber);
      const inMonth = dayNumber >= 1 && dayNumber <= daysInMonth;
      return { date, inMonth };
    });
  }, [cursor]);

  const sessionsByDay = useMemo(() => {
    const map = new Map<string, CalendarSession[]>();
    for (const s of sessions) {
      const d = new Date(s.scheduledAt);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const list = map.get(key) ?? [];
      list.push(s);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    }
    return map;
  }, [sessions]);

  function dayKey(d: Date): string {
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          className="px-3 py-1.5 text-sm text-wepac-text-secondary hover:text-wepac-white"
          aria-label="Mês anterior"
        >
          ‹
        </button>
        <div className="flex items-center gap-3">
          <p className="font-barlow text-sm font-bold text-wepac-white">{monthLabel}</p>
          <button
            onClick={() => setCursor(startOfMonth(today))}
            className="border border-wepac-border px-2 py-1 text-xs text-wepac-text-tertiary hover:text-wepac-white"
          >
            Hoje
          </button>
        </div>
        <button
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          className="px-3 py-1.5 text-sm text-wepac-text-secondary hover:text-wepac-white"
          aria-label="Mês seguinte"
        >
          ›
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-px bg-wepac-border text-center text-[10px] uppercase tracking-wide text-wepac-text-tertiary">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} className="bg-wepac-black py-1">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px bg-wepac-border">
        {cells.map(({ date, inMonth }) => {
          const daySessions = sessionsByDay.get(dayKey(date)) ?? [];
          const isToday = isSameDay(date, today);
          return (
            <div
              key={date.toISOString()}
              className={`min-h-20 sm:min-h-24 bg-wepac-card p-1 ${
                inMonth ? "" : "opacity-30"
              }`}
            >
              <p
                className={`text-[10px] ${
                  isToday
                    ? "inline-flex h-4 w-4 items-center justify-center bg-wepac-white text-wepac-black"
                    : "text-wepac-text-tertiary"
                }`}
              >
                {date.getDate()}
              </p>
              <div className="mt-1 space-y-0.5">
                {daySessions.map((s) => {
                  const time = new Date(s.scheduledAt).toLocaleTimeString("pt-PT", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  const label = SESSION_KIND_LABELS[s.kind]?.label ?? s.kind;
                  return (
                    <button
                      key={s.id}
                      onClick={() => onSelect(s.id)}
                      title={`${label} · ${time}`}
                      className={`flex w-full items-center gap-1 truncate px-1 py-0.5 text-left text-[10px] transition-colors ${
                        s.id === selectedId
                          ? "bg-wepac-white text-wepac-black"
                          : `bg-wepac-input text-wepac-text-secondary hover:bg-wepac-white/10 ${
                              s.status === "cancelled" ? "opacity-50" : ""
                            }`
                      }`}
                    >
                      <span className={s.id === selectedId ? "" : SESSION_KIND_COLOR[s.kind]}>
                        {SESSION_KIND_GLYPH[s.kind]}
                      </span>
                      <span className="truncate">{time}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
        {SESSION_KIND_KEYS.map((k) => (
          <div key={k} className="flex items-center gap-1 text-[11px] text-wepac-text-tertiary">
            <span className={SESSION_KIND_COLOR[k]}>{SESSION_KIND_GLYPH[k]}</span>
            {SESSION_KIND_LABELS[k].label}
          </div>
        ))}
      </div>
    </div>
  );
}
