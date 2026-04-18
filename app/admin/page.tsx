import Link from "next/link";

type Decision = "APROBADO" | "RECHAZADO" | "REVISION_MANUAL";

interface VerificationRecord {
  id: string;
  name: string;
  document_id: string;
  country: string;
  decision: Decision;
  confidence: number;
  created_at: string;
  face_score: number;
  sanctions: boolean;
  pep: boolean;
}

const MOCK_RECORDS: VerificationRecord[] = [
  { id: "chk_001", name: "Ana Martínez", document_id: "CC-1098765432", country: "CO", decision: "APROBADO", confidence: 0.97, created_at: "2025-04-15T09:12:00Z", face_score: 0.96, sanctions: false, pep: false },
  { id: "chk_002", name: "Jorge Rodríguez", document_id: "CC-1054321987", country: "CO", decision: "RECHAZADO", confidence: 0.91, created_at: "2025-04-15T09:35:00Z", face_score: 0.28, sanctions: true, pep: false },
  { id: "chk_003", name: "María López", document_id: "PA-AB123456", country: "MX", decision: "REVISION_MANUAL", confidence: 0.68, created_at: "2025-04-15T10:04:00Z", face_score: 0.61, sanctions: false, pep: true },
  { id: "chk_004", name: "Carlos Herrera", document_id: "CC-1123456789", country: "CO", decision: "APROBADO", confidence: 0.94, created_at: "2025-04-15T10:22:00Z", face_score: 0.93, sanctions: false, pep: false },
  { id: "chk_005", name: "Luisa Fernández", document_id: "CE-987654321", country: "VE", decision: "RECHAZADO", confidence: 0.88, created_at: "2025-04-15T10:48:00Z", face_score: 0.34, sanctions: true, pep: true },
  { id: "chk_006", name: "Andrés Torres", document_id: "CC-1098123456", country: "CO", decision: "APROBADO", confidence: 0.99, created_at: "2025-04-15T11:05:00Z", face_score: 0.98, sanctions: false, pep: false },
  { id: "chk_007", name: "Valentina Gómez", document_id: "PA-CD789012", country: "AR", decision: "REVISION_MANUAL", confidence: 0.72, created_at: "2025-04-15T11:31:00Z", face_score: 0.65, sanctions: false, pep: true },
  { id: "chk_008", name: "Sebastián Díaz", document_id: "CC-1076543210", country: "CO", decision: "APROBADO", confidence: 0.96, created_at: "2025-04-15T11:58:00Z", face_score: 0.95, sanctions: false, pep: false },
];

