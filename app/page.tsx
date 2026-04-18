"use client";

import { useState, useRef, useEffect } from "react";
import { OnboardingStepper } from "@/components/OnboardingStepper";
import type { KycSynthesis } from "@/lib/synthesizer";
import type { KycScenario } from "@/lib/truora";

const SCENARIOS: { value: KycScenario; label: string; dot: string }[] = [
  { value: "aprobado", label: "Aprobado", dot: "bg-emerald-400" },
  { value: "revision_manual", label: "Revisión manual", dot: "bg-amber-400" },
  { value: "rechazado", label: "Rechazado", dot: "bg-red-400" },
];

const DECISION_CONFIG = {
  APROBADO: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    headerBg: "bg-emerald-500",
    bar: "bg-emerald-400",
    label: "APROBADO",
    nextAction: "Tu identidad ha sido verificada exitosamente. Puedes continuar con el proceso de onboarding.",
  },
  RECHAZADO: {
    bg: "bg-red-50",
    border: "border-red-200",
    headerBg: "bg-red-600",
    bar: "bg-red-400",
    label: "RECHAZADO",
    nextAction: "No fue posible completar la verificación. Contacta a soporte con tu número de caso.",
  },
  REVISION_MANUAL: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    headerBg: "bg-amber-500",
    bar: "bg-amber-400",
    label: "REVISIÓN MANUAL",
    nextAction: "Un agente revisará tu caso en las próximas 24 horas hábiles. Te notificaremos por correo.",
  },
} as const;

const LOADING_STEPS = [
  "Validando documento de identidad…",
  "Comparando biometría facial…",
  "Consultando listas de sanciones…",
  "Sintetizando decisión con IA…",
];

const FEATURES = [
  { icon: "⚡", label: "Decisión en segundos" },
  { icon: "🔒", label: "Datos protegidos" },
  { icon: "🤖", label: "IA con LLaMA 3.1" },
  { icon: "📋", label: "Audit trail completo" },
];

