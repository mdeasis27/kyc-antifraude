# MDEA Design System (Brand Kit)

Source of truth for visual identity across the portfolio hub and every project repo.

## Tokens

Defined in `tokens.css`; mirrored as TS constants in `tokens.ts`.

### Color tokens

| Token | Light | Dark | Purpose |
|---|---|---|---|
| `--background` | `#ffffff` | `#171717` | Page background |
| `--surface` | `#ffffff` | `#1a1a1a` | Cards, panels |
| `--foreground` | `#171717` | `#ededed` | Primary text |
| `--muted` | `#4d4d4d` | `#a1a1a1` | Body / secondary text |
| `--border` | `var(--gray-100)` | `var(--gray-100)` | Semantic border (shadcn compat) |
| `--gray-500` | `#666666` | `#8a8a8a` | Tertiary text |
| `--gray-400` | `#808080` | `#6e6e6e` | Placeholder / disabled |
| `--gray-100` | `#ebebeb` | `#2e2e2e` | Borders, dividers |
| `--gray-50` | `#fafafa` | `#262626` | Subtle surface tint |
| `--accent` | `#0072f5` | `#0072f5` | Links, accent |
| `--ring` | `hsla(212, 100%, 48%, 1)` | — | Focus ring |

### Workflow accent tokens (use only in pipeline/status context)

| Token | Value | Use |
|---|---|---|
| `--ship` | `#ff5b4f` | Ship-to-production step |
| `--preview` | `#de1d8d` | Preview deployment step |
| `--develop` | `#0a72ef` | Development step |

### Semantic status tokens (v3.1+)

The only sanctioned use of color in UI chrome. Theme-aware: light/dark values
differ, so always use the token (never a raw hex). Tint surfaces at `/10`,
use the solid token for text, dots and bars.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--success` | `#16a34a` | `#34d399` | Approve, low risk, positive |
| `--warning` | `#d97706` | `#fbbf24` | Review, medium risk |
| `--danger` | `#dc2626` | `#f87171` | Reject, high risk, error |
| `--info` | `#0072f5` | `#60a5fa` | Neutral information |

Mapped in `globals.css` as `--color-success` / `--color-warning` /
`--color-danger` / `--color-info`, so Tailwind utilities `bg-success/10`,
`text-danger`, `border-warning/25` are available in every project.

### Shadow tokens

| Token | Value | Use |
|---|---|---|
| `--shadow-border` | `0 0 0 1px rgba(0,0,0,0.08)` | Shadow-as-border (standard) |
| `--shadow-border-light` | `0 0 0 1px #ebebeb` | Lighter ring for tabs, images |
| `--shadow-card` | multi-layer (see tokens.css) | Full card depth stack |

### Radius scale

| Token | Value | Use |
|---|---|---|
| `--radius-sm` | `4px` | Small containers |
| `--radius` | `6px` | Buttons, functional elements |
| `--radius-md` | `8px` | Cards, list items |
| `--radius-lg` | `12px` | Featured / image cards |
| `--radius-pill` | `9999px` | Badges, status pills |

## Fonts

Configured in `fonts.ts`:
- **Geist** (400/500/600) — all text: body, headings, nav. Variable `--font-sans`.
- **Geist Mono** (400/500) — code, eyebrows, tag chips. Variable `--font-mono`.

`fontVariables` export applies both variables to the root `<body>`.

## Components

In `components/`:
- `Button` — `default` / `outline` / `ghost` / `link`, sizes `default`/`sm`/`lg`/`icon`
- `Badge` — mono/technical label: `default` / `outline` / `status-shipped` / `status-beta` / `status-archived`
- `Card` — container with `--radius-md` + `--shadow-card`
- `Separator` — 1px border line
- `StatusDot` — dot + label (`live`/`beta`/`archived`)
- `StatusBadge` — semantic pill, `tone` = `neutral`/`success`/`warning`/`danger`/`info`, optional `dot`
- `Alert` — tinted callout, `tone` + optional `title` / `items[]`
- `MetricCard` — KPI tile, `label` / `value` / `hint` / `tone`
- `Meter` — horizontal bar, `value` / `max` / `tone`
- `Stepper` — horizontal step indicator, `steps[]` + 1-based `current`

`Tone` (`neutral` | `success` | `warning` | `danger` | `info`) is the shared
vocabulary; status is expressed with these components, never with raw
`green-500` / `amber-500` / `red-500` classes.

## MDX-only components (hub-exclusive)

In `mdx/`:
- `<Metric value="65%" label="…" description="…" />`
- `<MetricGroup cols={2|3|4}>…</MetricGroup>`
- `<Tradeoff title="…">…</Tradeoff>`
- `<Callout type="note|warn">…</Callout>`

These are NOT part of the portable kit — only projects with case-study MDX use them.

## Usage in sibling projects

```bash
# From inside a sibling repo under proyectos-portafolio/
pnpm brand:sync
```

This copies the entire `design-system/` from `portafolio-mdea/` into the current repo. It writes a `.brand-sync-manifest.json` to record which version was applied.

## Updating the palette

1. Edit `design-system/tokens.css` and `design-system/tokens.ts` in the hub.
2. Update `globals.css` consumers if needed.
3. Add an entry to `CHANGELOG.md`.
4. Run `pnpm brand:propagate` from the hub to push changes to all siblings.
