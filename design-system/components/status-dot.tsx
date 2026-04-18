// design-system/components/status-dot.tsx
import type { HTMLAttributes } from "react";
import { cn } from "@/design-system/utils";

type StatusKind = "live" | "beta" | "archived";

type StatusDotProps = HTMLAttributes<HTMLSpanElement> & {
  status: StatusKind;
  label?: string;
};

const dotColor: Record<StatusKind, string> = {
  live: "bg-accent",
  beta: "bg-accent/60",
  archived: "bg-muted",
};

const labels: Record<StatusKind, string> = {
  live: "Live",
  beta: "Beta",
  archived: "Archived",
};

export function StatusDot({ status, label, className, ...props }: StatusDotProps) {
  return (
    <span
      data-slot="status-dot"
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground",
        className,
      )}
      {...props}
    >
      <span className={cn("inline-block size-1.5 rounded-full", dotColor[status])} aria-hidden="true" />
      {label ?? labels[status]}
    </span>
  );
}