export default function Home() {
  const [step, setStep] = useState(1);
  const [scenario, setScenario] = useState<KycScenario>("aprobado");
  const [checkId, setCheckId] = useState<string | null>(null);
  const [synthesis, setSynthesis] = useState<KycSynthesis | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [docPreview, setDocPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

  const docInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);
  const docBlobRef = useRef<string | null>(null);
  const selfieBlobRef = useRef<string | null>(null);
  const animationCancelRef = useRef(false);

  useEffect(() => {
    return () => {
      if (docBlobRef.current) URL.revokeObjectURL(docBlobRef.current);
      if (selfieBlobRef.current) URL.revokeObjectURL(selfieBlobRef.current);
    };
  }, []);

  function handleDocChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (docBlobRef.current) URL.revokeObjectURL(docBlobRef.current);
    const url = URL.createObjectURL(file);
    docBlobRef.current = url;
    setDocPreview(url);
  }

  function handleSelfieChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (selfieBlobRef.current) URL.revokeObjectURL(selfieBlobRef.current);
    const url = URL.createObjectURL(file);
    selfieBlobRef.current = url;
    setSelfiePreview(url);
  }

  async function animateLoadingSteps(totalMs: number, cancelRef: React.MutableRefObject<boolean>) {
    const delay = totalMs / LOADING_STEPS.length;
    for (let i = 0; i < LOADING_STEPS.length; i++) {
      if (cancelRef.current) return;
      setLoadingStep(i);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  async function handleStartKyc() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/kyc/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_id: "DOC-" + Date.now(), country: "CO", scenario }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Error al iniciar verificación");
      }
      const data = await res.json();
      setCheckId(data.check_id);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  async function handleDecide() {
    if (!checkId) return;
    setError(null);
    setLoading(true);
    setLoadingStep(0);
    animationCancelRef.current = false;
    const cancelRef = animationCancelRef;
    try {
      const [res] = await Promise.all([
        fetch("/api/kyc/decide", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ check_id: checkId }),
        }),
        animateLoadingSteps(3200, cancelRef),
      ]);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Error al generar decisión");
      }
      const data = await res.json();
      setSynthesis(data.synthesis);
      setStep(3);
    } catch (err) {
      cancelRef.current = true;
      setLoadingStep(0);
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    if (docBlobRef.current) { URL.revokeObjectURL(docBlobRef.current); docBlobRef.current = null; }
    if (selfieBlobRef.current) { URL.revokeObjectURL(selfieBlobRef.current); selfieBlobRef.current = null; }
    setStep(1); setCheckId(null); setSynthesis(null);
    setError(null); setDocPreview(null); setSelfiePreview(null); setLoadingStep(0);
    if (docInputRef.current) docInputRef.current.value = "";
    if (selfieInputRef.current) selfieInputRef.current.value = "";
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">

      {/* Topbar */}
      <header className="border-b shadow-[var(--shadow-border-light)] px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] shadow-[var(--shadow-card)]">
            <svg className="h-4 w-4 text-foreground" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L3 5.5v5c0 4.5 3 7.5 7 8.5 4-1 7-4 7-8.5v-5L10 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-bold text-sm tracking-tight text-foreground">KYC Shield</span>
          <span className="rounded-full shadow-[var(--shadow-border-light)] px-2 py-0.5 text-xs text-[var(--muted-foreground)] font-medium">
            Demo
          </span>
        </div>
        <a
          href="/admin"
          className="text-xs text-[var(--muted-foreground)] hover:text-foreground transition-colors"
        >
          Panel de administración →
        </a>
      </header>

      {/* Hero */}
      <section className="max-w-3xl mx-auto w-full px-6 pt-14 pb-8">
        <h1 className="text-4xl font-bold text-foreground leading-tight mb-4">
          Verifica identidades<br />
          <span className="text-[var(--accent)]">con IA en segundos</span>
        </h1>
        <p className="text-[var(--muted-foreground)] text-sm leading-relaxed mb-8 max-w-lg">
          Plataforma de onboarding KYC anti-fraude. Análisis biométrico, validación documental y consulta de listas de sanciones en un solo flujo.
        </p>
        <div className="flex flex-wrap gap-2">
          {FEATURES.map((f) => (
            <div
              key={f.label}
              className="flex items-center gap-2 rounded-[var(--radius-pill)] shadow-[var(--shadow-border-light)] px-3.5 py-1.5"
            >
              <span className="text-sm">{f.icon}</span>
              <span className="text-xs text-[var(--muted-foreground)] font-medium">{f.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Main flow */}
      <main className="max-w-3xl mx-auto w-full px-6 pb-16 flex flex-col gap-6">

        {/* Scenario selector */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-3">
            Simular resultado
          </p>
          <div className="flex flex-wrap gap-2">
            {SCENARIOS.map((s) => (
              <button
                key={s.value}
                onClick={() => setScenario(s.value)}
                aria-pressed={scenario === s.value}
                className={`flex items-center gap-2.5 rounded-[var(--radius-pill)] px-4 py-2 text-sm transition-all ${
                  scenario === s.value
                    ? "bg-foreground text-background"
                    : "shadow-[var(--shadow-border-light)] text-[var(--muted-foreground)] hover:text-foreground hover:shadow-[var(--shadow-border)]"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${s.dot} shrink-0`} />
                {s.label}
                {scenario === s.value && (
                  <svg className="h-3.5 w-3.5 ml-1" viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 7l3 3 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Stepper */}
        <OnboardingStepper currentStep={step} />

        {/* Badge escenario activo en pasos 2 y 3 */}
        {step > 1 && (
          <div className="flex justify-end">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              scenario === "aprobado" ? "bg-emerald-100 text-emerald-700" :
              scenario === "rechazado" ? "bg-red-100 text-red-700" :
              "bg-amber-100 text-amber-700"
            }`}>
              {scenario === "aprobado" ? "Escenario: Aprobado" : scenario === "rechazado" ? "Escenario: Rechazado" : "Escenario: Revisión manual"}
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="rounded-[var(--radius-md)] bg-red-50 shadow-[var(--shadow-border-light)] p-4 flex items-start justify-between gap-3"
          >
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={() => setError(null)} aria-label="Cerrar error" className="text-red-300 hover:text-red-500 text-xl leading-none">×</button>
          </div>
        )}

        {/* Card */}
        <div className="bg-[var(--card)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] overflow-hidden">

          {/* PASO 1 */}
          {step === 1 && (
            <div className="step-panel">
              <div className="bg-[var(--gray-50)] px-6 py-5 border-b border-[var(--border)]">
                <h2 className="text-foreground font-semibold text-base">Documento de identidad</h2>
                <p className="text-[var(--muted-foreground)] text-xs mt-1">Cédula, pasaporte o documento nacional</p>
              </div>
              <div className="p-6 space-y-5">
                <label className="block cursor-pointer group">
                  <div className={`rounded-[var(--radius-md)] border-2 border-dashed transition-all ${
                    docPreview
                      ? "border-[var(--border)] bg-[var(--gray-50)]"
                      : "border-[var(--border)] group-hover:border-[var(--accent)] group-hover:bg-[var(--accent)]/5 bg-[var(--gray-50)]"
                  } flex flex-col items-center justify-center p-8 min-h-[160px]`}>
                    {docPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={docPreview} alt="Vista previa del documento" className="max-h-36 rounded-[var(--radius-md)] object-contain" />
                    ) : (
                      <>
                        <div className="h-12 w-12 rounded-[var(--radius-md)] bg-[var(--gray-100)] group-hover:bg-[var(--accent)]/10 flex items-center justify-center mb-3 transition-colors">
                          <svg className="h-6 w-6 text-[var(--gray-400)] group-hover:text-[var(--accent)] transition-colors" viewBox="0 0 24 24" fill="none">
                            <path d="M7 16V4m0 0l-3 3m3-3l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M3 20h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-[var(--muted-foreground)] group-hover:text-[var(--accent)] transition-colors">Subir documento</span>
                        <span className="text-xs text-[var(--gray-400)] mt-1">PNG, JPG, WEBP · No se envía al servidor</span>
                      </>
                    )}
                  </div>
                  <input ref={docInputRef} type="file" accept="image/*" className="sr-only" aria-label="Subir documento de identidad" onChange={handleDocChange} />
                </label>

                {docPreview && (
                  <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none">
                      <circle cx="7" cy="7" r="6" fill="#10b981"/>
                      <path d="M4 7l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Imagen seleccionada
                  </div>
                )}

                <button
                  onClick={handleStartKyc}
                  disabled={loading || !docPreview}
                  className="w-full rounded-[var(--radius-md)] bg-[var(--primary)] px-4 py-3.5 text-sm font-semibold text-white transition-all hover:bg-[var(--primary)]/90 disabled:cursor-not-allowed disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Iniciando…
                    </>
                  ) : (
                    "Continuar →"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* PASO 2 */}
          {step === 2 && (
            <div className="step-panel">
              <div className="bg-[var(--gray-50)] px-6 py-5 border-b border-[var(--border)]">
                <h2 className="text-foreground font-semibold text-base">Verificación biométrica</h2>
                <p className="text-[var(--muted-foreground)] text-xs mt-1">Selfie para comparar con el documento</p>
              </div>
              <div className="p-6 space-y-5">
                {loading ? (
                  <div className="rounded-[var(--radius-md)] shadow-[var(--shadow-border-light)] bg-[var(--gray-50)] p-6 space-y-5">
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--gray-100)] border-t-foreground shrink-0" />
                      <span className="text-sm font-medium text-foreground">{LOADING_STEPS[loadingStep]}</span>
                    </div>
                    <div className="space-y-2.5">
                      {LOADING_STEPS.map((label) => {
                        const i = LOADING_STEPS.indexOf(label);
                        return (
                          <div key={label} className="flex items-center gap-3">
                            <div className={`h-5 w-5 rounded-full shrink-0 flex items-center justify-center border transition-all ${
                              i < loadingStep
                                ? "bg-emerald-500 border-emerald-500"
                                : i === loadingStep
                                ? "border-foreground bg-background animate-pulse"
                                : "border-[var(--border)] bg-background"
                            }`}>
                              {i < loadingStep && (
                                <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                                  <path d="M2.5 6l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                              {i === loadingStep && <div className="h-2 w-2 rounded-full bg-foreground" />}
                            </div>
                            <span className={`text-xs transition-colors ${
                              i < loadingStep ? "text-emerald-600 line-through" :
                              i === loadingStep ? "text-foreground font-medium" : "text-[var(--muted-foreground)]"
                            }`}>{label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <label className="block cursor-pointer group">
                    <div className={`rounded-[var(--radius-md)] border-2 border-dashed transition-all ${
                      selfiePreview
                        ? "border-[var(--border)] bg-[var(--gray-50)]"
                        : "border-[var(--border)] group-hover:border-[var(--accent)] group-hover:bg-[var(--accent)]/5 bg-[var(--gray-50)]"
                    } flex flex-col items-center justify-center p-8 min-h-[160px]`}>
                      {selfiePreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={selfiePreview} alt="Vista previa de la selfie" className="max-h-36 rounded-[var(--radius-md)] object-contain" />
                      ) : (
                        <>
                          <div className="h-12 w-12 rounded-[var(--radius-md)] bg-[var(--gray-100)] group-hover:bg-[var(--accent)]/10 flex items-center justify-center mb-3 transition-colors">
                            <svg className="h-6 w-6 text-[var(--gray-400)] group-hover:text-[var(--accent)] transition-colors" viewBox="0 0 24 24" fill="none">
                              <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/>
                              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                          </div>
                          <span className="text-sm font-medium text-[var(--muted-foreground)] group-hover:text-[var(--accent)] transition-colors">Subir selfie</span>
                          <span className="text-xs text-[var(--gray-400)] mt-1">PNG, JPG, WEBP · No se envía al servidor</span>
                        </>
                      )}
                    </div>
                    <input ref={selfieInputRef} type="file" accept="image/*" className="sr-only" aria-label="Subir selfie para verificación biométrica" onChange={handleSelfieChange} />
                  </label>
                )}

                {selfiePreview && !loading && (
                  <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none">
                      <circle cx="7" cy="7" r="6" fill="#10b981"/>
                      <path d="M4 7l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Imagen seleccionada
                  </div>
                )}

                <button
                  onClick={handleDecide}
                  disabled={loading || !selfiePreview}
                  className="w-full rounded-[var(--radius-md)] bg-[var(--primary)] px-4 py-3.5 text-sm font-semibold text-white transition-all hover:bg-[var(--primary)]/90 disabled:cursor-not-allowed disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Analizando con IA…
                    </>
                  ) : (
                    "Analizar con IA →"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* PASO 3 — Resultado */}
          {step === 3 && synthesis && (() => {
            const cfg = DECISION_CONFIG[synthesis.decision];
            const confidencePct = Math.min(100, Math.max(0, synthesis.confidence * 100));
            return (
              <div className="step-panel">
                <div className={`${cfg.headerBg} px-6 py-5 flex items-center gap-4`}>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 shrink-0">
                    {synthesis.decision === "APROBADO" && (
                      <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none">
                        <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                    {synthesis.decision === "RECHAZADO" && (
                      <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none">
                        <path d="M6 6l12 12M18 6L6 18" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                      </svg>
                    )}
                    {synthesis.decision === "REVISION_MANUAL" && (
                      <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none">
                        <path d="M12 8v5m0 3h.01" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className="text-white font-bold text-lg tracking-wide">{cfg.label}</div>
                    <div className="text-white/70 text-xs mt-0.5">Confianza: {confidencePct.toFixed(0)}%</div>
                  </div>
                </div>

                <div className="h-1.5 bg-[var(--gray-100)]">
                  <div className={`h-full ${cfg.bar} transition-all duration-700`} style={{ width: `${confidencePct}%` }} />
                </div>

                <div className="p-6 space-y-5">
                  <div className={`rounded-[var(--radius-md)] border ${cfg.border} ${cfg.bg} p-4`}>
                    <p className="text-sm text-gray-700 leading-relaxed">{synthesis.summary}</p>
                  </div>

                  <div className="rounded-[var(--radius-md)] shadow-[var(--shadow-border-light)] bg-[var(--gray-50)] p-4">
                    <p className="text-xs font-semibold text-[var(--muted-foreground)] mb-1">¿Qué sigue?</p>
                    <p className="text-sm text-foreground">{cfg.nextAction}</p>
                  </div>

                  {synthesis.reasons.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-2">Razones</p>
                      <ul className="space-y-1.5">
                        {synthesis.reasons.map((r) => (
                          <li key={r} className="flex items-start gap-2 text-sm text-foreground">
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[var(--gray-400)] shrink-0" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-2">Audit Log</p>
                    <div className="rounded-[var(--radius-md)] shadow-[var(--shadow-border-light)] divide-y divide-[var(--border)] text-xs overflow-hidden">
                      {[
                        { icon: "📄", text: synthesis.audit_log.document_check },
                        { icon: "🤳", text: synthesis.audit_log.face_check },
                        { icon: "🔎", text: synthesis.audit_log.sanctions_check },
                      ].map(({ icon, text }) => (
                        <div key={text} className="flex items-center gap-2.5 px-3.5 py-2.5 bg-[var(--gray-50)]">
                          <span>{icon}</span>
                          <span className="text-[var(--muted-foreground)]">{text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleReset}
                      className="flex-1 rounded-[var(--radius-md)] shadow-[var(--shadow-border-light)] px-4 py-3 text-sm font-semibold text-foreground hover:bg-[var(--gray-50)] transition-colors"
                    >
                      Nueva verificación
                    </button>
                    <a
                      href="/admin"
                      className="flex-1 rounded-[var(--radius-md)] bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--primary)]/90 transition-colors text-center"
                    >
                      Ver en admin →
                    </a>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
          <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
            <span className="font-medium text-foreground">KYC Anti-Fraude</span>
            <span className="h-3 w-px bg-[var(--border)]" />
            <span>Portafolio técnico</span>
          </div>
          <a
            href="https://github.com/mdeasis27"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[var(--muted-foreground)] hover:text-foreground transition-colors font-mono"
          >
            @mdeasis27
          </a>
        </footer>
      </main>
    </div>
  );
}
