// design-system/components/status-badge.tsx
// Semantic status pill (tinted surface + tone text). The human-readable
// counterpart to the mono/technical <Badge>. Replaces per-project ad-hoc
// green/amber/red badges.
import type { HTMLAttributes } from "react";
import { cn } from "@/design-system/utils";
import type { Tone } from "./tone";

const TONE: Record<Tone, string> = {
  neutral: "border-border bg-muted/20 text-foreground",
  success: "border-success/25 bg-success/10 text-success",
  warning: "border-warning/25 bg-warning/10 text-warning",
  danger: "border-danger/25 bg-danger/10 text-danger",
  info: "border-info/25 bg-info/10 text-info",
};

export type StatusBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: Tone;
  dot?: boolean;
  dotClassName?: string;
};

export function StatusBadge({
  tone = "neutral",
  dot = false,
  dotClassName,
  className,
  children,
  ...props
}: StatusBadgeProps) {
  return (
    <span
      data-slot="status-badge"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        TONE[tone],
        className,
      )}
      {...props}
    >
      {dot ? (
        <span
          className={cn("inline-block size-1.5 shrink-0 rounded-full bg-current", dotClassName)}
          aria-hidden="true"
        />
      ) : null}
      {children}
    </span>
  );
}
