# KYC Shield — Diseño con Claude Vision + Supabase

**Fecha:** 2026-04-14  
**Objetivo:** Portafolio técnico para posibles empleadores  
**Stack:** Next.js 16, React 19, Tailwind v4, Provider B claude-sonnet-4-6, Supabase

---

## Contexto

El proyecto kyc-antifraude ya tiene un wizard KYC de 3 pasos con UI completa (Tailwind v4), rutas API básicas y una integración simulada de Identity verification API. El objetivo de este rediseño es convertirlo en un demo funcional real que demuestre:

- Análisis multimodal con IA (Claude Vision)
- Integración de base de datos (Supabase)
- Arquitectura limpia en Next.js 16 App Router
- Deployment en deployment platform con URL pública

---

## Arquitectura

```
Usuario
  │
  ▼
Next.js 16 (App Router)
  ├── /           → Wizard KYC (3 pasos)
  └── /dashboard  → Historial de checks + métricas
  │
  ├── POST /api/kyc/start
  │     ├── Recibe imagen documento (multipart/form-data)
  │     ├── Sube a Supabase Storage (bucket: kyc-documents)
  │     ├── Llama a Claude Vision → analiza documento
  │     ├── Guarda registro en Supabase DB (status: pending)
  │     └── Retorna { check_id, doc_data }
  │
  ├── POST /api/kyc/decide
  │     ├── Recibe check_id + imagen selfie (multipart/form-data)
  │     ├── Sube selfie a Supabase Storage (bucket: kyc-selfies)
  │     ├── Llama a Claude Vision → compara cara + genera decisión
  │     ├── Actualiza registro en Supabase DB (status: completed)
  │     └── Retorna { synthesis }
  │
  └── GET /api/kyc/checks
        └── Lista checks para el dashboard (orden: created_at DESC)

Servicios externos:
  ├── Provider B API (claude-sonnet-4-6) — análisis visual real
  └── Supabase — PostgreSQL + Storage
```

---

## Base de datos

### Tabla: `kyc_checks`

```sql
CREATE TABLE kyc_checks (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ DEFAULT now(),
  status          TEXT        NOT NULL CHECK (status IN ('pending', 'completed', 'error')),

  -- Decisión final
  decision        TEXT        CHECK (decision IN ('APROBADO', 'RECHAZADO', 'REVISION_MANUAL')),
  confidence      FLOAT,
  summary         TEXT,
  reasons         TEXT[],

  -- Imágenes (URLs de Supabase Storage)
  document_url    TEXT,
  selfie_url      TEXT,

  -- Datos extraídos del documento
  doc_type        TEXT,        -- 'cedula' | 'pasaporte' | 'licencia' | 'desconocido'
  doc_name        TEXT,
  doc_id_number   TEXT,
  doc_valid       BOOLEAN,

  -- Análisis facial
  face_match      BOOLEAN,
  face_score      FLOAT,
  liveness_notes  TEXT,

  -- Audit log (para mostrar en UI)
  audit_document  TEXT,
  audit_face      TEXT,
  audit_sanctions TEXT
);
```

---

## Integración con Claude Vision

### Llamada 1 — Análisis del documento (`/api/kyc/start`)

**Input:** imagen del documento en base64  
**Modelo:** `claude-sonnet-4-6` con vision  
**Herramienta:** `generateObject` del AI SDK + schema Zod

**System prompt:**
> Eres un sistema experto en verificación de identidad KYC. Analiza documentos de identidad con precisión y objetividad.

**User prompt:**
> Analiza este documento de identidad:
> 1. ¿Qué tipo de documento es? (cedula, pasaporte, licencia, desconocido)
> 2. Extrae: nombre completo, número de ID visible
> 3. ¿Hay señales de alteración, recorte digital, o falsificación?
> 4. ¿El documento parece auténtico y los datos son legibles?
> Responde con el schema JSON especificado.

**Schema Zod de respuesta:**
```typescript
z.object({
  doc_type: z.enum(['cedula', 'pasaporte', 'licencia', 'desconocido']),
  doc_name: z.string(),
  doc_id_number: z.string(),
  doc_valid: z.boolean(),
  audit_document: z.string(), // descripción legible para mostrar en UI
})
```

---

### Llamada 2 — Match facial + decisión (`/api/kyc/decide`)

**Input:** imagen documento + imagen selfie (ambas en base64)  
**Modelo:** `claude-sonnet-4-6` con vision  

**System prompt:**
> Eres un sistema experto en verificación biométrica KYC bancario. Evalúa con rigor si una persona es quien dice ser.

