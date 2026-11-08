import React, { useEffect } from 'react';
import {
  Radar,
  Network,
  TrendingUp,
  Boxes,
  SlidersHorizontal,
  CheckSquare,
  ShieldCheck,
  LucideIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { WorkflowPhase } from '../../types/api';

interface WorkflowNavigationProps {
  currentPhase: WorkflowPhase;
  onPhaseChange: (phase: WorkflowPhase) => void;
}

interface PhaseConfig {
  id: WorkflowPhase;
  label: string;
  step: number;
  icon: LucideIcon;
  description: string;
  badge?: string;
}

const PHASES: PhaseConfig[] = [
  {
    id: 'detect',
    label: 'Detect',
    step: 1,
    icon: Radar,
    description: 'Thermal anomalies, canopy deficits & environmental deterioration',
  },
  {
    id: 'investigate',
    label: 'Investigate',
    step: 2,
    icon: Network,
    description: 'Causal Evidence Graph & biophysical stressor mechanisms',
  },
  {
    id: 'predict',
    label: 'Predict',
    step: 3,
    icon: TrendingUp,
    description: 'Multi-decadal climate risk projections & SSP scenarios',
  },
  {
    id: 'simulate',
    label: 'Simulate',
    step: 4,
    icon: Boxes,
    description: 'Urban Climate Twin & microclimate physics simulation',
  },
  {
    id: 'prioritize',
    label: 'Prioritize',
    step: 5,
    icon: SlidersHorizontal,
    description: 'Budget-Constrained Intervention Optimizer & Pareto frontier',
  },
  {
    id: 'act',
    label: 'Act',
    step: 6,
    icon: CheckSquare,
    description: 'Municipal procurement, work orders & contractor deployment',
  },
  {
    id: 'verify',
    label: 'Verify',
    step: 7,
    icon: ShieldCheck,
    description: 'Empirical satellite audit & post-intervention delta verification',
  },
];

export const WorkflowNavigation: React.FC<WorkflowNavigationProps> = ({
  currentPhase,
  onPhaseChange,
}) => {
  // Global Hotkey handler: Press '1' through '7' to switch phases directly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (
        ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)
      ) {
        return;
      }

      const keyNum = parseInt(e.key, 10);
      if (keyNum >= 1 && keyNum <= 7) {
        e.preventDefault();
        const target = PHASES[keyNum - 1];
        if (target) {
          onPhaseChange(target.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPhaseChange]);

  return (
    <nav className="bg-white border-b border-[#E1E9DF] px-4 py-2 flex items-center justify-between shrink-0 select-none font-sans shadow-xs">
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none w-full">
        {PHASES.map((p) => {
          const Icon = p.icon;
          const isActive = currentPhase === p.id;

          return (
            <button
              key={p.id}
              onClick={() => onPhaseChange(p.id)}
              title={`${p.step}. ${p.label}: ${p.description}`}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all text-xs relative group ${isActive
                  ? 'bg-[#EDF5E9] text-[#073B1A] border border-[#C8DEC2] font-bold shadow-xs'
                  : 'text-[#667568] hover:text-[#17251A] hover:bg-[#F5F7F2] border border-transparent'
                }`}
            >
              {/* Step indicator */}
              <span
                className={`text-[10.5px] font-bold px-1.5 py-0.2 rounded-md ${isActive
                    ? 'bg-[#32A817] text-white shadow-xs'
                    : 'bg-[#E2EEDF] text-[#073B1A] group-hover:bg-[#C8DEC2]'
                  }`}
              >
                {p.step}
              </span>

              <Icon
                className={`w-3.5 h-3.5 ${isActive ? 'text-[#32A817]' : 'text-[#667568] group-hover:text-[#17251A]'
                  }`}
              />

              <span className="font-semibold text-xs">
                {p.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Stepper Quick Navigation Arrows */}
      <div className="flex items-center gap-1 shrink-0 px-2 border-l border-[#E1E9DF]">
        <button
          onClick={() => {
            const currentIdx = PHASES.findIndex((p) => p.id === currentPhase);
            if (currentIdx > 0) onPhaseChange(PHASES[currentIdx - 1].id);
          }}
          disabled={currentPhase === 'detect'}
          className={`p-1.5 rounded-lg text-[#667568] hover:text-[#17251A] transition-colors ${currentPhase === 'detect' ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[#EDF5E9]'
            }`}
          title="Previous Phase"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            const currentIdx = PHASES.findIndex((p) => p.id === currentPhase);
            if (currentIdx < PHASES.length - 1) onPhaseChange(PHASES[currentIdx + 1].id);
          }}
          disabled={currentPhase === 'verify'}
          className={`p-1.5 rounded-lg text-[#667568] hover:text-[#17251A] transition-colors ${currentPhase === 'verify' ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[#EDF5E9]'
            }`}
          title="Next Phase"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="hidden xl:flex items-center gap-2 text-xs text-[#667568] shrink-0 pl-3 border-l border-[#E1E9DF]">
        <span>Keys</span>
        <kbd className="px-1.5 py-0.5 rounded-md bg-[#EDF5E9] text-[#073B1A] border border-[#C8DEC2] font-mono text-[10px] font-semibold">
          1–7
        </kbd>
        <span>to switch</span>
      </div>
    </nav>
  );
};
