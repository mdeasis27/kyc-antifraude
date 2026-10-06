import type { ReactNode } from "react";

export type FlowTone = "idle" | "active" | "danger" | "success" | "off";
export interface FlowNode { id: string; x: number; y: number; name: string; sub: string; analogy: string; tone: FlowTone }
export interface FlowEdge { from: string; to: string; tone?: FlowTone }

const W = 150, H = 70;
const NODE_TONE: Record<FlowTone, string> = {
  idle: "fill-surface stroke-border",
  active: "fill-accent/10 stroke-accent",
  danger: "fill-danger/15 stroke-danger",
  success: "fill-success/10 stroke-success",
  off: "fill-surface stroke-border opacity-50",
};
const CARD_TONE: Record<FlowTone, string> = {
  idle: "border-border",
  active: "border-accent bg-accent/10",
  danger: "border-danger bg-danger/15",
  success: "border-success bg-success/10",
  off: "border-border opacity-50",
};
const EDGE_TONE: Record<FlowTone, { className: string; dash?: string }> = {
  idle: { className: "stroke-border" },
  active: { className: "stroke-accent" },
  danger: { className: "stroke-danger", dash: "6 6" },
  success: { className: "stroke-success" },
  off: { className: "stroke-border", dash: "2 6" },
};
// Status is never color alone: danger, success and off also carry a symbol.
const MARK: Partial<Record<FlowTone, string>> = { danger: "✕", success: "✓", off: "–" };
const MARK_FILL: Partial<Record<FlowTone, string>> = { danger: "fill-danger", success: "fill-success", off: "fill-muted-foreground" };
const MARK_TEXT: Partial<Record<FlowTone, string>> = { danger: "text-danger", success: "text-success", off: "text-muted-foreground" };

/** Boxes-and-arrows diagram whose nodes say what they stand for in the analogy.
 *  From `sm` up it is an SVG (pass overlays such as a moving packet as children, in viewBox
 *  coordinates). Below `sm` the same nodes stack as cards in array order, so nothing scrolls. */
export function FlowDiagram({ nodes, edges, width, height, ariaLabel, statusLabels = {}, children }: { nodes: FlowNode[]; edges: FlowEdge[]; width: number; height: number; ariaLabel: string; /** Spoken status per tone on the mobile cards, e.g. { danger: "down" }. */ statusLabels?: Partial<Record<FlowTone, string>>; children?: ReactNode }) {
  const byId = new Map(nodes.map(n => [n.id, n]));
  return <>
    <svg role="img" aria-label={ariaLabel} viewBox={`0 0 ${width} ${height}`} className="hidden h-auto w-full sm:block">
      {edges.map(e => {
        const a = byId.get(e.from), b = byId.get(e.to);
        if (!a || !b) return null;
        const t = EDGE_TONE[e.tone ?? "idle"];
        return <path key={`${e.from}-${e.to}`} data-flow-edge={`${e.from}-${e.to}`} d={`M${a.x + W} ${a.y + H / 2}L${b.x} ${b.y + H / 2}`} className={`transition-colors duration-500 motion-reduce:transition-none ${t.className}`} strokeWidth="2" strokeDasharray={t.dash} />;
      })}
      {nodes.map(n => <g key={n.id} data-flow-node={n.id} data-tone={n.tone}>
        <rect x={n.x} y={n.y} width={W} height={H} rx="10" className={`stroke-2 transition-colors duration-500 motion-reduce:transition-none ${NODE_TONE[n.tone]}`} />
        {MARK[n.tone] ? <text x={n.x + W - 14} y={n.y + 18} textAnchor="middle" aria-hidden="true" className={`text-[13px] font-bold ${MARK_FILL[n.tone]}`}>{MARK[n.tone]}</text> : null}
        <text x={n.x + W / 2} y={n.y + 24} textAnchor="middle" className="fill-foreground text-[14px] font-semibold">{n.name}</text>
        <text x={n.x + W / 2} y={n.y + 42} textAnchor="middle" className="fill-muted-foreground font-mono text-[10px] uppercase">{n.sub}</text>
        <text x={n.x + W / 2} y={n.y + 60} textAnchor="middle" className="fill-accent text-[11px]">= {n.analogy}</text>
      </g>)}
      {children}
    </svg>
    <ol aria-label={ariaLabel} className="space-y-2 sm:hidden">
      {nodes.map((n, i) => <li key={n.id} data-flow-card={n.id} data-tone={n.tone} className={`rounded-lg border-2 px-4 py-3 transition-colors duration-500 motion-reduce:transition-none ${CARD_TONE[n.tone]}`}>
        <p className="flex items-center justify-between gap-2 text-sm font-semibold"><span>{i > 0 ? <span aria-hidden="true" className="mr-1 text-muted-foreground">↳</span> : null}{n.name}</span>{statusLabels[n.tone] ? <span className="sr-only">, {statusLabels[n.tone]}</span> : null}{MARK[n.tone] ? <span aria-hidden="true" className={MARK_TEXT[n.tone]}>{MARK[n.tone]}</span> : null}</p>
        <p className="font-mono text-[10px] uppercase text-muted-foreground">{n.sub}</p>
        <p className="text-xs text-accent">= {n.analogy}</p>
      </li>)}
    </ol>
  </>;
}