const DECISION_STYLES: Record<Decision, { badge: string; label: string; dot: string }> = {
  APROBADO: { badge: "bg-green-100 text-green-800", label: "Aprobado", dot: "bg-green-500" },
  RECHAZADO: { badge: "bg-red-100 text-red-800", label: "Rechazado", dot: "bg-red-500" },
  REVISION_MANUAL: { badge: "bg-yellow-100 text-yellow-800", label: "Revisión manual", dot: "bg-yellow-500" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const total = MOCK_RECORDS.length;
const aprobados = MOCK_RECORDS.filter((r) => r.decision === "APROBADO").length;
const rechazados = MOCK_RECORDS.filter((r) => r.decision === "RECHAZADO").length;
const revision = MOCK_RECORDS.filter((r) => r.decision === "REVISION_MANUAL").length;
const avgConfidence = MOCK_RECORDS.reduce((acc, r) => acc + r.confidence, 0) / total;

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Topbar */}
      <header className="bg-background border-b shadow-[var(--shadow-border-light)] px-4 sm:px-6 py-0 h-14 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] shadow-[var(--shadow-card)] shrink-0">
            <svg className="h-4 w-4 text-foreground" viewBox="0 0 16 16" fill="none">
              <path d="M8 1.5L2 4v4c0 3.5 2.5 5.8 6 6.5 3.5-.7 6-3 6-6.5V4L8 1.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold text-foreground tracking-tight">Panel KYC</h1>
            <span className="h-4 w-px bg-[var(--border)]" />
            <p className="text-xs text-[var(--muted-foreground)] hidden sm:block">Administración de verificaciones</p>
          </div>
          <span className="rounded-full shadow-[var(--shadow-border-light)] px-2 py-0.5 text-xs text-[var(--muted-foreground)]">
            Datos simulados
          </span>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] shadow-[var(--shadow-border-light)] px-3 py-1.5 text-xs font-medium text-[var(--muted-foreground)] hover:text-foreground hover:bg-[var(--gray-50)] transition-all"
        >
          <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
            <path d="M7.5 2L3 6l4.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Nueva verificación
        </Link>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Métricas */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MetricCard label="Total verificaciones" value={total} accentClass="border-[var(--border)]" />
          <MetricCard label="Aprobados" value={aprobados} sub={`${((aprobados / total) * 100).toFixed(0)}% del total`} color="text-green-600" accentClass="border-green-400" />
          <MetricCard label="Rechazados" value={rechazados} sub={`${((rechazados / total) * 100).toFixed(0)}% del total`} color="text-red-600" accentClass="border-red-400" />
          <MetricCard label="Revisión manual" value={revision} sub={`${((revision / total) * 100).toFixed(0)}% del total`} color="text-amber-600" accentClass="border-amber-400" />
        </div>

        {/* Barra de distribución */}
        <div className="bg-[var(--card)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">Distribución de decisiones</h2>
            <span className="text-xs text-[var(--muted-foreground)]">
              Confianza promedio: {(avgConfidence * 100).toFixed(0)}%
            </span>
          </div>
          <div
            role="img"
            aria-label={`Distribución: ${aprobados} aprobados, ${revision} en revisión, ${rechazados} rechazados`}
            className="flex h-2.5 w-full rounded-full overflow-hidden gap-px"
          >
            <div className="bg-green-400 transition-all" style={{ width: `${(aprobados / total) * 100}%` }} />
            <div className="bg-yellow-400 transition-all" style={{ width: `${(revision / total) * 100}%` }} />
            <div className="bg-red-400 transition-all" style={{ width: `${(rechazados / total) * 100}%` }} />
          </div>
          <div className="flex items-center gap-4 mt-2.5">
            {[
              { color: "bg-green-400", label: "Aprobado" },
              { color: "bg-yellow-400", label: "Revisión" },
              { color: "bg-red-400", label: "Rechazado" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${item.color}`} />
                <span className="text-xs text-[var(--muted-foreground)]">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabla de verificaciones */}
        <div className="bg-[var(--card)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Verificaciones recientes</h2>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{total} registros hoy</p>
            </div>
            {/* Filtros visuales */}
            <div className="flex items-center gap-1.5">
              {[
                { label: "Todos", active: true },
                { label: "Revisión pendiente", active: false },
                { label: "Rechazados", active: false },
              ].map((f) => (
                <span
                  key={f.label}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium cursor-default ${
                    f.active
                      ? "bg-foreground text-background"
                      : "shadow-[var(--shadow-border-light)] text-[var(--muted-foreground)] hover:bg-[var(--gray-50)]"
                  }`}
                >
                  {f.label}
                </span>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--gray-50)]">
                  <th scope="col" className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Solicitante</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Documento</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">País</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Decisión</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Face score</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Confianza</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Alertas</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {MOCK_RECORDS.map((record) => {
                  const style = DECISION_STYLES[record.decision];
                  return (
                    <tr key={record.id} className="hover:bg-[var(--gray-50)] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-foreground">{record.name}</div>
                        <div className="text-xs text-[var(--muted-foreground)]">{record.id}</div>
                      </td>
                      <td className="px-4 py-3.5 text-[var(--muted-foreground)] font-mono text-xs">{record.document_id}</td>
                      <td className="px-4 py-3.5">
                        <span className="rounded-[var(--radius-sm)] bg-[var(--gray-100)] px-2 py-0.5 text-xs font-medium text-[var(--muted-foreground)]">
                          {record.country}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold shadow-[var(--shadow-border-light)] ${style.badge}`}>
                            {style.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 rounded-full bg-[var(--gray-100)] overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                record.face_score >= 0.8 ? "bg-green-400" : record.face_score >= 0.6 ? "bg-yellow-400" : "bg-red-400"
                              }`}
                              style={{ width: `${record.face_score * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-[var(--muted-foreground)]">{(record.face_score * 100).toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-[var(--muted-foreground)] tabular-nums">
                        {(record.confidence * 100).toFixed(0)}%
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex gap-1 flex-wrap">
                          {record.sanctions && (
                            <span className="rounded shadow-[var(--shadow-border-light)] px-1.5 py-0.5 text-xs font-medium bg-red-50 text-red-700">Sanciones</span>
                          )}
                          {record.pep && (
                            <span className="rounded shadow-[var(--shadow-border-light)] px-1.5 py-0.5 text-xs font-medium bg-orange-50 text-orange-700">PEP</span>
                          )}
                          {!record.sanctions && !record.pep && (
                            <span className="text-xs text-[var(--muted-foreground)]">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-[var(--muted-foreground)] whitespace-nowrap">
                        {formatDate(record.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <footer className="flex flex-col items-center gap-1 pt-2">
          <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
            <span className="font-medium text-foreground">KYC Anti-Fraude</span>
            <span className="h-3 w-px bg-[var(--border)]" />
            <span>Datos simulados · Portafolio técnico</span>
          </div>
          <a
            href="https://github.com/mdeasis27"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[var(--muted-foreground)] hover:text-foreground transition-colors font-mono"
          >
            github.com/mdeasis27
          </a>
        </footer>
      </main>
    </div>
  );
}

function MetricCard({
  label,
  value,
  sub,
  color = "text-foreground",
  accentClass = "border-[var(--border)]",
}: {
  label: string;
  value: number;
  sub?: string;
  color?: string;
  accentClass?: string;
}) {
  return (
    <div className={`bg-[var(--card)] rounded-[var(--radius-md)] shadow-[var(--shadow-card)] border-l-4 ${accentClass} p-5`}>
      <div className="text-xs text-[var(--muted-foreground)] font-medium mb-2">{label}</div>
      <div className={`text-3xl font-bold tabular-nums ${color}`}>{value}</div>
      {sub && <div className="text-xs text-[var(--muted-foreground)] mt-1">{sub}</div>}
    </div>
  );
}
