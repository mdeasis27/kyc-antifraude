import assert from "node:assert/strict";
import test from "node:test";
import { tapeCounts } from "@/design-system/demo/outcome-tape";
import { runApplicants } from "./screening";
import { atCounter, kycCells, outcomeSeats, revealedApplicants, syncStep } from "./scene-state";
import { traceCopy } from "./trace-copy";

test("final tape counts match the run", () => {
  assert.deepEqual(tapeCounts(kycCells(runApplicants(0.7).items, 12)), { served: 8, rerouted: 2, lost: 2, pending: 0 });
});

test("reveals one applicant per step, all when complete or under reduced motion", () => {
  assert.equal(revealedApplicants({ visible: 1, total: 12, complete: false }, 12, false), 1);
  assert.equal(revealedApplicants({ visible: 7, total: 12, complete: false }, 12, false), 7);
  assert.equal(revealedApplicants({ visible: 12, total: 12, complete: true }, 12, false), 12);
  assert.equal(revealedApplicants({ visible: 1, total: 12, complete: false }, 12, true), 12);
});

test("each applicant gets the next free seat in its outcome box", () => {
  assert.deepEqual(outcomeSeats(runApplicants(0.7).items), [0, 1, 2, 3, 4, 5, 6, 7, 0, 1, 0, 1]);
  assert.deepEqual(outcomeSeats([{ decision: "review" }, { decision: "proceed" }, { decision: "review" }]), [0, 0, 1]);
});

test("the counter shows the last applicant reached and nobody once everyone is placed", () => {
  assert.equal(atCounter(0, 12), null);
  assert.equal(atCounter(1, 12), 0);
  assert.equal(atCounter(2, 12), 0);
  assert.equal(atCounter(3, 12), 1);
  assert.equal(atCounter(24, 12), null);
});

test("the walk never lags the trace by more than the applicant on screen", () => {
  assert.equal(syncStep(0, 2, false), 0, "first applicant walks from the start");
  assert.equal(syncStep(2, 4, false), 2, "next applicant walks its own two half steps");
  assert.equal(syncStep(2, 10, false), 8, "a fast trace pulls the walk to the newest applicant");
  assert.equal(syncStep(2, 24, true), 24, "show all lands on the final state at once");
  assert.equal(syncStep(22, 24, true), 22, "the last applicant still walks when playback reaches it");
  assert.equal(syncStep(21, 24, true), 22, "a walk half a step late still lets the last applicant walk");
  assert.equal(syncStep(24, 22, false), 20, "previous step walks that applicant again");
  assert.equal(syncStep(24, 2, false), 0, "replay starts from the front of the line");
});

test("every trace message has copy in both languages", () => {
  for (const d of ["proceed", "review", "reject"]) for (const l of ["en", "es"] as const) assert.notEqual(traceCopy(l, `screened.${d}`), `screened.${d}`);
});
