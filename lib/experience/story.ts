import type { Heading } from "@/design-system/demo/project-story";

type NodeCopy = { name: string; sub: string; analogy: string };

export interface KycStory {
  name: string;
  oneLiner: string;
  chips: string[];
  analogy: { heading: Heading; paragraphs: string[]; dictionaryLabel: string; dictionary: { term: string; means: string }[] };
  why: { title: string; text: string };
  tryIt: { heading: Heading; lead: string; question: (threshold: number) => string; yes: string; no: string; thresholdLabel: string; thresholdHint: string; note: string; simulate: string; cancel: string; reset: string; error: string; idle: string };
  compare: { heading: Heading; lead: string; withQueue: string; withoutQueue: string; rejected: string; sentence: (withQueue: number, withoutQueue: number) => string };
  fit: { heading: Heading; worthLabel: string; worth: string; notLabel: string; not: string };
  proves: { heading: Heading; text: string };
  engineers: { summary: string; points: string[]; repoLabel: string };
  scene: { title: string; caption: string; statusLabels: { active: string; success: string }; tapeLabel: string; nodes: { applicants: NodeCopy; checks: NodeCopy; face: NodeCopy; decision: NodeCopy }; tape: { served: string; rerouted: string; lost: string }; approvedOf: (n: number) => string };
}

