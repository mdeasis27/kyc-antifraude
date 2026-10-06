"use client";
import type { Locale } from "../i18n/locale";
export function MissionBrief({ locale, name, title, context, role, stakes }: {
    locale: Locale;
    name: string;
    title: string;
    context: string;
    role: string;
    stakes: string;
}) {
    const en = locale === "en";
    return <header id="mission" data-business-story className="mb-7 border-b border-border pb-7">
    <p className="font-mono text-xs uppercase tracking-widest text-accent">{name} / {en ? "A decision you can test" : "Una decisión que puedes probar"}</p>
    <h1 className="mt-4 max-w-3xl text-3xl font-medium leading-tight tracking-tight sm:text-5xl">{title}</h1>
    <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">{context}</p>
    <div className="mt-5 flex flex-wrap gap-x-8 gap-y-3 text-sm"><p><span className="text-muted-foreground">{en ? "Your role" : "Tu papel"}: </span>{role}</p><p><span className="text-muted-foreground">{en ? "At stake" : "En juego"}: </span>{stakes}</p></div>
  </header>;
}
export function MissionPrompt({ locale, question, options, prediction, onPredict, locked = false }: {
    locale: Locale;
    question: string;
    options: {
        id: string;
        label: string;
    }[];
    prediction: string | null;
    onPredict: (id: string) => void;
    locked?: boolean;
}) {
    const en = locale === "en";
    return <section data-mission-prompt className="mt-5 mb-4 rounded-xl border border-accent/40 bg-accent/10 p-4">
    <p className="font-mono text-xs uppercase tracking-widest text-accent">{en ? "Your move / Predict, then test" : "Tu turno / Predice y prueba"}</p>
    <h2 className="mt-3 text-base font-medium leading-6 tracking-normal">{question}</h2>
    <div className="mt-4 flex flex-wrap gap-2">{options.map(option => <button key={option.id} type="button" data-prediction={option.id} disabled={locked} aria-pressed={prediction === option.id} onClick={() => onPredict(option.id)} className={`min-h-11 rounded-lg border px-4 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${prediction === option.id ? "border-accent bg-surface font-medium" : "border-border bg-surface/60"} disabled:cursor-default`}>{option.label}</button>)}</div>
    <p className="mt-3 text-xs leading-5 text-muted-foreground">{locked ? (en ? "Change an input or reset to make another prediction." : "Cambia un dato o reinicia para hacer otra predicción.") : (en ? "Choose your prediction, run the experiment, then reveal the result. You can also explore without predicting." : "Elige tu predicción, ejecuta el experimento y revela el resultado. También puedes explorar sin predecir.")}</p>
  </section>;
}
export interface ComparisonSide {
    label: string;
    value: string;
    detail: string;
    positive?: boolean;
}
export function MissionComparison({ locale, sides, explanation, prediction, actual, actualLabel }: {
    locale: Locale;
    sides: [
        ComparisonSide,
        ComparisonSide
    ];
    explanation: string;
    prediction: string | null;
    actual: string;
    actualLabel: string;
}) {
    const en = locale === "en";
    return <section data-mission-comparison aria-label={en ? "Computed comparison" : "Comparación calculada"} className="mt-6 border-t border-border pt-6">
    <p className="font-mono text-sm uppercase tracking-widest text-accent">{en ? "Same data / Two choices calculated" : "Mismos datos / Dos opciones calculadas"}</p>
    <div className="mt-4 grid gap-3 sm:grid-cols-2">{sides.map(side => <div key={side.label} className="min-w-0 rounded-xl border border-border bg-surface p-5"><p className="text-sm text-muted-foreground">{side.label}</p><p className={`mt-3 break-words text-3xl font-medium tracking-tight ${side.positive ? "text-success" : "text-foreground"}`}>{side.value}</p><p className="mt-3 text-sm leading-6 text-muted-foreground">{side.detail}</p></div>)}</div>
    <p className="mt-4 text-sm leading-7">{explanation}</p>
    <p data-prediction-feedback role="status" className="mt-4 border-l-2 border-accent pl-4 text-sm leading-6">{prediction ? (prediction === actual ? (en ? "Your prediction matches this run. " : "Tu predicción coincide con esta ejecución. ") : (en ? "This run challenges your prediction. " : "Esta ejecución contradice tu predicción. ")) : (en ? "Computed result: " : "Resultado calculado: ")}{actualLabel}</p>
  </section>;
}
export function DecisionNotes({ locale, implementation, rationale, production }: {
    locale: Locale;
    implementation: string;
    rationale: string;
    production: string;
}) {
    const en = locale === "en";
    return <details data-decision-notes className="mt-8 border-y border-border py-5"><summary className="cursor-pointer text-sm font-medium focus-visible:outline-2 focus-visible:outline-accent">{en ? "Inside the decision: implementation, tradeoffs and production" : "Dentro de la decisión: implementación, compromisos y producción"}</summary><dl className="mt-5 grid gap-5 text-sm leading-7 sm:grid-cols-3">{[[en ? "Implementation" : "Implementación", implementation], [en ? "Why this approach" : "Por qué este enfoque", rationale], [en ? "Before production" : "Antes de producción", production]].map(([label, value]) => <div key={label}><dt className="font-mono text-xs uppercase text-accent">{label}</dt><dd className="mt-2 text-muted-foreground">{value}</dd></div>)}</dl></details>;
}
