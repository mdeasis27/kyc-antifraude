// design-system/components/stepper.tsx
// Horizontal multi-step progress indicator. `current` is 1-based.
import { cn } from "@/design-system/utils";

export type StepperProps = {
  steps: string[];
  current: number;
  className?: string;
};

export function Stepper({ steps, current, className }: StepperProps) {
  return (
    <nav aria-label="Progreso" className={className}>
      <ol className="flex w-full items-center">
        {steps.map((label, i) => {
          const step = i + 1;
          const isDone = step < current;
          const isActive = step === current;
          const isLast = i === steps.length - 1;

          return (
            <li key={label} className={cn("flex items-center", isLast ? "flex-none" : "flex-1")}>
              <div className="flex flex-col items-center gap-1">
                <div
                  aria-current={isActive ? "step" : undefined}
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full text-xs font-bold transition-colors duration-300",
                    isDone
                      ? "bg-success text-white"
                      : isActive
                        ? "bg-foreground text-background"
                        : "bg-border text-muted-foreground",
                  )}
                >
                  {isDone ? "✓" : step}
                </div>
                <span
                  className={cn(
                    "text-xs whitespace-nowrap",
                    isActive ? "font-medium text-foreground" : "text-muted-foreground",
                  )}
                >
                  {label}
                </span>
              </div>

              {!isLast && (
                <div className="mx-2 mb-4 h-0.5 flex-1 overflow-hidden rounded-full bg-border">
                  <div
                    className={cn(
                      "h-full rounded-full bg-success transition-all duration-500",
                    )}
                    style={{ width: isDone ? "100%" : "0%" }}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
