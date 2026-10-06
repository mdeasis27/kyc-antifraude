import type{ExperienceInput,ExperienceResult}from"./types";export function screen(i:ExperienceInput):ExperienceResult{if(i.screeningFlag)return{state:"reject",steps:["document","screening","stop"],explanation:"A local screening flag rejects the scenario and records a human-review reason."};if(!i.documentComplete)return{state:"review",steps:["document","missing-fields","review"],explanation:"Incomplete documentation needs manual review."};return{state:"proceed",steps:["document","screening","proceed"],explanation:"Complete clean fictional scenario may proceed."}}

export type Decision = ExperienceResult["state"];
export type Applicant = { id: string; faceMatch: number; documentValid: boolean; sanctions: boolean; pep: boolean };

/** Same rules as the screening synthesis: sanctions, an invalid document or a face match under 0.4 reject; a politically exposed person or a face match under the line goes to review. */
export function decideApplicant(a: Applicant, threshold: number, { reviewQueue = true }: { reviewQueue?: boolean } = {}): Decision {
  if (!Number.isFinite(threshold) || threshold < 0 || threshold > 1) throw new Error("The threshold must be between 0 and 1.");
  if (a.sanctions || !a.documentValid || a.faceMatch < 0.4) return "reject";
  if (a.pep || a.faceMatch < threshold) return reviewQueue ? "review" : "reject";
  return "proceed";
}

/** Twelve fictional applicants. */
export const APPLICANTS: Applicant[] = [
  ...[0.97, 0.95, 0.92, 0.9, 0.86, 0.81, 0.76, 0.72, 0.64].map((faceMatch, i) => ({ id: `applicant-${i + 1}`, faceMatch, documentValid: true, sanctions: false, pep: false })),
  { id: "applicant-10", faceMatch: 0.88, documentValid: true, sanctions: false, pep: true },
  { id: "applicant-11", faceMatch: 0.91, documentValid: true, sanctions: true, pep: false },
  { id: "applicant-12", faceMatch: 0.85, documentValid: false, sanctions: false, pep: false },
];

export type ApplicantsResult = { items: { id: string; decision: Decision }[]; counts: Record<Decision, number> };

export function runApplicants(threshold: number, options: { reviewQueue?: boolean } = {}): ApplicantsResult {
  const items = APPLICANTS.map(a => ({ id: a.id, decision: decideApplicant(a, threshold, options) }));
  const counts: Record<Decision, number> = { proceed: 0, review: 0, reject: 0 };
  for (const i of items) counts[i.decision]++;
  return { items, counts };
}
