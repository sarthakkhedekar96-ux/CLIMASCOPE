import React from 'react';
import {
  Play,
  ArrowRight,
  ChevronLeft,
  X,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Layers,
  Flame,
  TrendingUp,
  Cpu,
  ShieldCheck,
  Building,
  Target,
} from 'lucide-react';
import { NavigationTab } from '../../types/api';

export interface DemoStep {
  stepNumber: number;
  title: string;
  tab: NavigationTab;
  wardId: number; // 1 for Hadapsar (WRD-01)
  pitchPrompt: string;
  keyFeatureHighlight: string;
}

export const DEMO_STEPS: DemoStep[] = [
  {
    stepNumber: 1,
    title: 'Executive Dashboard & Resilience Posture',
    tab: 'overview',
    wardId: 1,
    pitchPrompt:
      'Start here: Municipal decision-makers see citywide risk in 15 seconds. Note the 7 monitored study areas, ₹59.8 Cr estimated capital need, and the 6 Core Resilience Intelligence questions answering Where, Why, and What Next.',
    keyFeatureHighlight: 'Live citywide KPIs, Multi-Hazard Debt Index, and 15-second Executive Briefing',
  },
  {
    stepNumber: 2,
    title: 'GIS Intelligence Map & Boundary Provenance',
    tab: 'climate-map',
    wardId: 1,
    pitchPrompt:
      'Show the judges geographical accuracy: Click between Surface Heat, Canopy Deficit, Flood Vulnerability, and Climate Debt layers. Note clear distinctions between PMC, PCMC, and PMRDA boundaries.',
    keyFeatureHighlight: 'MapLibre multi-layer visualization with data-driven risk coloring and explicit boundary disclosures',
  },
  {
    stepNumber: 3,
    title: 'Phase 1 • Biophysical Telemetry Detection',
    tab: 'detect',
    wardId: 1,
    pitchPrompt:
      'Focus on Hadapsar (WRD-01): Point out calibrated USGS Landsat-8 TIRS (41.8°C thermal spike) and Copernicus Sentinel-2 Level-2A canopy deficit (-27.8%). All telemetry has clickable provenance badges.',
    keyFeatureHighlight: 'Zero fabricated sensors: Calibrated satellite radiance anchored to IMD ground stations',
  },
  {
    stepNumber: 4,
    title: 'Climate Debt Engine & Additive Explainability',
    tab: 'detect',
    wardId: 1,
    pitchPrompt:
      'Scroll down to the Climate Debt Engine: Show the Additive Biophysical Breakdown (+15.2 pts Thermal, +12.4 pts Canopy Deficit, etc.). Click FORMULA to show the IPCC AR6 conceptual adaptation disclaimer.',
    keyFeatureHighlight: '100% deterministic formulation with collinearity dampening and explainability breakdown',
  },
  {
    stepNumber: 5,
    title: 'Phase 2 • AI Climate Investigator & Causal Grounding',
    tab: 'investigate',
    wardId: 1,
    pitchPrompt:
      'Show the 7 Scientific Grounding Questions: Explain how the engine distinguishes empirical facts from biophysical hypotheses. Point out the Pearson correlation caveat (r = 0.84) and alternative synoptic factors.',
    keyFeatureHighlight: 'Strict scientific guardrails preventing premature causal attribution',
  },
  {
    stepNumber: 6,
    title: 'Phase 3 • CMIP6 Decadal Climate Projections',
    tab: 'predict',
    wardId: 1,
    pitchPrompt:
      'Toggle between SSP2-4.5 and SSP5-8.5 emissions pathways. Point out the 10th-90th percentile uncertainty bands on the chart and the Baseline-to-Future comparison table with annual inaction losses in ₹ Crore.',
    keyFeatureHighlight: 'Statistically downscaled 6-model CMIP6 ensemble bias-corrected to IMD Pune (43063)',
  },
  {
    stepNumber: 7,
    title: 'Phase 4 • Urban Climate Twin Physical Simulation',
    tab: 'simulate',
    wardId: 1,
    pitchPrompt:
      'Run a simulation: Add 10,000 trees and 25% cool roofs. Note that tree cooling incorporates an 82% sapling survival discount and 7-yr maturity, while cool roofs account for 88% weathering degradation.',
    keyFeatureHighlight: 'Thermodynamically bounded physics twin with Indian biophysical field degradation factors',
  },
  {
    stepNumber: 8,
    title: 'Phase 5 • SciPy HiGHS Municipal Budget Optimizer',
    tab: 'prioritize',
    wardId: 1,
    pitchPrompt:
      'Submit a ₹5.00 Crore municipal budget: The SciPy HiGHS Mixed-Integer Knapsack optimizer computes the mathematically optimal portfolio in milliseconds, protecting 26,000+ vulnerable citizens with zero wasted funds.',
    keyFeatureHighlight: 'Exact MILP 0-1 branch-and-cut optimization (Never lets LLMs decide mathematical budgets)',
  },
  {
    stepNumber: 9,
    title: 'Phase 6 • Climate Action Ledger Deployment',
    tab: 'act',
    wardId: 1,
    pitchPrompt:
      'Demonstrate municipal accountability: Review the prioritized interventions with assigned municipal departments (e.g. PMC Urban Resilience Cell) and procurement contractors, ready for mobilization.',
    keyFeatureHighlight: 'End-to-end governance: Connects climate data science directly to municipal civil works',
  },
  {
    stepNumber: 10,
    title: 'Phase 7 • Satellite Verification & SHA-256 Ledger',
    tab: 'verify',
    wardId: 1,
    pitchPrompt:
      'Complete the Detect-to-Verify loop: Compare planned vs observed cooling and stormwater attenuation. Show that every action is cryptographically anchored in an immutable SHA-256 blockchain-style ledger.',
    keyFeatureHighlight: 'Tamper-evident verification distinguishing empirical satellite passes from simulated tests',
  },
];

