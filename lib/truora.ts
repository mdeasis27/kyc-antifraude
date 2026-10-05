// Identity-verification client for document and screening checks.

const TRUORA_BASE = "https://api.truora.com";

export type KycScenario = "aprobado" | "rechazado" | "revision_manual";

export interface TruoraCheckResult {
  check_id: string;
  status: "pending" | "completed" | "error";
  identity_confirmed: boolean;
  sanctions_hit: boolean;
  pep_hit: boolean;
  document_valid: boolean;
  face_match_score?: number; // 0-1
  liveness_passed?: boolean;
  details: Record<string, unknown>;
}

const MOCK_SCENARIOS: Record<KycScenario, TruoraCheckResult> = {
  aprobado: {
    check_id: "",
    status: "completed",
    identity_confirmed: true,
    sanctions_hit: false,
    pep_hit: false,
    document_valid: true,
    face_match_score: 0.94,
    liveness_passed: true,
    details: { source: "mock", scenario: "aprobado" },
  },
  rechazado: {
    check_id: "",
    status: "completed",
    identity_confirmed: false,
    sanctions_hit: true,
    pep_hit: false,
    document_valid: false,
    face_match_score: 0.31,
    liveness_passed: false,
    details: { source: "mock", scenario: "rechazado", reason: "sanctions_hit + document_invalid" },
  },
  revision_manual: {
    check_id: "",
    status: "completed",
    identity_confirmed: true,
    sanctions_hit: false,
    pep_hit: true,
    document_valid: true,
    face_match_score: 0.62,
    liveness_passed: true,
    details: { source: "mock", scenario: "revision_manual", reason: "pep_detected + low_face_score" },
  },
};

function parseScenario(checkId: string): KycScenario {
  if (checkId.includes("rechazado")) return "rechazado";
  if (checkId.includes("revision_manual")) return "revision_manual";
  return "aprobado";
}

function isMockMode(): boolean {
  return (
    !process.env.TRUORA_API_KEY ||
    process.env.TRUORA_MOCK === "true"
  );
}

async function request<T>(
  method: "GET" | "POST",
  path: string,
  body?: Record<string, unknown>
): Promise<T> {
  const res = await fetch(`${TRUORA_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "Truora-API-Key": process.env.TRUORA_API_KEY ?? "",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    // Log detalle solo en servidor, no exponer al cliente
    console.error(`Identity verification ${method} ${path} → ${res.status}`);
    throw new Error(`Identity verification API error: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export async function createCheck(payload: {
  document_id: string;
  country: string;
  type: "id_verification" | "background_check" | "kyc_full";
  scenario?: KycScenario;
}) {
  if (isMockMode()) {
    const scenario = payload.scenario ?? "aprobado";
    return { check_id: `mock_${scenario}_${Date.now()}` };
  }
  return request<{ check_id: string }>("POST", "/v1/checks", payload);
}

export async function getCheck(checkId: string): Promise<TruoraCheckResult> {
  return request<TruoraCheckResult>("GET", `/v1/checks/${checkId}`);
}

export async function pollCheck(
  checkId: string,
  maxWaitMs = 30_000
): Promise<TruoraCheckResult> {
  if (checkId.startsWith("mock_")) {
    const scenario = parseScenario(checkId);
    return { ...MOCK_SCENARIOS[scenario], check_id: checkId };
  }

  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const result = await getCheck(checkId);
    if (result.status !== "pending") return result;
    await new Promise((r) => setTimeout(r, 2_000));
  }
  throw new Error(`Verification check ${checkId} timed out after ${maxWaitMs}ms`);
}
