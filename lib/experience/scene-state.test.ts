import assert from "node:assert/strict";
import test from "node:test";
import { tapeCounts } from "@/design-system/demo/outcome-tape";
import { runApplicants } from "./screening";
import { kycCells, revealedApplicants } from "./scene-state";

test("final tape counts match the run", () => {
  assert.deepEqual(tapeCounts(kycCells(runApplicants(0.7).items, 12)), { served: 8, rerouted: 2, lost: 2, pending: 0 });
});

test("reveals three applicants per step, all when complete or under reduced motion", () => {
  assert.equal(revealedApplicants({ visible: 1, total: 4, complete: false }, 12, false), 3);
  assert.equal(revealedApplicants({ visible: 4, total: 4, complete: true }, 12, false), 12);
  assert.equal(revealedApplicants({ visible: 1, total: 4, complete: false }, 12, true), 12);
});
