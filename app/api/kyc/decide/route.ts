import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { pollCheck } from "@/lib/truora";
import { synthesizeKyc } from "@/lib/synthesizer";

const DecideSchema = z.object({
  check_id: z.string().min(1).max(128).regex(/^[A-Za-z0-9_-]+$/),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = DecideSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "check_id inválido" },
        { status: 400 }
      );
    }

    const { check_id } = parsed.data;
    const checkResult = await pollCheck(check_id);
    const synthesis = await synthesizeKyc(checkResult);

    // No se expone `raw` (datos internos del proveedor) al cliente
    return NextResponse.json({ check_id, synthesis });
  } catch (err) {
    console.error("[/api/kyc/decide]", err);
    return NextResponse.json(
      { error: "Error al generar decisión KYC" },
      { status: 500 }
    );
  }
}
