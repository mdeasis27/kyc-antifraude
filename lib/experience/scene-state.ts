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

export const COMPLETE_FRAME: PlaybackFrame<TraceEvent> = { visible: 0, total: 0, event: undefined, complete: true };
