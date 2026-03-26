"use client";

const STEPS = ["Boas-vindas", "Acordo", "Autoavaliação"];

export function OnboardingStepper({ currentStep }: { currentStep: number }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-wepac-black border-b border-wepac-border px-6 py-3">
      <div className="mx-auto flex max-w-lg items-center justify-between">
        {STEPS.map((step, i) => (
          <div key={step} className="flex items-center">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-6 w-6 items-center justify-center text-xs font-bold ${
                  i < currentStep
                    ? "bg-wepac-white/10 text-wepac-white"
                    : i === currentStep
                      ? "bg-wepac-white text-wepac-black"
                      : "bg-wepac-input text-wepac-text-tertiary"
                }`}
              >
                {i < currentStep ? "\u2713" : i + 1}
              </div>
              <span
                className={`text-xs ${
                  i <= currentStep ? "text-wepac-white" : "text-wepac-text-tertiary"
                }`}
              >
                {step}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`mx-3 h-px w-8 ${
                  i < currentStep ? "bg-wepac-white/20" : "bg-wepac-input"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
