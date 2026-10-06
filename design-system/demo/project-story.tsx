"use client";
import { useSyncExternalStore } from "react";
import type { CSSProperties, ReactNode } from "react";
import type { TapeStatus } from "./outcome-tape";

export interface Heading { before?: string; accent: string; after?: string }

function subscribeMotion(callback: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribeMotion, () => window.matchMedia("(prefers-reduced-motion: reduce)").matches, () => false);
}

export function StoryHero({ name, oneLiner, chips }: { name: string; oneLiner: string; chips: string[] }) {
  return <header data-story-hero className="pb-10 pt-4 sm:pb-14">
    <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">{name}<span className="text-accent">.</span></h1>
    <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">{oneLiner}</p>
    <ul className="mt-6 flex flex-wrap gap-2">{chips.map(chip => <li key={chip} className="rounded-md border border-border bg-surface px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{chip}</li>)}</ul>
  </header>;
}

export function StorySection({ index, heading, lead, children }: { index: number; heading: Heading; lead?: string; children?: ReactNode }) {
  return <section data-story-section={index} className="border-t border-border py-10 sm:py-14">
    <div className="flex items-baseline gap-4">
      <span className="font-mono text-xs text-muted-foreground">{String(index).padStart(2, "0")}</span>
      <h2 className="text-2xl font-semibold tracking-tight sm:text-4xl">{heading.before ? `${heading.before} ` : ""}<span className="text-accent">{heading.accent}</span>{heading.after ? ` ${heading.after}` : ""}</h2>
    </div>
    {lead ? <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:pl-9">{lead}</p> : null}
    {children ? <div className="mt-8 min-w-0">{children}</div> : null}
  </section>;
}

export function AnalogyBlock({ paragraphs, dictionaryLabel, dictionary }: { paragraphs: string[]; dictionaryLabel: string; dictionary: { term: string; means: string }[] }) {
  return <div data-analogy className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
    <div className="space-y-4 text-base leading-8">{paragraphs.map(p => <p key={p}>{p}</p>)}</div>
    <div className="rounded-xl border border-border bg-surface p-5">
      <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{dictionaryLabel}</p>
      <dl className="mt-4 space-y-3 text-sm">{dictionary.map(item => <div key={item.term} className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-baseline gap-2"><dt className="font-medium">{item.term}</dt><span aria-hidden="true" className="text-muted-foreground">=</span><dd className="text-muted-foreground">{item.means}</dd></div>)}</dl>
    </div>
  </div>;
}

export function WhyIBuiltIt({ title, text }: { title: string; text: string }) {
  if (!text.trim()) return null;
  return <aside data-why className="my-2 border-l-2 border-accent py-1 pl-5">
    <p className="font-mono text-xs uppercase tracking-wider text-accent">{title}</p>
    <p className="mt-2 max-w-2xl text-base leading-7">{text}</p>
  </aside>;
}

const TAPE_COLORS: Record<TapeStatus, string> = { served: "bg-success", rerouted: "bg-info", lost: "bg-danger", pending: "bg-foreground/10" };

/** `columns` sets the grid width (default 30); phones under 400px get half when it is above 15. */
export function OutcomeTape({ cells, labels, ariaLabel, columns = 30 }: { cells: TapeStatus[]; labels: Record<Exclude<TapeStatus, "pending">, string>; ariaLabel: string; columns?: number }) {
  const style = { "--tape-cols": columns, "--tape-cols-sm": columns > 15 ? Math.ceil(columns / 2) : columns } as CSSProperties;
  return <div data-outcome-tape>
    <ol aria-label={ariaLabel} style={style} className="grid grid-cols-[repeat(var(--tape-cols-sm),minmax(0,1fr))] gap-1 min-[400px]:grid-cols-[repeat(var(--tape-cols),minmax(0,1fr))]">
      {cells.map((cell, i) => <li key={i} data-tape-cell={cell} title={cell === "pending" ? undefined : `${i + 1}: ${labels[cell]}`} className={`flex h-4 items-center justify-center rounded-sm text-[10px] font-bold leading-none text-white transition-colors duration-300 motion-reduce:transition-none ${TAPE_COLORS[cell]}`}>{cell === "lost" ? <span aria-hidden="true">×</span> : null}<span className="sr-only">{cell === "pending" ? "" : `${i + 1}: ${labels[cell]}`}</span></li>)}
    </ol>
    <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">{(["served", "rerouted", "lost"] as const).map(status => <li key={status} className="flex items-center gap-1.5"><span aria-hidden="true" className={`inline-flex size-2.5 items-center justify-center rounded-sm text-[8px] font-bold leading-none text-white ${TAPE_COLORS[status]}`}>{status === "lost" ? "×" : null}</span>{labels[status]}</li>)}</ul>
  </div>;
}

export function FitGuide({ worthLabel, worth, notLabel, not }: { worthLabel: string; worth: string; notLabel: string; not: string }) {
  return <div data-fit-guide className="grid gap-4 md:grid-cols-2">
    <div className="rounded-xl border border-border border-l-4 border-l-success bg-surface p-5"><p className="font-mono text-xs uppercase tracking-wider text-success">{worthLabel}</p><p className="mt-3 text-base leading-7">{worth}</p></div>
    <div className="rounded-xl border border-border border-l-4 border-l-danger bg-surface p-5"><p className="font-mono text-xs uppercase tracking-wider text-danger">{notLabel}</p><p className="mt-3 text-base leading-7">{not}</p></div>
  </div>;
}

export function ProvesBlock({ text }: { text: string }) {
  return <p data-proves className="max-w-3xl text-lg leading-8">{text}</p>;
}

export function EngineerNotes({ summary, children }: { summary: string; children: ReactNode }) {
  return <details data-engineer-notes className="my-10 rounded-xl border border-border bg-surface p-5"><summary className="cursor-pointer font-mono text-sm uppercase tracking-wider focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">{summary}</summary><div className="mt-5 text-sm leading-7 text-muted-foreground">{children}</div></details>;
}
