# WEPAC logo — canonical assets

Source of truth for the WEPAC (parent brand, not WEPACKER) logo. Downloaded
directly by Rui from the brand source on 2026-07-20 and stored here
permanently so nobody has to re-derive, approximate, or guess again.

**Never regenerate these from a font, from a PDF raster, or from a file
found in an unrelated project folder.** If a new variant is needed
(different color, different crop), re-export from the master vector files
in `brand-assets/wepac/source/` (`wepac-logo.ai` / `wepac-logo.pdf`,
untracked from `public/` on purpose — not meant to be served) or ask Rui
for a fresh export. Do not hand-derive by inverting pixels or rendering
text in Barlow — that produces wrong letterforms (confirmed wrong once
already, 2026-07-20).

## The three variants

Each exists in `-black` / `-white` / `-grey` (`#DEE0DB`, the brand grey),
all transparent-background PNG.

| File | Content | Use |
|---|---|---|
| `wordmark-{color}.png` | Just the "wepac" wordmark, no icon, no card. | Small/discreet placements — email footer signatures, inline mentions. This is the brandbook's official "10%" responsive variant. |
| `lockup-{color}.png` | Icon block (chevron/mountain mark) + "wepac" wordmark side by side, no card background. | Primary logo for headers, standalone branding where horizontal space is available. |
| `badge-{color}.png` | Icon card with notched chevron top/bottom + "wepac" wordmark knocked out inside a solid card. | The brandbook's official "100%" full lockup — use where the mark needs to read as a self-contained badge/stamp (e.g. a corner mark, a stamp on a document). |

Pick the color variant for contrast: `black` on light backgrounds, `white`
on dark backgrounds, `grey` for a muted/secondary treatment on either
(matches `#DEE0DB` from the brandbook palette).

## Provenance

- Downloaded by Rui 2026-07-20 ~19:30, original filenames in Downloads:
  `wepac-icon-{color}.png` → `wordmark-{color}.png` (renamed — the
  original name is misleading, this file contains no icon)
  `wepac-first-logo-{color}-horizontal.png` → `lockup-{color}.png`
  `wepac-optional-{color}.png` → `badge-{color}.png`
- Master vector files (`wepac-logo.ai`, `wepac-logo.pdf`) mirrored to
  `brand-assets/wepac/source/` in this repo (git-tracked, not served via
  `public/`) so the source survives even if it's cleared from Downloads.
- Cross-checked against `wepac-brandbook.pdf` (page "Logotipo -
  Responsividade") — `wordmark-*` matches the official 10% variant,
  `badge-*` matches the official 100% variant, letterform-for-letterform.

## Do NOT use

- `wepac-wordmark-{black,white}.png` that used to live under
  `public/logo/email/` — hand-derived (first from an unverified asset,
  then from raw Barlow-Black font) before this canonical set existed.
  **Deleted 2026-07-20**, superseded by `wordmark-{color}.png` here. If
  you see a reference to that path anywhere, it's stale — fix it to
  point here instead.
