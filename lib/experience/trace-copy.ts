const COPY: Record<string, { en: string; es: string }> = {
  "screened.proceed": { en: "screened: approved on its own", es: "revisada: aprobada sola" },
  "screened.review": { en: "screened: sent to the manager", es: "revisada: pasa al gerente" },
  "screened.reject": { en: "screened: rejected", es: "revisada: rechazada" },
};
export function traceCopy(locale: "en" | "es", key: string) { return COPY[key]?.[locale] ?? key; }
