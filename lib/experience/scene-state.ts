import type { TapeStatus } from "@/design-system/demo/outcome-tape";
import type { PlaybackFrame } from "@/design-system/demo/playback";
import type { TraceEvent } from "@/design-system/demo/types";
import type { Decision } from "./screening";

const CELL: Record<Decision, TapeStatus> = { proceed: "served", review: "rerouted", reject: "lost" };

export function kycCells(items: readonly { decision: Decision }[], revealed: number): TapeStatus[] {
  return items.map((a, i) => (i >= revealed ? "pending" : CELL[a.decision]));
}

export function revealedApplicants(frame: { visible: number; total: number; complete: boolean }, n: number, reducedMotion: boolean): number {
  if (reducedMotion || frame.complete || frame.total === 0) return n;
  return Math.ceil((n * frame.visible) / frame.total);
}

/** Seat of each applicant inside its outcome box: the first approved sits at 0, the second at 1, and so on. */
export function outcomeSeats(items: readonly { decision: Decision }[]): number[] {
  const used: Record<Decision, number> = { proceed: 0, review: 0, reject: 0 };
  return items.map(a => used[a.decision]++);
}

/** The scene moves in half steps: at 2i+1 applicant i reaches the counter, at 2i+2 it leaves for its box. */
export function atCounter(phase: number, n: number): number | null {
  if (phase <= 0 || phase >= 2 * n) return null;
  return Math.ceil(phase / 2) - 1;
}

export const COMPLETE_FRAME: PlaybackFrame<TraceEvent> = { visible: 0, total: 0, event: undefined, complete: true };
