"use client";

import { useState, useRef, useEffect } from "react";
import { OnboardingStepper } from "@/components/OnboardingStepper";
import type { KycSynthesis } from "@/lib/synthesizer";
import type { KycScenario } from "@/lib/truora";

const SCENARIOS: { value: KycScenario; label: string; description: string; color: string }[] = [
  {
    value: "aprobado",
    label: "Aprobado",
    description: "Identidad verificada, sin alertas",
    color: "border-green-300 bg-green-50 text-green-800",
  },
  {
    value: "revision_manual",
    label: "Revisión manual",
    description: "PEP detectado, score facial bajo",
    color: "border-yellow-300 bg-yellow-50 text-yellow-800",
  },
  {
    value: "rechazado",
    label: "Rechazado",
    description: "Sanciones + documento inválido",
    color: "border-red-300 bg-red-50 text-red-800",
  },
];

const DECISION_CONFIG = {
  APROBADO: {
    bg: "bg-green-50",
    border: "border-green-300",
    headerBg: "bg-green-500",
    badge: "bg-green-100 text-green-800",
    bar: "bg-green-400",
    label: "APROBADO",
    nextAction: "Tu identidad ha sido verificada exitosamente. Puedes continuar con el proceso de onboarding.",
  },
  RECHAZADO: {
    bg: "bg-red-50",
    border: "border-red-300",
    headerBg: "bg-red-600",
    badge: "bg-red-100 text-red-800",
    bar: "bg-red-400",
    label: "RECHAZADO",
    nextAction: "No fue posible completar la verificación. Si crees que hubo un error, contacta a soporte con tu número de caso.",
  },
  REVISION_MANUAL: {
    bg: "bg-amber-50",
    border: "border-amber-300",
    headerBg: "bg-amber-500",
    badge: "bg-amber-100 text-amber-800",
    bar: "bg-amber-400",
    label: "REVISIÓN MANUAL",
    nextAction: "Un agente revisará tu caso en las próximas 24 horas hábiles. Te notificaremos por correo electrónico.",
  },
} as const;

const LOADING_STEPS = [
  "Validando documento de identidad…",
  "Comparando biometría facial…",
  "Consultando listas de sanciones…",
  "Sintetizando decisión con IA…",
];

