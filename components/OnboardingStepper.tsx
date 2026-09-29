import { Stepper } from "@/design-system/components/stepper";

const STEPS = ["Documento", "Selfie", "Resultado"];

export function OnboardingStepper({ currentStep }: { currentStep: number }) {
  return <Stepper steps={STEPS} current={currentStep} />;
}