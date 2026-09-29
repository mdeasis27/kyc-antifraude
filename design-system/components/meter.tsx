// design-system/components/meter.tsx
// Horizontal progress / risk bar with a semantic tone.
import type { HTMLAttributes } from "react";
import { cn } from "@/design-system/utils";
import type { Tone } from "./tone";

const BAR: Record<Tone, string> = {
  neutral: "bg-foreground/40",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
};

export type MeterProps = HTMLAttributes<HTMLDivElement> & {
  value: number;
  max?: number;
  tone?: Tone;
};

export function Meter({
  value,
  max = 100,
  tone = "neutral",
  className,
  ...props
}: MeterProps) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div
      data-slot="meter"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn("h-2 w-full overflow-hidden rounded-[var(--radius-pill)] bg-border", className)}
      {...props}
    >
      <div
        className={cn("h-full rounded-[var(--radius-pill)] transition-all duration-500", BAR[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
