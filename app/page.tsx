"use client";

import { useState, useRef } from "react";
import { OnboardingStepper } from "@/components/OnboardingStepper";
import type { KycSynthesis } from "@/lib/synthesizer";

export default function Home() {
  const [step, setStep] = useState(1);
  const [checkId, setCheckId] = useState<string | null>(null);
  const [synthesis, setSynthesis] = useState<KycSynthesis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [docPreview, setDocPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

  const docInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  function handleDocChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setDocPreview(url);
  }

  function handleSelfieChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setSelfiePreview(url);
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
    try {
      const res = await fetch("/api/kyc/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ check_id: checkId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Error al generar decisión");
      }
      const data = await res.json();
      setSynthesis(data.synthesis);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setStep(1);
    setCheckId(null);
    setSynthesis(null);
    setError(null);
    setDocPreview(null);
    setSelfiePreview(null);
    if (docInputRef.current) docInputRef.current.value = "";
    if (selfieInputRef.current) selfieInputRef.current.value = "";
  }

  const decisionConfig = {
    APROBADO: {
      bg: "bg-green-50",
      border: "border-green-200",
      badge: "bg-green-100 text-green-800",
      icon: "✓",
      iconBg: "bg-green-500",
      label: "APROBADO",
    },
    RECHAZADO: {
      bg: "bg-red-50",
      border: "border-red-200",
      badge: "bg-red-100 text-red-800",
      icon: "✕",
      iconBg: "bg-red-500",
      label: "RECHAZADO",
    },
    REVISION_MANUAL: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      badge: "bg-yellow-100 text-yellow-800",
      icon: "⚠",
      iconBg: "bg-yellow-500",
      label: "REVISIÓN MANUAL",
    },
  } as const;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Verificación KYC
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Plataforma anti-fraude · Know Your Customer
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {/* Stepper */}
          <div className="mb-8">
            <OnboardingStepper currentStep={step} />
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* PASO 1 — Documento */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Paso 1: Sube tu documento de identidad
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Cédula, pasaporte o documento nacional. La imagen no se sube al servidor en este demo.
                </p>
              </div>

              <label className="block cursor-pointer">
                <div
                  className={`rounded-xl border-2 border-dashed transition-colors ${
                    docPreview
                      ? "border-gray-200 bg-gray-50"
                      : "border-gray-200 hover:border-gray-400 bg-gray-50 hover:bg-gray-100"
                  } flex flex-col items-center justify-center p-6 min-h-[160px]`}
                >
                  {docPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={docPreview}
                      alt="Vista previa del documento"
                      className="max-h-40 rounded-lg object-contain"
                    />
                  ) : (
                    <>
                      <div className="text-4xl text-gray-300 mb-2">🪪</div>
                      <span className="text-sm text-gray-500 font-medium">
                        Haz clic para seleccionar imagen
                      </span>
                      <span className="text-xs text-gray-400 mt-1">
                        PNG, JPG, WEBP hasta 10MB
                      </span>
                    </>
                  )}
                </div>
                <input
                  ref={docInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleDocChange}
                />
              </label>

              {docPreview && (
                <p className="text-xs text-green-600 font-medium">
                  ✓ Imagen seleccionada
                </p>
              )}

              <button
                onClick={handleStartKyc}
                disabled={loading || !docPreview}
                className="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {loading ? "Iniciando verificación…" : "Continuar →"}
              </button>
            </div>
          )}

          {/* PASO 2 — Selfie */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Paso 2: Toma tu selfie
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Sube una foto clara de tu rostro para la verificación biométrica.
                </p>
              </div>

              <label className="block cursor-pointer">
                <div
                  className={`rounded-xl border-2 border-dashed transition-colors ${
                    selfiePreview
                      ? "border-gray-200 bg-gray-50"
                      : "border-gray-200 hover:border-gray-400 bg-gray-50 hover:bg-gray-100"
                  } flex flex-col items-center justify-center p-6 min-h-[160px]`}
                >
                  {selfiePreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selfiePreview}
                      alt="Vista previa de la selfie"
                      className="max-h-40 rounded-lg object-contain"
                    />
                  ) : (
                    <>
                      <div className="text-4xl text-gray-300 mb-2">🤳</div>
                      <span className="text-sm text-gray-500 font-medium">
                        Haz clic para seleccionar imagen
                      </span>
                      <span className="text-xs text-gray-400 mt-1">
                        PNG, JPG, WEBP hasta 10MB
                      </span>
                    </>
                  )}
                </div>
                <input
                  ref={selfieInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleSelfieChange}
                />
              </label>

              {selfiePreview && (
                <p className="text-xs text-green-600 font-medium">
                  ✓ Imagen seleccionada
                </p>
              )}

              <button
                onClick={handleDecide}
                disabled={loading || !selfiePreview}
                className="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {loading ? "Analizando con IA…" : "Continuar →"}
              </button>
            </div>
          )}

          {/* PASO 3 — Resultado */}
          {step === 3 && synthesis && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Paso 3: Resultado de verificación
                </h2>
              </div>

              {/* Decision badge */}
              {(() => {
                const cfg = decisionConfig[synthesis.decision];
                return (
                  <div
                    className={`rounded-xl border p-5 ${cfg.bg} ${cfg.border}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${cfg.iconBg} text-white text-lg font-bold`}
                      >
                        {cfg.icon}
                      </div>
                      <div>
                        <span
                          className={`inline-block rounded-full px-3 py-0.5 text-xs font-bold tracking-wide ${cfg.badge}`}
                        >
                          {cfg.label}
                        </span>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Confianza:{" "}
                          <span className="font-semibold text-gray-700">
                            {(synthesis.confidence * 100).toFixed(0)}%
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Summary */}
                    <p className="mt-4 text-sm text-gray-700 leading-relaxed">
                      {synthesis.summary}
                    </p>
                  </div>
                );
              })()}

              {/* Reasons */}
              {synthesis.reasons.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
                    Razones
                  </h3>
                  <ul className="space-y-1">
                    {synthesis.reasons.map((reason, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-gray-600"
                      >
                        <span className="mt-0.5 text-gray-400">·</span>
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Audit log chips */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
                  Audit Log
                </h3>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                    📄 {synthesis.audit_log.document_check}
                  </span>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                    🤳 {synthesis.audit_log.face_check}
                  </span>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                    🔎 {synthesis.audit_log.sanctions_check}
                  </span>
                </div>
              </div>

              <button
                onClick={handleReset}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                Nueva verificación
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Demo · Mock Truora + Gemini 1.5 Flash
        </p>
      </div>
    </div>
  );
}
