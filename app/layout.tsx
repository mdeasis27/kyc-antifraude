import type { Metadata } from "next";
import { fontVariables } from "@/design-system/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "KYC Anti-Fraude · Verificación de Identidad",
  description: "Plataforma de onboarding KYC con decisión por IA — demo de portafolio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${fontVariables} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">{children}</body>
    </html>
  );
}
