# KYC Shield — Plan de Implementación con Claude Vision + Supabase

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir el wizard KYC demo en un sistema funcional real que usa Claude claude-sonnet-4-6 Vision para analizar documentos de identidad y selfies, con persistencia en Supabase.

**Architecture:** El cliente envía imágenes via FormData a las rutas API. Cada ruta sube la imagen a Supabase Storage, la convierte a base64 y la envía a Claude Vision con un prompt estructurado. Los resultados se persisten en PostgreSQL (Supabase). Un dashboard Server Component muestra el historial.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind v4, `@ai-sdk/anthropic` + `ai` v6, `@supabase/supabase-js`, Zod v4, TypeScript estricto.

---

## Mapa de archivos

| Acción | Archivo | Responsabilidad |
|--------|---------|----------------|
| Crear | `lib/claude-vision.ts` | Tipos KYC + `analyzeDocument()` + `analyzeFaceAndDecide()` |
| Crear | `lib/supabase.ts` | Cliente Supabase admin (server-side) |
| Crear | `supabase/migrations/001_kyc_checks.sql` | Schema de la tabla `kyc_checks` |
| Crear | `app/api/kyc/checks/route.ts` | GET historial para dashboard |
| Crear | `app/dashboard/page.tsx` | Dashboard Server Component con métricas |
| Modificar | `app/api/kyc/start/route.ts` | Recibe FormData, usa Claude Vision |
| Modificar | `app/api/kyc/decide/route.ts` | Recibe FormData + check_id, face match |
| Modificar | `app/page.tsx` | Envía FormData, muestra datos extraídos |
| Modificar | `app/layout.tsx` | Metadata + lang="es" + nav link dashboard |
| Modificar | `.env.local` | Nuevas vars de entorno |
| Modificar | `.env.example` | Template actualizado |
| Eliminar | `lib/truora.ts` | Reemplazado por claude-vision.ts |
| Eliminar | `lib/synthesizer.ts` | Fusionado en claude-vision.ts |

---

## Task 1: Instalar dependencias y configurar variables de entorno

**Files:**
- Modify: `package.json` (via npm install)
- Modify: `.env.local`
- Modify: `.env.example`

- [ ] **Step 1: Instalar paquetes**

```bash
cd /c/Proyectos/kyc-antifraude
npm install @ai-sdk/anthropic @supabase/supabase-js
```

Resultado esperado: se añaden `@ai-sdk/anthropic` y `@supabase/supabase-js` en `node_modules` y `package.json`.

- [ ] **Step 2: Actualizar `.env.local`**

Reemplazar el contenido completo de `.env.local` con:

```bash
# Provider B — claude-sonnet-4-6 Vision
ANTHROPIC_API_KEY=sk-ant-REEMPLAZA_CON_TU_KEY

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://REEMPLAZA.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJREEMPLAZA...
SUPABASE_SERVICE_ROLE_KEY=eyJREEMPLAZA...
```

> Para obtener estas claves:
> - Provider B: https://console.anthropic.com → API Keys
> - Supabase: Dashboard del proyecto → Settings → API

- [ ] **Step 3: Actualizar `.env.example`**

```bash
# Provider B — claude-sonnet-4-6 Vision
ANTHROPIC_API_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json .env.example
git commit -m "chore: add @ai-sdk/anthropic and @supabase/supabase-js"
```

---

## Task 2: Crear schema de base de datos en Supabase

**Files:**
- Create: `supabase/migrations/001_kyc_checks.sql`

- [ ] **Step 1: Escribir la migración SQL**

Crear `supabase/migrations/001_kyc_checks.sql` con el siguiente contenido:

```sql
-- Tabla principal de verificaciones KYC
CREATE TABLE IF NOT EXISTS kyc_checks (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  status          TEXT        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'completed', 'error')),

  -- Decisión final de Claude
  decision        TEXT        CHECK (decision IN ('APROBADO', 'RECHAZADO', 'REVISION_MANUAL')),
  confidence      FLOAT,
  summary         TEXT,
  reasons         TEXT[],

  -- Imágenes almacenadas en Supabase Storage (URLs públicas)
  document_url    TEXT,
  selfie_url      TEXT,

  -- Path en Storage (para descargar en paso 2)
  doc_image_path  TEXT,

  -- Datos extraídos del documento por Claude
  doc_type        TEXT,
  doc_name        TEXT,
  doc_id_number   TEXT,
  doc_valid       BOOLEAN,

  -- Análisis facial
  face_match      BOOLEAN,
  face_score      FLOAT,
  liveness_notes  TEXT,

  -- Textos del audit log para la UI
  audit_document  TEXT,
  audit_face      TEXT,
  audit_sanctions TEXT
);

-- Índice para el dashboard (orden cronológico inverso)
CREATE INDEX IF NOT EXISTS kyc_checks_created_at_idx ON kyc_checks (created_at DESC);
```

