import { NextRequest, NextResponse } from "next/server";
import { createCheck } from "@/lib/truora";

export async function POST(req: NextRequest) {
  try {
    const { document_id, country } = await req.json();

    if (!document_id || !country) {
      return NextResponse.json(
        { error: "document_id y country son requeridos" },
        { status: 400 }
      );
    }

    const { check_id } = await createCheck({
      document_id,
      country,
      type: "kyc_full",
    });

    return NextResponse.json({ check_id });
  } catch (err) {
    console.error("[/api/kyc/start]", err);
    return NextResponse.json(
      { error: "Error al iniciar verificación KYC" },
      { status: 500 }
    );
  }
}
