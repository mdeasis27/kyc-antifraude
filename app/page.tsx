import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/design-system/components/button";
import { cn } from "@/design-system/utils";

const STACK = [
  "Next.js 16",
  "AI SDK",
  "TypeScript",
  "Tailwind v4",
  "Zod",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-background/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-6">
          <Link
            href="https://manueldeasis.com"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            Manuel de Asis
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col items-start gap-8 px-6 py-24">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            KYC Anti-Fraude
          </h1>
          <p className="text-lg text-muted-foreground">
            Plataforma de onboarding con verificación de identidad KYC y
            decisión automatizada por IA.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {STACK.map((tech) => (
            <span
              key={tech}
              className="rounded-full shadow-[var(--shadow-border-light)] bg-[var(--gray-50)] px-3 py-1 text-xs font-medium text-muted-foreground"
            >
              {tech}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/app" className={cn(buttonVariants({ size: "default" }))}>
            Ver demo
          </Link>
          <a
            href="https://github.com/mdeasis27/kyc-antifraude"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "default" }))}
          >
            GitHub
          </a>
        </div>
      </main>
    </div>
  );
}
