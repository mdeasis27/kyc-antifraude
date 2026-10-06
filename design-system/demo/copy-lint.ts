/** Patterns that make story copy read as machine-written, plus brand names (DESIGN.md bans them in public copy). */
export const FORBIDDEN: RegExp[] = [/—/, /\bsino\b/i, /en lugar de/i, /\bnot just\b/i, /\binstead of\b/i, /potenciar/i, /robust/i, /de un vistazo/i, /at a glance/i, /seamless/i, /leverag/i, /\bWaze\b/i];

// Sentence functions are exercised with a clear gap, a tie, a gap of one and the reverse case.
// The 0 also exercises the falsy branch of a boolean control, e.g. question(end, backup).
const SAMPLE_ARGS: [number, number][] = [[27, 18], [18, 18], [19, 18], [17, 18], [18, 0]];

/** Every string reachable in a story object, including what its sentence functions return. */
export function storyStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (typeof value === "function") return SAMPLE_ARGS.map(([a, b]) => String((value as (a: number, b: number) => unknown)(a, b)));
  if (Array.isArray(value)) return value.flatMap(storyStrings);
  if (value && typeof value === "object") return Object.values(value).flatMap(storyStrings);
  return [];
}

/** One line per forbidden pattern found; empty when the copy is clean. */
export function lintStory(story: unknown): string[] {
  return storyStrings(story).flatMap(s => FORBIDDEN.filter(p => p.test(s)).map(p => `${p} in "${s}"`));
}
