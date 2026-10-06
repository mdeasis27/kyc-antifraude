const COPY: Record<string, { en: string; es: string }> = {
  "batch.1": { en: "applicants 1 to 3 screened", es: "solicitantes 1 a 3 revisados" },
  "batch.2": { en: "applicants 4 to 6 screened", es: "solicitantes 4 a 6 revisados" },
  "batch.3": { en: "applicants 7 to 9 screened", es: "solicitantes 7 a 9 revisados" },
  "batch.4": { en: "applicants 10 to 12 screened", es: "solicitantes 10 a 12 revisados" },
};
export function traceCopy(locale: "en" | "es", key: string) { return COPY[key]?.[locale] ?? key; }
