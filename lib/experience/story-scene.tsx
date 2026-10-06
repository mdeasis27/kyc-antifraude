"use client";
import { useEffect, useState } from "react";
import type { PlaybackFrame } from "@/design-system/demo/playback";
import type { TraceEvent } from "@/design-system/demo/types";
import { StoryStage } from "@/design-system/demo/decision-lab";
import { OutcomeTape, useReducedMotion } from "@/design-system/demo/project-story";
import { tapeCounts, type TapeStatus } from "@/design-system/demo/outcome-tape";
import type { MissionResult } from "./mission";
import type { ScreenedApplicant } from "./screening";
import { atCounter, kycCells, outcomeSeats, revealedApplicants, syncStep } from "./scene-state";
import { STORY, type KycStory } from "./story";

type Outcome = Exclude<TapeStatus, "pending">;
const TONE: Record<ScreenedApplicant["decision"], Outcome> = { proceed: "served", review: "rerouted", reject: "lost" };
const FILL: Record<Outcome, string> = { served: "fill-success", rerouted: "fill-info", lost: "fill-danger" };
const STROKE: Record<Outcome, string> = { served: "stroke-success", rerouted: "stroke-info", lost: "stroke-danger" };
const BOX_Y: Record<Outcome, number> = { served: 12, rerouted: 134, lost: 256 };
const OUTCOMES = ["served", "rerouted", "lost"] as const;
/** Half step of the walk: reach the counter, then leave for the box. Two of them fit inside the fastest trace step (200 ms at 4x). */
const TICK_MS = 100;
const COUNTER_X = 230;
const FLOOR_Y = 330;
const BAR_X = 24;
const BAR_W = 312;

function reasonText(copy: KycStory["scene"], a: ScreenedApplicant, line: number): string {
  const pct = Math.round(a.faceMatch * 100);
  const r = copy.reasons;
  return a.reason === "clear" ? r.clear(pct, line) : a.reason === "belowLine" ? r.belowLine(pct, line) : a.reason === "pep" ? r.pep(pct) : a.reason === "noMatch" ? r.noMatch(pct) : r[a.reason];
}

function panelTag(copy: KycStory["scene"], a: ScreenedApplicant): string {
  if (a.reason === "sanctions" || a.reason === "document") return copy.tags[a.reason];
  const pct = `${Math.round(a.faceMatch * 100)}%`;
  return a.reason === "pep" ? `${pct} · ${copy.tags.pep}` : pct;
}

