import { ScenarioParameters, ScenarioSimulationResult } from '../types';

export const DEFAULT_SCENARIO_PARAMS: ScenarioParameters = {
  equipmentAvailabilityPct: 72,
  blastingDelayHours: 12,
  mineAAllocationPct: 40,
  targetProductionKt: 52.0,
  weatherCondition: 'Moderate Rain',
  selectedMineId: 'all',
};

export function runScenarioSimulation(params: ScenarioParameters): ScenarioSimulationResult {
  const baselineForecast = 48.2;
  const baselineTarget = params.targetProductionKt;
  const baselineShortfall = Number((baselineTarget - baselineForecast).toFixed(1));

  // Sensitivity models derived from operational simulation
  // 1. Equipment availability delta (baseline = 72%)
  const equipDelta = params.equipmentAvailabilityPct - 72;
  const equipTonnesRecovered = equipDelta * 115; // 115 tonnes per +1% availability

  // 2. Blasting window delay reduction (baseline = 12 hours)
  const blastingReductionHours = 12 - params.blastingDelayHours;
  const blastingTonnesRecovered = blastingReductionHours * 150; // 150 tonnes per hour reclaimed

  // 3. Mine A (Balaghat deep high-grade) allocation optimization (baseline = 40%)
  const allocationDelta = params.mineAAllocationPct - 40;
  const allocationTonnesRecovered = allocationDelta * 65; // High-grade face optimization

  // 4. Weather factor
  let weatherFactorTonnes = 0;
  if (params.weatherCondition === 'Favorable (Dry)') {
    weatherFactorTonnes = 500;
  } else if (params.weatherCondition === 'Heavy Monsoon') {
    weatherFactorTonnes = -1100;
  }

  const totalDeltaTonnes = equipTonnesRecovered + blastingTonnesRecovered + allocationTonnesRecovered + weatherFactorTonnes;
  const totalDeltaKt = Number((totalDeltaTonnes / 1000).toFixed(2));

  // New simulated forecast (capped at realistic mine throughput capacity 54.5 kt)
  const simulatedForecastKt = Math.min(54.5, Number((baselineForecast + totalDeltaKt).toFixed(1)));
  const simulatedShortfallKt = Number(Math.max(0, baselineTarget - simulatedForecastKt).toFixed(1));

  let simulatedRisk: 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH';
  if (simulatedShortfallKt <= 1.5) {
    simulatedRisk = 'LOW';
  } else if (simulatedShortfallKt <= 3.0) {
    simulatedRisk = 'MEDIUM';
  }

  return {
    baselineForecastKt: baselineForecast,
    baselineShortfallKt: baselineShortfall,
    baselineRisk: 'HIGH',
    simulatedForecastKt,
    simulatedShortfallKt,
    simulatedRisk,
    netRecoveryKt: totalDeltaKt,
    recoveryBreakdown: [
      {
        lever: 'Equipment Availability Adjustment',
        tonnesRecovered: Math.round(equipTonnesRecovered),
        feasibility: equipDelta > 15 ? 'Moderate (requires hot standby loader)' : 'High (shift maintenance buffer)',
      },
      {
        lever: 'Blasting Window Synchronization',
        tonnesRecovered: Math.round(blastingTonnesRecovered),
        feasibility: blastingReductionHours > 8 ? 'Moderate (sequential shift clearance)' : 'High (standard protocol)',
      },
      {
        lever: 'Mine A High-Grade Feed Allocation',
        tonnesRecovered: Math.round(allocationTonnesRecovered),
        feasibility: 'High (underground shaft skip capacity permits)',
      },
      {
        lever: 'Weather / Dewatering Preparedness',
        tonnesRecovered: Math.round(weatherFactorTonnes),
        feasibility: 'High (sump drainage & ditch grading)',
      },
    ],
  };
}
