import Link from "next/link";

import { MetricCard } from "@/design-system/components/metric-card";
import { StatusBadge } from "@/design-system/components/status-badge";
import type { Tone } from "@/design-system/components/tone";

type Locale = "en" | "es";
type Decision = "approved" | "rejected" | "manual_review";

interface VerificationRecord {
  id: string;
  applicant: string;
  documentId: string;
  country: string;
  decision: Decision;
  reviewSignal: number;
  createdAt: string;
  matchSignal: number;
  sanctions: boolean;
  pep: boolean;
}

const RECORDS: VerificationRecord[] = [
  { id: "sample-001", applicant: "Applicant A", documentId: "DOC-1001", country: "CO", decision: "approved", reviewSignal: 97, createdAt: "2025-04-15T09:12:00Z", matchSignal: 96, sanctions: false, pep: false },
  { id: "sample-002", applicant: "Applicant B", documentId: "DOC-1002", country: "CO", decision: "rejected", reviewSignal: 91, createdAt: "2025-04-15T09:35:00Z", matchSignal: 28, sanctions: true, pep: false },
  { id: "sample-003", applicant: "Applicant C", documentId: "DOC-1003", country: "MX", decision: "manual_review", reviewSignal: 68, createdAt: "2025-04-15T10:04:00Z", matchSignal: 61, sanctions: false, pep: true },
  { id: "sample-004", applicant: "Applicant D", documentId: "DOC-1004", country: "CO", decision: "approved", reviewSignal: 94, createdAt: "2025-04-15T10:22:00Z", matchSignal: 93, sanctions: false, pep: false },
  { id: "sample-005", applicant: "Applicant E", documentId: "DOC-1005", country: "VE", decision: "rejected", reviewSignal: 88, createdAt: "2025-04-15T10:48:00Z", matchSignal: 34, sanctions: true, pep: true },
  { id: "sample-006", applicant: "Applicant F", documentId: "DOC-1006", country: "CO", decision: "approved", reviewSignal: 99, createdAt: "2025-04-15T11:05:00Z", matchSignal: 98, sanctions: false, pep: false },
  { id: "sample-007", applicant: "Applicant G", documentId: "DOC-1007", country: "AR", decision: "manual_review", reviewSignal: 72, createdAt: "2025-04-15T11:31:00Z", matchSignal: 65, sanctions: false, pep: true },
  { id: "sample-008", applicant: "Applicant H", documentId: "DOC-1008", country: "CO", decision: "approved", reviewSignal: 96, createdAt: "2025-04-15T11:58:00Z", matchSignal: 95, sanctions: false, pep: false },
];

const decisionTone: Record<Decision, Tone> = { approved: "success", rejected: "danger", manual_review: "warning" };

function copy(lang: Locale) {
  return lang === "es" ? {
    title: "Panel de verificación", subtitle: "Resumen estático de registros ficticios", newCase: "Nueva verificación", sample: "Datos ficticios", notice: "Los registros, identificadores y señales mostrados son ficticios. Las señales no son probabilidades calibradas y no sustituyen una decisión humana.",
    total: "Registros de muestra", approved: "Aprobados", rejected: "Rechazados", review: "Revisión manual", distribution: "Distribución de decisiones", staticSummary: "Resumen estático · sin filtros interactivos", table: "Registros de muestra", dated: "Muestra fechada el 15 abr 2025", applicant: "Solicitante", document: "Documento", country: "País", decision: "Decisión", match: "Señal de coincidencia", signal: "Señal de revisión", alerts: "Alertas", date: "Fecha", sanctions: "Sanciones", scoreNote: "Señal ilustrativa; no es probabilidad calibrada.",
    labels: { approved: "Aprobado", rejected: "Rechazado", manual_review: "Revisión manual" },
  } : {
    title: "Verification console", subtitle: "Static summary of fictional records", newCase: "New verification", sample: "Fictional data", notice: "The records, identifiers, and signals shown here are fictional. Signals are not calibrated probabilities and do not replace a human decision.",
    total: "Sample records", approved: "Approved", rejected: "Rejected", review: "Manual review", distribution: "Decision distribution", staticSummary: "Static summary · no interactive filters", table: "Sample records", dated: "Sample dated Apr 15, 2025", applicant: "Applicant", document: "Document", country: "Country", decision: "Decision", match: "Match signal", signal: "Review signal", alerts: "Alerts", date: "Date", sanctions: "Sanctions", scoreNote: "Illustrative signal; not a calibrated probability.",
    labels: { approved: "Approved", rejected: "Rejected", manual_review: "Manual review" },
  };
}

