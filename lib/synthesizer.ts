// Síntesis LLM — toma todos los resultados de Truora y genera decisión final

import { generateObject } from "ai";
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

export async function synthesizeKyc(
  check: TruoraCheckResult
): Promise<KycSynthesis> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY no está configurada");
  }

  const openrouter = createOpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  let object: z.infer<typeof schema>;
  try {
    const result = await generateObject({
      model: openrouter("meta-llama/llama-3.1-8b-instruct:free"),
      schema,
      abortSignal: controller.signal,
      system:
        "Eres un sistema de decisión KYC bancario. Basándote en los resultados de verificación de identidad, toma una decisión de onboarding. Responde siempre en español.",
      prompt: `Analiza los siguientes resultados de verificación KYC y toma una decisión de onboarding:

- Identidad confirmada: ${check.identity_confirmed}
- Documento válido: ${check.document_valid}
- Coincidencia facial (score 0-1): ${check.face_match_score ?? "N/A"}
- Liveness pasó: ${check.liveness_passed ?? "N/A"}
- Listas de sanciones: ${check.sanctions_hit ? "POSITIVO — usuario en lista de sanciones" : "limpio"}
- PEP detectado: ${check.pep_hit ? "SÍ — persona políticamente expuesta" : "NO"}

Devuelve una decisión (APROBADO, RECHAZADO, o REVISION_MANUAL), un nivel de confianza entre 0 y 1, un resumen ejecutivo y una lista de razones que justifiquen la decisión.`,
    });
    object = result.object;
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
