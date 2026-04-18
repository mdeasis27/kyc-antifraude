// design-system/fonts.ts
// Source of truth for portfolio fonts — v3.0.0 (Vercel/Geist).
// Consumed by the hub and any project that runs brand:sync.
import { Geist, Geist_Mono } from "next/font/google";

export const geist = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const fontVariables = `${geist.variable} ${geistMono.variable}`;
