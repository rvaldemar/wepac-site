"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PrizeKind } from "@prisma/client";
import { getGameCopy } from "@/i18n/copy/institutional-game";
import {
  lookupTicketForGame,
  playAction,
  type PersonDetails,
  type PlayIdentity,
  type PlayResult,
  type TicketLookupResult,
} from "@/lib/bilheteira/game/actions";
import { EMAIL_RE } from "@/lib/bilheteira/game/email-mask";
import { AttractScreen } from "./attract-screen";
import { Confetti } from "./confetti";
import { PrizeWheel, type WheelHandle } from "./prize-wheel";
import { QrStep } from "./qr-step";

type Found = Extract<TicketLookupResult, { ok: true }>;

type Step =
  | { name: "attract" }
  | { name: "identify" }
  | { name: "ticket_panel"; ticket: Found }
  | { name: "details"; ticket: Found | null }
  | { name: "consent"; identity: PlayIdentity; ticket: Found | null }
  | { name: "wheel"; identity: PlayIdentity; marketingConsent: boolean; ticket: Found | null }
  | { name: "result"; result: Extract<PlayResult, { ok: true }>; ticket: Found | null }
  | { name: "already_played"; kind: PrizeKind; code: string | null; resent: boolean; maskedEmail: string; ticket: Found | null }
  | { name: "error"; message: string };

const PHONE_RE = /^\+?[0-9 ()-]{6,20}$/;

const IDLE_RESET_MS = 75_000;

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden><path d="M5 12.5l4.2 4.2L19 7.5" /></svg>
);
const RESULT_RESET_S = 45;

function formatDate(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    timeZone: "Europe/Lisbon",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

function requestFullscreen() {
  // Older iPad Safari returns undefined (not a Promise) from the webkit
  // variant, and some kiosks block the API entirely; never let it throw.
  try {
    const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => unknown };
    const fn = el.requestFullscreen ?? el.webkitRequestFullscreen;
    if (!fn || document.fullscreenElement) return;
    const p = fn.call(el) as unknown;
    if (p && typeof (p as Promise<void>).catch === "function") (p as Promise<void>).catch(() => undefined);
  } catch {
    // ignore
  }
}

