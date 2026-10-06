import type { ReactNode } from "react";
import type { Locale } from "../i18n/locale";

export interface BusinessStory { eyebrow: string; mission: string; context: string; role: string; decision: string; stakes: string; }

export function StoryBrief({ story, locale }: { story: BusinessStory; locale: Locale }) {
  const en = locale === "en";
  return <section className="mb-8 border-y border-border py-7 sm:py-10" data-business-story>
    <div className="grid gap-7 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <div><p className="font-mono text-xs uppercase tracking-[.2em] text-accent">{story.eyebrow}</p><h2 className="mt-4 max-w-3xl text-3xl font-medium leading-tight tracking-tight sm:text-5xl">{story.mission}</h2><p className="mt-5 max-w-2xl text-sm leading-7 text-muted-foreground">{story.context}</p></div>
      <dl className="grid content-start gap-5 border-l-2 border-accent pl-5 text-sm">{[[en ? "Your role" : "Tu papel", story.role], [en ? "The decision" : "La decisión", story.decision], [en ? "What is at stake" : "Lo que está en juego", story.stakes]].map(([label, text]) => <div key={label}><dt className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{label}</dt><dd className="mt-1 leading-6">{text}</dd></div>)}</dl>
    </div>
  </section>;
}

export interface ScenarioOption { id: string; label: string; description: string; }
export function ScenarioPicker({ options, selected, onSelect, locale }: { options: ScenarioOption[]; selected?: string; onSelect: (id: string) => void; locale: Locale }) {
  return <section className="mb-6" aria-label={locale === "en" ? "Business scenarios" : "Escenarios de negocio"} data-scenario-picker><p className="mb-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">{locale === "en" ? "01 / Choose the situation, then run it" : "01 / Elige la situación y ejecútala"}</p><div className="grid gap-2 sm:grid-cols-2">{options.map(option => <button key={option.id} type="button" aria-pressed={selected === option.id} onClick={() => onSelect(option.id)} className={`min-w-0 rounded-xl border p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${selected === option.id ? "border-accent bg-accent/10" : "border-border bg-surface hover:border-accent/50"}`}><span className="block text-sm font-medium">{option.label}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{option.description}</span></button>)}</div></section>;
}

export function StoryStage({ title, caption, step, total, children, locale }: { title: string; caption: string; step?: number; total?: number; children: ReactNode; locale: Locale }) {
  return <section className="relative min-w-0 overflow-hidden rounded-xl border border-border bg-surface" data-story-stage>
    <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4"><h3 className="font-mono text-xs uppercase tracking-wider">{title}</h3>{total !== undefined && <span className="shrink-0 font-mono text-xs text-accent">{String(step ?? 0).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>}</div>
    <div className="relative min-w-0 p-5 sm:p-8" data-stage-canvas>{children}</div>
    <p className="border-t border-border px-5 py-4 text-xs leading-5 text-muted-foreground"><span className="mr-2 font-mono text-accent">{locale === "en" ? "OBSERVE" : "OBSERVA"}</span>{caption}</p>
  </section>;
}

export function OutcomeBlock({ title, explanation, tone = "info" }: { title: string; explanation: string; tone?: "success" | "warning" | "danger" | "info" }) {
  const colors = { success: "border-success text-success", warning: "border-warning text-warning", danger: "border-danger text-danger", info: "border-info text-info" };
  return <section className={`border-l-4 pl-5 ${colors[tone]}`} data-business-outcome role="status"><p className="text-2xl font-medium tracking-tight sm:text-3xl">{title}</p><p className="mt-3 max-w-2xl text-sm leading-7 text-foreground">{explanation}</p></section>;
}