interface DemoModeGuideProps {
  isActive: boolean;
  currentStepIndex: number;
  onStepChange: (index: number) => void;
  onClose: () => void;
  onNavigateTab: (tab: NavigationTab) => void;
  onSelectWard: (wardId: number) => void;
}

export const DemoModeGuide: React.FC<DemoModeGuideProps> = ({
  isActive,
  currentStepIndex,
  onStepChange,
  onClose,
  onNavigateTab,
  onSelectWard,
}) => {
  if (!isActive) return null;

  const currentStep = DEMO_STEPS[currentStepIndex] || DEMO_STEPS[0];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === DEMO_STEPS.length - 1;

  const handleNext = () => {
    if (!isLast) {
      const nextIndex = currentStepIndex + 1;
      const nextStep = DEMO_STEPS[nextIndex];
      onStepChange(nextIndex);
      onSelectWard(nextStep.wardId);
      onNavigateTab(nextStep.tab);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      const prevIndex = currentStepIndex - 1;
      const prevStep = DEMO_STEPS[prevIndex];
      onStepChange(prevIndex);
      onSelectWard(prevStep.wardId);
      onNavigateTab(prevStep.tab);
    }
  };

  const handleRestart = () => {
    onStepChange(0);
    onSelectWard(DEMO_STEPS[0].wardId);
    onNavigateTab(DEMO_STEPS[0].tab);
  };

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-4xl px-4 animate-slideUp select-none">
      <div className="bg-white/95 border-2 border-[#32A817] rounded-2xl shadow-2xl backdrop-blur-md p-5 text-[#17251A]">
        {/* Top Bar: Step Indicator & Actions */}
        <div className="flex items-center justify-between border-b border-[#E1E9DF] pb-2.5 mb-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#32A817] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#32A817]" />
            </span>
            <span className="text-[11px] font-bold text-[#073B1A] uppercase tracking-wider">
              HACKATHON DEMO TOUR • STEP {currentStep.stepNumber} OF {DEMO_STEPS.length}
            </span>
            <span className="text-[#C8DEC2]">•</span>
            <span className="text-xs font-bold text-[#073B1A] font-sans">{currentStep.title}</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={handleRestart}
              className="px-2.5 py-1 rounded-lg bg-[#EDF5E9] hover:bg-[#E2EEDF] border border-[#C8DEC2] text-[#073B1A] flex items-center gap-1 text-[11px] font-semibold transition-colors"
              title="Restart Demo Tour"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#32A817]" />
              <span>RESTART</span>
            </button>

            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-[#EDF5E9] hover:bg-[#E2EEDF] border border-[#C8DEC2] text-[#667568] hover:text-[#17251A] flex items-center justify-center transition-colors"
              title="Exit Demo Mode"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Narrative Pitch Prompt */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
          <div className="md:col-span-3 space-y-1">
            <div className="text-[11px] text-[#073B1A] font-bold flex items-center gap-1.5 uppercase tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-[#32A817]" />
              JUDGE TALKING POINT (30 SECONDS):
            </div>
            <p className="text-xs text-[#17251A] leading-relaxed font-sans font-normal">
              {currentStep.pitchPrompt}
            </p>
            <div className="text-[11px] text-emerald-700 font-semibold pt-0.5">
              Highlight: {currentStep.keyFeatureHighlight}
            </div>
          </div>

          {/* Navigational Controls */}
          <div className="flex items-center justify-end gap-2 md:col-span-1 pt-2 md:pt-0 border-t md:border-t-0 border-[#E1E9DF]">
            <button
              onClick={handlePrev}
              disabled={isFirst}
              className={`p-2.5 rounded-xl border flex items-center justify-center transition-all ${
                isFirst
                  ? 'opacity-40 cursor-not-allowed border-[#E1E9DF] bg-[#F5F7F2] text-[#879487]'
                  : 'bg-[#EDF5E9] hover:bg-[#E2EEDF] border-[#C8DEC2] text-[#073B1A]'
              }`}
              title="Previous Demo Step"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleNext}
              disabled={isLast}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm ${
                isLast
                  ? 'bg-emerald-600 text-white cursor-default'
                  : 'bg-[#32A817] hover:bg-[#288712] text-white'
              }`}
            >
              <span>{isLast ? 'TOUR COMPLETE' : 'NEXT STEP'}</span>
              {!isLast && <ArrowRight className="w-3.5 h-3.5" />}
              {isLast && <CheckCircle2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#EDF5E9] h-2 rounded-full mt-3 overflow-hidden">
          <div
            className="bg-[#32A817] h-full rounded-full transition-all duration-300"
            style={{ width: `${(currentStep.stepNumber / DEMO_STEPS.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};
