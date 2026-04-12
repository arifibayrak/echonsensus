'use client';

import { Check } from 'lucide-react';
import type { DebatePhase } from '@/lib/types';

const STEPS: { phase: DebatePhase; label: string }[] = [
  { phase: 'echo',      label: 'Echo' },
  { phase: 'positions', label: 'Positions' },
  { phase: 'critiques', label: 'Critiques' },
  { phase: 'debate',    label: 'Debate' },
  { phase: 'synthesis', label: 'Synthesis' },
];

interface Props {
  currentPhase: DebatePhase | null;
  completedPhases: DebatePhase[];
}

export function ProgressStepper({ currentPhase, completedPhases }: Props) {
  return (
    <div className="flex items-center justify-center mb-6 px-2">
      {STEPS.map((step, idx) => {
        const isCompleted = completedPhases.includes(step.phase);
        const isActive    = currentPhase === step.phase;
        const isLast      = idx === STEPS.length - 1;

        return (
          <div key={step.phase} className="flex items-center">
            {/* Step dot + label */}
            <div className="flex flex-col items-center">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                  isCompleted
                    ? 'bg-green-500'
                    : isActive
                    ? 'bg-violet-600 animate-pulse'
                    : 'bg-gray-200'
                }`}
              >
                {isCompleted ? (
                  <Check size={12} className="text-white" strokeWidth={3} />
                ) : (
                  <span
                    className={`text-[10px] font-bold leading-none ${
                      isActive ? 'text-white' : 'text-gray-400'
                    }`}
                  >
                    {idx + 1}
                  </span>
                )}
              </div>
              <span
                className={`hidden sm:block text-[10px] mt-1 font-medium transition-colors ${
                  isCompleted
                    ? 'text-green-600'
                    : isActive
                    ? 'text-violet-600'
                    : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div
                className={`w-6 sm:w-10 h-px mx-1 flex-shrink-0 mb-3 sm:mb-4 transition-colors ${
                  isCompleted ? 'bg-green-400' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
