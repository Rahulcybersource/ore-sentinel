import React, { useState } from 'react';
import { 
  Sliders, 
  RotateCcw, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Wrench, 
  Zap, 
  Layers, 
  CloudRain,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Info,
  Check
} from 'lucide-react';
import { ScenarioParameters, ScenarioSimulationResult } from '../../types';
import { DEFAULT_SCENARIO_PARAMS, runScenarioSimulation } from '../../data/scenarioData';

interface ScenarioWorkspaceProps {
  onNavigateToActions: () => void;
}

// Initial active scenario: +2.7 kt recovery demonstrating balanced intervention
const INITIAL_WHAT_IF_PARAMS: ScenarioParameters = {
  equipmentAvailabilityPct: 85,
  blastingDelayHours: 6,
  mineAAllocationPct: 45,
  targetProductionKt: 52.0,
  weatherCondition: 'Moderate Rain',
  selectedMineId: 'all',
};

export const ScenarioWorkspace: React.FC<ScenarioWorkspaceProps> = ({ onNavigateToActions }) => {
  const [params, setParams] = useState<ScenarioParameters>(INITIAL_WHAT_IF_PARAMS);
  const [simulationResult, setSimulationResult] = useState<ScenarioSimulationResult>(
    runScenarioSimulation(INITIAL_WHAT_IF_PARAMS)
  );
  const [showTechnicalBasis, setShowTechnicalBasis] = useState(false);
  const [activePreset, setActivePreset] = useState<string>('balanced');

  const handleParamChange = (updated: ScenarioParameters, presetKey: string = 'custom') => {
    setParams(updated);
    setActivePreset(presetKey);
    const result = runScenarioSimulation(updated);
    setSimulationResult(result);
  };

  // Reset to Current Plan (Baseline)
  const handleResetToBaseline = () => {
    setParams(DEFAULT_SCENARIO_PARAMS);
    setActivePreset('baseline');
    const result = runScenarioSimulation(DEFAULT_SCENARIO_PARAMS);
    setSimulationResult(result);
  };

  // Presets
  const applyPreset = (presetType: 'equipment' | 'blasting' | 'balanced') => {
    let presetParams: ScenarioParameters;
    if (presetType === 'equipment') {
      presetParams = {
        ...DEFAULT_SCENARIO_PARAMS,
        equipmentAvailabilityPct: 88,
      };
    } else if (presetType === 'blasting') {
      presetParams = {
        ...DEFAULT_SCENARIO_PARAMS,
        blastingDelayHours: 6,
      };
    } else {
      // Balanced mitigation (+2.7 kt)
      presetParams = {
        equipmentAvailabilityPct: 85,
        blastingDelayHours: 6,
        mineAAllocationPct: 45,
        targetProductionKt: 52.0,
        weatherCondition: 'Moderate Rain',
        selectedMineId: 'all',
      };
    }
    handleParamChange(presetParams, presetType);
  };

  // Calculate changes from baseline
  const equipDiff = params.equipmentAvailabilityPct - DEFAULT_SCENARIO_PARAMS.equipmentAvailabilityPct;
  const blastDiff = DEFAULT_SCENARIO_PARAMS.blastingDelayHours - params.blastingDelayHours; // positive = reduced delay
  const allocDiff = params.mineAAllocationPct - DEFAULT_SCENARIO_PARAMS.mineAAllocationPct;
  const weatherChanged = params.weatherCondition !== DEFAULT_SCENARIO_PARAMS.weatherCondition;

  const hasModifications = equipDiff !== 0 || blastDiff !== 0 || allocDiff !== 0 || weatherChanged;

  // Human explanation of why result changed
  const getChangeExplanation = () => {
    if (!hasModifications) {
      return "Controls are currently set to the Current Plan baseline. Without operational interventions, the operation projects a 3.8 kt shortfall against the 52.0 kt monthly target.";
    }

    const reasons: string[] = [];
    if (equipDiff > 0) {
      reasons.push(`increasing equipment availability from ${DEFAULT_SCENARIO_PARAMS.equipmentAvailabilityPct}% to ${params.equipmentAvailabilityPct}% (+${(equipDiff * 115).toLocaleString()} t)`);
    } else if (equipDiff < 0) {
      reasons.push(`lower equipment availability (${params.equipmentAvailabilityPct}%) reduces loader and haul truck capacity`);
    }

    if (blastDiff > 0) {
      reasons.push(`reducing blasting clearance delay by ${blastDiff}h (+${(blastDiff * 150).toLocaleString()} t)`);
    } else if (blastDiff < 0) {
      reasons.push(`extended blast delay (+${Math.abs(blastDiff)}h) halts pit excavation`);
    }

    if (allocDiff > 0) {
      reasons.push(`drawing ${allocDiff}% more high-grade feed from Balaghat Mine A (+${(allocDiff * 65).toLocaleString()} t)`);
    }

    if (weatherChanged) {
      if (params.weatherCondition === 'Favorable (Dry)') {
        reasons.push('dry weather eliminates pit sump drainage delays (+500 t)');
      } else if (params.weatherCondition === 'Heavy Monsoon') {
        reasons.push('heavy monsoon rainfall impedes haul ramp traction (-1,100 t)');
      }
    }

    return `The forecast improved primarily because ${reasons.join(', and ')}. This directly addresses the main operational bottlenecks identified in the waterfall analysis.`;
  };

  // Human recommendation
  const getRecommendation = () => {
    if (!hasModifications) {
      return {
        action: "Select an operational intervention or adjust equipment availability to begin testing recovery options.",
        expectedEffect: "Currently at baseline with an expected shortfall of 3.8 kt.",
      };
    }

    if (activePreset === 'equipment' || (equipDiff >= 10 && blastDiff <= 0)) {
      return {
        action: "Prioritize recovery of critical equipment availability: mobilize hot-standby maintenance crews at Pit 3 and adjust shift inspection buffer.",
        expectedEffect: `+${(simulationResult.simulatedForecastKt - simulationResult.baselineForecastKt).toFixed(1)} kt recovery under this scenario.`,
      };
    }

    if (activePreset === 'blasting' || (blastDiff >= 4 && equipDiff <= 0)) {
      return {
        action: "Synchronize blasting clearance protocols with shift changeovers to eliminate idle excavator waiting time.",
        expectedEffect: `+${(simulationResult.simulatedForecastKt - simulationResult.baselineForecastKt).toFixed(1)} kt recovery under this scenario.`,
      };
    }

    return {
      action: "Execute prioritized maintenance dispatch on critical haul fleet and optimize blast clearance sequencing.",
      expectedEffect: `+${(simulationResult.simulatedForecastKt - simulationResult.baselineForecastKt).toFixed(1)} kt recovery under this scenario (closes ${Math.min(100, Math.round(((simulationResult.baselineShortfallKt - simulationResult.simulatedShortfallKt) / simulationResult.baselineShortfallKt) * 100))}% of current shortfall).`,
    };
  };

  const recommendation = getRecommendation();
  const netRecoveredKt = Number((simulationResult.simulatedForecastKt - simulationResult.baselineForecastKt).toFixed(1));
  const gapClosedPct = simulationResult.baselineShortfallKt > 0 
    ? Math.min(100, Math.max(0, Math.round(((simulationResult.baselineShortfallKt - simulationResult.simulatedShortfallKt) / simulationResult.baselineShortfallKt) * 100)))
    : 100;

  return (
    <div className="space-y-4 select-none pb-8 max-w-7xl mx-auto">
      {/* ========================================================================= */}
      {/* 1. TOP COMMAND BAR & EXECUTIVE CONTEXT (FIRST VIEWPORT) */}
      {/* ========================================================================= */}
      <div className="bg-white px-4 sm:px-5 py-3.5 rounded-2xl border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
            <Sliders className="w-4 h-4 text-amber-700" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs sm:text-sm font-bold text-stone-900 tracking-tight">
                SCENARIO PLANNER
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200">
                WHAT-IF DECISION TOOL
              </span>
            </div>
            <div className="text-[11px] text-stone-500 font-sans">
              Evaluate how operational interventions recover the monthly production gap
            </div>
          </div>
        </div>

        {/* Action Link & Reset */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleResetToBaseline}
            className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl border border-stone-300 flex items-center space-x-1.5 transition-colors cursor-pointer"
            title="Reset all inputs back to Current Plan baseline"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-600" />
            <span>Reset to Current Plan</span>
          </button>

          <button
            onClick={onNavigateToActions}
            className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <span>Review Action Directives</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. EXECUTIVE METRIC STRIP (FIRST VIEW) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Current Production */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
            Current Production (Run-Rate)
          </span>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-stone-900">
              {simulationResult.baselineForecastKt.toFixed(1)}
            </span>
            <span className="text-xs font-semibold text-stone-500">kt</span>
          </div>
          <span className="text-[11px] text-stone-500 block mt-1">
            Month-end projected forecast
          </span>
        </div>

        {/* Monthly Target */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
            Monthly Target
          </span>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-stone-900">
              {DEFAULT_SCENARIO_PARAMS.targetProductionKt.toFixed(1)}
            </span>
            <span className="text-xs font-semibold text-stone-500">kt</span>
          </div>
          <span className="text-[11px] text-stone-500 block mt-1">
            Mandated production ceiling
          </span>
        </div>

        {/* Current Shortfall */}
        <div className="bg-white p-4 rounded-2xl border border-red-200 shadow-xs bg-red-50/20">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider">
              Current Shortfall
            </span>
            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold text-[10px]">
              AT RISK
            </span>
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-red-600">
              −{simulationResult.baselineShortfallKt.toFixed(1)}
            </span>
            <span className="text-xs font-semibold text-red-700">kt (-7.3%)</span>
          </div>
          <span className="text-[11px] text-red-600/90 block mt-1">
            Intervention required to recover target
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SCENARIO PRESETS BAR */}
      {/* ========================================================================= */}
      <div className="bg-[#faf9f6] p-3 rounded-2xl border border-stone-200 flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          <span className="font-semibold text-stone-800">Quick What-If Presets:</span>
          <span className="text-stone-500 text-[11px] hidden md:inline">
            Load targeted operational scenarios in one click:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => applyPreset('equipment')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
              activePreset === 'equipment'
                ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
            }`}
          >
            Recover Equipment (72% → 88%)
          </button>

          <button
            onClick={() => applyPreset('blasting')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
              activePreset === 'blasting'
                ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
            }`}
          >
            Blasting Recovery (12h → 6h)
          </button>

          <button
            onClick={() => applyPreset('balanced')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
              activePreset === 'balanced'
                ? 'bg-amber-700 text-white border-amber-800 shadow-xs'
                : 'bg-white text-amber-900 border-amber-300 hover:bg-amber-50'
            }`}
          >
            Balanced Mitigation (+2.7 kt)
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. MAIN WORKSPACE: CONTROLS (LEFT) & RESULTS CENTERPIECE (RIGHT) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* ----------------------------------------------------------------------- */}
        {/* LEFT COLUMN: SCENARIO CONTROLS (5 Cols) */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-5 space-y-3.5">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div>
                <span className="text-xs font-bold text-stone-900 uppercase tracking-wide block">
                  Scenario Controls
                </span>
                <span className="text-[11px] text-stone-500">
                  Adjust inputs to test operational sensitivity
                </span>
              </div>

              <button
                onClick={handleResetToBaseline}
                className="text-[11px] text-stone-500 hover:text-stone-900 flex items-center space-x-1 cursor-pointer transition-colors"
                title="Reset to baseline"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* CONTROL 1: Equipment Availability */}
            <div className="bg-[#fcfbf9] p-3.5 rounded-xl border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-1.5 text-xs font-semibold text-stone-900">
                  <Wrench className="w-3.5 h-3.5 text-stone-600" />
                  <span>Equipment Availability</span>
                </span>
                <div className="font-mono text-xs">
                  <span className="text-stone-400 mr-2 text-[11px]">Current: 72%</span>
                  <span className={`font-bold px-2 py-0.5 rounded-md ${
                    equipDiff > 0 ? 'bg-emerald-100 text-emerald-800' : equipDiff < 0 ? 'bg-red-100 text-red-800' : 'bg-stone-200 text-stone-800'
                  }`}>
                    What-if: {params.equipmentAvailabilityPct}%
                  </span>
                </div>
              </div>

              <input
                type="range"
                min={60}
                max={95}
                step={1}
                value={params.equipmentAvailabilityPct}
                onChange={(e) => {
                  handleParamChange({
                    ...params,
                    equipmentAvailabilityPct: Number(e.target.value),
                  });
                }}
                className="w-full accent-stone-900 cursor-pointer h-2 bg-stone-200 rounded-full"
              />

              <div className="flex justify-between text-[10px] font-mono text-stone-500">
                <span>60% (Critical)</span>
                <span className="font-bold text-stone-700">72% (Baseline)</span>
                <span>90%</span>
                <span>95% (Max)</span>
              </div>

              <p className="text-[11px] text-stone-500 leading-snug">
                Operational uptime of excavators and dump trucks across pits.
              </p>
            </div>

            {/* CONTROL 2: Blasting Delay */}
            <div className="bg-[#fcfbf9] p-3.5 rounded-xl border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-1.5 text-xs font-semibold text-stone-900">
                  <Zap className="w-3.5 h-3.5 text-amber-700" />
                  <span>Blasting Delay Window</span>
                </span>
                <div className="font-mono text-xs">
                  <span className="text-stone-400 mr-2 text-[11px]">Current: 12h</span>
                  <span className={`font-bold px-2 py-0.5 rounded-md ${
                    blastDiff > 0 ? 'bg-emerald-100 text-emerald-800' : blastDiff < 0 ? 'bg-red-100 text-red-800' : 'bg-stone-200 text-stone-800'
                  }`}>
                    What-if: {params.blastingDelayHours}h
                  </span>
                </div>
              </div>

              <input
                type="range"
                min={2}
                max={24}
                step={1}
                value={params.blastingDelayHours}
                onChange={(e) => {
                  handleParamChange({
                    ...params,
                    blastingDelayHours: Number(e.target.value),
                  });
                }}
                className="w-full accent-stone-900 cursor-pointer h-2 bg-stone-200 rounded-full"
              />

              <div className="flex justify-between text-[10px] font-mono text-stone-500">
                <span>2h (Optimized)</span>
                <span>6h (Standby)</span>
                <span className="font-bold text-stone-700">12h (Baseline)</span>
                <span>24h (Max Stoppage)</span>
              </div>

              <p className="text-[11px] text-stone-500 leading-snug">
                Safety clearance and re-entry wait time after bench detonation.
              </p>
            </div>

            {/* CONTROL 3: High-Grade Ore Allocation */}
            <div className="bg-[#fcfbf9] p-3.5 rounded-xl border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-1.5 text-xs font-semibold text-stone-900">
                  <Layers className="w-3.5 h-3.5 text-amber-700" />
                  <span>Mine A High-Grade Feed</span>
                </span>
                <div className="font-mono text-xs">
                  <span className="text-stone-400 mr-2 text-[11px]">Current: 40%</span>
                  <span className={`font-bold px-2 py-0.5 rounded-md ${
                    allocDiff > 0 ? 'bg-emerald-100 text-emerald-800' : allocDiff < 0 ? 'bg-red-100 text-red-800' : 'bg-stone-200 text-stone-800'
                  }`}>
                    What-if: {params.mineAAllocationPct}%
                  </span>
                </div>
              </div>

              <input
                type="range"
                min={25}
                max={60}
                step={5}
                value={params.mineAAllocationPct}
                onChange={(e) => {
                  handleParamChange({
                    ...params,
                    mineAAllocationPct: Number(e.target.value),
                  });
                }}
                className="w-full accent-stone-900 cursor-pointer h-2 bg-stone-200 rounded-full"
              />

              <div className="flex justify-between text-[10px] font-mono text-stone-500">
                <span>25%</span>
                <span className="font-bold text-stone-700">40% (Baseline)</span>
                <span>50% (High Blend)</span>
                <span>60% (Shaft Limit)</span>
              </div>

              <p className="text-[11px] text-stone-500 leading-snug">
                Proportion of mill feed drawn from high-grade Balaghat underground stopes.
              </p>
            </div>

            {/* CONTROL 4: Weather & Pit Drainage */}
            <div className="bg-[#fcfbf9] p-3.5 rounded-xl border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-1.5 text-xs font-semibold text-stone-900">
                  <CloudRain className="w-3.5 h-3.5 text-sky-700" />
                  <span>Weather &amp; Pit Drainage</span>
                </span>
                <span className="font-mono text-[11px] text-stone-500 font-semibold">
                  {params.weatherCondition}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(['Favorable (Dry)', 'Moderate Rain', 'Heavy Monsoon'] as const).map((w) => (
                  <button
                    key={w}
                    onClick={() => {
                      handleParamChange({
                        ...params,
                        weatherCondition: w,
                      });
                    }}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-medium transition-colors cursor-pointer border ${
                      params.weatherCondition === w
                        ? 'bg-stone-900 border-stone-900 text-white font-semibold shadow-2xs'
                        : 'bg-white border-stone-300 text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                    }`}
                  >
                    {w === 'Favorable (Dry)' ? 'Dry (+500 t)' : w === 'Moderate Rain' ? 'Moderate (Base)' : 'Monsoon (-1.1k t)'}
                  </button>
                ))}
              </div>

              <p className="text-[11px] text-stone-500 leading-snug">
                Precipitation impact on pit sump water levels and haul road traction.
              </p>
            </div>

            {/* COMPACT SUMMARY OF CHANGES */}
            {hasModifications ? (
              <div className="pt-2 border-t border-stone-100">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1.5">
                  Scenario Changes Applied:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {equipDiff !== 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200 text-stone-800 text-[11px] font-mono font-medium">
                      Equipment: {equipDiff > 0 ? `+${equipDiff}%` : `${equipDiff}%`}
                    </span>
                  )}
                  {blastDiff !== 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200 text-stone-800 text-[11px] font-mono font-medium">
                      Blast Delay: {blastDiff > 0 ? `-${blastDiff}h` : `+${Math.abs(blastDiff)}h`}
                    </span>
                  )}
                  {allocDiff !== 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200 text-stone-800 text-[11px] font-mono font-medium">
                      Mine A Feed: {allocDiff > 0 ? `+${allocDiff}%` : `${allocDiff}%`}
                    </span>
                  )}
                  {weatherChanged && (
                    <span className="px-2 py-0.5 rounded-md bg-sky-50 border border-sky-200 text-sky-800 text-[11px] font-mono font-medium">
                      Weather: {params.weatherCondition}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="pt-2 border-t border-stone-100 text-center py-1 text-[11px] text-stone-500">
                Currently matching Current Plan baseline
              </div>
            )}
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* RIGHT COLUMN: OUTCOME CENTERPIECE & ACTIONS (7 Cols) */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* ===================================================================== */}
          {/* VISUAL CENTERPIECE: BASELINE VS WHAT-IF COMPARISON */}
          {/* ===================================================================== */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
                <span className="text-xs font-bold text-stone-900 uppercase tracking-wide">
                  Scenario Outcome Comparison
                </span>
              </div>
              <span className="text-xs font-mono font-semibold text-stone-600">
                Target: {DEFAULT_SCENARIO_PARAMS.targetProductionKt.toFixed(1)} kt
              </span>
            </div>

            {/* Side-by-Side Comparison Box */}
            <div className="grid grid-cols-2 gap-3.5">
              
              {/* Left: CURRENT PLAN */}
              <div className="bg-[#faf9f6] p-4 rounded-xl border border-stone-200 space-y-2">
                <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                  Current Plan
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block font-medium">Forecast:</span>
                  <span className="text-2xl font-bold font-mono text-stone-900">
                    {simulationResult.baselineForecastKt.toFixed(1)} kt
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block font-medium">Target gap:</span>
                  <span className="text-lg font-bold font-mono text-red-600">
                    −{simulationResult.baselineShortfallKt.toFixed(1)} kt
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block font-medium">Risk status:</span>
                  <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-800 text-[10px] font-bold inline-block border border-red-200">
                    AT RISK (High)
                  </span>
                </div>
              </div>

              {/* Right: WHAT-IF SCENARIO */}
              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-300 space-y-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[9px] font-mono px-2 py-0.5 rounded-bl-lg font-bold">
                  WHAT-IF
                </div>
                <div className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider">
                  What-If Scenario
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block font-medium">Forecast:</span>
                  <span className="text-2xl font-bold font-mono text-emerald-800">
                    {simulationResult.simulatedForecastKt.toFixed(1)} kt
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block font-medium">Target gap:</span>
                  <span className={`text-lg font-bold font-mono ${
                    simulationResult.simulatedShortfallKt <= 0 ? 'text-emerald-700' : 'text-stone-800'
                  }`}>
                    {simulationResult.simulatedShortfallKt <= 0
                      ? '0.0 kt (Met)'
                      : `−${simulationResult.simulatedShortfallKt.toFixed(1)} kt`}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block font-medium">Risk status:</span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold inline-block border ${
                    simulationResult.simulatedRisk === 'LOW'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : simulationResult.simulatedRisk === 'MEDIUM'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-red-100 text-red-800 border-red-300'
                  }`}>
                    {simulationResult.simulatedRisk === 'LOW' ? 'LOW RISK' : simulationResult.simulatedRisk === 'MEDIUM' ? 'MEDIUM RISK' : 'AT RISK'}
                  </span>
                </div>
              </div>
            </div>

            {/* Improvement Banner (Visual Highlight) */}
            <div className="bg-[#faf9f6] p-4 rounded-xl border border-stone-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wide block">
                  Improvement (Recovered Production)
                </span>
                <div className="flex items-baseline space-x-2 mt-0.5">
                  <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-700">
                    {netRecoveredKt >= 0 ? `+${netRecoveredKt.toFixed(1)} kt` : `${netRecoveredKt.toFixed(1)} kt`}
                  </span>
                  <span className="text-xs font-semibold text-emerald-800">
                    ({(netRecoveredKt * 1000).toLocaleString()} Tonnes)
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wide block">
                  Shortfall Closed
                </span>
                <span className="text-xl sm:text-2xl font-bold font-mono text-stone-900">
                  {gapClosedPct}%
                </span>
              </div>
            </div>

            {/* Compact Production Comparison Visualizer */}
            <div className="space-y-2 pt-1">
              <div className="flex justify-between text-[11px] font-mono text-stone-500">
                <span>0 kt</span>
                <span className="font-bold text-stone-800">Target Line: 52.0 kt</span>
                <span>55.0 kt Max</span>
              </div>

              {/* Progress Bars */}
              <div className="space-y-2">
                {/* Current Plan Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-stone-700">
                    <span>Current Plan</span>
                    <span className="font-mono text-red-600">48.2 kt</span>
                  </div>
                  <div className="h-3.5 w-full bg-stone-100 rounded-full overflow-hidden relative border border-stone-200">
                    {/* 52kt reference line */}
                    <div 
                      className="absolute top-0 bottom-0 w-0.5 bg-stone-400 z-10" 
                      style={{ left: `${(52.0 / 55.0) * 100}%` }}
                    />
                    <div 
                      className="h-full bg-stone-800 rounded-full transition-all duration-300" 
                      style={{ width: `${(48.2 / 55.0) * 100}%` }}
                    />
                  </div>
                </div>

                {/* What-If Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-stone-900">
                    <span className="text-emerald-800 font-bold">What-If Scenario</span>
                    <span className="font-mono text-emerald-800 font-bold">
                      {simulationResult.simulatedForecastKt.toFixed(1)} kt
                    </span>
                  </div>
                  <div className="h-3.5 w-full bg-stone-100 rounded-full overflow-hidden relative border border-stone-200">
                    {/* 52kt reference line */}
                    <div 
                      className="absolute top-0 bottom-0 w-0.5 bg-stone-400 z-10" 
                      style={{ left: `${(52.0 / 55.0) * 100}%` }}
                    />
                    <div 
                      className="h-full bg-emerald-600 rounded-full transition-all duration-300" 
                      style={{ width: `${(Math.min(55, simulationResult.simulatedForecastKt) / 55.0) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* WHY DID THE RESULT CHANGE? & BEST ACTION */}
          {/* ===================================================================== */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
            
            {/* Why did the result change? */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-stone-900 uppercase tracking-wide flex items-center space-x-1.5">
                <Info className="w-4 h-4 text-amber-700" />
                <span>Why Did The Result Change?</span>
              </span>
              <p className="text-xs text-stone-700 leading-relaxed bg-[#fcfbf9] p-3 rounded-xl border border-stone-200">
                {getChangeExplanation()}
              </p>
            </div>

            {/* Recommended Action & Expected Effect */}
            <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 space-y-2.5">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0" />
                <span className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                  Recommended Action
                </span>
              </div>
              <p className="text-xs text-stone-800 leading-relaxed font-medium">
                {recommendation.action}
              </p>

              <div className="pt-2 border-t border-amber-200/80 flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs">
                  <span className="text-stone-500 font-medium">Expected Effect: </span>
                  <span className="font-bold text-amber-900">{recommendation.expectedEffect}</span>
                </div>

                <button
                  onClick={onNavigateToActions}
                  className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <span>Review Action Directives</span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
                </button>
              </div>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* OPTIONAL EXPANDABLE: VIEW TECHNICAL BASIS */}
          {/* ===================================================================== */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <button
              onClick={() => setShowTechnicalBasis(!showTechnicalBasis)}
              className="w-full px-5 py-3.5 flex items-center justify-between text-xs font-bold text-stone-800 hover:bg-stone-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-stone-500" />
                <span>VIEW TECHNICAL BASIS &amp; ATTRIBUTION MODEL</span>
              </div>
              <div className="flex items-center space-x-1 text-stone-500 text-[11px] font-normal">
                <span>{showTechnicalBasis ? 'Hide parameters' : 'Show calculation sensitivity'}</span>
                {showTechnicalBasis ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {showTechnicalBasis && (
              <div className="p-5 pt-0 border-t border-stone-100 space-y-4 text-xs text-stone-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">
                  <div className="p-3 bg-[#faf9f6] rounded-xl border border-stone-200 space-y-1">
                    <span className="font-semibold text-stone-900 block text-xs">Sensitivity Coefficients</span>
                    <ul className="space-y-1 text-[11px] text-stone-600">
                      <li>&bull; Equipment Availability: +115 tonnes per +1%</li>
                      <li>&bull; Blasting Window: +150 tonnes per hour reclaimed</li>
                      <li>&bull; Mine A High-Grade Feed: +65 tonnes per +1% blend</li>
                      <li>&bull; Weather Impact: +500 t (Dry) to -1,100 t (Monsoon)</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-[#faf9f6] rounded-xl border border-stone-200 space-y-1">
                    <span className="font-semibold text-stone-900 block text-xs">Constraint &amp; Model Bounds</span>
                    <ul className="space-y-1 text-[11px] text-stone-600">
                      <li>&bull; Max Throughput Ceiling: 54.5 kt (Crusher capacity)</li>
                      <li>&bull; Shaft Skip Hoist Limit: 60% high-grade allocation</li>
                      <li>&bull; Minimum Blast Clearance: 2.0 hours (DGMS compliance)</li>
                      <li>&bull; Model Validation: R² = 0.86 on 18-month telemetry</li>
                    </ul>
                  </div>
                </div>

                {/* Lever Contribution Breakdown Table */}
                <div className="space-y-2">
                  <span className="font-semibold text-stone-900 text-xs block">
                    Itemized Simulated Tonnage by Lever:
                  </span>
                  <div className="overflow-x-auto rounded-xl border border-stone-200">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-[#faf9f6] text-stone-600 font-semibold border-b border-stone-200">
                        <tr>
                          <th className="p-2.5">Intervention Lever</th>
                          <th className="p-2.5 text-right">Tonnage Impact</th>
                          <th className="p-2.5">Feasibility Assessment</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 bg-white">
                        {simulationResult.recoveryBreakdown.map((item) => (
                          <tr key={item.lever} className="hover:bg-[#faf9f6]">
                            <td className="p-2.5 font-medium text-stone-900">{item.lever}</td>
                            <td className="p-2.5 text-right font-mono font-bold">
                              <span className={item.tonnesRecovered >= 0 ? 'text-emerald-700' : 'text-red-600'}>
                                {item.tonnesRecovered >= 0 ? `+${item.tonnesRecovered}` : item.tonnesRecovered} t
                              </span>
                            </td>
                            <td className="p-2.5 text-stone-500 text-[11px]">{item.feasibility}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
