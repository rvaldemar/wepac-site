# Roda da Capela — kiosk prize game

Touch-screen game for the Arte à Capela box office. A visitor taps the attract
screen, identifies themself (ticket QR or email), accepts the game terms,
optionally opts in to marketing, spins the wheel and receives a prize code on
screen and by email. Admins redeem codes in the bilheteira admin.

## Routes

| Route | Who | Purpose |
|---|---|---|
| `/bilheteira/jogo` (`/en/bilheteira/jogo`) | kiosk | Full-screen game. `noindex`. |
| `/bilheteira/admin/jogo` | TicketingAdmin | Stats, code lookup/redeem/cancel, latest vouchers. |
| `GET /api/bilheteira/game/export` | TicketingAdmin | CSV of participants **with** marketing consent only. |

## Prizes (campaign `capela-2026-q4`)

| `PrizeKind` | Prize | Default weight | Redemption |
|---|---|---|---|
| `two_for_one_single_2026` | 2 for 1 at one concert, until 2026-12-31 | 55 | single-use → `redeemed` |
| `two_for_one_all_2026` | 2 for 1 at every concert, until 2026-12-31 | 27 | multi-use, stays `issued`, each use logged |
| `free_ticket_single_2026` | One free ticket, until 2026-12-31 | 15 | single-use → `redeemed` |
| `free_all_q4_2026` | One seat at every concert 2026-10-01 → 2026-12-31, one person | 3 | multi-use, stays `issued`, each use logged |

Everyone wins exactly once per email. A ticket with N seats grants N spins:
the buyer (name/email from the ticket row) plus up to N-1 companions, each
registered at the kiosk with name, email and optional mobile. The seat cap is
enforced inside the insert transaction. Weights are overridable with
`GAME_PRIZE_WEIGHTS`; the draw runs server-side with a crypto RNG and the
client only animates to the server's result.

## Data and GDPR

- Data asked at the kiosk: name (required), email (required), mobile
  (optional). Nothing else.
- `game_participants`: one row per `(campaign, email)`, with optional
  `ticketId` provenance and `phone`. `termsAcceptedAt` is
  mandatory; `marketingConsentAt` is a separate explicit opt-in and stays
  `NULL` when unchecked. `consentVersion` records the terms text version
  (`GAME_CONSENT_VERSION` in `src/lib/bilheteira/game/prizes.ts`; bump it when
  the kiosk terms change).
- `prize_vouchers`: code `AC-XXXX-XXXX`, kind, status, validity window,
  `emailSentAt`, redemption audit (`redeemedAt`, admin, note history).
- In ticket mode the email comes from the `tickets` row, never from the client,
  and the kiosk only ever shows a masked address. Lookup results never contain
  the full email.
- SMTP errors are logged through `logSafeError` so recipient addresses never
  reach the logs.
- Marketing export contains only consented rows. Withdrawal: delete the
  participant row or null `marketingConsentAt` (no UI yet; SQL by an admin).
- Retention stated in the terms: 12 months after the campaign ends.

## Kiosk setup

1. Set `GAME_KIOSK_ACCESS_KEY` in `/var/www/wepac/shared/.env.production` and
   restart the service. Without it the game is public.
2. On the kiosk tablet open `https://wepac.pt/bilheteira/jogo?k=<key>` once in
   Chrome/Safari; a signed cookie unlocks the device for 90 days.
3. Grant camera permission on first scan; the browser remembers it. Add the
   page to the home screen / use guided access so the browser chrome is hidden.
4. The attract loop resumes after 75 s of inactivity and 45 s after a result.

## Operations

- Redeem at the box office: admin → Roda → type/scan the code → "Marcar como
  usado" (single-use) or "Registar utilização" (multi-use). Out-of-window codes
  are flipped to `expired` on lookup.
- Abuse: play and lookup are rate-limited per IP (60 plays/h, 300 lookups/h,
  in-process). One entry per email per campaign is enforced by a unique index.
- Email delivery is best-effort: the code is always shown on screen.

## Release

Additive migration `20261010120000_bilheteira_prize_game`. No existing table
is modified apart from two new relation fields (Prisma-only). Standard deploy;
no E2E gate required by the release contract (does not touch auth, onboarding,
Sessions, Debrief or public intake), but run `npm test` and `npm run build`.
