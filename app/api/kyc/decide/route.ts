import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { pollCheck } from "@/lib/truora";
import { synthesizeKyc } from "@/lib/synthesizer";
import { rateLimit } from "@/ai-kit/rate-limit";
import type { UserApiKey } from "@/ai-kit/types";

const DecideSchema = z.object({
  check_id: z.string().min(1).max(128).regex(/^[A-Za-z0-9_-]+$/),
});

function parseByokHeader(header: string | null): UserApiKey | null {
  if (!header) return null;
  try {
    const parsed = JSON.parse(header) as unknown;
    if (typeof parsed === "object" && parsed !== null && "provider" in parsed && "key" in parsed) {
      return parsed as UserApiKey;
    }
  } catch {
    // ignore
  }
  return null;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const { allowed } = rateLimit(ip, { maxRequests: 10, windowMs: 60 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json({ error: "Demasiadas solicitudes. Vuelve en una hora." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const parsed = DecideSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "check_id inválido" }, { status: 400 });
    }

    const userApiKey = parseByokHeader(req.headers.get("x-user-api-key"));
    const { check_id } = parsed.data;
    const checkResult = await pollCheck(check_id);
    const synthesis = await synthesizeKyc(checkResult, userApiKey ?? undefined);

    return NextResponse.json({ check_id, synthesis });
  } catch (err) {
    console.error("[/api/kyc/decide]", err);
    return NextResponse.json({ error: "Error al generar decisión KYC" }, { status: 500 });
  }
}
