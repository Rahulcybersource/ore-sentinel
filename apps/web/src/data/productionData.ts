import { MineSite, ProductionCausalFactor } from '../types';

export interface DailyProductionPoint {
  day: number;
  dateStr: string;
  actualTonnes: number | null;
  targetCumulativeTonnes: number;
  actualCumulativeTonnes: number | null;
  forecastCumulativeTonnes: number;
  isForecast: boolean;
  notes?: string;
}

export interface WaterfallStep {
  id: string;
  label: string;
  category: 'Target' | 'Equipment' | 'Blasting' | 'Weather' | 'Logistics' | 'Forecast';
  type: 'start' | 'decrease' | 'increase' | 'end';
  startVal: number;
  change: number; // e.g. -1558
  endVal: number;
  pctOfTotalGap: number;
  details: string;
  mitigation: string;
  sector: string;
}

export interface FleetAllocationItem {
  id: string;
  label: string;
  category: string;
  units: number;
  pct: number;
  color: string;
  availabilityPct: number;
  activeSector: string;
  dailyCapacityTonnes: number;
  status: 'OPTIMAL' | 'ALERT' | 'STANDBY';
  description: string;
}

export interface ShiftPerformanceCell {
  id: string;
  day: number;
  dateStr: string;
  shift: 'Shift A (06:00–14:00)' | 'Shift B (14:00–22:00)' | 'Shift C (22:00–06:00)';
  shiftCode: 'A' | 'B' | 'C';
  actualTonnes: number;
  targetTonnes: number;
  varianceTonnes: number;
  performancePct: number;
  status: 'optimal' | 'normal' | 'degraded' | 'critical';
  primaryConstraint: string;
  activeUnits: number;
  benchLevel: string;
}

export const WATERFALL_SHORTFALL_STEPS: WaterfallStep[] = [
  {
    id: 'target',
    label: 'Planned Target',
    category: 'Target',
    type: 'start',
    startVal: 0,
    change: 52000,
    endVal: 52000,
    pctOfTotalGap: 0,
    details: 'Corporate monthly production benchmark across Balaghat Underground, Dongri Buzurg Opencast, and Kandri sectors.',
    mitigation: 'Baseline run-rate requirement: 1,733 tonnes/day (~578 t per 8h operational shift).',
    sector: 'All MOIL Operational Sectors',
  },
  {
    id: 'equipment',
    label: 'Equipment Breakdown',
    category: 'Equipment',
    type: 'decrease',
    startVal: 52000,
    change: -1558,
    endVal: 50442,
    pctOfTotalGap: 41.0,
    details: 'Unscheduled hydraulic pack failure on primary underground LHD Loader L-04 and 3 dumpers sidelined for cylinder overhauls.',
    mitigation: 'Dispatch 4 idle haul dumpers from Dongri surface bench and expedite hydraulic seal kit.',
    sector: 'Balaghat Deep (Shaft #2)',
  },
  {
    id: 'blasting',
    label: 'Blasting Clearance Delay',
    category: 'Blasting',
    type: 'decrease',
    startVal: 50442,
    change: -1026,
    endVal: 49416,
    pctOfTotalGap: 27.0,
    details: 'Toxic nitrogen dioxide fume clearance backlog in sublevels 4 & 5 and misaligned shift-change blast clearing windows (12.5h backlog).',
    mitigation: 'Reschedule primary detonation to 14:00 shift-change window and activate auxiliary booster fan.',
    sector: 'Balaghat Deep (Sublevels 4 & 5)',
  },
  {
    id: 'weather',
    label: 'Pit Rain & Sump Flooding',
    category: 'Weather',
    type: 'decrease',
    startVal: 49416,
    change: -722,
    endVal: 48694,
    pctOfTotalGap: 19.0,
    details: '142mm unseasonal precipitation caused haul ramp softening, speed caps (15 km/h), and incline sump pumping delays.',
    mitigation: 'Deploy heavy grader fleet with dry crushed stone ballast on haul incline ramps.',
    sector: 'Dongri Buzurg (Opencast Pit)',
  },
  {
    id: 'logistics',
    label: 'Secondary Crushing & Rail',
    category: 'Logistics',
    type: 'decrease',
    startVal: 48694,
    change: -494,
    endVal: 48200,
    pctOfTotalGap: 13.0,
    details: 'Secondary cone crusher mesh blinding from moist fines plus rail rake siding placement congestion.',
    mitigation: 'Pre-emptive screen replacement during 3h night lull and calibrate feeder vibration frequency.',
    sector: 'Kandri–Mansar Pithead Hopper',
  },
  {
    id: 'forecast',
    label: 'Projected Output',
    category: 'Forecast',
    type: 'end',
    startVal: 0,
    change: 48200,
    endVal: 48200,
    pctOfTotalGap: 100,
    details: 'Projected month-end production without operational recovery interventions: 48,200 t (-3,800 t deficit, -7.3%).',
    mitigation: 'Execute Top 3 Priority Recovery Interventions to reclaim +2,900 tonnes of the gap.',
    sector: 'Combined Total',
  },
];