- [ ] **Step 2: Ejecutar la migración en Supabase**

Ir al Supabase Dashboard → SQL Editor → New Query, pegar el SQL anterior y ejecutarlo.

Verificar que aparece la tabla `kyc_checks` en Table Editor.

- [ ] **Step 3: Crear buckets de Storage en Supabase**

En Supabase Dashboard → Storage → New bucket:

1. Nombre: `kyc-documents`, marcar **Public bucket** → Create
2. Nombre: `kyc-selfies`, marcar **Public bucket** → Create

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/001_kyc_checks.sql
git commit -m "chore: add Supabase migration for kyc_checks table"
```

---

## Task 3: Crear cliente Supabase

**Files:**
- Create: `lib/supabase.ts`

- [ ] **Step 1: Crear `lib/supabase.ts`**

```typescript
import { createClient } from "@supabase/supabase-js";

// Cliente con service role — solo usar en server-side (rutas API, Server Components)
// Nunca exponer SUPABASE_SERVICE_ROLE_KEY al cliente
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

- [ ] **Step 2: Verificar que el servidor arranca**

```bash
npm run dev
```

Esperado: servidor en http://localhost:3000 sin errores de importación.

- [ ] **Step 3: Commit**

```bash
git add lib/supabase.ts
git commit -m "feat: add Supabase admin client"
```

---

## Task 4: Crear `lib/claude-vision.ts`

Este archivo reemplaza `lib/truora.ts` y `lib/synthesizer.ts`. Define los tipos y las dos funciones de análisis con Claude Vision.

**Files:**
- Create: `lib/claude-vision.ts`

- [ ] **Step 1: Crear `lib/claude-vision.ts`**

```typescript
import { generateObject } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? "",
});

// ─── Tipos exportados ────────────────────────────────────────────────────────

export type KycDecision = "APROBADO" | "RECHAZADO" | "REVISION_MANUAL";

export interface DocAnalysis {
  doc_type: "cedula" | "pasaporte" | "licencia" | "desconocido";
  doc_name: string;
  doc_id_number: string;
  doc_valid: boolean;
  audit_document: string;
}

export interface KycSynthesis {
  decision: KycDecision;
  confidence: number; // 0-1
  face_score: number; // 0-1
  summary: string;
  reasons: string[];
  audit_log: {
    document_check: string;
    face_check: string;
    sanctions_check: string;
  };
}

// ─── Schemas Zod ─────────────────────────────────────────────────────────────

const docSchema = z.object({
  doc_type: z.enum(["cedula", "pasaporte", "licencia", "desconocido"]),
  doc_name: z.string(),
  doc_id_number: z.string(),
  doc_valid: z.boolean(),
  audit_document: z.string(),
});

const decisionSchema = z.object({
  face_match: z.boolean(),
  face_score: z.number().min(0).max(1),
  liveness_notes: z.string(),
  decision: z.enum(["APROBADO", "RECHAZADO", "REVISION_MANUAL"]),
  confidence: z.number().min(0).max(1),
  summary: z.string(),
  reasons: z.array(z.string()),
  audit_face: z.string(),
  audit_sanctions: z.string(),
});

// ─── Funciones ───────────────────────────────────────────────────────────────

/**
 * Analiza un documento de identidad con Claude Vision.
 * Devuelve tipo de doc, datos extraídos y si parece auténtico.
 */
export async function analyzeDocument(
  imageBase64: string,
  mimeType: string
): Promise<DocAnalysis> {
  const { object } = await generateObject({
    model: anthropic("claude-sonnet-4-6"),
    schema: docSchema,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Eres un sistema experto en verificación de identidad KYC.
Analiza este documento de identidad:
1. Identifica el tipo: cedula, pasaporte, licencia, o desconocido
2. Extrae el nombre completo visible (usa cadena vacía si no es legible)
3. Extrae el número de ID o documento (usa cadena vacía si no es legible)
4. Evalúa si el documento parece auténtico (sin signos de alteración digital, recortes o falsificación)
5. Escribe un texto corto de audit (1 línea) describiendo el resultado

Responde SOLO con el JSON del schema. Responde en español.`,
          },
          {
            type: "image",
            image: imageBase64,
            mimeType: mimeType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
          },
        ],
      },
    ],
  });

  return {
    doc_type: object.doc_type,
    doc_name: object.doc_name,
    doc_id_number: object.doc_id_number,
    doc_valid: object.doc_valid,
    audit_document: object.audit_document,
  };
}

/**
 * Compara la selfie con la foto del documento y emite decisión KYC final.
 * Requiere el resultado del análisis de documento (Task 5).
 */
