# Design System Changelog

## 3.1.0 — 2026-09-28

- New **semantic status tokens**: `--success`, `--warning`, `--danger`, `--info` (theme-aware light/dark). Mapped as `--color-*` in `globals.css`.
- New portable components: `StatusBadge`, `Alert`, `MetricCard`, `Meter`, `Stepper`; shared `Tone` type (`neutral`/`success`/`warning`/`danger`/`info`).
- Rationale: unify the 5 portfolio demos, which had each invented their own green/amber/red palette. Status is now expressed only through tokens + these components.

## 3.0.0 — 2026-04-17

- **Breaking:** fonts replaced Inter + Fraunces + JetBrains Mono → **Geist** + **Geist Mono** (Next.js font/google). `fontSerif` export removed; `fontVariables` now covers only sans + mono.
- **Breaking:** color palette replaced zinc + blue-700 → Vercel/Geist achromatic scale (`#ffffff`/`#171717`) with gray-50/100/400/500 explicit tokens.
- **Breaking:** `--radius` unified 8px → **radius scale** (`--radius-sm` 4px, `--radius` 6px, `--radius-md` 8px, `--radius-lg` 12px, `--radius-pill` 9999px).
- New **shadow tokens**: `--shadow-border`, `--shadow-border-light`, `--shadow-card` (shadow-as-border technique).
- New **workflow accent tokens**: `--ship` (#ff5b4f), `--preview` (#de1d8d), `--develop` (#0a72ef).
- `globals.css`: removed `--font-serif`; added heading letter-spacing scale per DESIGN.md §3; added `font-feature-settings: "liga"` global on `html`.
- `tokens.ts`: added `shadows` object; `radius` object now has `sm/base/md/lg/pill` keys.
- All `font-serif` class usages in src/ migrated to `font-sans` (Fraunces had no production content).

## 2.0.0 — 2026-04-16
- **Breaking:** palette replaced `indigo #6366f1 + cyan #22d3ee` → `zinc + blue-700 (#1D4ED8)`.
- **Breaking:** fonts replaced Geist/Geist_Mono → Inter + Fraunces + JetBrains_Mono.
- Radius unified to 8px.
- New `StatusDot` component.
- New MDX components: `Metric`, `MetricGroup`, `Tradeoff`, `Callout`.
- Added `brand-sync.mjs` for distribution to sibling repos.