export function GameClient({ locale }: { locale: string }) {
  const copy = getGameCopy(locale);
  const [step, setStep] = useState<Step>({ name: "attract" });
  const [termsOpen, setTermsOpen] = useState(false);
  const wheelRef = useRef<WheelHandle | null>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spinningRef = useRef(false);
  const [busy, setBusy] = useState(false);

  const reset = useCallback(() => {
    setTermsOpen(false);
    setStep({ name: "attract" });
  }, []);

  // Idle watchdog: any inactivity outside the attract screen returns the kiosk
  // to the attract loop so the next visitor never sees someone else's data.
  useEffect(() => {
    if (step.name === "attract") return;
    const arm = () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => {
        if (!spinningRef.current) reset();
      }, IDLE_RESET_MS);
    };
    arm();
    const events: (keyof WindowEventMap)[] = ["pointerdown", "keydown", "touchstart"];
    events.forEach((e) => window.addEventListener(e, arm));
    return () => {
      events.forEach((e) => window.removeEventListener(e, arm));
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [step.name, reset]);

  const start = () => {
    requestFullscreen();
    setStep({ name: "identify" });
  };

  // After a spin on a ticket, refresh the ticket so the panel shows the
  // remaining spins; fall back to the attract loop if the lookup fails.
  const nextPlayer = async (ticket: Found) => {
    try {
      const fresh = await lookupTicketForGame(ticket.ticketId);
      if (fresh.ok) setStep({ name: "ticket_panel", ticket: fresh });
      else reset();
    } catch {
      reset();
    }
  };

  const spin = async (identity: PlayIdentity, marketingConsent: boolean, ticket: Found | null) => {
    if (spinningRef.current) return;
    spinningRef.current = true;
    setBusy(true);
    try {
      const result = await playAction({ identity, termsAccepted: true, marketingConsent, locale });
      if (result.ok) {
        await wheelRef.current?.spinTo(result.kind);
        setStep({ name: "result", result, ticket });
      } else if (result.error === "already_played") {
        setStep({ name: "already_played", kind: result.kind, code: result.code, resent: result.resent, maskedEmail: result.maskedEmail, ticket });
      } else {
        const message =
          result.error === "rate_limited" ? copy.errors.rateLimited
          : result.error === "locked" ? copy.errors.locked
          : result.error === "ticket_not_found" ? copy.identify.lookupError
          : result.error === "ticket_exhausted" ? copy.errors.ticketExhausted
          : result.error === "invalid_email" ? copy.details.invalidEmail
          : result.error === "invalid_name" ? copy.details.invalidName
          : result.error === "invalid_phone" ? copy.details.invalidPhone
          : result.error === "terms_required" ? copy.consent.termsRequired
          : copy.errors.generic;
        setStep({ name: "error", message });
      }
    } catch {
      setStep({ name: "error", message: copy.errors.generic });
    } finally {
      spinningRef.current = false;
      setBusy(false);
    }
  };

  if (step.name === "attract") return <AttractScreen copy={copy} onStart={start} />;

  return (
    <main className="game-stage">
      {step.name === "identify" && (
        <QrStep
          copy={copy}
          onBack={reset}
          onNoTicket={() => setStep({ name: "details", ticket: null })}
          onFound={(ticket) => setStep({ name: "ticket_panel", ticket })}
        />
      )}

      {step.name === "ticket_panel" && (() => {
        const t = step.ticket;
        const left = Math.max(0, t.seats - t.spinsUsed);
        return (
          <section className="step">
            <button type="button" className="game-btn game-btn--text step__back" onClick={reset}>← {copy.identify.back}</button>
            <p className="game-eyebrow">{t.eventTitle}</p>
            <h2 className="game-serif game-h2">{copy.ticketPanel.title}</h2>
            <p className="game-body">
              {t.buyerName} · {copy.ticketPanel.seats(t.seats)} · {copy.ticketPanel.spinsLeft(left, t.seats)}
            </p>
            {left === 0 ? (
              <p className="game-body" style={{ color: "var(--g-red-on-dark)" }}>{copy.ticketPanel.exhausted}</p>
            ) : (
              <div className="game-actions" style={{ flexDirection: "column", alignItems: "center" }}>
                {!t.buyerPlayed && (
                  <>
                    <button
                      type="button"
                      className="game-btn game-btn--primary"
                      onClick={() => setStep({ name: "consent", identity: { mode: "ticket", ticketId: t.ticketId }, ticket: t })}
                    >
                      {copy.ticketPanel.me(t.buyerName)}
                    </button>
                    <span className="result__meta" style={{ marginTop: 0 }}>{copy.ticketPanel.meHint(t.maskedEmail)}</span>
                  </>
                )}
                {t.buyerPlayed && <span className="result__meta">{copy.ticketPanel.mePlayed}</span>}
                {t.seats > 1 && (
                  <>
                    <button type="button" className="game-btn game-btn--cream" onClick={() => setStep({ name: "details", ticket: t })}>
                      {copy.ticketPanel.companion}
                    </button>
                    <span className="result__meta" style={{ marginTop: 0 }}>{copy.ticketPanel.companionHint}</span>
                  </>
                )}
              </div>
            )}
            <div className="game-actions">
              <button type="button" className="game-btn game-btn--text" onClick={() => setStep({ name: "details", ticket: null })}>
                {copy.ticketPanel.otherEmail}
              </button>
            </div>
          </section>
        );
      })()}

      {step.name === "details" && (
        <DetailsStep
          copy={copy}
          companion={step.ticket !== null}
          onBack={() => setStep(step.ticket ? { name: "ticket_panel", ticket: step.ticket } : { name: "identify" })}
          onNext={(person) =>
            setStep({
              name: "consent",
              identity: step.ticket
                ? { mode: "ticket", ticketId: step.ticket.ticketId, companion: person }
                : { mode: "email", person },
              ticket: step.ticket,
            })
          }
        />
      )}

      {step.name === "consent" && (
        <ConsentStep
          copy={copy}
          termsOpen={termsOpen}
          setTermsOpen={setTermsOpen}
          onBack={() =>
            setStep(
              step.identity.mode === "ticket" && !step.identity.companion && step.ticket
                ? { name: "ticket_panel", ticket: step.ticket }
                : { name: "details", ticket: step.ticket },
            )
          }
          onPlay={(marketingConsent) => setStep({ name: "wheel", identity: step.identity, marketingConsent, ticket: step.ticket })}
        />
      )}

      {step.name === "wheel" && (
        <section className="step">
          <p className="game-eyebrow">{copy.campaignName}</p>
          <h2 className="game-serif game-h2">{copy.wheel.title}</h2>
          <p className="game-body">{busy ? copy.wheel.spinning : copy.wheel.tapToSpin}</p>
          <PrizeWheel
            copy={copy}
            handleRef={wheelRef}
            disabled={busy}
            onTap={() => void spin(step.identity, step.marketingConsent, step.ticket)}
          />
        </section>
      )}

      {step.name === "result" && (
        <ResultStep
          copy={copy}
          locale={locale}
          result={step.result}
          onDone={reset}
          spinsLeft={step.ticket ? Math.max(0, step.ticket.seats - step.ticket.spinsUsed - 1) : 0}
          onNextPlayer={step.ticket ? () => void nextPlayer(step.ticket as Found) : undefined}
        />
      )}

      {step.name === "already_played" && (
        <section className="step">
          <p className="game-eyebrow">{copy.campaignName}</p>
          <h2 className="game-serif game-h2">{copy.alreadyPlayed.title}</h2>
          <p className="game-body">{copy.alreadyPlayed.body(step.maskedEmail)}</p>
          <p className="game-eyebrow" style={{ marginTop: 32 }}>{copy.alreadyPlayed.yourPrize}</p>
          <h3 className="game-serif" style={{ fontSize: "clamp(26px,3.4vw,44px)" }}>{copy.prizes[step.kind].title}</h3>
          {step.code ? (
            <div className="result__code">{step.code}</div>
          ) : (
            <p className="result__meta">{step.resent ? copy.alreadyPlayed.resent(step.maskedEmail) : copy.alreadyPlayed.notResent}</p>
          )}
          <div className="game-actions">
            {step.ticket && step.ticket.seats - step.ticket.spinsUsed > 0 && (
              <button type="button" className="game-btn game-btn--primary" onClick={() => void nextPlayer(step.ticket as Found)}>
                {copy.ticketPanel.companion}
              </button>
            )}
            <button type="button" className="game-btn game-btn--cream" onClick={reset}>{copy.alreadyPlayed.done}</button>
          </div>
        </section>
      )}

      {step.name === "error" && (
        <section className="step">
          <h2 className="game-serif game-h2">{step.message}</h2>
          <div className="game-actions">
            <button type="button" className="game-btn game-btn--cream" onClick={reset}>{copy.identify.back}</button>
          </div>
        </section>
      )}
    </main>
  );
}

