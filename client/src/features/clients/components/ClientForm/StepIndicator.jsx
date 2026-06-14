import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StepIndicator({ steps, currentStep, onStepClick }) {
  return (
    <nav className="flex items-center justify-between mb-8" aria-label="Progress">
      {steps.map((step, index) => {
        const stepNum = index + 1;
        const isCompleted = stepNum < currentStep;
        const isCurrent = stepNum === currentStep;
        const isClickable = stepNum < currentStep;

        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-initial">
            {/* Step circle + label */}
            <button
              type="button"
              onClick={() => isClickable && onStepClick?.(stepNum)}
              disabled={!isClickable}
              className={cn(
                'flex flex-col items-center gap-1.5 group',
                isClickable && 'cursor-pointer'
              )}
            >
              <div
                className={cn(
                  'flex items-center justify-center h-9 w-9 rounded-full border-2 text-sm font-bold transition-all',
                  isCompleted &&
                    'bg-primary border-primary text-primary-foreground',
                  isCurrent &&
                    'border-primary text-primary bg-primary/10',
                  !isCompleted &&
                    !isCurrent &&
                    'border-muted-foreground/30 text-muted-foreground bg-muted/30'
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  stepNum
                )}
              </div>
              <span
                className={cn(
                  'text-xs font-medium hidden sm:block',
                  isCurrent
                    ? 'text-primary'
                    : isCompleted
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            </button>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className="flex-1 mx-2 sm:mx-4">
                <div
                  className={cn(
                    'h-0.5 w-full transition-colors',
                    isCompleted ? 'bg-primary' : 'bg-muted-foreground/20'
                  )}
                />
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
