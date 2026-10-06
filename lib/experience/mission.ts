import type { DemoAdapter, TraceEvent } from "@/design-system/demo/types";
import { runApplicants, type ApplicantsResult } from "./screening";

/** threshold is the face match needed to approve alone, in percent. */
export type MissionInput = { threshold: number };
/** comparison counts rejected applicants. */
export type MissionResult = ApplicantsResult & { comparison: { withQueue: number; withoutQueue: number } };

const STEP = 3;

/** Screens the 12 applicants at one line; the trace reveals them three at a time. */
export const runMission: DemoAdapter<MissionInput, MissionResult> = async (input, signal, onEvent) => {
  const startedAt = performance.now();
  const line = input.threshold / 100;
  const run = runApplicants(line);
  const trace: TraceEvent[] = [];
  for (let i = 0; i < run.items.length; i += STEP) {
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");
    const n = i / STEP + 1;
    const event: TraceEvent = { id: `batch-${n}`, step: n, kind: "decision", messageKey: `batch.${n}`, timestampMs: performance.now() - startedAt, evidenceIds: run.items.slice(i, i + STEP).map(a => a.id) };
    trace.push(event);
    onEvent(event);
  }
  if (signal.aborted) throw new DOMException("Aborted", "AbortError");
  return { input, result: { ...run, comparison: { withQueue: run.counts.reject, withoutQueue: runApplicants(line, { reviewQueue: false }).counts.reject } }, trace, executionMs: performance.now() - startedAt, mode: "simulation" };
};
