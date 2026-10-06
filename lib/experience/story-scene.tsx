"use client";
import type { PlaybackFrame } from "@/design-system/demo/playback";
import type { TraceEvent } from "@/design-system/demo/types";
import { StoryStage } from "@/design-system/demo/decision-lab";
import { OutcomeTape, useReducedMotion } from "@/design-system/demo/project-story";
import { tapeCounts } from "@/design-system/demo/outcome-tape";
import { FlowDiagram, type FlowTone } from "@/design-system/demo/flow-diagram";
import type { MissionResult } from "./mission";
import { kycCells, revealedApplicants } from "./scene-state";
import { STORY } from "./story";

const ORDER = ["applicants", "checks", "face", "decision"] as const;

export function KycStoryScene({ frame, result, locale }: { frame: PlaybackFrame<TraceEvent>; result: MissionResult; locale: "en" | "es" }) {
  const copy = STORY[locale].scene;
  const reduced = useReducedMotion();
  const cells = kycCells(result.items, revealedApplicants(frame, result.items.length, reduced));
  const counts = tapeCounts(cells);
  const tone: Record<(typeof ORDER)[number], FlowTone> = { applicants: "idle", checks: counts.lost > 0 ? "success" : "idle", face: "active", decision: "idle" };
  const nodes = ORDER.map((id, i) => ({ id, x: 10 + i * 160, y: 15, ...copy.nodes[id], tone: tone[id] }));
  const edges = ORDER.slice(1).map((to, i) => ({ from: ORDER[i], to }));
  return <StoryStage locale={locale} title={copy.title} caption={copy.caption} step={frame.visible} total={frame.total}>
    <FlowDiagram nodes={nodes} edges={edges} width={650} height={100} ariaLabel={copy.approvedOf(counts.served)} statusLabels={copy.statusLabels} />
    <div className="mt-6">
      <OutcomeTape cells={cells} labels={copy.tape} ariaLabel={copy.tapeLabel} columns={12} />
      <p className="mt-4 font-mono text-2xl font-semibold tracking-tight">{copy.approvedOf(counts.served)}</p>
    </div>
  </StoryStage>;
}