function DetailsStep({
  copy,
  companion,
  onBack,
  onNext,
}: {
  copy: ReturnType<typeof getGameCopy>;
  companion: boolean;
  onBack: () => void;
  onNext: (person: PersonDetails) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string }>({});
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim().replace(/\s+/g, " ");
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const next: typeof errors = {};
    if (cleanName.length < 2) next.name = copy.details.invalidName;
    if (!EMAIL_RE.test(cleanEmail)) next.email = copy.details.invalidEmail;
    if (cleanPhone && !PHONE_RE.test(cleanPhone)) next.phone = copy.details.invalidPhone;
    setErrors(next);
    if (Object.keys(next).length) return;
    onNext({ name: cleanName, email: cleanEmail, phone: cleanPhone || undefined });
  };
  return (
    <section className="step">
      <button type="button" className="game-btn game-btn--text step__back" onClick={onBack}>← {copy.identify.back}</button>
      <p className="game-eyebrow">{copy.campaignName}</p>
      <h2 className="game-serif game-h2">{companion ? copy.details.companionTitle : copy.details.title}</h2>
      <p className="game-body">{copy.details.body}</p>
      <form onSubmit={submit} noValidate>
        <label className="field">
          <span>{copy.details.nameLabel}</span>
          <input type="text" autoComplete="off" autoFocus value={name} onChange={(e) => { setName(e.target.value); setErrors((x) => ({ ...x, name: undefined })); }} maxLength={120} />
          {errors.name && <div className="field__error">{errors.name}</div>}
        </label>
        <label className="field">
          <span>{copy.details.emailLabel}</span>
          <input
            type="email"
            inputMode="email"
            autoComplete="off"
            autoCapitalize="none"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setErrors((x) => ({ ...x, email: undefined })); }}
            placeholder={copy.details.emailPlaceholder}
          />
          {errors.email && <div className="field__error">{errors.email}</div>}
        </label>
        <label className="field">
          <span>{copy.details.phoneLabel}</span>
          <input type="tel" inputMode="tel" autoComplete="off" value={phone} onChange={(e) => { setPhone(e.target.value); setErrors((x) => ({ ...x, phone: undefined })); }} placeholder={copy.details.phonePlaceholder} maxLength={20} />
          {errors.phone && <div className="field__error">{errors.phone}</div>}
        </label>
        <div className="game-actions">
          <button type="submit" className="game-btn game-btn--primary">{copy.details.next}</button>
        </div>
      </form>
    </section>
  );
}

