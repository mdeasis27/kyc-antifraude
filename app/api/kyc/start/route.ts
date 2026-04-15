import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createCheck } from "@/lib/truora";

const StartSchema = z.object({
  document_id: z.string().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/),
  country: z.string().length(2).regex(/^[A-Z]{2}$/),
  scenario: z.enum(["aprobado", "rechazado", "revision_manual"]).optional().default("aprobado"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = StartSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos de entrada inválidos" },
        { status: 400 }
      );
    }

    const { document_id, country, scenario } = parsed.data;

    const { check_id } = await createCheck({
      document_id,
      country,
      type: "kyc_full",
      scenario,
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