const SCENARIO_LABELS: Record<KycScenario, { label: string; color: string }> = {
  aprobado: { label: "Escenario: Aprobado", color: "bg-green-100 text-green-700" },
  revision_manual: { label: "Escenario: Revisión manual", color: "bg-yellow-100 text-yellow-700" },
  rechazado: { label: "Escenario: Rechazado", color: "bg-red-100 text-red-700" },
};

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

  // Limpiar blob URLs al desmontar el componente
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
        body: JSON.stringify({
          document_id: "DOC-" + Date.now(),
          country: "CO",
          scenario,
        }),
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
    setStep(1);
    setCheckId(null);
    setSynthesis(null);
    setError(null);
    setDocPreview(null);
    setSelfiePreview(null);
    setLoadingStep(0);
    if (docInputRef.current) docInputRef.current.value = "";
    if (selfieInputRef.current) selfieInputRef.current.value = "";
  }

  const scenarioInfo = SCENARIO_LABELS[scenario];

  return (
    <div className="min-h-screen bg-dot-grid flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900">
              <svg className="h-4 w-4 text-white" viewBox="0 0 16 16" fill="none">
                <path d="M8 1.5L2 4v4c0 3.5 2.5 5.8 6 6.5 3.5-.7 6-3 6-6.5V4L8 1.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Verificación KYC
            </h1>
          </div>
          <p className="text-sm text-gray-500">
            Plataforma anti-fraude · Know Your Customer
          </p>
          <a
            href="/admin"
            className="mt-2 inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Ver panel de administración →
          </a>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {/* Stepper */}
          <div className="mb-8">
            <OnboardingStepper currentStep={step} />
          </div>

          {/* Badge de escenario activo — visible en pasos 2 y 3 */}
          {step > 1 && (
            <div className="mb-5 flex justify-end">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${scenarioInfo.color}`}>
                {scenarioInfo.label}
              </span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              role="alert"
              aria-live="polite"
              className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 flex items-start justify-between gap-3"
            >
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600 flex-shrink-0 text-lg leading-none"
                aria-label="Cerrar error"
              >
                ×
              </button>
            </div>
          )}

          {/* PASO 1 — Documento + selector de escenario */}
          {step === 1 && (
            <div className="space-y-6 step-panel">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Sube tu documento de identidad
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Cédula, pasaporte o documento nacional.
                </p>
              </div>

              {/* Selector de escenario para demo */}
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                  Modo demo — elige el resultado a simular
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {SCENARIOS.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setScenario(s.value)}
                      aria-pressed={scenario === s.value}
                      className={`rounded-lg border-2 p-2.5 text-left transition-all ${
                        scenario === s.value
                          ? s.color + " font-semibold shadow-sm"
                          : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      <div className="text-xs font-bold">{s.label}</div>
                      <div className="text-xs mt-0.5 opacity-75 leading-tight">
                        {s.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload documento */}
              <label className="block cursor-pointer">
                <div
                  className={`rounded-xl border-2 border-dashed transition-colors ${
                    docPreview
                      ? "border-gray-200 bg-gray-50"
                      : "border-gray-200 hover:border-gray-400 bg-gray-50 hover:bg-gray-100"
                  } flex flex-col items-center justify-center p-6 min-h-[140px]`}
                >
                  {docPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={docPreview}
                      alt="Vista previa del documento"
                      className="max-h-32 rounded-lg object-contain"
                    />
                  ) : (
                    <>
                      <div className="text-4xl text-gray-300 mb-2">🪪</div>
                      <span className="text-sm text-gray-500 font-medium">
                        Haz clic para seleccionar imagen
                      </span>
                      <span className="text-xs text-gray-400 mt-1">
                        PNG, JPG, WEBP · La imagen no se sube al servidor
                      </span>
                    </>
                  )}
                </div>
                <input
                  ref={docInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  aria-label="Subir documento de identidad"
                  onChange={handleDocChange}
                />
              </label>

              {docPreview && (
                <p className="text-xs text-green-600 font-medium">✓ Imagen seleccionada</p>
              )}

              <button
                onClick={handleStartKyc}
                disabled={loading || !docPreview}
                className="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? "Iniciando verificación…" : "Continuar →"}
              </button>
            </div>
          )}

          {/* PASO 2 — Selfie + loading animado */}
          {step === 2 && (
            <div className="space-y-6 step-panel">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Toma tu selfie
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Sube una foto clara de tu rostro para la verificación biométrica.
                </p>
              </div>

              {/* Loading state animado */}
              {loading ? (
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-700">
                      {LOADING_STEPS[loadingStep]}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {LOADING_STEPS.map((label) => {
                      const i = LOADING_STEPS.indexOf(label);
                      return (
                        <div key={label} className="flex items-center gap-2">
                          <div
                            className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                              i < loadingStep
                                ? "bg-green-500"
                                : i === loadingStep
                                ? "bg-gray-900 animate-pulse"
                                : "bg-gray-200"
                            }`}
                          />
                          <span
                            className={`text-xs ${
                              i < loadingStep
                                ? "text-green-600 line-through"
                                : i === loadingStep
                                ? "text-gray-900 font-medium"
                                : "text-gray-400"
                            }`}
                          >
                            {label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <label className="block cursor-pointer">
                  <div
                    className={`rounded-xl border-2 border-dashed transition-colors ${
                      selfiePreview
                        ? "border-gray-200 bg-gray-50"
                        : "border-gray-200 hover:border-gray-400 bg-gray-50 hover:bg-gray-100"
                    } flex flex-col items-center justify-center p-6 min-h-[140px]`}
                  >
                    {selfiePreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selfiePreview}
                        alt="Vista previa de la selfie"
                        className="max-h-32 rounded-lg object-contain"
                      />
                    ) : (
                      <>
                        <div className="text-4xl text-gray-300 mb-2">🤳</div>
                        <span className="text-sm text-gray-500 font-medium">
                          Haz clic para seleccionar imagen
                        </span>
                        <span className="text-xs text-gray-400 mt-1">
                          PNG, JPG, WEBP · La imagen no se sube al servidor
                        </span>
                      </>
                    )}
                  </div>
                  <input
                    ref={selfieInputRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    aria-label="Subir selfie para verificación biométrica"
                    onChange={handleSelfieChange}
                  />
                </label>
              )}

              {selfiePreview && !loading && (
                <p className="text-xs text-green-600 font-medium">✓ Imagen seleccionada</p>
              )}

              <button
                onClick={handleDecide}
                disabled={loading || !selfiePreview}
                className="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? "Analizando con IA…" : "Analizar con IA →"}
              </button>
            </div>
          )}

          {/* PASO 3 — Resultado */}
          {step === 3 && synthesis && (() => {
            const cfg = DECISION_CONFIG[synthesis.decision];
            const confidencePct = Math.min(100, Math.max(0, synthesis.confidence * 100));
            return (
              <div className="space-y-6 step-panel">
                <h2 className="text-lg font-semibold text-gray-900">
                  Resultado de verificación
                </h2>

                {/* Decision card — header coloreado */}
                <div className={`rounded-xl border-2 overflow-hidden ${cfg.border}`}>
                  <div className={`${cfg.headerBg} px-5 py-4 flex items-center gap-3`}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 flex-shrink-0">
                      {synthesis.decision === "APROBADO" && (
                        <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="none">
                          <path d="M4 10l4 4 8-8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      {synthesis.decision === "RECHAZADO" && (
                        <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="none">
                          <path d="M5 5l10 10M15 5L5 15" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                        </svg>
                      )}
                      {synthesis.decision === "REVISION_MANUAL" && (
                        <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="none">
                          <path d="M10 6v5m0 3h.01" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className="text-white font-bold text-base tracking-wide">
                        {cfg.label}
                      </div>
                      <div className="text-white/75 text-xs mt-0.5">
                        Confianza: {confidencePct.toFixed(0)}%
                      </div>
                    </div>
                  </div>

                  {/* Barra de confianza */}
                  <div className="h-1.5 w-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-700 ease-out ${cfg.bar}`}
                      style={{ width: `${confidencePct}%` }}
                    />
                  </div>

                  {/* Cuerpo */}
                  <div className={`${cfg.bg} px-5 py-4`}>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {synthesis.summary}
                    </p>
                  </div>
                </div>

                {/* Guía de siguiente paso según decisión */}
                <div className={`rounded-lg px-4 py-3 border ${cfg.border} ${cfg.bg}`}>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    <span className="font-semibold text-gray-800">¿Qué sigue? </span>
                    {cfg.nextAction}
                  </p>
                </div>

                {/* Razones */}
                {synthesis.reasons.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
                      Razones
                    </h3>
                    <ul className="space-y-1.5">
                      {synthesis.reasons.map((reason) => (
                        <li key={reason} className="flex items-start gap-2 text-sm text-gray-600">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Audit log */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
                    Audit Log
                  </h3>
                  <div className="rounded-xl border border-gray-100 bg-gray-50 divide-y divide-gray-100 text-xs">
                    <div className="flex items-center gap-2 px-3 py-2.5">
                      <span>📄</span>
                      <span className="text-gray-600">{synthesis.audit_log.document_check}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2.5">
                      <span>🤳</span>
                      <span className="text-gray-600">{synthesis.audit_log.face_check}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2.5">
                      <span>🔎</span>
                      <span className="text-gray-600">{synthesis.audit_log.sanctions_check}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleReset}
                    className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Nueva verificación
                  </button>
                  <a
                    href="/admin"
                    className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 text-center"
                  >
                    Ver en admin →
                  </a>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Footer */}
        <footer className="mt-6 flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="font-medium text-gray-500">KYC Anti-Fraude</span>
            <span className="h-3 w-px bg-gray-300" />
            <span>Mock Truora</span>
            <span className="h-3 w-px bg-gray-300" />
            <span>OpenRouter LLM</span>
          </div>
          <a
            href="https://github.com/mdeasis27"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-gray-700 transition-colors font-mono"
          >
            github.com/mdeasis27
          </a>
        </footer>
      </div>
    </div>
  );
}
