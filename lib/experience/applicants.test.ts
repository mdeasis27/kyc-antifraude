import assert from "node:assert/strict";
import test from "node:test";
import { APPLICANTS, applicantReason, decideApplicant, runApplicants } from "./screening";

const base = { id: "a", faceMatch: 0.9, documentValid: true, sanctions: false, pep: false };

test("decideApplicant follows the screening rules at any threshold", () => {
  assert.equal(decideApplicant(base, 0.7), "proceed");
  assert.equal(decideApplicant({ ...base, faceMatch: 0.65 }, 0.7), "review");
  assert.equal(decideApplicant({ ...base, faceMatch: 0.35 }, 0.3), "reject");
  assert.equal(decideApplicant({ ...base, pep: true }, 0.5), "review");
  assert.equal(decideApplicant({ ...base, sanctions: true }, 0.5), "reject");
  assert.equal(decideApplicant({ ...base, documentValid: false }, 0.5), "reject");
  assert.throws(() => decideApplicant(base, 1.2));
});

test("12 fictional applicants; 8 approve alone at 0.70 and 7 at 0.75", () => {
  assert.equal(APPLICANTS.length, 12);
  assert.deepEqual(runApplicants(0.7).counts, { proceed: 8, review: 2, reject: 2 });
  assert.deepEqual(runApplicants(0.75).counts, { proceed: 7, review: 3, reject: 2 });
});

test("without the review queue, everyone below the line is rejected", () => {
  assert.deepEqual(runApplicants(0.7, { reviewQueue: false }).counts, { proceed: 8, review: 0, reject: 4 });
});

test("sweep: both bet answers are reachable, and the default (0.70) says yes", () => {
  const answers = new Set<boolean>();
  for (let t = 50; t <= 95; t += 5) answers.add(runApplicants(t / 100).counts.proceed >= 8);
  assert.deepEqual([...answers].sort(), [false, true]);
  assert.equal(runApplicants(0.7).counts.proceed >= 8, true);
});

test("applicantReason names why each applicant got its decision", () => {
  assert.equal(applicantReason(base, 0.7), "clear");
  assert.equal(applicantReason({ ...base, faceMatch: 0.65 }, 0.7), "belowLine");
  assert.equal(applicantReason({ ...base, faceMatch: 0.35 }, 0.3), "noMatch");
  assert.equal(applicantReason({ ...base, pep: true }, 0.5), "pep");
  assert.equal(applicantReason({ ...base, sanctions: true, documentValid: false }, 0.5), "sanctions");
  assert.equal(applicantReason({ ...base, documentValid: false }, 0.5), "document");
});

test("the run carries the line, each face match and each reason", () => {
  const run = runApplicants(0.7);
  assert.equal(run.line, 0.7);
  assert.deepEqual(run.items[0], { id: "applicant-1", decision: "proceed", faceMatch: 0.97, reason: "clear" });
  assert.deepEqual(run.items.slice(8).map(i => i.reason), ["belowLine", "pep", "sanctions", "document"]);
  assert.deepEqual(runApplicants(0.7, { reviewQueue: false }).items[8], { id: "applicant-9", decision: "reject", faceMatch: 0.64, reason: "belowLine" });
});
