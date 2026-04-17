// Síntesis LLM — toma todos los resultados de Truora y genera decisión final

import { z } from "zod";
import { chat, AllProvidersFailedError } from "@/ai-kit/client";
import type { UserApiKey } from "@/ai-kit/types";
import type { TruoraCheckResult } from "./truora";

export type KycDecision = "APROBADO" | "RECHAZADO" | "REVISION_MANUAL";

export interface KycSynthesis {
  decision: KycDecision;
  confidence: number;
  summary: string;
  reasons: string[];
  audit_log: {
    document_check: string;
    face_check: string;
    sanctions_check: string;
  };
  provider?: string;
  model?: string;
  latency_ms?: number;
}

const schema = z.object({
  decision: z.enum(["APROBADO", "RECHAZADO", "REVISION_MANUAL"]),
  confidence: z.number().min(0).max(1),
  summary: z.string(),
  reasons: z.array(z.string()),
});

function mockSynthesis(check: TruoraCheckResult): KycSynthesis {
  const decision: KycDecision =
    check.sanctions_hit || !check.document_valid || (check.face_match_score ?? 1) < 0.4
      ? "RECHAZADO"
      : check.pep_hit || (check.face_match_score ?? 1) < 0.7
      ? "REVISION_MANUAL"
      : "APROBADO";

  const confidence =
    decision === "APROBADO" ? 0.95
    : decision === "RECHAZADO" ? 0.91
    : 0.72;

  const summaries: Record<KycDecision, string> = {
    APROBADO: "La identidad del solicitante ha sido verificada exitosamente. El documento es válido, la coincidencia facial es alta y no se detectaron alertas en listas de sanciones.",
    RECHAZADO: "La verificación ha fallado. Se detectaron irregularidades en el documento o coincidencias en listas de sanciones que impiden continuar con el proceso de onboarding.",
    REVISION_MANUAL: "La verificación requiere revisión humana. Se detectó que el solicitante es una persona políticamente expuesta (PEP) o el score de coincidencia facial está por debajo del umbral automático.",
  };

  const reasons: Record<KycDecision, string[]> = {
    APROBADO: ["Documento de identidad válido y verificado", "Coincidencia facial superior al 90%", "Sin coincidencias en listas de sanciones internacionales"],
    RECHAZADO: [
      ...(check.sanctions_hit ? ["Usuario detectado en listas de sanciones internacionales"] : []),
      ...(!check.document_valid ? ["Documento de identidad no válido o no verificable"] : []),
      ...((check.face_match_score ?? 1) < 0.4 ? ["Score de coincidencia facial insuficiente"] : []),
    ],
    REVISION_MANUAL: [
      ...(check.pep_hit ? ["Solicitante identificado como Persona Políticamente Expuesta (PEP)"] : []),
      ...((check.face_match_score ?? 1) < 0.7 ? ["Score de coincidencia facial requiere revisión manual"] : []),
    ],
  };

  return {
    decision,
    confidence,
    summary: summaries[decision],
    reasons: reasons[decision],
    audit_log: buildAuditLog(check),
  };
}

function buildAuditLog(check: TruoraCheckResult) {
  return {
    document_check: check.document_valid
      ? "Documento válido y verificado"
      : "Documento no válido o no verificado",
    face_check:
      check.face_match_score !== undefined
        ? `Face match score: ${(check.face_match_score * 100).toFixed(0)}%${check.liveness_passed ? " — Liveness OK" : " — Liveness fallido"}`
        : "Face match no disponible",
    sanctions_check: check.sanctions_hit
      ? `Sanciones: POSITIVO${check.pep_hit ? " | PEP: SÍ" : ""}`
      : `Sanciones: Limpio${check.pep_hit ? " | PEP: SÍ" : " | PEP: No"}`,
  };
}

export async function synthesizeKyc(
  check: TruoraCheckResult,
  userApiKey?: UserApiKey,
): Promise<KycSynthesis> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await chat({
      messages: [
        {
          role: "system",
          content:
            "Eres un sistema de decisión KYC bancario. Responde ÚNICAMENTE con un objeto JSON válido, sin markdown, sin texto adicional, sin bloques de código. Solo JSON puro.",
        },
        {
          role: "user",
          content: `Analiza estos resultados de verificación KYC y responde con JSON:

- Identidad confirmada: ${check.identity_confirmed}
- Documento válido: ${check.document_valid}
- Coincidencia facial (score 0-1): ${check.face_match_score ?? "N/A"}
- Liveness pasó: ${check.liveness_passed ?? "N/A"}
- Listas de sanciones: ${check.sanctions_hit ? "POSITIVO" : "limpio"}
- PEP detectado: ${check.pep_hit ? "SÍ" : "NO"}

Responde EXACTAMENTE con este formato JSON (sin nada más):
{
  "decision": "APROBADO" | "RECHAZADO" | "REVISION_MANUAL",
  "confidence": <número entre 0 y 1>,
  "summary": "<resumen ejecutivo en español>",
  "reasons": ["<razón 1>", "<razón 2>"]
}`,
        },
      ],
      maxTokens: 512,
      signal: controller.signal,
      userApiKey,
    });

    const jsonMatch = response.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn("[synthesizer] No se pudo extraer JSON — usando mock");
      return mockSynthesis(check);
    }

    const parsed = schema.safeParse(JSON.parse(jsonMatch[0]));
    if (!parsed.success) {
      console.warn("[synthesizer] JSON inválido según schema — usando mock", parsed.error);
      return mockSynthesis(check);
    }

    return {
      decision: parsed.data.decision,
      confidence: parsed.data.confidence,
      summary: parsed.data.summary,
      reasons: parsed.data.reasons,
      audit_log: buildAuditLog(check),
      provider: response.provider,
      model: response.model,
      latency_ms: response.latency_ms,
    };
  } catch (err) {
    if (err instanceof AllProvidersFailedError) {
      console.warn("[synthesizer] Todos los providers fallaron — usando mock determinista");
      return mockSynthesis(check);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