export const FLEET_ALLOCATION_DATA: FleetAllocationItem[] = [
  {
    id: 'haul-dumpers',
    label: 'Production Haul Dumpers (35t–50t)',
    category: 'Haulage',
    units: 24,
    pct: 38.7,
    color: '#b45309', // Warm Ochre
    availabilityPct: 75.0,
    activeSector: 'Balaghat (14) & Dongri (10)',
    dailyCapacityTonnes: 920,
    status: 'ALERT',
    description: '18 active in haul cycles, 4 in scheduled transmission service, 2 waiting on operator rotation.',
  },
  {
    id: 'lhd-loaders',
    label: 'Underground LHD Loaders & Boggers',
    category: 'Underground Mucking',
    units: 12,
    pct: 19.4,
    color: '#1c1917', // Ore Graphite
    availabilityPct: 66.7,
    activeSector: 'Balaghat Deep Sublevels',
    dailyCapacityTonnes: 480,
    status: 'ALERT',
    description: '8 active in stopes, 1 LHD-04 hydraulic line overhaul, 3 awaiting shift crews.',
  },
  {
    id: 'pit-bulldozers',
    label: 'Pit Bulldozers & Heavy Graders',
    category: 'Infrastructure',
    units: 9,
    pct: 14.5,
    color: '#78716c', // Slate Graphite
    availabilityPct: 88.9,
    activeSector: 'Dongri Buzurg & Kandri',
    dailyCapacityTonnes: 0,
    status: 'OPTIMAL',
    description: 'Continuous haul road maintenance, waste dump reprofiling, and sump drainage trenching.',
  },
  {
    id: 'drill-rigs',
    label: 'Rotary Blast Hole Drill Rigs',
    category: 'Drilling',
    units: 8,
    pct: 12.9,
    color: '#d97706', // Mineral Amber
    availabilityPct: 87.5,
    activeSector: 'Balaghat & Dongri Benches',
    dailyCapacityTonnes: 340,
    status: 'OPTIMAL',
    description: '7 active drilling 115mm blast hole patterns across active extraction benches.',
  },
  {
    id: 'crushers-screening',
    label: 'Secondary Screening Plants & Feeders',
    category: 'Crushing / Sizing',
    units: 5,
    pct: 8.1,
    color: '#059669', // Deep Emerald
    availabilityPct: 80.0,
    activeSector: 'Pithead Sizing Hoppers',
    dailyCapacityTonnes: 620,
    status: 'OPTIMAL',
    description: '4 operational at nominal 420 t/h, 1 deck mesh overhaul scheduled during night shift.',
  },
  {
    id: 'standby-spares',
    label: 'Workshop Spares & Overhaul Reserve',
    category: 'Reserve Pool',
    units: 4,
    pct: 6.5,
    color: '#a8a29e', // Warm Mineral Gray
    availabilityPct: 25.0,
    activeSector: 'Central Heavy Workshop',
    dailyCapacityTonnes: 0,
    status: 'STANDBY',
    description: 'Rotational reserve units undergoing 500-hour planned mechanical refurbishment.',
  },
];