export const STORY: Record<"en" | "es", KycStory> = {
  en: {
    name: "Onboarding screening",
    oneLiner: "Decides which account applications get approved on their own and which need someone to look.",
    chips: ["Onboarding", "2 min", "Live demo"],
    analogy: {
      heading: { before: "The", accent: "analogy" },
      paragraphs: [
        "Picture opening an account at a bank branch. The teller looks at your ID and then at your face. If they match, you're done. If something doesn't add up, the teller calls the manager.",
        "This screening does that with online applications. It checks the document and the lists first, then compares the selfie with the ID photo. You choose how close the match must be for an application to go through without a person.",
      ],
      dictionaryLabel: "In the diagram below",
      dictionary: [
        { term: "the teller", means: "the automatic screening" },
        { term: "the manager", means: "manual review" },
        { term: "ID against face", means: "the face match score" },
        { term: "how sure the teller must be", means: "the line you set" },
      ],
    },
    why: { title: "Why I built it", text: "" },
    tryIt: {
      heading: { before: "Try", accent: "it" },
      lead: "Twelve people apply for an account. One shows up on a sanctions list, one sent an invalid document and one is a politically exposed person.",
      question: (t) => `Before you run it, place a bet: if the face must match at least ${t}%, are 8 or more of the 12 approved on their own?`,
      yes: "Yes, 8 or more",
      no: "No, fewer than 8",
      thresholdLabel: "Face match to approve alone",
      thresholdHint: "Higher means more applications go to a person.",
      note: "Each square is one applicant. Blue went to the manager. Red was rejected: a sanctions hit, an invalid document or a face that doesn't match at all.",
      simulate: "Run it",
      cancel: "Cancel",
      reset: "Start over",
      error: "The applications could not be screened.",
      idle: "Place your bet and press Run it.",
    },
    compare: {
      heading: { before: "With a review queue", accent: "or without it" },
      lead: "Same twelve applicants and the same line. Without a queue, everyone the teller isn't sure about is turned away.",
      withQueue: "With the review queue",
      withoutQueue: "Without it",
      rejected: "applications rejected",
      sentence: (withQueue, withoutQueue) => {
        const lost = withoutQueue - withQueue;
        if (lost === 0) return `At this line nobody needs the manager, so both settings reject the same ${withQueue}.`;
        return `With the queue, ${withQueue} were rejected. Without it, ${withoutQueue}: ${lost === 1 ? "one person who" : `${lost} people who`} could have opened an account went home.`;
      },
    },
    fit: {
      heading: { before: "Where it", accent: "fits" },
      worthLabel: "Worth it",
      worth: "When a fintech or a bank opens accounts online and wants most people approved in minutes, with a person looking only at the doubtful ones.",
      notLabel: "Not needed",
      not: "When every account is opened in person and someone already looks at every ID.",
    },
    proves: {
      heading: { before: "What it", accent: "proves" },
      text: "I kept two decisions apart. The hard stops (sanctions, a fake document) never depend on the slider. The slider only moves how much work lands on the review team, and the comparison shows what it costs to have no team at all.",
    },
    engineers: {
      summary: "For engineers",
      points: [
        "The twelve applicants are a fixed fictional set. The rules match the screening synthesis used by the full product: sanctions, an invalid document or a face match under 0.4 reject; a politically exposed person or a match under the line goes to review.",
        "The full product calls an identity provider and a language model. This demo calls no API.",
        "Tests pin the counts at 70% and 75% and sweep the slider to prove the bet can go either way.",
        "Stack: Next.js 16, TypeScript, node:test.",
      ],
      repoLabel: "Source code",
    },
    scene: {
      title: "What happened to each application",
      caption: "Watch the applications arrive three at a time.",
      statusLabels: { active: "tuned by you", success: "stopped a hard case" },
      tapeLabel: "Twelve applicants, in the order they applied",
      nodes: {
        applicants: { name: "Applications", sub: "12 people", analogy: "the line at the branch" },
        checks: { name: "Document and lists", sub: "hard stops", analogy: "the ID check" },
        face: { name: "Face match", sub: "selfie against ID", analogy: "the teller's look" },
        decision: { name: "Decision", sub: "approve, review or reject", analogy: "the counter" },
      },
      tape: { served: "approved on its own", rerouted: "sent to the manager", lost: "rejected" },
      approvedOf: (n) => (n === 1 ? "1 of 12 approved on its own" : `${n} of 12 approved on their own`),
    },
  },
  es: {
    name: "KYC Antifraude",
    oneLiner: "Decide qué solicitudes de cuenta se aprueban solas y cuáles necesitan que alguien las vea.",
    chips: ["Alta de clientes", "2 min", "Demo en vivo"],
    analogy: {
      heading: { before: "La", accent: "analogía" },
      paragraphs: [
        "Imagina que abres una cuenta en la sucursal. El cajero ve tu identificación y luego tu cara. Si cuadran, listo. Si algo no cuadra, llama al gerente.",
        "Esta revisión hace eso con solicitudes en línea. Primero revisa el documento y las listas, y luego compara la selfie con la foto de la identificación. Tú eliges qué tan parecidas deben ser para que una solicitud pase sin que la vea una persona.",
      ],
      dictionaryLabel: "En el diagrama de abajo",
      dictionary: [
        { term: "el cajero", means: "la revisión automática" },
        { term: "el gerente", means: "la revisión manual" },
        { term: "la identificación contra la cara", means: "el parecido de la foto" },
        { term: "qué tan seguro debe estar el cajero", means: "la línea que tú pones" },
      ],
    },
    why: { title: "Por qué lo hice", text: "" },
    tryIt: {
      heading: { accent: "Pruébalo" },
      lead: "Doce personas piden abrir una cuenta. Una aparece en una lista de sanciones, otra mandó un documento inválido y otra es una persona políticamente expuesta.",
      question: (t) => `Antes de correrlo, apuesta: si la foto debe parecerse al menos ${t}%, ¿se aprueban solas 8 o más de las 12?`,
      yes: "Sí, 8 o más",
      no: "No, menos de 8",
      thresholdLabel: "Parecido para aprobar sola",
      thresholdHint: "Más alto significa que más solicitudes van a una persona.",
      note: "Cada cuadrito es un solicitante. Los azules fueron con el gerente. Los rojos se rechazaron: una coincidencia en sanciones, un documento inválido o una cara que no se parece en nada.",
      simulate: "Correr",
      cancel: "Cancelar",
      reset: "Empezar de nuevo",
      error: "No se pudieron revisar las solicitudes.",
      idle: "Haz tu apuesta y presiona Correr.",
    },
    compare: {
      heading: { before: "Con cola de revisión", accent: "o sin ella" },
      lead: "Los mismos doce solicitantes y la misma línea. Sin cola, a todos los que el cajero no ve claros se les dice que no.",
      withQueue: "Con cola de revisión",
      withoutQueue: "Sin cola",
      rejected: "solicitudes rechazadas",
      sentence: (withQueue, withoutQueue) => {
        const lost = withoutQueue - withQueue;
        if (lost === 0) return `Con esta línea nadie necesita al gerente, así que los dos ajustes rechazan a los mismos ${withQueue}.`;
        return `Con la cola se rechazaron ${withQueue}. Sin ella, ${withoutQueue}: ${lost === 1 ? "una persona que pudo abrir su cuenta se fue" : `${lost} personas que pudieron abrir su cuenta se fueron`} a su casa.`;
      },
    },
    fit: {
      heading: { before: "¿Dónde", accent: "sirve?" },
      worthLabel: "Vale la pena",
      worth: "Cuando una fintech o un banco abre cuentas en línea y quiere aprobar a casi todos en minutos, con una persona viendo solo los casos dudosos.",
      notLabel: "No hace falta",
      not: "Cuando todas las cuentas se abren en sucursal y alguien ya revisa cada identificación.",
    },
    proves: {
      heading: { before: "Lo que", accent: "demuestra" },
      text: "Separé dos decisiones. Los altos duros (sanciones, un documento falso) nunca dependen del slider. El slider solo mueve cuánto trabajo le cae al equipo de revisión, y la comparación muestra lo que cuesta no tener ese equipo.",
    },
    engineers: {
      summary: "Para ingenieros",
      points: [
        "Los doce solicitantes son un lote ficticio fijo. Las reglas son las de la síntesis de revisión del producto completo: sanciones, un documento inválido o un parecido menor a 0.4 rechazan; una persona políticamente expuesta o un parecido bajo la línea van a revisión.",
        "El producto completo llama a un proveedor de identidad y a un modelo de lenguaje. Este demo no llama a ninguna API.",
        "Los tests fijan los conteos con 70% y 75% y recorren el slider para comprobar que la apuesta puede salir para los dos lados.",
        "Stack: Next.js 16, TypeScript, node:test.",
      ],
      repoLabel: "Código fuente",
    },
    scene: {
      title: "Qué pasó con cada solicitud",
      caption: "Mira cómo llegan las solicitudes de tres en tres.",
      statusLabels: { active: "ajustado por ti", success: "detuvo un caso duro" },
      tapeLabel: "Doce solicitantes, en el orden en que llegaron",
      nodes: {
        applicants: { name: "Solicitudes", sub: "12 personas", analogy: "la fila en sucursal" },
        checks: { name: "Documento y listas", sub: "altos duros", analogy: "revisar la identificación" },
        face: { name: "Parecido", sub: "selfie contra foto", analogy: "la mirada del cajero" },
        decision: { name: "Decisión", sub: "aprueba, revisa o rechaza", analogy: "la ventanilla" },
      },
      tape: { served: "aprobada sola", rerouted: "con el gerente", lost: "rechazada" },
      approvedOf: (n) => (n === 1 ? "Se aprobó sola 1 de 12" : `Se aprobaron solas ${n} de 12`),
    },
  },
};
