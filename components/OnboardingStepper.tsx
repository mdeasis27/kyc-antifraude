"use client";

const STEPS = ["Documento", "Selfie", "Resultado"];

export function OnboardingStepper({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center gap-4">
      {STEPS.map((label, i) => {
        const step = i + 1;
        const isDone = step < currentStep;
        const isActive = step === currentStep;
        return (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                isDone
                  ? "bg-green-500 text-white"
                  : isActive
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {isDone ? "✓" : step}
            </div>
            <span
              className={`text-sm ${isActive ? "font-medium text-gray-900" : "text-gray-400"}`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div className="h-px w-8 bg-gray-200" />
            )}
          </div>
        );
      })}
    </div>
  );
}
