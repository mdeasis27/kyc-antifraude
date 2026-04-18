// design-system/mdx/callout.tsx
import type { HTMLAttributes } from "react";
import { cn } from "@/design-system/utils";

type CalloutProps = HTMLAttributes<HTMLDivElement> & {
  type?: "note" | "warn";
};

export function Callout({ type = "note", children, className, ...props }: CalloutProps) {
  const tone =
    type === "warn"
      ? "bg-destructive/5 shadow-[0_0_0_1px_rgba(220,38,38,0.3)]"
      : "bg-muted/10 shadow-[var(--shadow-border)]";
  return (
    <div
      data-slot="callout"
      data-type={type}
      className={cn("my-6 rounded-[var(--radius)] px-5 py-4 text-[15px] leading-7 text-foreground/85", tone, className)}
      {...props}
    >
      {children}
    </div>
  );
}
