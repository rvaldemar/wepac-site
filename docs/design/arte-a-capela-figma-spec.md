# Arte à Capela — Figma spec (transcription)

Source: Figma file `Site Arte à Capela (Reswe)` (`mTD3IGiCAR0lb56VOD007B`), frames `DESKTOP` and
`MOBILE`. Transcribed by direct reading of the board; the file is view-only, so measurements are
proportional rather than pixel-exported. Assets were pulled from the file's image fills and are
already committed under `public/images/arte-a-capela/`.

This document is the build brief. Where it is silent, follow `src/app/wessex/page.tsx`, which is the
existing precedent for a sub-brand landing page in this repo.

## How much authority this design has

**The Figma was produced by a designer who does not know this platform or product.** That makes it
authoritative on identity, narrative and layout — what a designer is actually deciding — and merely
illustrative wherever it depicts product behaviour. The tell shows in three places: it offers MB Way,
which our Stripe integration does not support; it draws a checkout form, while this repo already
ships a ticketing product with tiers, capacity and QR check-in; and it shows one price, while a real
Arte à Capela event carries several tiers, including a patron one.

So: match the design faithfully on typography, colour, imagery, copy and section rhythm. Where it
depicts a mechanism we already own, defer to the product and its data — and never reproduce a payment
method or a price that does not exist. A review board ruled on the ticketing block on 2026-07-22;
section 9 records the outcome.

## Positioning

`/arte-a-capela` is a **top-level route**, a sibling of `/wessex` — not inside the `(site)` route
group. It carries its own nav and footer and must NOT render the WEPAC `Header`/`Footer`. The WEPAC
navbar entry "Arte à Capela" points here, exactly as "Wessex" points to `/wessex`.

## Visual system

| Token | Value | Use |
|---|---|---|
| background | `#0B0A09` | page base, near-black with a warm cast |
| cream | `#F0EDE6` | ticketing block only |
| red | `#C2301F` | primary CTA fill, eyebrow labels, nav active underline |
| body text on dark | `#FFFFFF` at 55–70% opacity | paragraphs, list rows |
| hairlines | `#FFFFFF` at 10–15% opacity | section dividers, outline button borders |

- **Display face:** Cormorant Garamond (high-contrast serif). Register it in `src/app/layout.tsx`
  via `next/font/google` as `--font-cormorant` and expose it in the `@theme inline` block of
  `src/app/globals.css` alongside the three `--color-capela-*` tokens above. Weights 300–600,
  normal + italic.
- **UI face:** Inter (already in the project). All small labels are uppercase with wide letter
  spacing (~0.18em) at ~11px, in white at ~40% opacity — except eyebrows, which are red.
- Headline sizes are large and airy: hero display runs roughly 72–96px on desktop, section titles
  ~48–56px, with generous leading (~1.15) and no letter-spacing on the serif.
- Images are full-bleed edge-to-edge within their band; no rounded corners anywhere on the page.
- Buttons are square (no radius). Primary = red fill, white uppercase label, wide tracking.
  Secondary = 1px white/25% border, transparent fill.

## Section order and content

### 1. Nav (over the hero, transparent)

Logo `public/images/arte-a-capela/logo.png` on the left (transparent PNG, 232x68, cream artwork).
Right: `Sobre` · `Eventos` · `Bilhetes`. The active/last item carries a red underline. Mobile shows
the logo plus a single `Bilhetes` link.

### 2. Hero — full-viewport

Background `hero.jpg` (cathedral interior), darkened so the type reads: a heavy left-to-right
gradient plus a global dim. Headline sits left of centre, four lines:

```
A arte
ganha
nova vida        <- roman
dentro do        <- italic
património.      <- italic
```

To the right of the headline block, a short lead paragraph and the two CTAs stacked:

> Concertos intimistas e experiências imersivas em capelas, igrejas e espaços históricos de Portugal.

- Primary: `COMPRAR BILHETE` → the ticketing section (`#bilheteira`)
- Secondary: `VER PROGRAMAÇÃO` → the event section (`#evento`)

On mobile the lead + CTAs move below the headline, full width.

### 3. Manifesto (`#sobre`)

Serif statement at ~36px, max ~640px wide:

> Mais do que concertos — experiências que reativam o património. Cada evento cria uma ligação
> profunda entre o espaço, os artistas e o público.

Below it, small sans body at ~13px, white/45%:

> A Arte à Capela transforma capelas, igrejas e locais patrimoniais em cenários vivos para
> experiências artísticas memoráveis, aproximando o público da história, da música e da cultura de
> forma contemporânea.

### 4. Gallery — three images, one row

`claustro.jpg` (wide) · `talha.jpg` · `vitral.jpg`, equal height, no gaps. Column split measured off
the board at 41.3% / 29.1% / 29.6% (`lg:grid-cols-[1.41fr_1fr_1.01fr]`) — see the measurement note at
the end of this document. Stacks vertically on mobile.

### 5. Quote + stats band

Left: italic serif pull-quote, ~20px, white/70%:

> "A música ressoa diferente entre pedras que guardam séculos de oração e silêncio."

Right: three stacked pairs, serif title over sans caption in white/40%:

| Concertos | Espaços | Programação |
|---|---|---|
| Intimistas | Históricos | Curada |

### 6. Image duo

`azulejos.jpg` (square-ish, left) and `lisboa.jpg` (wide, right), side by side, no gap. Note the
azulejos source is only 450x450 — keep its rendered box modest or let it crop, do not upscale it
across a full-width band.