**User prompt:**
> Tienes dos imágenes:
> - Imagen 1: Documento de identidad (con foto del titular)
> - Imagen 2: Selfie tomada en el momento
>
> Evalúa:
> 1. ¿La cara de la selfie corresponde a la foto en el documento?
> 2. ¿La selfie parece tomada en vivo (no foto de pantalla ni foto de foto)?
> 3. Basándote en todo, emite una decisión: APROBADO, RECHAZADO o REVISION_MANUAL
>
> APROBADO: documento válido + match facial claro  
> RECHAZADO: documento falso o sin coincidencia facial  
> REVISION_MANUAL: dudas razonables que requieren revisión humana

**Schema Zod de respuesta:**
```typescript
z.object({
  face_match: z.boolean(),
  face_score: z.number().min(0).max(1),
  liveness_notes: z.string(),
  decision: z.enum(['APROBADO', 'RECHAZADO', 'REVISION_MANUAL']),
  confidence: z.number().min(0).max(1),
  summary: z.string(),
  reasons: z.array(z.string()),
  audit_face: z.string(),
  audit_sanctions: z.string(),
})
```

---

## UI/UX — Cambios al wizard existente

### Paso 1 (documento) — nuevo comportamiento:
- Al hacer click en "Continuar", mostrar spinner mientras Claude analiza
- Al completar, mostrar card con datos extraídos bajo el preview:
  ```
  ✅ Documento detectado: Cédula colombiana
  👤 Nombre: Juan Carlos Pérez
  🔢 ID: 1234567890
  ```

### Paso 3 (resultado) — mejoras visuales:
- Barra de progreso para face match score (ej: `████████░░ 84%`)
- Mantener decision badge, reasons y audit log existentes

### Dashboard nuevo `/dashboard`:
```
┌─────────────────────────────────────────────┐
│  KYC Shield — Dashboard                      │
├──────────┬──────────┬──────────┬────────────┤
│  Total   │ Aprobados│Rechazados│Conf. prom. │
│   47     │  38 (81%)│  9 (19%) │   87%      │
├─────────────────────────────────────────────┤
│ Checks recientes                            │
│ ✅ APROBADO   Juan Pérez      hace 2 min    │
│ ❌ RECHAZADO  Desconocido     hace 15 min   │
│ ⚠️  REVISIÓN  María López     hace 1 hora   │
└─────────────────────────────────────────────┘
```

- Botón "← Nueva verificación" en dashboard
- Botón "Ver Dashboard →" en el resultado final del wizard

---

## Archivos a crear / modificar

### Nuevos:
```
lib/claude-vision.ts            # analyzeDocument() + analyzeFaceAndDecide()
lib/supabase.ts                 # cliente Supabase (server-side)
app/dashboard/page.tsx          # Dashboard con métricas + lista
app/api/kyc/checks/route.ts     # GET /api/kyc/checks
supabase/migrations/001_kyc_checks.sql
```

### Modificados:
```
app/api/kyc/start/route.ts      # Ahora recibe FormData con imagen
app/api/kyc/decide/route.ts     # Ahora recibe FormData con selfie
app/page.tsx                    # Mostrar datos extraídos en paso 1, face score en paso 3
app/layout.tsx                  # Metadata: "KYC Shield — Verificación de Identidad"
```

### Eliminados:
```
lib/truora.ts                   # Reemplazado por claude-vision.ts
lib/synthesizer.ts              # Fusionado en claude-vision.ts
```

### Variables de entorno:
```bash
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## Dependencias a instalar

```bash
npm install @ai-sdk/anthropic @supabase/supabase-js
```

> El paquete `@ai-sdk/anthropic` reemplaza a `@ai-sdk/openai` y mantiene el mismo patrón de `generateObject` + Zod que ya usa `synthesizer.ts`. No hay que cambiar la lógica del AI SDK, solo el provider.

---

## Costo estimado (portafolio)

| Servicio   | Plan     | Costo       |
|------------|----------|-------------|
| Provider B  | Pay-as-go| ~$0.003/check |
| Supabase   | Free     | $0          |
| deployment platform     | Free     | $0          |

---

## Resultado final

URL pública en deployment platform donde un empleador puede:
1. Abrir la app sin registro
2. Subir una foto de su cédula/pasaporte
3. Ver cómo Claude extrae los datos en tiempo real
4. Tomar una selfie / subir foto
5. Obtener una decisión KYC con explicación de la IA
6. Ver el dashboard con todos los checks históricos

**Stack demostrado:** Next.js 16 App Router, React 19, Tailwind v4, Provider B claude-sonnet-4-6 Vision, Supabase, deployment platform — todo en un solo proyecto cohesivo.