function formatDate(value: string, lang: Locale) {
  return new Intl.DateTimeFormat(lang === "es" ? "es-MX" : "en-US", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export default function AdminPage({ lang = "es" }: { lang?: Locale }) {
  const text = copy(lang);
  const total = RECORDS.length;
  const count = (decision: Decision) => RECORDS.filter((record) => record.decision === decision).length;

  return <main className="mx-auto min-h-screen max-w-6xl px-5 py-10 text-foreground">
    <header className="flex flex-wrap items-center justify-between gap-4 border-b pb-5">
      <div>
        <div className="flex flex-wrap items-center gap-3"><h1 className="text-2xl font-semibold">{text.title}</h1><StatusBadge tone="neutral">{text.sample}</StatusBadge></div>
        <p className="mt-1 text-sm text-muted-foreground">{text.subtitle}</p>
      </div>
      <Link href={`/${lang}/app`} className="rounded border px-3 py-2 text-sm">← {text.newCase}</Link>
    </header>

    <p className="mt-6 rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-muted-foreground">{text.notice}</p>

    <section className="mt-6 grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 sm:grid-cols-4">
      <MetricCard label={text.total} value={total} />
      <MetricCard label={text.approved} value={count("approved")} tone="success" />
      <MetricCard label={text.rejected} value={count("rejected")} tone="danger" />
      <MetricCard label={text.review} value={count("manual_review")} tone="warning" />
    </section>

    <section className="mt-6 rounded-xl border bg-card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2"><h2 className="font-semibold">{text.distribution}</h2><span className="text-xs text-muted-foreground">{text.staticSummary}</span></div>
      <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-muted" aria-label={text.distribution} role="img">
        {(["approved", "manual_review", "rejected"] as Decision[]).map((decision) => <div key={decision} className={decision === "approved" ? "bg-success" : decision === "manual_review" ? "bg-warning" : "bg-danger"} style={{ width: `${(count(decision) / total) * 100}%` }} />)}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{text.scoreNote}</p>
    </section>

    <section className="mt-6 overflow-hidden rounded-xl border bg-card">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b px-5 py-4"><h2 className="font-semibold">{text.table}</h2><p className="text-xs text-muted-foreground">{text.dated}</p></div>
      <div className="overflow-x-auto"><table className="min-w-[900px] w-full text-sm"><thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground"><tr>{[text.applicant, text.document, text.country, text.decision, text.match, text.signal, text.alerts, text.date].map((heading) => <th key={heading} className="px-4 py-3 font-medium">{heading}</th>)}</tr></thead><tbody>{RECORDS.map((record) => <tr key={record.id} className="border-t"><td className="px-4 py-3"><p className="font-medium">{record.applicant}</p><p className="font-mono text-xs text-muted-foreground">{record.id}</p></td><td className="px-4 py-3 font-mono text-xs">{record.documentId}</td><td className="px-4 py-3">{record.country}</td><td className="px-4 py-3"><StatusBadge tone={decisionTone[record.decision]}>{text.labels[record.decision]}</StatusBadge></td><td className="px-4 py-3 tabular-nums">{record.matchSignal}</td><td className="px-4 py-3 tabular-nums">{record.reviewSignal}</td><td className="px-4 py-3 text-xs">{record.sanctions ? text.sanctions : record.pep ? "PEP" : "—"}</td><td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">{formatDate(record.createdAt, lang)}</td></tr>)}</tbody></table></div>
    </section>
  </main>;
}
