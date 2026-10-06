import assert from "node:assert/strict";
import test from "node:test";
import { runMission } from "./mission";

test("reveals the 12 applicants one per step with its decision and compares with no review queue", async () => {
  const r = await runMission({ threshold: 70 }, new AbortController().signal, () => {});
  assert.equal(r.trace.length, 12);
  assert.deepEqual(r.trace.map(e => e.evidenceIds), r.result.items.map(a => [a.id]));
  assert.deepEqual(r.trace.map(e => e.messageKey), r.result.items.map(a => `screened.${a.decision}`));
  assert.deepEqual(r.result.comparison, { withQueue: 2, withoutQueue: 4 });
});

test("rejects a line outside 0..100 and stops when aborted", async () => {
  await assert.rejects(runMission({ threshold: 120 }, new AbortController().signal, () => {}));
  const c = new AbortController(); c.abort();
  await assert.rejects(runMission({ threshold: 70 }, c.signal, () => {}));
});
