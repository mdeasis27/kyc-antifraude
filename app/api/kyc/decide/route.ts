import { NextRequest, NextResponse } from "next/server";
import { pollCheck } from "@/lib/truora";
import { synthesizeKyc } from "@/lib/synthesizer";

export async function POST(req: NextRequest) {
  try {
    const { check_id } = await req.json();

    if (!check_id) {
      return NextResponse.json(
        { error: "check_id es requerido" },
        { status: 400 }
      );
    }

    const checkResult = await pollCheck(check_id);
    const synthesis = await synthesizeKyc(checkResult);

    return NextResponse.json({ check_id, raw: checkResult, synthesis });
  } catch (err) {
    console.error("[/api/kyc/decide]", err);
    return NextResponse.json(
      { error: "Error al generar decisión KYC" },
      { status: 500 }
    );
  }
}