export function generateShiftPerformanceMatrix(): ShiftPerformanceCell[] {
  const shifts: ('A' | 'B' | 'C')[] = ['A', 'B', 'C'];
  const shiftLabels: Record<'A' | 'B' | 'C', ShiftPerformanceCell['shift']> = {
    A: 'Shift A (06:00–14:00)',
    B: 'Shift B (14:00–22:00)',
    C: 'Shift C (22:00–06:00)',
  };

  const matrix: ShiftPerformanceCell[] = [];
  const shiftTarget = 578; // ~1,733 t / 3 shifts

  for (let d = 1; d <= 21; d++) {
    const dateStr = `Sep ${d < 10 ? '0' + d : d}`;

    shifts.forEach((shiftCode) => {
      let actual = shiftTarget;
      let status: ShiftPerformanceCell['status'] = 'normal';
      let constraint = 'Standard cycle throughput maintained';
      let activeUnits = 22;
      let bench = 'Balaghat Sublevel 3 / Dongri B2';

      // Specific operational incident scenarios matching overall narrative
      if (d === 9 && shiftCode === 'B') {
        actual = 365;
        status = 'critical';
        constraint = 'LHD Loader L-04 hydraulic burst; extraction stope blocked 4.5h';
        activeUnits = 14;
        bench = 'Balaghat Deep Sublevel 4';
      } else if (d === 9 && shiftCode === 'C') {
        actual = 410;
        status = 'critical';
        constraint = 'LHD repair ongoing; stope haulage diverted to backup shaft';
        activeUnits = 16;
        bench = 'Balaghat Deep Sublevel 4';
      } else if (d === 10 && shiftCode === 'A') {
        actual = 430;
        status = 'degraded';
        constraint = 'LHD Loader returned to service at reduced 65% tramming speed';
        activeUnits = 17;
        bench = 'Balaghat Deep Sublevel 4';
      } else if (d === 14 && shiftCode === 'B') {
        actual = 445;
        status = 'degraded';
        constraint = 'Fume clearance delay post-blast in Sublevel 5 (standing time 3.2h)';
        activeUnits = 18;
        bench = 'Balaghat Deep Sublevel 5';
      } else if (d === 16 && shiftCode === 'A') {
        actual = 385;
        status = 'critical';
        constraint = '142mm heavy rain: incline ramp speed limit 15 km/h & sump surge';
        activeUnits = 15;
        bench = 'Dongri Buzurg Incline Ramp';
      } else if (d === 16 && shiftCode === 'B') {
        actual = 425;
        status = 'degraded';
        constraint = 'Grader fleet laying dry crushed stone; single-lane haulage';
        activeUnits = 18;
        bench = 'Dongri Buzurg Incline Ramp';
      } else if (d === 17 && shiftCode === 'A') {
        actual = 460;
        status = 'degraded';
        constraint = 'Secondary cone crusher screen blinding due to high fines moisture';
        activeUnits = 19;
        bench = 'Kandri Primary Hopper';
      } else if (d === 19 && shiftCode === 'A') {
        actual = 650;
        status = 'optimal';
        constraint = 'High-grade ore zone accessed; 112% cycle efficiency achieved';
        activeUnits = 24;
        bench = 'Dongri Buzurg Highwall Bench 3';
      } else if (d === 4 && shiftCode === 'A') {
        actual = 635;
        status = 'optimal';
        constraint = 'Unobstructed dual-circuit mucking; zero standing delays';
        activeUnits = 24;
        bench = 'Balaghat Deep Sublevel 2';
      } else if (d === 12 && shiftCode === 'C') {
        actual = 590;
        status = 'optimal';
        constraint = 'Smooth night hoisting cycle via main shaft skip';
        activeUnits = 23;
        bench = 'Balaghat Central Hoist';
      } else {
        // Normal baseline variations
        const variation = (Math.sin(d * 1.7 + (shiftCode === 'A' ? 0.2 : shiftCode === 'B' ? 1.1 : 2.3)) * 0.12);
        actual = Math.round(shiftTarget * (0.94 + variation));
        const pct = (actual / shiftTarget) * 100;
        if (pct >= 102) {
          status = 'optimal';
          constraint = 'Clean shift run with uninterrupted haul cycle';
        } else if (pct >= 90) {
          status = 'normal';
          constraint = 'Normal operating cadence within acceptable tolerance';
        } else if (pct >= 78) {
          status = 'degraded';
          constraint = 'Minor haul traffic queuing and chute cleanout delay';
        } else {
          status = 'critical';
          constraint = 'Sublevel ventilation pause and operator transition delay';
        }
      }

      const varianceTonnes = actual - shiftTarget;
      const performancePct = Math.round((actual / shiftTarget) * 100);

      matrix.push({
        id: `d${d}-s${shiftCode}`,
        day: d,
        dateStr,
        shift: shiftLabels[shiftCode],
        shiftCode,
        actualTonnes: actual,
        targetTonnes: shiftTarget,
        varianceTonnes,
        performancePct,
        status,
        primaryConstraint: constraint,
        activeUnits,
        benchLevel: bench,
      });
    });
  }

  return matrix;
}

export const CURRENT_PRODUCTION_SUMMARY = {
  monthName: 'September 2026',
  currentDay: 21,
  totalDays: 30,
  targetTonnes: 52000,
  forecastTonnes: 48200,
  actualTonnesToDate: 33950,
  projectedShortfallTonnes: 3800,
  shortfallRisk: 'HIGH' as const,
  overallAvailabilityPct: 72.4,
  blastingWindowDelayHours: 12.5,
  weatherIndex: 'Moderate Pre-Monsoon Rains',
};

