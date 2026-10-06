export type TapeStatus = "served" | "rerouted" | "lost" | "pending";

export function tapeCells(servedBy: readonly (string | null)[], primaryId: string, revealed: number): TapeStatus[] {
  return servedBy.map((provider, i) =>
    i >= revealed ? "pending" : provider === null ? "lost" : provider === primaryId ? "served" : "rerouted",
  );
}

export function tapeCounts(cells: readonly TapeStatus[]): Record<TapeStatus, number> {
  const counts: Record<TapeStatus, number> = { served: 0, rerouted: 0, lost: 0, pending: 0 };
  for (const cell of cells) counts[cell] += 1;
  return counts;
}

/** Trace frames are breaker events, not ticks: reveal up to the current event's tick. */
export function revealedTicks(
  frame: { total: number; complete: boolean; event?: { evidenceIds?: string[] } },
  nTicks: number,
  reducedMotion = false,
): number {
  if (reducedMotion || frame.total === 0 || frame.complete) return nTicks;
  const tag = frame.event?.evidenceIds?.find((id) => id.startsWith("tick:"));
  const tick = tag ? Number(tag.slice("tick:".length)) : Number.NaN;
  return Number.isInteger(tick) ? Math.min(nTicks, Math.max(0, tick + 1)) : 0;
}
