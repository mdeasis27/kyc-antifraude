import type{ExperienceInput,ExperienceResult}from"./types";export function screen(i:ExperienceInput):ExperienceResult{if(i.screeningFlag)return{state:"reject",steps:["document","screening","stop"],explanation:"A local screening flag rejects the scenario and records a human-review reason."};if(!i.documentComplete)return{state:"review",steps:["document","missing-fields","review"],explanation:"Incomplete documentation needs manual review."};return{state:"proceed",steps:["document","screening","proceed"],explanation:"Complete clean fictional scenario may proceed."}}

export type Decision = ExperienceResult["state"];
export type Applicant = { id: string; faceMatch: number; documentValid: boolean; sanctions: boolean; pep: boolean };

/** Why an applicant got its decision: a hard stop, a doubt about the person, or a clear match. */
export type Reason = "sanctions" | "document" | "noMatch" | "pep" | "belowLine" | "clear";

/** Same rules as the screening synthesis: sanctions, an invalid document or a face match under 0.4 are hard stops; a politically exposed person or a face match under the line raise a doubt. */
export function applicantReason(a: Applicant, threshold: number): Reason {
  if (!Number.isFinite(threshold) || threshold < 0 || threshold > 1) throw new Error("The threshold must be between 0 and 1.");
  if (a.sanctions) return "sanctions";
  if (!a.documentValid) return "document";
  if (a.faceMatch < 0.4) return "noMatch";
  if (a.pep) return "pep";
  if (a.faceMatch < threshold) return "belowLine";
  return "clear";
}

/** Hard stops reject; a doubt goes to review, or is rejected when there is no review queue. */
export function decideApplicant(a: Applicant, threshold: number, { reviewQueue = true }: { reviewQueue?: boolean } = {}): Decision {
  const reason = applicantReason(a, threshold);
  if (reason === "clear") return "proceed";
  if (reason === "pep" || reason === "belowLine") return reviewQueue ? "review" : "reject";
  return "reject";
}

/** Twelve fictional applicants. */
export const APPLICANTS: Applicant[] = [
  ...[0.97, 0.95, 0.92, 0.9, 0.86, 0.81, 0.76, 0.72, 0.64].map((faceMatch, i) => ({ id: `applicant-${i + 1}`, faceMatch, documentValid: true, sanctions: false, pep: false })),
  { id: "applicant-10", faceMatch: 0.88, documentValid: true, sanctions: false, pep: true },
  { id: "applicant-11", faceMatch: 0.91, documentValid: true, sanctions: true, pep: false },
  { id: "applicant-12", faceMatch: 0.85, documentValid: false, sanctions: false, pep: false },
];

export type ScreenedApplicant = { id: string; decision: Decision; faceMatch: number; reason: Reason };
/** line is the face match needed to approve alone, 0..1. */
export type ApplicantsResult = { line: number; items: ScreenedApplicant[]; counts: Record<Decision, number> };

export function runApplicants(threshold: number, options: { reviewQueue?: boolean } = {}): ApplicantsResult {
  const items = APPLICANTS.map(a => ({ id: a.id, decision: decideApplicant(a, threshold, options), faceMatch: a.faceMatch, reason: applicantReason(a, threshold) }));
  const counts: Record<Decision, number> = { proceed: 0, review: 0, reject: 0 };
  for (const i of items) counts[i.decision]++;
  return { line: threshold, items, counts };
}