function ConsentStep({
  copy,
  termsOpen,
  setTermsOpen,
  onBack,
  onPlay,
}: {
  copy: ReturnType<typeof getGameCopy>;
  termsOpen: boolean;
  setTermsOpen: (v: boolean) => void;
  onBack: () => void;
  onPlay: (marketingConsent: boolean) => void;
}) {
  const [terms, setTerms] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [error, setError] = useState("");
  return (
    <section className="step">
      <button type="button" className="game-btn game-btn--text step__back" onClick={onBack}>← {copy.identify.back}</button>
      <p className="game-eyebrow">{copy.campaignName}</p>
      <h2 className="game-serif game-h2">{copy.consent.title}</h2>
      <p className="game-body">{copy.consent.intro}</p>
      <div className="consent">
        <label className={`consent__row ${terms ? "consent__row--checked" : ""}`}>
          <input type="checkbox" checked={terms} onChange={(e) => { setTerms(e.target.checked); setError(""); }} />
          <span className="consent__box">{terms && <CheckIcon />}</span>
          <span>{copy.consent.termsLabel}</span>
        </label>
        <label className={`consent__row ${marketing ? "consent__row--checked" : ""}`}>
          <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} />
          <span className="consent__box">{marketing && <CheckIcon />}</span>
          <span>
            {copy.consent.marketingLabel}
            <span className="consent__hint">{copy.consent.marketingHint}</span>
          </span>
        </label>
        <div className="consent__links">
          <button type="button" className="game-btn game-btn--text" onClick={() => setTermsOpen(true)}>{copy.consent.termsLink}</button>
        </div>
        {error && <div className="field__error" style={{ textAlign: "center" }}>{error}</div>}
      </div>
      <div className="game-actions">
        <button
          type="button"
          className="game-btn game-btn--primary"
          onClick={() => (terms ? onPlay(marketing) : setError(copy.consent.termsRequired))}
        >
          {copy.consent.play}
        </button>
      </div>
      {termsOpen && (
        <div className="terms" role="dialog" aria-modal="true">
          <div className="terms__panel">
            <h2>{copy.consent.termsTitle}</h2>
            {copy.consent.termsBody.map((p) => <p key={p}>{p}</p>)}
            <button type="button" className="game-btn game-btn--primary" onClick={() => setTermsOpen(false)}>OK</button>
          </div>
        </div>
      )}
    </section>
  );
}

function ResultStep({
  copy,
  locale,
  result,
  onDone,
  spinsLeft,
  onNextPlayer,
}: {
  copy: ReturnType<typeof getGameCopy>;
  locale: string;
  result: Extract<PlayResult, { ok: true }>;
  onDone: () => void;
  spinsLeft: number;
  onNextPlayer?: () => void;
}) {
  const [left, setLeft] = useState(RESULT_RESET_S);
  useEffect(() => {
    const id = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (left <= 0) onDone();
  }, [left, onDone]);
  const prize = copy.prizes[result.kind];
  return (
    <section className="step">
      <Confetti burstKey={result.code ?? result.validUntil} />
      <p className="game-eyebrow">{copy.result.eyebrow}</p>
      <h2 className="game-serif game-h1" style={{ fontSize: "clamp(36px,6vw,88px)" }}>{prize.title}</h2>
      <p className="game-body">{prize.description}</p>
      {result.code && (
        <>
          <p className="game-eyebrow" style={{ marginTop: 28, marginBottom: 0 }}>{copy.result.codeLabel}</p>
          <div className="result__code">{result.code}</div>
        </>
      )}
      <p className="result__meta">{copy.result.validUntil(formatDate(result.validUntil, locale))}</p>
      <p className="result__meta">
        {!result.emailSent
          ? copy.result.emailFailed
          : result.code
            ? copy.result.emailed(result.maskedEmail)
            : copy.result.emailOnly(result.maskedEmail)}
      </p>
      <p className="result__meta">{copy.result.howTo}</p>
      <div className="game-actions">
        {onNextPlayer && spinsLeft > 0 && (
          <button type="button" className="game-btn game-btn--primary" onClick={onNextPlayer}>{copy.result.nextPlayer(spinsLeft)}</button>
        )}
        <button type="button" className="game-btn game-btn--cream" onClick={onDone}>{copy.result.done}</button>
      </div>
      <p className="result__timer">{copy.result.autoReset(Math.max(0, left))}</p>
    </section>
  );
}
