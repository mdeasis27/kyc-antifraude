// design-system/tokens.ts
// Source of truth for the MDEA brand palette — v3.1.0 (Vercel/Geist + semantic status layer).
// CSS variables live in tokens.css; this file mirrors them for TS consumption.

export const brand = {
  background:  { light: "#ffffff",  dark: "#171717" },
  surface:     { light: "#ffffff",  dark: "#1a1a1a" },
  foreground:  { light: "#171717",  dark: "#ededed" },
  muted:       { light: "#4d4d4d",  dark: "#a1a1a1" },
  gray500:     { light: "#666666",  dark: "#8a8a8a" },
  gray400:     { light: "#808080",  dark: "#6e6e6e" },
  gray100:     { light: "#ebebeb",  dark: "#2e2e2e" },
  gray50:      { light: "#fafafa",  dark: "#262626" },
  accent:      "#0072f5",
  ship:        "#ff5b4f",
  preview:     "#de1d8d",
  develop:     "#0a72ef",
  success:     { light: "#16a34a", dark: "#34d399" },
  warning:     { light: "#d97706", dark: "#fbbf24" },
  danger:      { light: "#dc2626", dark: "#f87171" },
  info:        { light: "#0072f5", dark: "#60a5fa" },
} as const;

export const shadows = {
  border:      "0 0 0 1px rgba(0,0,0,0.08)",
  borderLight: "0 0 0 1px #ebebeb",
  card:        "0 0 0 1px rgba(0,0,0,0.08), 0 2px 2px rgba(0,0,0,0.04), 0 8px 8px -8px rgba(0,0,0,0.04), inset 0 0 0 1px #fafafa",
} as const;

export const radius = {
  sm:   "4px",
  base: "6px",
  md:   "8px",
  lg:   "12px",
  pill: "9999px",
} as const;

export type BrandToken = keyof typeof brand;
