// design-system/components/alert.tsx
// Tinted semantic callout: errors, warnings, positive signals, notices.
// Replaces per-project error boxes and alert cards.
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/design-system/utils";
import type { Tone } from "./tone";

const TONE: Record<Tone, string> = {
  neutral: "border-border bg-muted/10 text-foreground",
  success: "border-success/25 bg-success/10 text-foreground",
  warning: "border-warning/25 bg-warning/10 text-foreground",
  danger: "border-danger/25 bg-danger/10 text-foreground",
  info: "border-info/25 bg-info/10 text-foreground",
};

const DOT: Record<Tone, string> = {
  neutral: "bg-foreground/40",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
};

const TITLE: Record<Tone, string> = {
  neutral: "text-foreground",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  info: "text-info",
};

export type AlertProps = HTMLAttributes<HTMLDivElement> & {
  tone?: Tone;
  title?: string;
  items?: string[];
  children?: ReactNode;
};

export function Alert({
  tone = "neutral",
  title,
  items,
  className,
  children,
  ...props
}: AlertProps) {
  return (
    <div
      data-slot="alert"
      role={tone === "danger" ? "alert" : undefined}
      className={cn(
        "rounded-[var(--radius-md)] border p-5 text-sm shadow-[var(--shadow-border-light)]",
        TONE[tone],
        className,
      )}
      {...props}
    >
      {title ? (
        <h3
          className={cn(
            "mb-3 text-xs font-semibold uppercase tracking-wide",
            TITLE[tone],
          )}
        >
          {title}
        </h3>
      ) : null}
      {items && items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-foreground">
              <span
                className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", DOT[tone])}
                aria-hidden="true"
              />
              {item}
            </li>
          ))}
        </ul>
      ) : null}
      {children}
    </div>
  );
}
