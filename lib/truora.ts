// Cliente Truora API — KYC: documento, facial, listas, bases gubernamentales

const TRUORA_BASE = "https://api.truora.com";

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

// Mock que simula respuesta de Truora para demo
function getMockCheckResult(): TruoraCheckResult {
  return {
    check_id: `mock_${Date.now()}`,
    status: "completed",
    identity_confirmed: true,
    sanctions_hit: false,
    pep_hit: false,
    document_valid: true,
    face_match_score: 0.94,
    liveness_passed: true,
    details: { source: "mock", note: "Demo — connect Truora API for real KYC" },
  };
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
      "Truora-API-Key": process.env.TRUORA_API_KEY!,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Truora ${method} ${path} → ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

export async function createCheck(payload: {
  document_id: string;
  country: string;
  type: "id_verification" | "background_check" | "kyc_full";
}) {
  if (isMockMode()) {
    return { check_id: "mock_" + Date.now() };
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
  // Si es mock, devolver resultado directamente sin fetch
  if (checkId.startsWith("mock_")) {
    return getMockCheckResult();
  }

  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const result = await getCheck(checkId);
    if (result.status !== "pending") return result;
    await new Promise((r) => setTimeout(r, 2_000));
  }
  throw new Error(`Truora check ${checkId} timed out after ${maxWaitMs}ms`);
}