/** The bank branch: applicants queue, the teller checks the ID and the face against your line, and each one walks to its outcome. */
export function KycStoryScene({ frame, result, locale }: { frame: PlaybackFrame<TraceEvent>; result: MissionResult; locale: "en" | "es" }) {
  const copy = STORY[locale].scene;
  const reduced = useReducedMotion();
  const items = result.items;
  const n = items.length;
  const line = Math.round(result.line * 100);
  const target = 2 * revealedApplicants(frame, n, reduced);

  // Each new run starts the walk again from the front of the line; the walk follows the trace both ways.
  const [run, setRun] = useState(result);
  const [step, setStep] = useState(0);
  if (run !== result) { setRun(result); setStep(0); }
  else if (!reduced && syncStep(step, target, frame.complete) !== step) setStep(syncStep(step, target, frame.complete));
  useEffect(() => {
    if (reduced || step >= target) return;
    const timer = setTimeout(() => setStep(s => s + 1), TICK_MS);
    return () => clearTimeout(timer);
  }, [reduced, step, target]);
  const phase = reduced ? 2 * n : Math.min(step, target);

  const placed = Math.floor(phase / 2);
  const seats = outcomeSeats(items);
  const current = atCounter(phase, n);
  const inspected = current === null ? null : items[current];
  const hardStop = inspected?.reason === "sanctions" || inspected?.reason === "document";
  const cells = kycCells(items, placed);
  const counts = tapeCounts(cells);
  const final = result.counts;
  const summary = `${copy.approvedOf(final.proceed)}. ${copy.summary(final.review, final.reject)}`;
  const status = inspected && current !== null ? `${copy.applicant(current + 1)}: ${reasonText(copy, inspected, line)}` : placed === n ? summary : "";
  const motion = reduced ? "" : "transition-[transform,opacity] duration-100 ease-in-out";

  const position = (i: number): [number, number] => {
    if (i < placed) {
      const seat = seats[i];
      return [404 + (seat % 6) * 32, BOX_Y[TONE[items[i].decision]] + 70 + Math.floor(seat / 6) * 34];
    }
    if (i === current) return [COUNTER_X, FLOOR_Y];
    const waiting = i - (current === null ? placed : current + 1);
    return [190 - waiting * 15, FLOOR_Y];
  };

  return <StoryStage locale={locale} title={copy.title} caption={copy.caption} step={frame.visible} total={frame.total}>
    <svg viewBox="0 0 600 380" className="block h-auto w-full" role="img" aria-label={summary} data-kyc-scene data-phase={phase}>
      <rect x="0" y="300" width="360" height="80" className="fill-foreground/5" />
      <g className={motion} opacity={inspected ? 1 : 0} data-teller-panel>
        <rect x="12" y="8" width="336" height="180" rx="10" className="fill-background stroke-border" />
        <rect x="24" y="20" width="150" height="76" rx="6" className="fill-foreground/10 stroke-foreground/30" />
        <circle cx="54" cy="48" r="11" className="fill-muted-foreground" />
        <rect x="40" y="62" width="28" height="20" rx="6" className="fill-muted-foreground" />
        {[40, 54, 68].map((y, k) => <rect key={y} x="84" y={y} width={[70, 56, 64][k]} height="6" rx="3" className="fill-foreground/25" />)}
        {hardStop ? <g data-id-rejected>
          <rect x="24" y="20" width="150" height="76" rx="6" className="fill-danger/20 stroke-danger" strokeWidth="2" />
          <path d="M84 36 l30 44 M114 36 l-30 44" className="stroke-danger" strokeWidth="6" strokeLinecap="round" />
        </g> : null}
        <rect x="186" y="20" width="150" height="76" rx="6" className="fill-foreground/10 stroke-foreground/30" />
        <circle cx="261" cy="46" r="14" className="fill-muted-foreground" />
        <rect x="243" y="63" width="36" height="25" rx="9" className="fill-muted-foreground" />
        <text x="99" y="120" textAnchor="middle" fontSize="20" className="fill-muted-foreground">{copy.idCard}</text>
        <text x="261" y="120" textAnchor="middle" fontSize="20" className="fill-muted-foreground">{copy.face}</text>
        <rect x={BAR_X} y="134" width={BAR_W} height="14" rx="7" className="fill-foreground/10" />
        <rect x={BAR_X} y="134" width={inspected && !hardStop ? BAR_W * inspected.faceMatch : 0} height="14" rx="7" className={`${inspected ? FILL[TONE[inspected.decision]] : ""} ${reduced ? "" : "transition-[width] duration-100"}`} />
        <line x1={BAR_X + BAR_W * result.line} y1="128" x2={BAR_X + BAR_W * result.line} y2="154" className="stroke-foreground" strokeWidth="2" strokeDasharray="3 2" />
        <text x={BAR_X} y="176" fontSize="20" fontWeight="600" className="fill-foreground">{inspected ? panelTag(copy, inspected) : ""}</text>
        <text x={BAR_X + BAR_W} y="176" textAnchor="end" fontSize="20" className="fill-muted-foreground">{copy.lineLabel(line)}</text>
      </g>
      <circle cx={COUNTER_X} cy="214" r="11" className="fill-warning" />
      <rect x={COUNTER_X - 14} y="226" width="28" height="22" rx="8" className="fill-warning" />
      <rect x={COUNTER_X - 70} y="246" width="140" height="22" rx="4" className="fill-foreground/30" />
      <text x={COUNTER_X} y="368" textAnchor="middle" fontSize="22" className="fill-muted-foreground">{copy.counter}</text>
      <text x="80" y="368" textAnchor="middle" fontSize="22" className="fill-muted-foreground">{copy.queue}</text>
      {OUTCOMES.map(o => <g key={o}>
        <rect x="380" y={BOX_Y[o]} width="208" height="112" rx="10" className={`${FILL[o]} ${STROKE[o]}`} fillOpacity="0.08" />
        <text x="394" y={BOX_Y[o] + 30} fontSize="22" fontWeight="600" className={FILL[o]}>{copy.boxes[o]}</text>
        <text x="574" y={BOX_Y[o] + 30} textAnchor="end" fontSize="24" fontWeight="700" className={FILL[o]} data-box-count={o}>{counts[o]}</text>
      </g>)}
      {items.map((a, i) => {
        const [x, y] = position(i);
        const tone = i < placed ? TONE[a.decision] : null;
        const body = tone ? FILL[tone] : "fill-muted-foreground";
        return <g key={a.id} className={motion} style={{ transform: `translate(${x}px, ${y}px)` }} data-person={tone ?? "waiting"}>
          <circle cy="-20" r="6" className={body} />
          <rect x="-7" y="-13" width="14" height="14" rx="5" className={body} />
          {tone === "lost" ? <path d="M-4 -10 l8 8 M4 -10 l-8 8" stroke="white" strokeWidth="2.2" strokeLinecap="round" /> : null}
        </g>;
      })}
    </svg>
    <p className="mt-4 min-h-[3rem] text-sm leading-6" data-scene-status>{status}</p>
    <div className="mt-4">
      <OutcomeTape cells={cells} labels={copy.tape} ariaLabel={copy.tapeLabel} columns={12} />
      <p className="mt-4 font-mono text-2xl font-semibold tracking-tight">{copy.approvedOf(counts.served)}</p>
    </div>
  </StoryStage>;
}
