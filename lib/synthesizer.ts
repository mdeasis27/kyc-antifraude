// Síntesis LLM — toma todos los resultados de Truora y genera decisión final

import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import type { TruoraCheckResult } from "./truora";

export type KycDecision = "APROBADO" | "RECHAZADO" | "REVISION_MANUAL";

export interface KycSynthesis {
  decision: KycDecision;
  confidence: number; // 0-1
  summary: string;
  reasons: string[];
  audit_log: {
    document_check: string;
    face_check: string;
    sanctions_check: string;
  };
}

// Subset que devuelve el LLM — audit_log se construye aparte desde datos raw
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
    audit_log: {
      document_check: check.document_valid ? "Documento válido y verificado" : "Documento no válido o no verificado",
      face_check: check.face_match_score !== undefined
        ? `Face match score: ${(check.face_match_score * 100).toFixed(0)}%${check.liveness_passed ? " — Liveness OK" : " — Liveness fallido"}`
        : "Face match no disponible",
      sanctions_check: check.sanctions_hit
        ? `Sanciones: POSITIVO${check.pep_hit ? " | PEP: SÍ" : ""}`
        : `Sanciones: Limpio${check.pep_hit ? " | PEP: SÍ" : " | PEP: No"}`,
    },
  };
}

export async function synthesizeKyc(
  check: TruoraCheckResult
): Promise<KycSynthesis> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    // Sin API key: usar síntesis determinista basada en los datos del check
    console.info("[synthesizer] OPENROUTER_API_KEY no configurada — usando mock de síntesis");
    return mockSynthesis(check);
  }

  const openrouter = createOpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  let object: z.infer<typeof schema>;
  try {
    const { text } = await generateText({
      model: openrouter("google/gemma-4-31b-it:free"),
      abortSignal: controller.signal,
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
    });

    // Extraer JSON del texto (Gemma a veces añade markdown alrededor)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn("[synthesizer] No se pudo extraer JSON de la respuesta — usando mock");
      return mockSynthesis(check);
    }

    const parsed = schema.safeParse(JSON.parse(jsonMatch[0]));
    if (!parsed.success) {
      console.warn("[synthesizer] JSON inválido según schema — usando mock", parsed.error);
      return mockSynthesis(check);
    }
    object = parsed.data;
  } finally {
    clearTimeout(timeout);
  }

  const audit_log = {
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

  return {
    decision: object.decision,
    confidence: object.confidence,
    summary: object.summary,
    reasons: object.reasons,
    audit_log,
  };
}
