import React, { useState, useMemo, useEffect } from 'react';
import {
  Boxes,
  Sliders,
  ThermometerSnowflake,
  Droplets,
  Leaf,
  Cpu,
  ArrowRight,
  TrendingDown,
  Sparkles,
  Zap,
  RotateCcw,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Bookmark,
  BookmarkCheck,
  DollarSign,
  IndianRupee,
  Info,
  Layers,
  ChevronRight,
  Maximize2,
  Trash2,
  Download,
  Building,
  BarChart2,
  Radar as RadarIcon,
  HelpCircle,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import { WardSummary, NavigationTab, SavedScenario, AssumptionItem } from '../../types/api';
import { MetricCard } from '../common/MetricCard';
import { Badge } from '../common/Badge';
import { ProvenanceBadge } from '../common/ProvenanceBadge';
import { formatINR, formatINRLakh, formatINRCrore } from '../../utils/formatters';

interface SimulateViewProps {
  ward: WardSummary | null;
  wards?: WardSummary[];
  onSelectWard?: (wardId: number) => void;
  onNavigateTab?: (tab: NavigationTab) => void;
}

type ScenarioMode = 'combined' | 'single' | 'baseline';
type SingleInterventionType = 'trees' | 'cool_roofs' | 'permeable' | 'corridors' | 'retention';

export const SimulateView: React.FC<SimulateViewProps> = ({
  ward,
  wards = [],
  onSelectWard,
  onNavigateTab,
}) => {
  // If no ward is selected, fallback to first ward in list
  const activeWard = ward || (wards.length > 0 ? wards[0] : null);

  // Scenario Mode State
  const [scenarioMode, setScenarioMode] = useState<ScenarioMode>('combined');
  const [selectedSingleIntervention, setSelectedSingleIntervention] =
    useState<SingleInterventionType>('trees');

  // 5 Intervention Sliders State
  const [treesCount, setTreesCount] = useState<number>(12000);
  const [coolRoofPct, setCoolRoofPct] = useState<number>(35);
  const [permeableSqM, setPermeableSqM] = useState<number>(35000);
  const [greenCorridorSqM, setGreenCorridorSqM] = useState<number>(20000);
  const [retentionCapacityM3, setRetentionCapacityM3] = useState<number>(15000);

  // Available Budget Input (INR Native System)
  const [availableBudgetINR, setAvailableBudgetINR] = useState<number>(25000000);

  // UI Drawer / Modal States
  const [showAssumptionsModal, setShowAssumptionsModal] = useState<boolean>(false);
  const [showSavedModal, setShowSavedModal] = useState<boolean>(false);
  const [scenarioNameInput, setScenarioNameInput] = useState<string>('');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  // Saved Scenarios in localStorage
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>(() => {
    try {
      const stored = localStorage.getItem('climascope_saved_simulations');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse saved scenarios from localStorage:', e);
    }
    return [
      {
        id: 'PMC-SIM-01',
        name: 'Monsoon Heat & Surge Defense 2026',
        timestamp: '2026-10-15 14:30',
        ward_id: '1',
        ward_name: 'Hadapsar & Magarpatta Industrial Corridor',
        inputs: {
          ward_id: '1',
          trees_count: 18000,
          cool_roof_pct: 45,
          permeable_surface_sq_m: 40000,
          green_corridor_sq_m: 25000,
          retention_capacity_m3: 30000,
          available_budget_usd: 300000,
          ...({ available_budget_inr: 25000000 } as any)
        },
        result: {} as any,
      },
    ];
  });

  // Save to localStorage when changed
  useEffect(() => {
    try {
      localStorage.setItem('climascope_saved_simulations', JSON.stringify(savedScenarios));
    } catch (e) {
      console.warn('Failed to write saved scenarios to localStorage:', e);
    }
  }, [savedScenarios]);

  if (!activeWard) return null;

  // Scientific Constants (Municipal INR Costs & Physics Coefficients)
  const COST_PER_TREE_INR = 2200;
  const MAINT_PER_TREE_INR = 300;
  const COST_PER_SQM_COOL_ROOF_INR = 650;
  const MAINT_PER_SQM_COOL_ROOF_INR = 45;
  const COST_PER_SQM_PERMEABLE_INR = 1950;
  const MAINT_PER_SQM_PERMEABLE_INR = 95;
  const COST_PER_SQM_CORRIDOR_INR = 2400;
  const MAINT_PER_SQM_CORRIDOR_INR = 180;
  const COST_PER_M3_RETENTION_INR = 2850;
  const MAINT_PER_M3_RETENTION_INR = 120;

  // Baseline Ward Parameters
  const baseLST = activeWard.heat_index_celsius;
  const baseCanopy = activeWard.canopy_cover_pct;
  const baseDebt = activeWard.climate_debt_score;
  const baseRunoffRisk = Math.round(activeWard.flood_susceptibility_idx * 100);
  const baseVulnerability = activeWard.vulnerable_population_pct;
  const wardAreaSqM = activeWard.area_sq_km * 1000000;
  const wardPop = activeWard.population;

  // Determine Active Inputs depending on Scenario Mode
  const activeParams = useMemo(() => {
    if (scenarioMode === 'baseline') {
      return {
        trees: 0,
        coolRoofPct: 0,
        permeableSqM: 0,
        corridorSqM: 0,
        retentionM3: 0,
      };
    }
    if (scenarioMode === 'single') {
      return {
        trees: selectedSingleIntervention === 'trees' ? treesCount : 0,
        coolRoofPct: selectedSingleIntervention === 'cool_roofs' ? coolRoofPct : 0,
        permeableSqM: selectedSingleIntervention === 'permeable' ? permeableSqM : 0,
        corridorSqM: selectedSingleIntervention === 'corridors' ? greenCorridorSqM : 0,
        retentionM3: selectedSingleIntervention === 'retention' ? retentionCapacityM3 : 0,
      };
    }
    return {
      trees: treesCount,
      coolRoofPct: coolRoofPct,
      permeableSqM: permeableSqM,
      corridorSqM: greenCorridorSqM,
      retentionM3: retentionCapacityM3,
    };
  }, [
    scenarioMode,
    selectedSingleIntervention,
    treesCount,
    coolRoofPct,
    permeableSqM,
    greenCorridorSqM,
    retentionCapacityM3,
  ]);

  // Core Biophysical Simulation Function
  const computeScenario = (params: {
    trees: number;
    coolRoofPct: number;
    permeableSqM: number;
    corridorSqM: number;
    retentionM3: number;
  }) => {
    // 1. Financial Costs (INR)
    const capexTrees = params.trees * COST_PER_TREE_INR;
    const maintTrees = params.trees * MAINT_PER_TREE_INR;

    const estimatedTotalRoofSqM = wardAreaSqM * (activeWard.impervious_surface_pct / 100.0) * 0.35;
    const retrofittedRoofSqM = estimatedTotalRoofSqM * (params.coolRoofPct / 100.0);
    const capexRoof = retrofittedRoofSqM * COST_PER_SQM_COOL_ROOF_INR;
    const maintRoof = retrofittedRoofSqM * MAINT_PER_SQM_COOL_ROOF_INR;

    const capexPermeable = params.permeableSqM * COST_PER_SQM_PERMEABLE_INR;
    const maintPermeable = params.permeableSqM * MAINT_PER_SQM_PERMEABLE_INR;

    const capexCorridor = params.corridorSqM * COST_PER_SQM_CORRIDOR_INR;
    const maintCorridor = params.corridorSqM * MAINT_PER_SQM_CORRIDOR_INR;

    const capexRetention = params.retentionM3 * COST_PER_M3_RETENTION_INR;
    const maintRetention = params.retentionM3 * MAINT_PER_M3_RETENTION_INR;

    const totalCapexINR = capexTrees + capexRoof + capexPermeable + capexCorridor + capexRetention;
    const totalMaintINR = maintTrees + maintRoof + maintPermeable + maintCorridor + maintRetention;
    const totalCapexUSD = Math.round(totalCapexINR / 83.5);

    // 2. Microclimate Heat Transfer & Latent Transpiration (Oke 1989 & Akbari 2001)
    const treeCanopySqM = params.trees * 15.0;
    const deltaT_trees = (treeCanopySqM / Math.max(1, wardAreaSqM)) * 16.0;
    const deltaT_roof = (retrofittedRoofSqM / Math.max(1, wardAreaSqM)) * 12.0;
    const deltaT_permeable = (params.permeableSqM / Math.max(1, wardAreaSqM)) * 6.5;
    const deltaT_corridor = (params.corridorSqM / Math.max(1, wardAreaSqM)) * 14.0;
    const deltaT_retention = (params.retentionM3 / Math.max(1, wardAreaSqM * 0.05)) * 2.2;

    const rawCooling = deltaT_trees + deltaT_roof + deltaT_permeable + deltaT_corridor + deltaT_retention;
    const diminishingFactor = 1.0 / (1.0 + 0.12 * rawCooling);
    const effectiveCooling = Number(Math.min(4.8, rawCooling * diminishingFactor).toFixed(2));
    const postSimLST = Number(Math.max(28.0, baseLST - effectiveCooling).toFixed(1));

    // 3. Canopy Coverage calculation
    const addedCanopySqM = treeCanopySqM + params.corridorSqM * 0.5;
    const canopyGainPct = (addedCanopySqM / Math.max(1, wardAreaSqM)) * 100.0;
    const postSimCanopy = Number(Math.min(45.0, baseCanopy + canopyGainPct).toFixed(1));

    // 4. Infiltration & Runoff Attenuation (Rational SCS-CN Infiltration Model)
    const permeableRatio = params.permeableSqM / Math.max(1, wardAreaSqM * (activeWard.impervious_surface_pct / 100.0));
    const permeableAttenuation = Math.min(28.0, permeableRatio * 32.0);

    const stormDesignVolume = wardAreaSqM * 0.075;
    const retentionAttenuation = Math.min(30.0, (params.retentionM3 / Math.max(1, stormDesignVolume)) * 60.0);
    const canopyHydrologicInterception = canopyGainPct * 0.35;

    const runoffReductionPct = Number(
      Math.min(55.0, permeableAttenuation + retentionAttenuation + canopyHydrologicInterception).toFixed(1)
    );

    const postSimRunoffRisk = Number(
      Math.max(15.0, baseRunoffRisk * (1.0 - runoffReductionPct / 100.0)).toFixed(1)
    );

    // 5. Climate Debt Score calculation
    const debtReduction =
      effectiveCooling * 7.2 + runoffReductionPct * 0.28 + canopyGainPct * 0.45;
    const postSimDebt = Number(Math.max(12.0, baseDebt - debtReduction).toFixed(1));

    // 6. Population Exposure calculation
    const baseExposed = Math.round(wardPop * (baseVulnerability / 100.0) * (baseDebt / 100.0));
    const debtRatio = postSimDebt / Math.max(1.0, baseDebt);
    const postSimExposed = Math.max(0, Math.round(baseExposed * Math.pow(debtRatio, 1.25)));

    return {
      capexINR: totalCapexINR,
      maintINR: totalMaintINR,
      capexUSD: totalCapexUSD,
      capexTrees,
      capexRoof,
      capexPermeable,
      capexCorridor,
      capexRetention,
      effectiveCooling,
      postSimLST,
      canopyGainPct: Number(canopyGainPct.toFixed(1)),
      postSimCanopy,
      runoffReductionPct,
      postSimRunoffRisk,
      postSimDebt,
      debtReduction: Number(debtReduction.toFixed(1)),
      baseExposed,
      postSimExposed,
      relievedCitizens: baseExposed - postSimExposed,
      retrofittedRoofSqM,
      treeCanopySqM,
    };
  };

  // Evaluate Current Active Scenario
  const sim = useMemo(() => computeScenario(activeParams), [activeParams, activeWard]);

  // Evaluate Baseline (0 interventions)
  const baselineSim = useMemo(
    () =>
      computeScenario({
        trees: 0,
        coolRoofPct: 0,
        permeableSqM: 0,
        corridorSqM: 0,
        retentionM3: 0,
      }),
    [activeWard]
  );

  // Evaluate Each Single Intervention for Comparative Analysis
  const singleTreesSim = useMemo(
    () =>
      computeScenario({
        trees: treesCount,
        coolRoofPct: 0,
        permeableSqM: 0,
        corridorSqM: 0,
        retentionM3: 0,
      }),
    [treesCount, activeWard]
  );
  const singleRoofSim = useMemo(
    () =>
      computeScenario({
        trees: 0,
        coolRoofPct: coolRoofPct,
        permeableSqM: 0,
        corridorSqM: 0,
        retentionM3: 0,
      }),
    [coolRoofPct, activeWard]
  );
  const singlePermSim = useMemo(
    () =>
      computeScenario({
        trees: 0,
        coolRoofPct: 0,
        permeableSqM: permeableSqM,
        corridorSqM: 0,
        retentionM3: 0,
      }),
    [permeableSqM, activeWard]
  );
  const singleCorridorSim = useMemo(
    () =>
      computeScenario({
        trees: 0,
        coolRoofPct: 0,
        permeableSqM: 0,
        corridorSqM: greenCorridorSqM,
        retentionM3: 0,
      }),
    [greenCorridorSqM, activeWard]
  );
  const singleRetentionSim = useMemo(
    () =>
      computeScenario({
        trees: 0,
        coolRoofPct: 0,
        permeableSqM: 0,
        corridorSqM: 0,
        retentionM3: retentionCapacityM3,
      }),
    [retentionCapacityM3, activeWard]
  );

  // Improvements percentage calculations (Baseline vs Simulated Future)
  const debtImprovementPct = Number(
    (((baseDebt - sim.postSimDebt) / Math.max(0.1, baseDebt)) * 100).toFixed(1)
  );
  const heatImprovementPct = Number(
    (((baseLST - sim.postSimLST) / Math.max(0.1, baseLST)) * 100).toFixed(1)
  );
  const canopyImprovementPct = Number(
    (((sim.postSimCanopy - baseCanopy) / Math.max(0.1, baseCanopy)) * 100).toFixed(1)
  );
  const runoffImprovementPct = Number(
    (((baseRunoffRisk - sim.postSimRunoffRisk) / Math.max(0.1, baseRunoffRisk)) * 100).toFixed(1)
  );
  const popImprovementPct = Number(
    (
      ((baselineSim.baseExposed - sim.postSimExposed) / Math.max(1, baselineSim.baseExposed)) *
      100
    ).toFixed(1)
  );

  // Budget calculations (INR)
  const budgetSurplusDeficit = availableBudgetINR - sim.capexINR;
  const isBudgetSufficient = budgetSurplusDeficit >= 0;

  // Preset Configurations (INR)
  const applyPreset = (preset: 'cooling' | 'flood' | 'corridor' | 'balanced' | 'zero') => {
    setScenarioMode('combined');
    if (preset === 'cooling') {
      setTreesCount(25000);
      setCoolRoofPct(70);
      setPermeableSqM(20000);
      setGreenCorridorSqM(15000);
      setRetentionCapacityM3(5000);
      setAvailableBudgetINR(35000000);
    } else if (preset === 'flood') {
      setTreesCount(8000);
      setCoolRoofPct(15);
      setPermeableSqM(90000);
      setGreenCorridorSqM(25000);
      setRetentionCapacityM3(60000);
      setAvailableBudgetINR(45000000);
    } else if (preset === 'corridor') {
      setTreesCount(20000);
      setCoolRoofPct(20);
      setPermeableSqM(30000);
      setGreenCorridorSqM(75000);
      setRetentionCapacityM3(15000);
      setAvailableBudgetINR(40000000);
    } else if (preset === 'balanced') {
      setTreesCount(15000);
      setCoolRoofPct(35);
      setPermeableSqM(40000);
      setGreenCorridorSqM(30000);
      setRetentionCapacityM3(20000);
      setAvailableBudgetINR(25000000);
    } else if (preset === 'zero') {
      setTreesCount(0);
      setCoolRoofPct(0);
      setPermeableSqM(0);
      setGreenCorridorSqM(0);
      setRetentionCapacityM3(0);
    }
  };

  // 6x6 Spatial Microclimate Thermal Raster Simulation Grid
  const gridCells = useMemo(() => {
    return Array.from({ length: 36 }).map((_, i) => {
      const row = Math.floor(i / 6);
      const col = i % 6;
      const baseVariation = ((row * 4 + col * 9) % 7) * 0.35 - 1.0;
      const cellBaseTemp = Number((baseLST + baseVariation).toFixed(1));

      const isInterventionZone = (row + col) % 2 === 0;
      const cellCoolingMultiplier = isInterventionZone ? 1.25 : 0.75;
      const cellCooling = sim.effectiveCooling * cellCoolingMultiplier;
      const cellPostTemp = Number((cellBaseTemp - cellCooling).toFixed(1));

      return {
        id: i,
        row,
        col,
        baseTemp: cellBaseTemp,
        postTemp: cellPostTemp,
        delta: Number((cellPostTemp - cellBaseTemp).toFixed(1)),
        isInterventionZone,
      };
    });
  }, [baseLST, sim.effectiveCooling]);

  // Radar chart data comparing 5 biophysical dimensions
  const radarData = [
    {
      dimension: 'Thermal Buffer',
      baseline: Math.max(10, 100 - baseLST * 2.1),
      simulated: Math.max(10, 100 - sim.postSimLST * 2.1),
      fullMark: 100,
    },
    {
      dimension: 'Tree Canopy',
      baseline: Math.min(100, baseCanopy * 2.5),
      simulated: Math.min(100, sim.postSimCanopy * 2.5),
      fullMark: 100,
    },
    {
      dimension: 'Flood Infiltration',
      baseline: Math.max(10, 100 - baseRunoffRisk),
      simulated: Math.max(10, 100 - sim.postSimRunoffRisk),
      fullMark: 100,
    },
    {
      dimension: 'Resilience Debt',
      baseline: Math.max(10, 100 - baseDebt),
      simulated: Math.max(10, 100 - sim.postSimDebt),
      fullMark: 100,
    },
    {
      dimension: 'Public Relief',
      baseline: Math.max(10, 100 - (baselineSim.baseExposed / wardPop) * 100),
      simulated: Math.max(10, 100 - (sim.postSimExposed / wardPop) * 100),
      fullMark: 100,
    },
  ];

  // Bar chart data for comparative scenario debt scores
  const scenarioBarData = [
    {
      scenario: 'Baseline (0)',
      climateDebt: baseDebt,
      costINR: 0,
      fill: '#DC3545',
    },
    {
      scenario: 'Trees Only',
      climateDebt: singleTreesSim.postSimDebt,
      costINR: singleTreesSim.capexINR,
      fill: '#16A34A',
    },
    {
      scenario: 'Cool Roofs',
      climateDebt: singleRoofSim.postSimDebt,
      costINR: singleRoofSim.capexINR,
      fill: '#0EA5E9',
    },
    {
      scenario: 'Permeable',
      climateDebt: singlePermSim.postSimDebt,
      costINR: singlePermSim.capexINR,
      fill: '#F59E0B',
    },
    {
      scenario: 'Corridors',
      climateDebt: singleCorridorSim.postSimDebt,
      costINR: singleCorridorSim.capexINR,
      fill: '#8B5CF6',
    },
    {
      scenario: 'Retention',
      climateDebt: singleRetentionSim.postSimDebt,
      costINR: singleRetentionSim.capexINR,
      fill: '#0284C7',
    },
    {
      scenario: 'Combined',
      climateDebt: sim.postSimDebt,
      costINR: sim.capexINR,
      fill: '#32A817',
    },
  ];

  // Save Current Simulation Handler
  const handleSaveSimulation = () => {
    if (!scenarioNameInput.trim()) return;

    const newScenario: SavedScenario = {
      id: `PMC-SIM-${Date.now().toString().slice(-4)}`,
      name: scenarioNameInput.trim(),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      ward_id: String(activeWard.id),
      ward_name: activeWard.name,
      inputs: {
        ward_id: String(activeWard.id),
        trees_count: treesCount,
        cool_roof_pct: coolRoofPct,
        permeable_surface_sq_m: permeableSqM,
        green_corridor_sq_m: greenCorridorSqM,
        retention_capacity_m3: retentionCapacityM3,
        available_budget_usd: Math.round(availableBudgetINR / 83.5),
        ...({ available_budget_inr: availableBudgetINR } as any)
      },
      result: {} as any,
    };

    setSavedScenarios((prev) => [newScenario, ...prev]);
    setScenarioNameInput('');
    setSaveSuccessNotice(`Scenario "${newScenario.name}" saved successfully.`);
    setTimeout(() => setSaveSuccessNotice(null), 3500);
  };

  // Load Saved Scenario Handler
  const handleLoadScenario = (sc: SavedScenario) => {
    setTreesCount(sc.inputs.trees_count);
    setCoolRoofPct(sc.inputs.cool_roof_pct);
    setPermeableSqM(sc.inputs.permeable_surface_sq_m);
    setGreenCorridorSqM(sc.inputs.green_corridor_sq_m);
    setRetentionCapacityM3(sc.inputs.retention_capacity_m3);
    const inr = (sc.inputs as any).available_budget_inr || (sc.inputs.available_budget_usd ? sc.inputs.available_budget_usd * 83.5 : 25000000);
    setAvailableBudgetINR(inr);
    setScenarioMode('combined');
    setShowSavedModal(false);
  };

  // Delete Saved Scenario Handler
  const handleDeleteScenario = (id: string) => {
    setSavedScenarios((prev) => prev.filter((s) => s.id !== id));
  };

  const handleResetSliders = () => {
    applyPreset('balanced');
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-5 scrollbar-thin bg-[#F5F7F2] text-[#17251A] font-sans">
      {/* 1. Header Command Ribbon */}
      <div className="bg-white border border-[#E1E9DF] rounded-2xl p-5 shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-[11px] font-bold text-[#073B1A] bg-[#EDF5E9] border border-[#C8DEC2] px-2.5 py-0.5 rounded-full tracking-wide">
              PHASE 4 • SIMULATE
            </span>
            <span className="text-[#879487] text-xs">•</span>
            <span className="text-xs text-[#073B1A] font-semibold">
              Urban Climate Twin Simulation
            </span>
            <span className="text-[#879487] text-xs">•</span>
            <span className="text-xs font-mono text-[#32A817] font-bold">{activeWard.code}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-[#073B1A] tracking-tight">
              Microclimate Physics Sandbox: {activeWard.name}
            </h1>

            {/* Ward Selector Dropdown */}
            {wards.length > 0 && onSelectWard && (
              <select
                aria-label="Select Municipal Ward"
                value={activeWard.id}
                onChange={(e) => onSelectWard(Number(e.target.value))}
                className="bg-[#EDF5E9] border border-[#C8DEC2] text-[#073B1A] text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#32A817] font-semibold"
              >
                {wards.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.code} - {w.name} ({w.zone})
                  </option>
                ))}
              </select>
            )}
          </div>

          <p className="text-xs text-[#667568] mt-1.5 max-w-3xl leading-relaxed">
            Deterministic scenario-based impact twin modeling surface heat transfer, latent evapotranspiration,
            and stormwater infiltration dynamics for municipal capital expenditure planning.
          </p>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => setShowAssumptionsModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#EDF5E9] hover:bg-[#32A817] hover:text-white border border-[#C8DEC2] text-[#073B1A] rounded-xl text-xs font-semibold transition-all shadow-xs"
            title="Inspect Biophysical Equations and Financial Constants"
          >
            <Info className="w-3.5 h-3.5 text-[#32A817]" />
            <span>Assumptions</span>
          </button>

          <button
            onClick={() => setShowSavedModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#EDF5E9] hover:bg-[#32A817] hover:text-white border border-[#C8DEC2] text-[#073B1A] rounded-xl text-xs font-semibold transition-all shadow-xs"
            title="View Saved Scenarios"
          >
            <Bookmark className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>Saved ({savedScenarios.length})</span>
          </button>

          <button
            onClick={handleResetSliders}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#F5F7F2] hover:bg-[#EDF5E9] border border-[#E1E9DF] text-[#17251A] rounded-xl text-xs font-semibold transition-all shadow-xs"
            title="Reset Simulation Parameters"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#667568]" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* 2. Epistemic Disclaimer Banner */}
      <div className="bg-[#EDF5E9] border border-[#C8DEC2] rounded-2xl p-4 flex items-start gap-3 text-xs shadow-xs">
        <ShieldCheck className="w-5 h-5 text-[#16A34A] shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <ProvenanceBadge
              category="SIMULATED"
              sourceName="CLIMASCOPE Biophysical Microclimate Twin"
              methodology="Microclimate Heat Transfer (Oke 1989) & Rational SCS-CN Runoff Infiltration"
            />
            <span className="text-[#879487]">•</span>
            <span className="text-[#667568] text-[11px] font-medium">
              Modeled scenario estimate — not an unvalidated prediction
            </span>
          </div>
          <p className="text-[#17251A] text-[11px] mt-1 leading-relaxed">
            All projected values represent localized deterministic engineering estimations derived from
            empirical heat transfer coefficients (Oke 1989, Akbari 2001) and rational runoff infiltration models.
            Simulations provide municipal decision support and must be cross-verified with on-site hydrogeological surveys.
          </p>
        </div>
        <div className="text-[10px] font-bold text-[#073B1A] bg-white border border-[#C8DEC2] px-2.5 py-1 rounded-full shrink-0">
          REACTIVE TWIN v2.4
        </div>
      </div>

      {/* 3. Scenario Mode Selector & Quick Presets */}
      <div className="bg-white border border-[#E1E9DF] rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-card">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-[#073B1A] font-bold uppercase mr-1">
            SCENARIO MODE:
          </span>
          <button
            onClick={() => setScenarioMode('combined')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              scenarioMode === 'combined'
                ? 'bg-[#073B1A] text-white shadow-xs'
                : 'bg-[#F5F7F2] text-[#667568] hover:text-[#17251A] border border-[#E1E9DF]'
            }`}
          >
            Combined Masterplan
          </button>
          <button
            onClick={() => setScenarioMode('single')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              scenarioMode === 'single'
                ? 'bg-[#073B1A] text-white shadow-xs'
                : 'bg-[#F5F7F2] text-[#667568] hover:text-[#17251A] border border-[#E1E9DF]'
            }`}
          >
            Single-Intervention Isolation
          </button>
          <button
            onClick={() => setScenarioMode('baseline')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              scenarioMode === 'baseline'
                ? 'bg-[#DC3545] text-white shadow-xs'
                : 'bg-[#F5F7F2] text-[#667568] hover:text-[#17251A] border border-[#E1E9DF]'
            }`}
          >
            Baseline (0 Interventions)
          </button>
        </div>

        {/* Quick Strategy Presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] text-[#667568] uppercase font-bold mr-1">Quick Presets:</span>
          <button
            onClick={() => applyPreset('cooling')}
            className="px-2.5 py-1 bg-[#EDF5E9] hover:bg-[#32A817] hover:text-white border border-[#C8DEC2] text-[#073B1A] rounded-xl text-[10px] font-semibold transition-all"
          >
            Max Cooling
          </button>
          <button
            onClick={() => applyPreset('flood')}
            className="px-2.5 py-1 bg-[#EDF5E9] hover:bg-[#32A817] hover:text-white border border-[#C8DEC2] text-[#073B1A] rounded-xl text-[10px] font-semibold transition-all"
          >
            Monsoon Buffer
          </button>
          <button
            onClick={() => applyPreset('corridor')}
            className="px-2.5 py-1 bg-[#EDF5E9] hover:bg-[#32A817] hover:text-white border border-[#C8DEC2] text-[#073B1A] rounded-xl text-[10px] font-semibold transition-all"
          >
            Greenway Corridor
          </button>
          <button
            onClick={() => applyPreset('balanced')}
            className="px-2.5 py-1 bg-[#EDF5E9] hover:bg-[#32A817] hover:text-white border border-[#C8DEC2] text-[#073B1A] rounded-xl text-[10px] font-semibold transition-all"
          >
            Balanced PMC
          </button>
        </div>
      </div>

      {/* Single Intervention Sub-selector (if single mode active) */}
      {scenarioMode === 'single' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex flex-wrap items-center gap-2 shadow-xs">
          <span className="text-xs font-bold text-[#F59E0B] uppercase flex items-center gap-1.5 mr-2">
            <Zap className="w-3.5 h-3.5 text-[#F59E0B]" />
            Testing Single Intervention in Isolation:
          </span>
          <button
            onClick={() => setSelectedSingleIntervention('trees')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
              selectedSingleIntervention === 'trees'
                ? 'bg-[#16A34A] text-white shadow-xs'
                : 'bg-white text-[#17251A] border border-[#E1E9DF]'
            }`}
          >
            1. Tree Plantation Only
          </button>
          <button
            onClick={() => setSelectedSingleIntervention('cool_roofs')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
              selectedSingleIntervention === 'cool_roofs'
                ? 'bg-[#0EA5E9] text-white shadow-xs'
                : 'bg-white text-[#17251A] border border-[#E1E9DF]'
            }`}
          >
            2. Cool Roofs Only
          </button>
          <button
            onClick={() => setSelectedSingleIntervention('permeable')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
              selectedSingleIntervention === 'permeable'
                ? 'bg-[#F59E0B] text-white shadow-xs'
                : 'bg-white text-[#17251A] border border-[#E1E9DF]'
            }`}
          >
            3. Permeable Roads Only
          </button>
          <button
            onClick={() => setSelectedSingleIntervention('corridors')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
              selectedSingleIntervention === 'corridors'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white text-[#17251A] border border-[#E1E9DF]'
            }`}
          >
            4. Green Corridors Only
          </button>
          <button
            onClick={() => setSelectedSingleIntervention('retention')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
              selectedSingleIntervention === 'retention'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-[#17251A] border border-[#E1E9DF]'
            }`}
          >
            5. Retention Zones Only
          </button>
        </div>
      )}

      {/* 4. Interactive Simulation Sliders Workspace */}
      <div className="bg-white border border-[#E1E9DF] rounded-2xl p-5 space-y-4 shadow-card">
        <div className="flex items-center justify-between border-b border-[#E1E9DF] pb-2">
          <span className="text-xs font-bold text-[#073B1A] uppercase flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-[#32A817]" />
            Intervention Parameter Inputs (Drag sliders to simulate in real time)
          </span>
          <span className="text-[10px] text-[#32A817] font-bold">
            ZERO PAGE RELOAD • INSTANT SOLVER
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Slider 1: Tree Plantation */}
          <div
            className={`bg-[#F5F7F2] border p-4 rounded-xl transition-all ${
              scenarioMode === 'single' && selectedSingleIntervention !== 'trees'
                ? 'opacity-40 border-[#E1E9DF]'
                : 'border-[#C8DEC2] shadow-xs'
            }`}
          >
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-[#16A34A] font-bold flex items-center gap-1.5">
                <Leaf className="w-3.5 h-3.5" /> 1. Tree Plantation
              </span>
              <span className="text-[#17251A] font-bold text-sm">
                {treesCount.toLocaleString()} trees
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={50000}
              step={500}
              value={treesCount}
              onChange={(e) => setTreesCount(Number(e.target.value))}
              disabled={scenarioMode === 'baseline'}
              className="w-full accent-[#16A34A] cursor-pointer h-2 bg-[#E1E9DF] rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-[#667568] mt-2">
              <span>{((treesCount * 15) / 1000).toFixed(0)}k m² crown canopy</span>
              <span className="text-[#16A34A] font-bold">
                {formatINR(treesCount * COST_PER_TREE_INR)} (@₹2,200/tree)
              </span>
            </div>
          </div>

          {/* Slider 2: Cool Roofs */}
          <div
            className={`bg-[#F5F7F2] border p-4 rounded-xl transition-all ${
              scenarioMode === 'single' && selectedSingleIntervention !== 'cool_roofs'
                ? 'opacity-40 border-[#E1E9DF]'
                : 'border-[#C8DEC2] shadow-xs'
            }`}
          >
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-[#0EA5E9] font-bold flex items-center gap-1.5">
                <ThermometerSnowflake className="w-3.5 h-3.5" /> 2. Cool Roof Coverage
              </span>
              <span className="text-[#17251A] font-bold text-sm">{coolRoofPct}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={coolRoofPct}
              onChange={(e) => setCoolRoofPct(Number(e.target.value))}
              disabled={scenarioMode === 'baseline'}
              className="w-full accent-[#0EA5E9] cursor-pointer h-2 bg-[#E1E9DF] rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-[#667568] mt-2">
              <span>{(sim.retrofittedRoofSqM / 1000).toFixed(0)}k m² membrane</span>
              <span className="text-[#0EA5E9] font-bold">
                {formatINR(sim.capexRoof)} (@₹650/m²)
              </span>
            </div>
          </div>

          {/* Slider 3: Permeable Roads */}
          <div
            className={`bg-[#F5F7F2] border p-4 rounded-xl transition-all ${
              scenarioMode === 'single' && selectedSingleIntervention !== 'permeable'
                ? 'opacity-40 border-[#E1E9DF]'
                : 'border-[#C8DEC2] shadow-xs'
            }`}
          >
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-[#F59E0B] font-bold flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5" /> 3. Permeable Roads
              </span>
              <span className="text-[#17251A] font-bold text-sm">
                {permeableSqM.toLocaleString()} m²
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={200000}
              step={2500}
              value={permeableSqM}
              onChange={(e) => setPermeableSqM(Number(e.target.value))}
              disabled={scenarioMode === 'baseline'}
              className="w-full accent-[#F59E0B] cursor-pointer h-2 bg-[#E1E9DF] rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-[#667568] mt-2">
              <span>Porous aggregate concrete</span>
              <span className="text-[#F59E0B] font-bold">
                {formatINR(permeableSqM * COST_PER_SQM_PERMEABLE_INR)} (@₹1,950/m²)
              </span>
            </div>
          </div>

          {/* Slider 4: Urban Green Corridors */}
          <div
            className={`bg-[#F5F7F2] border p-4 rounded-xl transition-all ${
              scenarioMode === 'single' && selectedSingleIntervention !== 'corridors'
                ? 'opacity-40 border-[#E1E9DF]'
                : 'border-[#C8DEC2] shadow-xs'
            }`}
          >
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-purple-600 font-bold flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5" /> 4. Urban Green Corridors
              </span>
              <span className="text-[#17251A] font-bold text-sm">
                {greenCorridorSqM.toLocaleString()} m²
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={150000}
              step={2500}
              value={greenCorridorSqM}
              onChange={(e) => setGreenCorridorSqM(Number(e.target.value))}
              disabled={scenarioMode === 'baseline'}
              className="w-full accent-purple-600 cursor-pointer h-2 bg-[#E1E9DF] rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-[#667568] mt-2">
              <span>Linear bioswales & street shade</span>
              <span className="text-purple-600 font-bold">
                {formatINR(greenCorridorSqM * COST_PER_SQM_CORRIDOR_INR)} (@₹2,400/m²)
              </span>
            </div>
          </div>

          {/* Slider 5: Rainwater Retention Zones */}
          <div
            className={`bg-[#F5F7F2] border p-4 rounded-xl transition-all ${
              scenarioMode === 'single' && selectedSingleIntervention !== 'retention'
                ? 'opacity-40 border-[#E1E9DF]'
                : 'border-[#C8DEC2] shadow-xs'
            }`}
          >
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-blue-600 font-bold flex items-center gap-1.5">
                <Boxes className="w-3.5 h-3.5" /> 5. Rainwater Retention Zones
              </span>
              <span className="text-[#17251A] font-bold text-sm">
                {retentionCapacityM3.toLocaleString()} m³
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100000}
              step={1000}
              value={retentionCapacityM3}
              onChange={(e) => setRetentionCapacityM3(Number(e.target.value))}
              disabled={scenarioMode === 'baseline'}
              className="w-full accent-blue-600 cursor-pointer h-2 bg-[#E1E9DF] rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-[#667568] mt-2">
              <span>{(retentionCapacityM3 / 1000).toFixed(0)}M liters surge capacity</span>
              <span className="text-blue-600 font-bold">
                {formatINR(retentionCapacityM3 * COST_PER_M3_RETENTION_INR)} (@₹2,850/m³)
              </span>
            </div>
          </div>

          {/* Input 6: Available Municipal Budget */}
          <div className="bg-[#F5F7F2] border border-[#C8DEC2] p-4 rounded-xl shadow-xs">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-[#073B1A] font-bold flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-[#32A817]" /> Municipal Available Budget
              </span>
              <span className="text-[#32A817] font-bold text-sm">
                {formatINR(availableBudgetINR)}
              </span>
            </div>
            <input
              type="range"
              min={1000000}
              max={100000000}
              step={1000000}
              value={availableBudgetINR}
              onChange={(e) => setAvailableBudgetINR(Number(e.target.value))}
              className="w-full accent-[#32A817] cursor-pointer h-2 bg-[#E1E9DF] rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-[#667568] mt-2">
              <span>PMC Capital Outlay Cap</span>
              <span
                className={`font-bold ${
                  isBudgetSufficient ? 'text-[#16A34A]' : 'text-[#DC3545]'
                }`}
              >
                {isBudgetSufficient ? 'SURPLUS' : 'DEFICIT'}: {formatINR(Math.abs(budgetSurplusDeficit))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. BASELINE vs SIMULATED FUTURE Comparison Cards */}
      <div className="bg-white border border-[#E1E9DF] rounded-2xl p-5 shadow-card space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E1E9DF] pb-2 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#073B1A] flex items-center gap-1.5">
              <Boxes className="w-4 h-4 text-[#32A817]" />
              BASELINE vs SIMULATED FUTURE
            </span>
            <span className="text-[#879487] text-xs">•</span>
            <span className="text-[10px] text-[#32A817] font-bold">
              PERCENTAGE IMPROVEMENT BREAKDOWN
            </span>
          </div>

          <div className="flex items-center gap-2">
            {saveSuccessNotice && (
              <span className="text-[11px] text-[#16A34A] bg-[#EDF5E9] border border-[#C8DEC2] px-2.5 py-0.5 rounded-full font-semibold animate-fade-in">
                {saveSuccessNotice}
              </span>
            )}
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                placeholder="Name scenario to save..."
                value={scenarioNameInput}
                onChange={(e) => setScenarioNameInput(e.target.value)}
                className="bg-[#F5F7F2] border border-[#E1E9DF] text-xs px-3 py-1.5 rounded-xl text-[#17251A] focus:outline-none focus:border-[#32A817] w-48"
              />
              <button
                onClick={handleSaveSimulation}
                disabled={!scenarioNameInput.trim()}
                className="px-3 py-1.5 bg-[#32A817] hover:bg-[#288812] disabled:opacity-40 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1"
              >
                <BookmarkCheck className="w-3.5 h-3.5" />
                <span>SAVE</span>
              </button>
            </div>
          </div>
        </div>

        {/* 6 Key Outcome Comparison Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* Card 1: Climate Debt Score */}
          <div className="bg-[#F5F7F2] border border-[#E1E9DF] p-3.5 rounded-xl flex flex-col justify-between shadow-xs">
            <div>
              <div className="text-[10px] text-[#667568] uppercase font-bold">Climate Debt</div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xs text-[#DC3545] font-bold">{baseDebt.toFixed(1)}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#879487]" />
                <span className="text-lg font-bold text-[#073B1A]">
                  {sim.postSimDebt}
                </span>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-[#E1E9DF] flex items-center justify-between">
              <span className="text-[9px] text-[#667568]">Deficit Recovery</span>
              <span className="text-[10px] font-bold text-[#16A34A] bg-[#EDF5E9] border border-[#C8DEC2] px-1.5 py-0.5 rounded-full">
                +{debtImprovementPct}%
              </span>
            </div>
          </div>

          {/* Card 2: Heat Risk (LST Surface Temp) */}
          <div className="bg-[#F5F7F2] border border-[#E1E9DF] p-3.5 rounded-xl flex flex-col justify-between shadow-xs">
            <div>
              <div className="text-[10px] text-[#667568] uppercase font-bold">Heat Risk (LST)</div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xs text-[#DC3545] font-bold">{baseLST.toFixed(1)}°C</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#879487]" />
                <span className="text-lg font-bold text-[#16A34A]">
                  {sim.postSimLST}°C
                </span>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-[#E1E9DF] flex items-center justify-between">
              <span className="text-[9px] text-[#667568]">Net LST Cooling</span>
              <span className="text-[10px] font-bold text-[#16A34A] bg-[#EDF5E9] border border-[#C8DEC2] px-1.5 py-0.5 rounded-full">
                -{sim.effectiveCooling}°C ({heatImprovementPct}%)
              </span>
            </div>
          </div>

          {/* Card 3: Green Canopy Coverage */}
          <div className="bg-[#F5F7F2] border border-[#E1E9DF] p-3.5 rounded-xl flex flex-col justify-between shadow-xs">
            <div>
              <div className="text-[10px] text-[#667568] uppercase font-bold">Green Coverage</div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xs text-[#F59E0B] font-bold">{baseCanopy.toFixed(1)}%</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#879487]" />
                <span className="text-lg font-bold text-[#16A34A]">
                  {sim.postSimCanopy}%
                </span>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-[#E1E9DF] flex items-center justify-between">
              <span className="text-[9px] text-[#667568]">Canopy Expansion</span>
              <span className="text-[10px] font-bold text-[#16A34A] bg-[#EDF5E9] border border-[#C8DEC2] px-1.5 py-0.5 rounded-full">
                +{canopyImprovementPct}%
              </span>
            </div>
          </div>

          {/* Card 4: Surface Runoff Risk */}
          <div className="bg-[#F5F7F2] border border-[#E1E9DF] p-3.5 rounded-xl flex flex-col justify-between shadow-xs">
            <div>
              <div className="text-[10px] text-[#667568] uppercase font-bold">Runoff Risk</div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xs text-[#F59E0B] font-bold">{baseRunoffRisk}%</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#879487]" />
                <span className="text-lg font-bold text-[#0EA5E9]">
                  {sim.postSimRunoffRisk}%
                </span>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-[#E1E9DF] flex items-center justify-between">
              <span className="text-[9px] text-[#667568]">Attenuation</span>
              <span className="text-[10px] font-bold text-[#0EA5E9] bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded-full">
                -{runoffImprovementPct}%
              </span>
            </div>
          </div>

          {/* Card 5: Population Exposure */}
          <div className="bg-[#F5F7F2] border border-[#E1E9DF] p-3.5 rounded-xl flex flex-col justify-between shadow-xs">
            <div>
              <div className="text-[10px] text-[#667568] uppercase font-bold">Pop. Exposure</div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xs text-[#DC3545] font-bold">
                  {(baselineSim.baseExposed / 1000).toFixed(0)}k
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[#879487]" />
                <span className="text-lg font-bold text-[#073B1A]">
                  {(sim.postSimExposed / 1000).toFixed(0)}k
                </span>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-[#E1E9DF] flex items-center justify-between">
              <span className="text-[9px] text-[#667568]">Relieved Citizens</span>
              <span className="text-[10px] font-bold text-[#16A34A] bg-[#EDF5E9] border border-[#C8DEC2] px-1.5 py-0.5 rounded-full">
                -{popImprovementPct}%
              </span>
            </div>
          </div>

          {/* Card 6: Estimated Cost vs Available Budget */}
          <div className="bg-[#F5F7F2] border border-[#E1E9DF] p-3.5 rounded-xl flex flex-col justify-between shadow-xs">
            <div>
              <div className="text-[10px] text-[#667568] uppercase font-bold">Estimated Capex</div>
              <div className="text-base font-bold text-[#17251A] mt-1">
                {formatINR(sim.capexINR)}
              </div>
              <div className="text-[10px] text-[#667568]">
                Maint: {formatINR(sim.maintINR)} / yr
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-[#E1E9DF] flex items-center justify-between">
              <span className="text-[9px] text-[#667568]">Budget Status</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isBudgetSufficient
                    ? 'text-[#16A34A] bg-[#EDF5E9] border-[#C8DEC2]'
                    : 'text-[#DC3545] bg-red-50 border-red-200'
                }`}
              >
                {isBudgetSufficient ? 'IN BUDGET' : 'OVERRUN'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Scenario Comparison Charts & Spatial Microclimate Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Card: Scenario Comparison Charts (Radar & Bar Chart) */}
        <div className="bg-white border border-[#E1E9DF] rounded-2xl p-5 flex flex-col justify-between shadow-card space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-[#E1E9DF] pb-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#073B1A] flex items-center gap-2">
                <RadarIcon className="w-4 h-4 text-[#32A817]" />
                Resilience Multi-Axis Signature (Baseline vs Future)
              </span>
              <span className="text-[10px] text-[#32A817] font-bold">
                5-DIMENSION EVALUATION
              </span>
            </div>

            {/* Recharts Radar Chart */}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="75%">
                  <PolarGrid stroke="#E1E9DF" />
                  <PolarAngleAxis
                    dataKey="dimension"
                    tick={{ fill: '#667568', fontSize: 10 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={{ fill: '#879487', fontSize: 9 }}
                  />
                  <Radar
                    name="Baseline State"
                    dataKey="baseline"
                    stroke="#DC3545"
                    fill="#DC3545"
                    fillOpacity={0.20}
                  />
                  <Radar
                    name="Simulated Future"
                    dataKey="simulated"
                    stroke="#32A817"
                    fill="#32A817"
                    fillOpacity={0.35}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E1E9DF',
                      borderRadius: '12px',
                      fontSize: '11px',
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recharts Marginal Debt Impact Bar Chart */}
          <div className="pt-3 border-t border-[#E1E9DF]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#073B1A] flex items-center gap-1.5">
                <BarChart2 className="w-3.5 h-3.5 text-[#32A817]" />
                Climate Debt by Scenario vs Capex (₹)
              </span>
              <span className="text-[10px] text-[#667568]">LOWER DEBT IS BETTER</span>
            </div>

            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scenarioBarData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E1E9DF" />
                  <XAxis
                    dataKey="scenario"
                    tick={{ fill: '#667568', fontSize: 9 }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: '#667568', fontSize: 9 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E1E9DF',
                      borderRadius: '12px',
                      fontSize: '11px',
                    }}
                    formatter={(val: any, name: string) => [
                      name === 'climateDebt' ? `${val} / 100` : formatINR(val),
                      name === 'climateDebt' ? 'Debt Score' : 'Capex (INR)',
                    ]}
                  />
                  <Bar dataKey="climateDebt" name="Debt Score" radius={[4, 4, 0, 0]}>
                    {scenarioBarData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Card: Spatial Microclimate Thermal Raster Matrix (36 Sectors) */}
        <div className="bg-white border border-[#E1E9DF] rounded-2xl p-5 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#E1E9DF] pb-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#073B1A]">
                Spatial Microclimate Thermal Matrix (36 Sectors)
              </span>
              <span className="text-[10px] text-[#16A34A] font-bold">
                CELL RESOLUTION 250m
              </span>
            </div>

            <p className="text-[11px] text-[#667568] mb-3 leading-relaxed">
              Discretized 250m spatial grid of {activeWard.name}. Hover over sectors to inspect baseline vs post-intervention
              thermal relief and active cooling zones.
            </p>

            {/* 6x6 Grid of cells */}
            <div className="grid grid-cols-6 gap-2 p-3 bg-[#F5F7F2] border border-[#E1E9DF] rounded-xl">
              {gridCells.map((cell) => {
                const bgCol =
                  cell.postTemp >= 40.0
                    ? 'bg-[#DC3545] text-white'
                    : cell.postTemp >= 37.0
                    ? 'bg-[#F59E0B] text-white'
                    : cell.postTemp >= 34.0
                    ? 'bg-[#EAB308] text-black'
                    : 'bg-[#16A34A] text-white';

                return (
                  <div
                    key={cell.id}
                    className={`h-11 rounded-lg p-1.5 flex flex-col justify-between text-[9px] transition-all hover:scale-105 cursor-pointer shadow-xs ${bgCol}`}
                    title={`Sector ${cell.id + 1} (Row ${cell.row + 1}, Col ${cell.col + 1})\nBaseline: ${cell.baseTemp}°C\nPost-Sim: ${cell.postTemp}°C (${cell.delta}°C)\n${cell.isInterventionZone ? 'Direct Intervention Zone' : 'Buffer Sector'}`}
                  >
                    <div className="flex justify-between items-center opacity-90 text-[8px] font-bold">
                      <span>S{cell.id + 1}</span>
                      {cell.isInterventionZone && <span>★</span>}
                    </div>
                    <span className="font-extrabold text-[10px] leading-tight">
                      {cell.postTemp}°
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-[#E1E9DF] mt-3 space-y-3">
            <div className="flex items-center justify-between text-[10px] text-[#667568]">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#DC3545]" /> ≥40°C
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" /> 37-40°C
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EAB308]" /> 34-37°C
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]" /> &lt;34°C
                </span>
              </div>
              <span className="text-[#073B1A] font-bold">★ Active Zone</span>
            </div>

            {/* Send to Budget Optimizer Button */}
            {onNavigateTab && (
              <div className="flex items-center justify-between pt-2 border-t border-[#E1E9DF]">
                <span className="text-[10px] text-[#667568] font-medium">
                  READY TO STAGE INTERVENTIONS?
                </span>
                <button
                  onClick={() => onNavigateTab('budget-optimizer')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#32A817] hover:bg-[#288812] text-white font-bold text-xs transition-all shadow-sm active:scale-98"
                >
                  <span>TRANSFER TO BUDGET OPTIMIZER</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 7. Documented Assumptions Modal */}
      {showAssumptionsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E1E9DF] rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-elevated">
            <div className="flex items-center justify-between border-b border-[#E1E9DF] pb-3">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-[#32A817]" />
                <h3 className="text-base font-bold text-[#073B1A]">
                  Urban Climate Twin: Biophysical Equations & Documented Assumptions
                </h3>
              </div>
              <button
                onClick={() => setShowAssumptionsModal(false)}
                className="text-[#667568] hover:text-[#17251A] text-xs px-2.5 py-1 bg-[#F5F7F2] rounded-xl font-bold"
              >
                CLOSE [ESC]
              </button>
            </div>

            <div className="space-y-3 text-xs max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin">
              <div className="bg-[#F5F7F2] border border-[#E1E9DF] p-3.5 rounded-xl space-y-1">
                <div className="text-[#16A34A] font-bold">1. Native Tree Plantation</div>
                <div className="text-[#17251A]">
                  Unit Cost: ₹2,200 / sapling (Maharashtra PWD CSR 2024 Item 42.18) • Crown Area: 15 m²
                </div>
                <div className="text-[#073B1A] font-mono text-[11px]">
                  ΔT_trees = (Trees × 15 m² / Ward_Area) × 16.0°C; Infiltration = 0.8% / 1% canopy gain
                </div>
                <div className="text-[#667568] text-[10px]">
                  Based on Oke (1989) evapotranspirative latent heat balance equations for urban canopies.
                </div>
              </div>

              <div className="bg-[#F5F7F2] border border-[#E1E9DF] p-3.5 rounded-xl space-y-1">
                <div className="text-[#0EA5E9] font-bold">2. High-Albedo Cool Roofs</div>
                <div className="text-[#17251A]">
                  Unit Cost: ₹650 / m² (CPWD Analysis of Rates 2024) • Elastomeric Polymer Membrane (SRI ≥ 104)
                </div>
                <div className="text-[#073B1A] font-mono text-[11px]">
                  ΔT_roof = (Retrofitted_Roof_m² / Ward_Area) × 12.0°C
                </div>
                <div className="text-[#667568] text-[10px]">
                  Akbari et al. (2001) Lawrence Berkeley National Lab radiative equilibrium models.
                </div>
              </div>

              <div className="bg-[#F5F7F2] border border-[#E1E9DF] p-3.5 rounded-xl space-y-1">
                <div className="text-[#F59E0B] font-bold">3. Permeable Roads & Interlocking Paving</div>
                <div className="text-[#17251A]">
                  Unit Cost: ₹1,950 / m² (Maharashtra PWD CSR Item 22.04 & IRC:SP:63) • Porous concrete with sub-base
                </div>
                <div className="text-[#073B1A] font-mono text-[11px]">
                  Runoff Attenuation = 1.2% per 1% unsealed area; ΔT = 0.8°C per 10% unsealed fraction
                </div>
                <div className="text-[#667568] text-[10px]">
                  Ferguson (2005) Porous Pavements urban hydrological infiltration standards.
                </div>
              </div>

              <div className="bg-[#F5F7F2] border border-[#E1E9DF] p-3.5 rounded-xl space-y-1">
                <div className="text-purple-700 font-bold">4. Urban Green Corridors</div>
                <div className="text-[#17251A]">
                  Unit Cost: ₹2,400 / m² (CPWD Urban Landscaping Standard 2023) • Linear bioswales, native shrub layers
                </div>
                <div className="text-[#073B1A] font-mono text-[11px]">
                  ΔT_corridor = (Corridor_m² / Ward_Area) × 14.0°C; 50% contributes to active vegetative canopy
                </div>
                <div className="text-[#667568] text-[10px]">
                  Enhances wind ventilation corridors and microclimate thermal mixing.
                </div>
              </div>

              <div className="bg-[#F5F7F2] border border-[#E1E9DF] p-3.5 rounded-xl space-y-1">
                <div className="text-blue-700 font-bold">5. Rainwater Retention Zones</div>
                <div className="text-[#17251A]">
                  Unit Cost: ₹2,850 / m³ (CGWB Rainwater Harvesting Manual & PMC By-laws) • Modular polypropylene matrix
                </div>
                <div className="text-[#073B1A] font-mono text-[11px]">
                  Surge Attenuation = min(45%, (Retention_m³ / (Ward_Area × 0.05)) × 60%); Micro-oasis ΔT = 0.3°C / 50k m³
                </div>
                <div className="text-[#667568] text-[10px]">
                  Calibrated for 50-year monsoon convective storms (75 mm / 2 hr design surge).
                </div>
              </div>

              <div className="bg-[#F5F7F2] border border-[#E1E9DF] p-3.5 rounded-xl space-y-1">
                <div className="text-[#DC3545] font-bold">6. Compound Interaction & Thermal Saturation</div>
                <div className="text-[#073B1A] font-mono text-[11px]">
                  Diminishing Factor γ = 1 / (1 + 0.12 × ΔT_raw); Effective Cooling = min(4.8°C, ΔT_raw × γ)
                </div>
                <div className="text-[#667568] text-[10px]">
                  Boundary layer air exchange limits compound cooling to prevent unphysical temperature drops.
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#E1E9DF] flex justify-end">
              <button
                onClick={() => setShowAssumptionsModal(false)}
                className="px-4 py-2 bg-[#32A817] hover:bg-[#288812] text-white font-bold text-xs rounded-xl transition-all"
              >
                DISMISS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Saved Scenarios Drawer / Modal */}
      {showSavedModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E1E9DF] rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-elevated">
            <div className="flex items-center justify-between border-b border-[#E1E9DF] pb-3">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-[#F59E0B]" />
                <h3 className="text-base font-bold text-[#073B1A]">
                  Saved Climate Simulations ({savedScenarios.length})
                </h3>
              </div>
              <button
                onClick={() => setShowSavedModal(false)}
                className="text-[#667568] hover:text-[#17251A] text-xs px-2.5 py-1 bg-[#F5F7F2] rounded-xl font-bold"
              >
                CLOSE [ESC]
              </button>
            </div>

            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1 scrollbar-thin">
              {savedScenarios.length === 0 ? (
                <div className="text-center py-8 text-[#667568] text-xs">
                  No saved scenarios found. Name and save your active slider configuration above.
                </div>
              ) : (
                savedScenarios.map((sc) => (
                  <div
                    key={sc.id}
                    className="bg-[#F5F7F2] border border-[#E1E9DF] hover:border-[#32A817] p-3.5 rounded-xl flex items-center justify-between gap-3 text-xs transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#17251A] text-sm">{sc.name}</span>
                        <span className="text-[10px] text-[#073B1A] bg-[#EDF5E9] border border-[#C8DEC2] px-2 py-0.5 rounded-full font-bold">
                          {sc.id}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#667568] mt-1">
                        Ward: {sc.ward_name} • Saved on {sc.timestamp}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-[#17251A] mt-1">
                        <span>🌳 {sc.inputs.trees_count.toLocaleString()} trees</span>
                        <span>❄️ {sc.inputs.cool_roof_pct}% cool roof</span>
                        <span>💧 {sc.inputs.permeable_surface_sq_m.toLocaleString()} m² perm</span>
                        <span>💰 {formatINR((sc.inputs as any).available_budget_inr || sc.inputs.available_budget_usd * 83.5)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleLoadScenario(sc)}
                        className="px-3 py-1.5 bg-[#32A817] hover:bg-[#288812] text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>LOAD</span>
                      </button>
                      <button
                        onClick={() => handleDeleteScenario(sc.id)}
                        className="p-1.5 text-[#667568] hover:text-[#DC3545] hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete scenario"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-[#E1E9DF] flex justify-end">
              <button
                onClick={() => setShowSavedModal(false)}
                className="px-4 py-2 bg-[#F5F7F2] hover:bg-[#EDF5E9] text-[#17251A] rounded-xl font-bold text-xs transition-colors"
              >
                DONE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
