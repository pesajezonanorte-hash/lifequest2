import { motion } from 'framer-motion';

interface Props {
  currentStep: number;
  totalSteps: number;
}

export function OnboardingProgress({ currentStep, totalSteps }: Props) {
  return (
    <div className="flex gap-2 items-center justify-center">
      {Array.from({ length: totalSteps }, (_, i) => (
        <motion.div
          key={i}
          className="h-2 border-2 border-border-pixel"
          animate={{
            width: i < currentStep ? 32 : i === currentStep ? 24 : 16,
            backgroundColor: i < currentStep ? 'var(--accent-gold)' : i === currentStep ? 'var(--accent-gold)' : 'var(--border-strong)',
            opacity: i === currentStep ? 1 : i < currentStep ? 0.8 : 0.4,
          }}
          transition={{ duration: 0.3 }}
        />
      ))}
    </div>
  );
}
