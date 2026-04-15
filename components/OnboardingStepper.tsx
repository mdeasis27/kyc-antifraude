const STEPS = ["Documento", "Selfie", "Resultado"];

export function OnboardingStepper({ currentStep }: { currentStep: number }) {
  return (
    <nav aria-label="Pasos de verificación">
      <ol className="flex items-center w-full">
        {STEPS.map((label, i) => {
          const step = i + 1;
          const isDone = step < currentStep;
          const isActive = step === currentStep;
          const isLast = i === STEPS.length - 1;

          return (
            <li
              key={label}
              className={`flex items-center ${isLast ? "flex-none" : "flex-1"}`}
            >
              {/* Step item */}
              <div className="flex flex-col items-center gap-1">
                <div
                  aria-current={isActive ? "step" : undefined}
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors duration-300 ${
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
                  className={`text-xs whitespace-nowrap ${
                    isActive ? "font-medium text-gray-900" : "text-gray-400"
                  }`}
                >
                  {label}
                </span>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div className="flex-1 mx-2 h-0.5 rounded-full bg-gray-100 overflow-hidden mb-4">
                  <div
                    className="h-full rounded-full bg-green-500 transition-all duration-500"
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