export const MINE_SITES: MineSite[] = [
  {
    id: 'mine-a',
    name: 'Mine A (Balaghat Deep)',
    type: 'Underground',
    targetTonnes: 26000,
    forecastTonnes: 23200,
    availabilityPct: 69.5,
    blastingDelayHours: 14.0,
    status: 'CRITICAL',
    keyConstraint: 'Heavy equipment downtime on LHD Loader L-04 and ventilation shaft #2 maintenance',
  },
  {
    id: 'mine-b',
    name: 'Mine B (Dongri Buzurg)',
    type: 'Opencast',
    targetTonnes: 16000,
    forecastTonnes: 15400,
    availabilityPct: 76.0,
    blastingDelayHours: 8.5,
    status: 'ALERT',
    keyConstraint: 'Bench haul road softening due to unseasonal rain; temporary speed restrictions',
  },
  {
    id: 'mine-c',
    name: 'Mine C (Kandri–Mansar)',
    type: 'Opencast',
    targetTonnes: 10000,
    forecastTonnes: 9600,
    availabilityPct: 74.2,
    blastingDelayHours: 9.0,
    status: 'NORMAL',
    keyConstraint: 'Grade blending bottlenecks at secondary crushing hopper',
  },
];

export const CAUSAL_SHORTFALL_FACTORS: ProductionCausalFactor[] = [
  {
    factor: 'Equipment downtime',
    pct: 41,
    tonnesImpact: 1558,
    category: 'Equipment',
    details: 'Unscheduled hydraulic breakdown of primary LHD Loader L-04 at Mine A and delayed spare delivery',
  },
  {
    factor: 'Blasting window delay',
    pct: 27,
    tonnesImpact: 1026,
    category: 'Blasting',
    details: 'Fume clearance delays in underground sublevels and misaligned shift change blast window (12.5h backlog)',
  },
  {
    factor: 'Rainfall & drainage',
    pct: 19,
    tonnesImpact: 722,
    category: 'Weather',
    details: '142mm cumulative precipitation in Dongri Buzurg pit sump causing 18-hour incline ramp transit suspension',
  },
  {
    factor: 'Haul road & logistics',
    pct: 13,
    tonnesImpact: 494,
    category: 'Logistics',
    details: 'Rail rake placement delays at Balaghat siding and primary crusher feeder maintenance',
  },
];

// Generate 30 days time-series for clean interactive chart
export function generateMonthlyProductionSeries(): DailyProductionPoint[] {
  const points: DailyProductionPoint[] = [];
  const totalDays = 30;
  const currentDay = 21;
  const dailyTarget = 52000 / totalDays; // ~1733 t/day

  let actualCum = 0;
  let targetCum = 0;

  for (let d = 1; d <= totalDays; d++) {
    targetCum += dailyTarget;
    
    if (d <= currentDay) {
      // Simulate historical variability
      let dailyActual = dailyTarget;
      if (d >= 8 && d <= 11) {
        // Equipment breakdown period
        dailyActual = dailyTarget * 0.72;
      } else if (d >= 15 && d <= 17) {
        // Rain spell
        dailyActual = dailyTarget * 0.68;
      } else {
        dailyActual = dailyTarget * (0.92 + (Math.sin(d) * 0.08));
      }
      actualCum += Math.round(dailyActual);
      
      points.push({
        day: d,
        dateStr: `Sep ${d < 10 ? '0' + d : d}`,
        actualTonnes: Math.round(dailyActual),
        targetCumulativeTonnes: Math.round(targetCum),
        actualCumulativeTonnes: Math.round(actualCum),
        forecastCumulativeTonnes: Math.round(actualCum),
        isForecast: false,
        notes: d === 9 ? 'Loader L-04 Breakdown' : d === 16 ? 'Heavy Incline Rain' : undefined,
      });
    } else {
      // Future days: project to reach 48,200 t
      const remainingTonnes = 48200 - actualCum;
      const daysRemaining = totalDays - currentDay;
      const projectedDaily = remainingTonnes / daysRemaining; // ~1583 t/day
      const prevCum = points[points.length - 1].forecastCumulativeTonnes;
      const nextForecastCum = prevCum + projectedDaily;

      points.push({
        day: d,
        dateStr: `Sep ${d < 10 ? '0' + d : d}`,
        actualTonnes: null,
        targetCumulativeTonnes: Math.round(targetCum),
        actualCumulativeTonnes: null,
        forecastCumulativeTonnes: Math.round(nextForecastCum),
        isForecast: true,
      });
    }
  }

  return points;
}