export async function analyzeFaceAndDecide(
  docImageBase64: string,
  docMimeType: string,
  selfieBase64: string,
  selfieMimeType: string,
  docAnalysis: DocAnalysis
): Promise<KycSynthesis> {
  const { object } = await generateObject({
    model: anthropic("claude-sonnet-4-6"),
    schema: decisionSchema,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Eres un sistema experto en verificación biométrica KYC bancario. Evalúa con rigor.

IMAGEN 1: Documento de identidad (${docAnalysis.doc_type}) — ${docAnalysis.doc_name || "nombre no extraído"}
IMAGEN 2: Selfie tomada en tiempo real

Evalúa:
1. ¿La cara de la selfie corresponde a la foto en el documento? Da un score 0-1
2. ¿La selfie parece tomada en vivo (no foto de pantalla, no foto de foto)?
3. Emite la decisión final:
   - APROBADO si: documento válido=${docAnalysis.doc_valid} Y face_score >= 0.70
   - RECHAZADO si: documento inválido O face_score < 0.40
   - REVISION_MANUAL si: face_score entre 0.40 y 0.69 o hay dudas razonables
4. Escribe un resumen ejecutivo (2-3 frases) y lista de razones
5. audit_face: texto corto (1 línea) del análisis facial
6. audit_sanctions: escribe "Sin señales de alerta en documento" si no hay problemas, o describe el problema

Responde SOLO con el JSON del schema. Responde en español.`,
          },
          {
            type: "image",
            image: docImageBase64,
            mimeType: docMimeType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
          },
          {
            type: "image",
            image: selfieBase64,
            mimeType: selfieMimeType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
          },
        ],
      },
    ],
  });

  return {
    decision: object.decision,
    confidence: object.confidence,
    face_score: object.face_score,
    summary: object.summary,
    reasons: object.reasons,
    audit_log: {
      document_check: docAnalysis.audit_document,
      face_check: object.audit_face,
      sanctions_check: object.audit_sanctions,
    },
  };
}
```

- [ ] **Step 2: Verificar tipos compilando**

```bash
npx tsc --noEmit
```

Esperado: sin errores de TypeScript.

- [ ] **Step 3: Commit**

```bash
git add lib/claude-vision.ts
git commit -m "feat: add Claude Vision analysis functions (analyzeDocument, analyzeFaceAndDecide)"
```

---

## Task 5: Reescribir `/api/kyc/start`

Recibe imagen del documento via FormData, sube a Supabase Storage, analiza con Claude, crea registro en DB.

**Files:**
- Modify: `app/api/kyc/start/route.ts`

- [ ] **Step 1: Reemplazar `app/api/kyc/start/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { analyzeDocument } from "@/lib/claude-vision";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("document") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Se requiere el campo 'document' con la imagen" },
        { status: 400 }
      );
    }

    // Convertir a Buffer para Storage y base64 para Claude
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const mimeType = file.type || "image/jpeg";

    // Analizar documento con Claude Vision
    const docAnalysis = await analyzeDocument(base64, mimeType);

    // Crear registro inicial en DB para obtener check_id
    const { data: row, error: insertError } = await supabaseAdmin
      .from("kyc_checks")
      .insert({
        status: "pending",
        doc_type: docAnalysis.doc_type,
        doc_name: docAnalysis.doc_name,
        doc_id_number: docAnalysis.doc_id_number,
        doc_valid: docAnalysis.doc_valid,
        audit_document: docAnalysis.audit_document,
      })
      .select("id")
      .single();

    if (insertError || !row) {
      throw new Error(`Error al crear registro KYC: ${insertError?.message}`);
    }

    const checkId = row.id as string;

    // Subir imagen a Supabase Storage usando el check_id como nombre
    const extension = mimeType.split("/")[1] ?? "jpg";
    const storagePath = `${checkId}.${extension}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("kyc-documents")
      .upload(storagePath, buffer, { contentType: mimeType, upsert: false });

    if (uploadError) {
      throw new Error(`Error al subir documento: ${uploadError.message}`);
    }

    // Obtener URL pública y guardar path en DB
    const { data: urlData } = supabaseAdmin.storage
      .from("kyc-documents")
      .getPublicUrl(storagePath);

    await supabaseAdmin
      .from("kyc_checks")
      .update({
        document_url: urlData.publicUrl,
        doc_image_path: storagePath,
      })
      .eq("id", checkId);

    return NextResponse.json({
      check_id: checkId,
      doc_data: docAnalysis,
    });
  } catch (err) {
    console.error("[/api/kyc/start]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al iniciar verificación KYC" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Verificar compilación**

```bash
npx tsc --noEmit
```

Esperado: sin errores.

- [ ] **Step 3: Probar con curl**

```bash
curl -X POST http://localhost:3000/api/kyc/start \
  -F "document=@/ruta/a/una/cedula.jpg" \
  | jq .
```

Esperado:
```json
{
  "check_id": "uuid-generado",
  "doc_data": {
    "doc_type": "cedula",
    "doc_name": "JUAN CARLOS PÉREZ",
    "doc_id_number": "1234567890",
    "doc_valid": true,
    "audit_document": "Cédula colombiana válida, datos legibles"
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add app/api/kyc/start/route.ts
git commit -m "feat: rewrite /api/kyc/start to use FormData + Claude Vision + Supabase"
```

---

## Task 6: Reescribir `/api/kyc/decide`

Recibe selfie + check_id, descarga documento de Storage, llama a Claude para face match + decisión, actualiza DB.

**Files:**
- Modify: `app/api/kyc/decide/route.ts`

- [ ] **Step 1: Reemplazar `app/api/kyc/decide/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { analyzeFaceAndDecide, type DocAnalysis } from "@/lib/claude-vision";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const selfieFile = formData.get("selfie") as File | null;
    const checkId = formData.get("check_id") as string | null;

    if (!selfieFile || !checkId) {
      return NextResponse.json(
        { error: "Se requieren los campos 'selfie' y 'check_id'" },
        { status: 400 }
      );
    }

    // Obtener registro existente (necesitamos doc_image_path y datos del doc)
    const { data: check, error: fetchError } = await supabaseAdmin
      .from("kyc_checks")
      .select("doc_image_path, doc_type, doc_name, doc_id_number, doc_valid, audit_document")
      .eq("id", checkId)
      .single();

    if (fetchError || !check) {
      return NextResponse.json(
        { error: "check_id no encontrado" },
        { status: 404 }
      );
    }

    if (!check.doc_image_path) {
      return NextResponse.json(
        { error: "Documento no procesado. Ejecuta /api/kyc/start primero." },
        { status: 400 }
      );
    }

    // Descargar imagen del documento desde Supabase Storage
    const { data: docBlob, error: downloadError } = await supabaseAdmin.storage
      .from("kyc-documents")
      .download(check.doc_image_path);

    if (downloadError || !docBlob) {
      throw new Error(`Error al descargar documento: ${downloadError?.message}`);
    }

    const docArrayBuffer = await docBlob.arrayBuffer();
    const docBase64 = Buffer.from(docArrayBuffer).toString("base64");
    const docMimeType = check.doc_image_path.endsWith(".png")
      ? "image/png"
      : check.doc_image_path.endsWith(".webp")
      ? "image/webp"
      : "image/jpeg";

    // Convertir selfie a base64
    const selfieArrayBuffer = await selfieFile.arrayBuffer();
    const selfieBuffer = Buffer.from(selfieArrayBuffer);
    const selfieBase64 = selfieBuffer.toString("base64");
    const selfieMimeType = selfieFile.type || "image/jpeg";

    // Reconstruir DocAnalysis del registro
    const docAnalysis: DocAnalysis = {
      doc_type: check.doc_type ?? "desconocido",
      doc_name: check.doc_name ?? "",
      doc_id_number: check.doc_id_number ?? "",
      doc_valid: check.doc_valid ?? false,
      audit_document: check.audit_document ?? "",
    };

    // Analizar face match + generar decisión con Claude Vision
    const synthesis = await analyzeFaceAndDecide(
      docBase64,
      docMimeType,
      selfieBase64,
      selfieMimeType,
      docAnalysis
    );

    // Subir selfie a Storage
    const selfieExtension = selfieMimeType.split("/")[1] ?? "jpg";
    const selfiePath = `${checkId}.${selfieExtension}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("kyc-selfies")
      .upload(selfiePath, selfieBuffer, { contentType: selfieMimeType, upsert: false });

    if (uploadError) {
      console.warn("[/api/kyc/decide] Error subiendo selfie:", uploadError.message);
      // No bloqueamos la respuesta si falla el upload de la selfie
    }

    const { data: selfieUrlData } = supabaseAdmin.storage
      .from("kyc-selfies")
      .getPublicUrl(selfiePath);

    // Actualizar registro en DB con decisión final
    await supabaseAdmin
      .from("kyc_checks")
      .update({
        status: "completed",
        decision: synthesis.decision,
        confidence: synthesis.confidence,
        summary: synthesis.summary,
        reasons: synthesis.reasons,
        selfie_url: selfieUrlData?.publicUrl ?? null,
        face_match: synthesis.face_score >= 0.7,
        face_score: synthesis.face_score,
        liveness_notes: synthesis.audit_log.face_check,
        audit_face: synthesis.audit_log.face_check,
        audit_sanctions: synthesis.audit_log.sanctions_check,
      })
      .eq("id", checkId);

    return NextResponse.json({ synthesis });
  } catch (err) {
    console.error("[/api/kyc/decide]", err);

    // Marcar check como error en DB
    const checkId = (await (async () => {
      try { return ((await (req.clone()).formData()).get("check_id") as string) ?? null; } catch { return null; }
    })());
    if (checkId) {
      await supabaseAdmin
        .from("kyc_checks")
        .update({ status: "error" })
        .eq("id", checkId);
    }

    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al generar decisión KYC" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Verificar compilación**

```bash
npx tsc --noEmit
```

Esperado: sin errores.

- [ ] **Step 3: Commit**

```bash
git add app/api/kyc/decide/route.ts
git commit -m "feat: rewrite /api/kyc/decide to use Claude Vision face match + Supabase"
```

---

## Task 7: Crear `/api/kyc/checks` para el dashboard

**Files:**
- Create: `app/api/kyc/checks/route.ts`

- [ ] **Step 1: Crear `app/api/kyc/checks/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const { data: checks, error } = await supabaseAdmin
      .from("kyc_checks")
      .select(
        "id, created_at, status, decision, confidence, face_score, doc_name, doc_type"
      )
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw new Error(error.message);

    const completed = (checks ?? []).filter((c) => c.status === "completed");
    const approved = completed.filter((c) => c.decision === "APROBADO").length;
    const rejected = completed.filter((c) => c.decision === "RECHAZADO").length;
    const manual = completed.filter((c) => c.decision === "REVISION_MANUAL").length;
    const avgConfidence =
      completed.length > 0
        ? completed.reduce((sum, c) => sum + (c.confidence ?? 0), 0) / completed.length
        : 0;

    return NextResponse.json({
      checks: checks ?? [],
      metrics: {
        total: (checks ?? []).length,
        completed: completed.length,
        approved,
        rejected,
        manual,
        avgConfidence: Math.round(avgConfidence * 100),
      },
    });
  } catch (err) {
    console.error("[/api/kyc/checks]", err);
    return NextResponse.json(
      { error: "Error al obtener checks" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Probar con curl**

```bash
curl http://localhost:3000/api/kyc/checks | jq .
```

Esperado:
```json
{
  "checks": [...],
  "metrics": {
    "total": 3,
    "completed": 2,
    "approved": 1,
    "rejected": 1,
    "manual": 0,
    "avgConfidence": 84
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/kyc/checks/route.ts
git commit -m "feat: add GET /api/kyc/checks endpoint for dashboard"
```

---

## Task 8: Crear `/dashboard`

**Files:**
- Create: `app/dashboard/page.tsx`

- [ ] **Step 1: Crear `app/dashboard/page.tsx`**

```typescript
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";

interface Check {
  id: string;
  created_at: string;
  status: string;
  decision: string | null;
  confidence: number | null;
  face_score: number | null;
  doc_name: string | null;
  doc_type: string | null;
}

async function getData(): Promise<{ checks: Check[]; metrics: ReturnType<typeof computeMetrics> }> {
  const { data: checks } = await supabaseAdmin
    .from("kyc_checks")
    .select("id, created_at, status, decision, confidence, face_score, doc_name, doc_type")
    .order("created_at", { ascending: false })
    .limit(50);

  return { checks: checks ?? [], metrics: computeMetrics(checks ?? []) };
}

function computeMetrics(checks: Check[]) {
  const completed = checks.filter((c) => c.status === "completed");
  const approved = completed.filter((c) => c.decision === "APROBADO").length;
  const rejected = completed.filter((c) => c.decision === "RECHAZADO").length;
  const manual = completed.filter((c) => c.decision === "REVISION_MANUAL").length;
  const avgConfidence =
    completed.length > 0
      ? Math.round(
          (completed.reduce((s, c) => s + (c.confidence ?? 0), 0) / completed.length) * 100
        )
      : 0;
  return { total: checks.length, approved, rejected, manual, avgConfidence };
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "ahora mismo";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  return `hace ${Math.floor(hours / 24)}d`;
}

const DECISION_STYLE: Record<string, { icon: string; badge: string }> = {
  APROBADO: { icon: "✅", badge: "bg-green-100 text-green-800" },
  RECHAZADO: { icon: "❌", badge: "bg-red-100 text-red-800" },
  REVISION_MANUAL: { icon: "⚠️", badge: "bg-yellow-100 text-yellow-800" },
};

export default async function DashboardPage() {
  const { checks, metrics } = await getData();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">KYC Shield — Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">Historial de verificaciones de identidad</p>
          </div>
          <Link
            href="/"
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            ← Nueva verificación
          </Link>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Total checks", value: metrics.total, color: "text-gray-900" },
            { label: "Aprobados", value: metrics.approved, color: "text-green-700" },
            { label: "Rechazados", value: metrics.rejected, color: "text-red-700" },
            { label: "Confianza prom.", value: `${metrics.avgConfidence}%`, color: "text-blue-700" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
              <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">{label}</p>
              <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Lista de checks */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-widest">
              Checks recientes
            </h2>
          </div>

          {checks.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400 text-sm">
              Aún no hay verificaciones. <Link href="/" className="text-gray-700 underline">Iniciar una →</Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {checks.map((check) => {
                const style = check.decision
                  ? DECISION_STYLE[check.decision] ?? { icon: "⏳", badge: "bg-gray-100 text-gray-600" }
                  : { icon: "⏳", badge: "bg-gray-100 text-gray-600" };

                return (
                  <li key={check.id} className="px-6 py-4 flex items-center gap-4">
                    <span className="text-xl">{style.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {check.doc_name ?? "Nombre no extraído"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {check.doc_type ?? "—"} · {timeAgo(check.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {check.confidence !== null && (
                        <span className="text-xs text-gray-400">
                          {Math.round((check.confidence ?? 0) * 100)}%
                        </span>
                      )}
                      {check.decision ? (
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.badge}`}>
                          {check.decision === "REVISION_MANUAL" ? "REVISIÓN" : check.decision}
                        </span>
                      ) : (
                        <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-500">
                          {check.status.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar que el dashboard carga en el navegador**

Abrir http://localhost:3000/dashboard

Esperado: página con tarjetas de métricas y lista de checks (vacía inicialmente).

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat: add /dashboard Server Component with metrics and check history"
```

---

## Task 9: Actualizar `app/page.tsx`

Cambios: FormData en vez de JSON, mostrar datos extraídos del doc en paso 2, barra de face score en paso 3, link al dashboard, texto del footer correcto.

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Reemplazar `app/page.tsx` completo**

```typescript
"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { OnboardingStepper } from "@/components/OnboardingStepper";
import type { KycSynthesis, DocAnalysis } from "@/lib/claude-vision";

export default function Home() {
  const [step, setStep] = useState(1);
  const [checkId, setCheckId] = useState<string | null>(null);
  const [docData, setDocData] = useState<DocAnalysis | null>(null);
  const [synthesis, setSynthesis] = useState<KycSynthesis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [docPreview, setDocPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

  const docInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  function handleDocChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocPreview(URL.createObjectURL(file));
  }

  function handleSelfieChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelfiePreview(URL.createObjectURL(file));
  }

  async function handleStartKyc() {
    const file = docInputRef.current?.files?.[0];
    if (!file) return;

    setError(null);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("document", file);

      const res = await fetch("/api/kyc/start", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Error al iniciar verificación");
      }
      const data = await res.json();
      setCheckId(data.check_id);
      setDocData(data.doc_data);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  async function handleDecide() {
    if (!checkId) return;
    const file = selfieInputRef.current?.files?.[0];
    if (!file) return;

    setError(null);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("selfie", file);
      formData.append("check_id", checkId);

      const res = await fetch("/api/kyc/decide", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Error al generar decisión");
      }
      const data = await res.json();
      setSynthesis(data.synthesis);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setStep(1);
    setCheckId(null);
    setDocData(null);
    setSynthesis(null);
    setError(null);
    setDocPreview(null);
    setSelfiePreview(null);
    if (docInputRef.current) docInputRef.current.value = "";
    if (selfieInputRef.current) selfieInputRef.current.value = "";
  }

  const decisionConfig = {
    APROBADO: {
      bg: "bg-green-50", border: "border-green-200",
      badge: "bg-green-100 text-green-800",
      icon: "✓", iconBg: "bg-green-500", label: "APROBADO",
    },
    RECHAZADO: {
      bg: "bg-red-50", border: "border-red-200",
      badge: "bg-red-100 text-red-800",
      icon: "✕", iconBg: "bg-red-500", label: "RECHAZADO",
    },
    REVISION_MANUAL: {
      bg: "bg-yellow-50", border: "border-yellow-200",
      badge: "bg-yellow-100 text-yellow-800",
      icon: "⚠", iconBg: "bg-yellow-500", label: "REVISIÓN MANUAL",
    },
  } as const;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            KYC Shield
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Verificación de identidad · Powered by Claude AI
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="mb-8">
            <OnboardingStepper currentStep={step} />
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* ── PASO 1: Documento ── */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Paso 1: Sube tu documento de identidad
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Cédula, pasaporte o documento nacional.
                </p>
              </div>

              <label className="block cursor-pointer">
                <div className={`rounded-xl border-2 border-dashed transition-colors ${
                    docPreview
                      ? "border-gray-200 bg-gray-50"
                      : "border-gray-200 hover:border-gray-400 bg-gray-50 hover:bg-gray-100"
                  } flex flex-col items-center justify-center p-6 min-h-[160px]`}
                >
                  {docPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={docPreview} alt="Vista previa del documento"
                      className="max-h-40 rounded-lg object-contain" />
                  ) : (
                    <>
                      <div className="text-4xl text-gray-300 mb-2">🪪</div>
                      <span className="text-sm text-gray-500 font-medium">Haz clic para seleccionar imagen</span>
                      <span className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP hasta 10MB</span>
                    </>
                  )}
                </div>
                <input ref={docInputRef} type="file" accept="image/*"
                  className="sr-only" onChange={handleDocChange} />
              </label>

              {docPreview && (
                <p className="text-xs text-green-600 font-medium">✓ Imagen seleccionada</p>
              )}

              <button onClick={handleStartKyc} disabled={loading || !docPreview}
                className="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {loading ? "Claude está analizando el documento…" : "Continuar →"}
              </button>
            </div>
          )}

          {/* ── PASO 2: Selfie ── */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Paso 2: Toma tu selfie
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Sube una foto clara de tu rostro para verificación biométrica.
                </p>
              </div>

              {/* Datos extraídos del documento */}
              {docData && (
                <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-2">
                    Documento detectado por Claude AI
                  </p>
                  <div className="text-sm text-blue-900 space-y-1">
                    <p>📄 {docData.doc_type === "cedula" ? "Cédula de ciudadanía"
                        : docData.doc_type === "pasaporte" ? "Pasaporte"
                        : docData.doc_type === "licencia" ? "Licencia de conducir"
                        : "Documento no identificado"}
                      {" "}
                      <span className={`ml-1 text-xs font-semibold ${docData.doc_valid ? "text-green-700" : "text-red-700"}`}>
                        {docData.doc_valid ? "✓ Válido" : "✗ Cuestionable"}
                      </span>
                    </p>
                    {docData.doc_name && <p>👤 {docData.doc_name}</p>}
                    {docData.doc_id_number && <p>🔢 {docData.doc_id_number}</p>}
                  </div>
                </div>
              )}

              <label className="block cursor-pointer">
                <div className={`rounded-xl border-2 border-dashed transition-colors ${
                    selfiePreview
                      ? "border-gray-200 bg-gray-50"
                      : "border-gray-200 hover:border-gray-400 bg-gray-50 hover:bg-gray-100"
                  } flex flex-col items-center justify-center p-6 min-h-[160px]`}
                >
                  {selfiePreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selfiePreview} alt="Vista previa de la selfie"
                      className="max-h-40 rounded-lg object-contain" />
                  ) : (
                    <>
                      <div className="text-4xl text-gray-300 mb-2">🤳</div>
                      <span className="text-sm text-gray-500 font-medium">Haz clic para seleccionar imagen</span>
                      <span className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP hasta 10MB</span>
                    </>
                  )}
                </div>
                <input ref={selfieInputRef} type="file" accept="image/*"
                  className="sr-only" onChange={handleSelfieChange} />
              </label>

              {selfiePreview && (
                <p className="text-xs text-green-600 font-medium">✓ Imagen seleccionada</p>
              )}

              <button onClick={handleDecide} disabled={loading || !selfiePreview}
                className="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {loading ? "Claude comparando rostros…" : "Continuar →"}
              </button>
            </div>
          )}

          {/* ── PASO 3: Resultado ── */}
          {step === 3 && synthesis && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Paso 3: Resultado de verificación
              </h2>

              {(() => {
                const cfg = decisionConfig[synthesis.decision];
                return (
                  <div className={`rounded-xl border p-5 ${cfg.bg} ${cfg.border}`}>
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${cfg.iconBg} text-white text-lg font-bold`}>
                        {cfg.icon}
                      </div>
                      <div>
                        <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-bold tracking-wide ${cfg.badge}`}>
                          {cfg.label}
                        </span>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Confianza:{" "}
                          <span className="font-semibold text-gray-700">
                            {(synthesis.confidence * 100).toFixed(0)}%
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Barra de face match */}
                    <div className="mt-4">
                      <p className="text-xs text-gray-500 mb-1">
                        Match facial:{" "}
                        <span className="font-semibold text-gray-700">
                          {(synthesis.face_score * 100).toFixed(0)}%
                        </span>
                      </p>
                      <div className="w-full bg-white/60 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            synthesis.face_score >= 0.7
                              ? "bg-green-500"
                              : synthesis.face_score >= 0.4
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${synthesis.face_score * 100}%` }}
                        />
                      </div>
                    </div>

                    <p className="mt-4 text-sm text-gray-700 leading-relaxed">
                      {synthesis.summary}
                    </p>
                  </div>
                );
              })()}

              {synthesis.reasons.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Razones</h3>
                  <ul className="space-y-1">
                    {synthesis.reasons.map((reason, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="mt-0.5 text-gray-400">·</span>
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Audit Log</h3>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                    📄 {synthesis.audit_log.document_check}
                  </span>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                    🤳 {synthesis.audit_log.face_check}
                  </span>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                    🔎 {synthesis.audit_log.sanctions_check}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={handleReset}
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Nueva verificación
                </button>
                <Link href="/dashboard"
                  className="flex-1 rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white text-center transition-colors hover:bg-gray-700"
                >
                  Ver Dashboard →
                </Link>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Powered by Provider B Claude · Supabase · Next.js 16
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar compilación**

```bash
npx tsc --noEmit
```

Esperado: sin errores.

- [ ] **Step 3: Prueba manual en el navegador**

1. Abrir http://localhost:3000
2. Subir una foto de una cédula/pasaporte → click "Continuar"
3. Verificar que en el Paso 2 aparece la card azul con "Documento detectado por Claude AI" con nombre e ID extraídos
4. Subir una selfie → click "Continuar"
5. Verificar el resultado: badge de decisión, barra de face match, razones y audit log
6. Click "Ver Dashboard →" y verificar que el check aparece en la lista

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: update wizard to use FormData + show Claude-extracted doc data + face score bar"
```

---

## Task 10: Actualizar `app/layout.tsx`

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Reemplazar `app/layout.tsx`**

```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KYC Shield — Verificación de Identidad con IA",
  description:
    "Sistema de verificación de identidad KYC impulsado por Claude AI. Analiza documentos y selfies en segundos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/layout.tsx
git commit -m "chore: update metadata and lang=es in layout"
```

---

## Task 11: Eliminar archivos obsoletos

**Files:**
- Delete: `lib/truora.ts`
- Delete: `lib/synthesizer.ts`

- [ ] **Step 1: Eliminar los archivos**

```bash
git rm lib/truora.ts lib/synthesizer.ts
```

- [ ] **Step 2: Verificar que no queden importaciones rotas**

```bash
npx tsc --noEmit
```

Esperado: sin errores. Si hay alguna importación restante de `truora` o `synthesizer`, corregirla antes de continuar.

- [ ] **Step 3: Commit final**

```bash
git commit -m "refactor: remove truora.ts and synthesizer.ts (replaced by claude-vision.ts)"
```

---

## Task 12: Deployment en plataforma de despliegue

- [ ] **Step 1: Crear repositorio en GitHub si no existe**

```bash
gh repo create kyc-antifraude --public --source=. --push
```

O si ya existe, hacer push:

```bash
git push origin main
```

- [ ] **Step 2: Instalar plataforma de despliegue CLI e iniciar proyecto**

```bash
npm i -g vercel
vercel
```

Seguir el wizard: seleccionar el repo, framework Next.js (detectado automáticamente).

- [ ] **Step 3: Configurar variables de entorno en plataforma de despliegue**

```bash
vercel env add ANTHROPIC_API_KEY production
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
```

O desde el dashboard: plataforma de despliegue → Proyecto → Settings → Environment Variables.

- [ ] **Step 4: Deploy a producción**

```bash
vercel --prod
```

Esperado: URL pública tipo `https://kyc-antifraude-xxx.vercel.app`

- [ ] **Step 5: Verificar el deploy**

Abrir la URL pública. Completar el flujo completo: subir documento → selfie → ver resultado → ver dashboard.

Verificar en Supabase que el check queda guardado en la tabla `kyc_checks`.

- [ ] **Step 6: Commit con la URL del deploy en README**

Actualizar `README.md` con la URL pública y correr:

```bash
git add README.md
git commit -m "docs: add live demo URL to README"
git push origin main
```

---

## Checklist de cobertura del spec

| Requisito del spec | Tarea |
|---|---|
| Claude Vision analiza documento | Task 4 + 5 |
| Claude Vision compara cara + decide | Task 4 + 6 |
| Supabase Storage para imágenes | Task 5 + 6 |
| Supabase DB persiste checks | Task 2 + 5 + 6 |
| Dashboard con métricas | Task 7 + 8 |
| Datos extraídos en paso 2 del wizard | Task 9 |
| Barra de face score en paso 3 | Task 9 |
| Link "Ver Dashboard →" en resultado | Task 9 |
| Metadata correcta en layout | Task 10 |
| Eliminar truora.ts + synthesizer.ts | Task 11 |
| Deploy en plataforma de despliegue | Task 12 |
