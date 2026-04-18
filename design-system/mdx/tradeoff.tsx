// design-system/mdx/tradeoff.tsx
import type { HTMLAttributes } from "react";
import { cn } from "@/design-system/utils";

type TradeoffProps = HTMLAttributes<HTMLDivElement> & {
  title: string;
};

export function Tradeoff({ title, children, className, ...props }: TradeoffProps) {
  return (
    <div
      data-slot="tradeoff"
      className={cn(
        "my-6 bg-muted/10 py-4 pl-5 pr-4 shadow-[inset_4px_0_0_var(--accent)]",
        className,
      )}
      {...props}
    >
      <h4 className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{title}</h4>
      <div className="mt-2 text-[15px] leading-7 text-foreground/90">{children}</div>
    </div>
  );
}
