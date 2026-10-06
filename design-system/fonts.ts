// design-system/fonts.ts
// Source of truth for portfolio fonts. Bundled for reproducible offline builds.
// Consumed by the hub and any project that runs brand:sync.
import localFont from "next/font/local";

export const geist = localFont({
  src: "./fonts/Geist.woff2",
  variable: "--font-sans",
  weight: "100 900",
  display: "swap",
});

export const geistMono = localFont({
  src: "./fonts/GeistMono.woff2",
  variable: "--font-mono",
  weight: "100 900",
  display: "swap",
});

export const fontVariables = `${geist.variable} ${geistMono.variable}`;
