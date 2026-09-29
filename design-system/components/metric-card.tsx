// design-system/components/metric-card.tsx
// KPI tile: big value + mono label + optional hint, with a semantic accent.
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/design-system/utils";
import type { Tone } from "./tone";

const VALUE: Record<Tone, string> = {
  neutral: "text-foreground",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  info: "text-info",
};

export type MetricCardProps = HTMLAttributes<HTMLDivElement> & {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: Tone;
};

export function MetricCard({
  label,
  value,
  hint,
  tone = "neutral",
  className,
  ...props
}: MetricCardProps) {
  return (
    <div
      data-slot="metric-card"
      className={cn(
        "flex flex-col gap-1 rounded-[var(--radius-md)] bg-surface p-5 shadow-[var(--shadow-card)]",
        className,
      )}
      {...props}
    >
      <span className={cn("text-3xl font-semibold tracking-tight", VALUE[tone])}>{value}</span>
      <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {hint ? <span className="mt-1 text-sm text-muted-foreground">{hint}</span> : null}
    </div>
  );
}
