/**
 * CourierLab — Workflow Step Indicator
 *
 * Barra di progresso del workflow a 5 step.
 * Supporta gli stati: completed · active · pending · disabled
 */
import { Check, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export type StepStatus = 'completed' | 'active' | 'pending' | 'disabled';

export interface WorkflowStep {
  id: string;
  label: string;
  description: string;
  status: StepStatus;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface StepIndicatorProps {
  steps: WorkflowStep[];
}

export default function StepIndicator({ steps }: StepIndicatorProps) {
  return (
    <nav aria-label="Fasi del workflow">
      <ol className="flex items-start">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;

          return (
            <li
              key={step.id}
              className={cn('flex items-center', isLast ? 'flex-none' : 'flex-1')}
            >
              {/* Cerchio + label */}
              <div className="flex flex-col items-center gap-2">
                {/* Cerchio step */}
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 flex-shrink-0',
                    step.status === 'completed' &&
                      'bg-blue-600 text-white shadow-sm',
                    step.status === 'active' &&
                      'bg-blue-600 text-white ring-4 ring-blue-100 shadow-sm',
                    step.status === 'pending' &&
                      'border-2 border-gray-200 text-gray-400 bg-white',
                    step.status === 'disabled' &&
                      'border-2 border-gray-100 text-gray-300 bg-gray-50',
                  )}
                  aria-current={step.status === 'active' ? 'step' : undefined}
                >
                  {step.status === 'completed' ? (
                    <Check className="w-4 h-4" strokeWidth={2.5} />
                  ) : step.status === 'disabled' ? (
                    <Lock className="w-3 h-3" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                {/* Label (nascosta su mobile) */}
                <div className="text-center hidden sm:block" style={{ maxWidth: '72px' }}>
                  <p
                    className={cn(
                      'text-xs font-medium leading-tight',
                      step.status === 'completed' && 'text-blue-700',
                      step.status === 'active' && 'text-gray-900 font-semibold',
                      step.status === 'pending' && 'text-gray-500',
                      step.status === 'disabled' && 'text-gray-300',
                    )}
                  >
                    {step.label}
                  </p>
                  <p
                    className={cn(
                      'text-[10px] mt-0.5 leading-tight',
                      step.status === 'disabled'
                        ? 'text-gray-300'
                        : 'text-gray-400',
                    )}
                  >
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Linea connettore */}
              {!isLast && (
                <div
                  className={cn(
                    'flex-1 h-px mx-3 mb-7 transition-colors duration-300',
                    step.status === 'completed'
                      ? 'bg-blue-600'
                      : 'bg-gray-200',
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
