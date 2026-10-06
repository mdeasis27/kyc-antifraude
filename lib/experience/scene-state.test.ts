import assert from "node:assert/strict";
import test from "node:test";
import { tapeCounts } from "@/design-system/demo/outcome-tape";
import { runApplicants } from "./screening";
import { atCounter, kycCells, outcomeSeats, revealedApplicants } from "./scene-state";

test("final tape counts match the run", () => {
  assert.deepEqual(tapeCounts(kycCells(runApplicants(0.7).items, 12)), { served: 8, rerouted: 2, lost: 2, pending: 0 });
});

test("reveals three applicants per step, all when complete or under reduced motion", () => {
  assert.equal(revealedApplicants({ visible: 1, total: 4, complete: false }, 12, false), 3);
  assert.equal(revealedApplicants({ visible: 4, total: 4, complete: true }, 12, false), 12);
  assert.equal(revealedApplicants({ visible: 1, total: 4, complete: false }, 12, true), 12);
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
