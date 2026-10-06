import type { DemoAdapter, TraceEvent } from "@/design-system/demo/types";
import { runApplicants, type ApplicantsResult } from "./screening";

/** threshold is the face match needed to approve alone, in percent. */
export type MissionInput = { threshold: number };
/** comparison counts rejected applicants. */
export type MissionResult = ApplicantsResult & { comparison: { withQueue: number; withoutQueue: number } };

/** Screens the 12 applicants at one line; the trace reveals them one per step with its decision. */
export const runMission: DemoAdapter<MissionInput, MissionResult> = async (input, signal, onEvent) => {
  const startedAt = performance.now();
  const line = input.threshold / 100;
  const run = runApplicants(line);
  const trace: TraceEvent[] = [];
  for (const [i, a] of run.items.entries()) {
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");
    const event: TraceEvent = { id: `screen-${i + 1}`, step: i + 1, kind: "decision", messageKey: `screened.${a.decision}`, timestampMs: performance.now() - startedAt, evidenceIds: [a.id] };
    trace.push(event);
    onEvent(event);
  }
  if (signal.aborted) throw new DOMException("Aborted", "AbortError");
  return { input, result: { ...run, comparison: { withQueue: run.counts.reject, withoutQueue: runApplicants(line, { reviewQueue: false }).counts.reject } }, trace, executionMs: performance.now() - startedAt, mode: "simulation" };
};