### 7. Next event (`#evento`)

- Red eyebrow: `PRÓXIMO EVENTO`
- Serif title, two lines, ~56px: **Catedrais Interiores**
- Right-aligned meta row: `DATA` / `18 de junho` · `ENTRADA` / `12€` · red CTA `GARANTIR BILHETE`
- Hairline divider
- Two columns below:
  - `ARTISTA` → **António Cortez**, caption `Violoncelo`
  - `PROGRAMA` → five rows, work on the left, composer right-aligned in white/35%:

    | Suíte Nº 1 em Sol Maior | J. S. Bach |
    | Capricho Nº 8 | J.-L. Duport |
    | Suíte Nº 3 em Dó Maior | J. S. Bach |
    | Capricho Nº 11 | J.-L. Duport |
    | Capricho Nº 27 | D. Popper |

**This section is data-driven.** Read the soonest published upcoming `Event` whose
`department.slug` is `arte-a-capela` (see `prisma/schema.prisma`: `Event`, `TicketTier`,
`Department`, `Brand`). Map `event.title`, `event.startsAt`, `event.venue`, and the cheapest tier's
`priceCents` onto the layout; `event.subtitle` supplies the artist line. The programme has no column
in the schema — render it from the static fallback data and leave a comment saying so. When no such
event is published, render the Figma content verbatim from the fallback constants and point the CTA
at `/bilheteira`.

### 8. Full-width image band

`tumulo-vitral.jpg`, cropped to a wide letterbox (4.18:1 desktop — see the measurement note at the
end of this document — taller on mobile), with a ~25-30% dimming layer.

### 9. Ticketing (`#bilheteira`) — cream block

Two columns on cream `#F0EDE6`, black text, separated by a hairline.

Left column:
- Red eyebrow `BILHETEIRA`
- Serif title (event name)
- Label/value pairs: `ARTISTA` → `António Cortez — Violoncelo`; `DATA` → `18 de junho de 2026`;
  `LOCAL` → `A confirmar`; `PREÇO POR BILHETE` → `12€`
- Fine print, grey: `Lugares limitados. Bilhete enviado por e-mail após confirmação do pagamento.`

Right column — a real form that posts to the existing `reserveAction`
(`src/lib/bilheteira/reserve-action.ts`):
- `QUANTIDADE`: a `−` / value / `+` stepper, caption `bilhete`. Ships as a plain number input if a
  client component would be the only way to get the stepper — do not add a client component just for
  chrome.
- `DADOS DO PARTICIPANTE`: `Nome completo`, `E-mail`, `Telefone` — underline-only inputs, no boxes.
  These map to the action's `buyerName`, `buyerEmail`, `buyerPhone` fields.
- `PAGAMENTO`: the Figma shows three chips (MB Way / Cartão / Multibanco). **The Stripe session in
  this repo is created with `payment_method_types: ["card", "multibanco"]` — MB Way is not
  wired.** Render only what actually works and say so plainly (e.g. "Cartão · Multibanco"), rather
  than a chip that lies. Do not add payment methods to the Stripe call.
- `TOTAL` row, then the full-width red `COMPRAR` button.

The form needs hidden `eventSlug`, `tierId` and `returnPath` inputs. `returnPath` is a new field on
the action: on validation failure or Stripe cancel, the user must come back to `/arte-a-capela`
rather than to `/bilheteira/[slug]`. Implement it as a strict allowlist (a `Set` of known paths), so
a crafted value can never become an open redirect, and default to the current behaviour otherwise.
The page then reads `?error=` / `?cancelled=` from `searchParams` and surfaces the message inside
the ticketing block.

If no event is published, the whole right column degrades to a link to `/bilheteira` — never a form
that cannot submit.

### 10. Footer

Dark. Logo + tagline on the left:

> Experiências culturais em espaços patrimoniais históricos de Portugal.

Two link columns on the right:
- `REDES SOCIAIS`: Instagram, Facebook, YouTube
- `INFORMAÇÕES`: Sobre o Projecto (`/projetos/arte-a-capela`), Bilheteira (`/bilheteira`),
  Contacto (`/contacto`)

Hairline, then `© 2026 Arte à Capela` left and `Portugal · Cultura · Património` right.

## Non-negotiables

- Responsive from 360px up; the mobile frame stacks every section into one column and keeps all
  copy. No horizontal scroll at any width.
- Portuguese copy is transcribed above verbatim, accents included. Identifiers, comments and commit
  messages stay in English (repo convention).
- Reuse `next/image` where it buys real optimisation; the Wessex page uses plain `<img>`, so either
  is acceptable — be consistent within the page.
- Accessibility: every image needs a meaningful `alt` (decorative bands may use `alt=""`), the form
  needs real labels (visually hidden if the design shows none), and text over imagery must clear
  4.5:1 against the darkened backdrop.

## Measurement note (2026-07-22)

The gallery split (section 4) and the full-width image band aspect ratio (section 8) were originally
transcribed "by eye" from the board and were wrong: the gallery split was recorded as 2fr/1.2fr/1fr
with the middle and last weights swapped, and the letterbox band was recorded as "~21:9" instead of
its actual 4.18:1. A four-lens design-board review on 2026-07-22 remeasured both directly off the
board — scale calibrated from the full-bleed bands against the stated 1533.6px frame width — and this
document now reflects those measured figures (41.3% / 29.1% / 29.6% and 4.18:1) rather than the
earlier eyeballed ones. Treat any dimension in this file that is not sourced from an explicit
measurement pass with the same skepticism.
