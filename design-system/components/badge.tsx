// design-system/components/badge.tsx
import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/design-system/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-[var(--radius)] border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "border-border bg-muted/20 text-foreground",
        outline: "border-border bg-transparent text-foreground",
        "status-shipped": "border-border bg-muted/20 text-foreground",
        "status-beta": "border-accent/40 bg-accent/10 text-accent",
        "status-archived": "border-border bg-transparent text-muted",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export type BadgeProps = HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, className }))}
      {...props}
    />
  );
}

export { badgeVariants };
