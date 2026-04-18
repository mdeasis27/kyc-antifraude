// design-system/mdx/metric-group.tsx
import type { HTMLAttributes } from "react";
import { cn } from "@/design-system/utils";

type MetricGroupProps = HTMLAttributes<HTMLDivElement> & {
  cols?: 2 | 3 | 4;
};

export function MetricGroup({ cols = 3, className, children, ...props }: MetricGroupProps) {
  const gridClass =
    cols === 2 ? "sm:grid-cols-2" : cols === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3";
  return (
    <div
      data-slot="metric-group"
      className={cn("my-6 grid grid-cols-1 gap-3", gridClass, className)}
      {...props}
    >
      {children}
    </div>
  );
}
