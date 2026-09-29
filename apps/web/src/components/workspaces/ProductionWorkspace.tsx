import React, { useState } from 'react';
import { 
  TrendingUp, 
  AlertTriangle, 
  ArrowRight, 
  HelpCircle, 
  Wrench, 
  CloudRain, 
  Zap, 
  Truck, 
  Sliders,
  ChevronRight,
  PieChart,
  BarChart2,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { 
  CURRENT_PRODUCTION_SUMMARY, 
  CAUSAL_SHORTFALL_FACTORS, 
  MINE_SITES, 
  generateMonthlyProductionSeries,
  DailyProductionPoint
} from '../../data/productionData';
import { ProductionWaterfallChart } from '../charts/ProductionWaterfallChart';
import { FleetDonutChart } from '../charts/FleetDonutChart';
import { ShiftHeatmapChart } from '../charts/ShiftHeatmapChart';

interface ProductionWorkspaceProps {
  onNavigateToScenarios: () => void;
  onNavigateToActions: () => void;
}

type ProductionViewMode = 'all' | 'waterfall' | 'fleet' | 'shifts' | 'trajectory';

export const ProductionWorkspace: React.FC<ProductionWorkspaceProps> = ({
  onNavigateToScenarios,
  onNavigateToActions,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<DailyProductionPoint | null>(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [activeViewMode, setActiveViewMode] = useState<ProductionViewMode>('all');

  const series = generateMonthlyProductionSeries();
  const summary = CURRENT_PRODUCTION_SUMMARY;

  // Trajectory Chart dimensions and scaling
  const chartW = 860;
  const chartH = 260;
  const padX = 65;
  const padY = 28;
  const maxVal = 56000;

  const getX = (day: number) => padX + ((day - 1) / 29) * (chartW - padX - 25);
  const getY = (val: number) => chartH - padY - (val / maxVal) * (chartH - padY - 20);

  // Paths
  const targetPath = series.reduce((acc, pt, idx) => {
    const cmd = idx === 0 ? 'M' : 'L';
    return `${acc} ${cmd} ${getX(pt.day)} ${getY(pt.targetCumulativeTonnes)}`;
  }, '');

  const actualPoints = series.filter((pt) => !pt.isForecast);
  const actualPath = actualPoints.reduce((acc, pt, idx) => {
    const cmd = idx === 0 ? 'M' : 'L';
    return `${acc} ${cmd} ${getX(pt.day)} ${getY(pt.actualCumulativeTonnes || 0)}`;
  }, '');

  const forecastPoints = series.filter((pt) => pt.day >= 21);
  const forecastPath = forecastPoints.reduce((acc, pt, idx) => {
    const cmd = idx === 0 ? 'M' : 'L';
    return `${acc} ${cmd} ${getX(pt.day)} ${getY(pt.forecastCumulativeTonnes)}`;
  }, '');

  // Confidence Interval Fan (P10 to P90 forecast band)
  const confidenceUpperPath = forecastPoints.reduce((acc, pt, idx) => {
    const spread = (pt.day - 21) * 110;
    const cmd = idx === 0 ? 'M' : 'L';
    return `${acc} ${cmd} ${getX(pt.day)} ${getY(pt.forecastCumulativeTonnes + spread)}`;
  }, '');

  const confidenceLowerPoints = [...forecastPoints].reverse();
  const confidenceBandArea = `${confidenceUpperPath} ${confidenceLowerPoints.reduce((acc, pt) => {
    const spread = (pt.day - 21) * 110;
    return `${acc} L ${getX(pt.day)} ${getY(pt.forecastCumulativeTonnes - spread)}`;
  }, '')} Z`;

  const actualArea = `${actualPath} L ${getX(21)} ${getY(0)} L ${getX(1)} ${getY(0)} Z`;

  return (
    <div className="space-y-4 select-none pb-8">
      {/* Top Command Bar */}
      <div className="bg-white px-4 sm:px-5 py-3.5 rounded-2xl border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-amber-700" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs sm:text-sm font-bold text-stone-900 tracking-tight">
                03 PRODUCTION FORECAST & ANALYTICS
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200 hidden sm:inline-block">
                Day 21 of 30 &bull; Sep 2026
              </span>
            </div>
            <div className="text-[11px] text-stone-500 font-sans">
              Combined Balaghat Deep, Dongri Buzurg Opencast & Kandri Sectors
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowHowItWorks(!showHowItWorks)}
            className="px-3 py-1.5 bg-white hover:bg-stone-50 text-stone-700 text-xs font-medium rounded-xl border border-stone-300 flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <HelpCircle className="w-3.5 h-3.5 text-stone-500" />
            <span>{showHowItWorks ? 'Hide Architecture' : 'Forecast Architecture'}</span>
          </button>

          <button
            onClick={onNavigateToScenarios}
            className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <span>What-If Simulator</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
          </button>
        </div>
      </div>

      {/* Educational How It Works Drawer */}
      {showHowItWorks && (
        <div className="bg-[#faf9f6] p-4 rounded-2xl border border-stone-200 text-xs text-stone-700 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-stone-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Production Forecasting Pipeline & Causal Attribution (SHAP)
            </span>
            <span className="text-[11px] font-mono text-stone-500 bg-white px-2 py-0.5 rounded-md border border-stone-200">
              SIMULATED TELEMETRY
            </span>
          </div>
          <p className="leading-relaxed text-stone-600 text-xs">
            The forecasting engine merges real-time telemetry from underground stopes, opencast pit benches, and processing hoppers. Machine learning models isolate mechanical downtime, rain-induced cycle throttling, and blasting fume delays to compute exact causal variance and forecast month-end targets.
          </p>
          <div className="bg-white p-3 rounded-xl border border-stone-200 font-mono text-[11px] text-center text-stone-700">
            Shift Telemetry + Monthly Target + Rain/Monsoon Inflow + Mechanical Availability + Blasting Standing Time
            <br />
            <span className="text-amber-800 font-bold">
              &rarr; Gradient-Boosted Regressor &rarr; Forecast (48,200 t) &rarr; Shortfall (-3,800 t) &rarr; Risk: High
            </span>
          </div>
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Target */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs hover:border-stone-300 transition-colors">
          <div className="text-xs text-stone-500 font-medium mb-1 flex items-center justify-between">
            <span>Planned Monthly Target</span>
            <span className="w-2 h-2 rounded-full bg-stone-400"></span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-stone-900">52,000</span>
            <span className="text-xs text-stone-500 font-medium">Tonnes</span>
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            Required Run-rate: ~1,733 t/day across 3 sectors
          </div>
        </div>

        {/* Forecast */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs hover:border-stone-300 transition-colors">
          <div className="text-xs text-stone-500 font-medium mb-1 flex items-center justify-between">
            <span>Projected Month-End Output</span>
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-amber-800">48,200</span>
            <span className="text-xs text-stone-500 font-medium">Tonnes</span>
          </div>
          <div className="text-[11px] text-stone-600 mt-1">
            Verified actual to date: <strong className="font-mono text-stone-800">33,950 t</strong> (Day 21)
          </div>
        </div>

        {/* Shortfall */}
        <div className="bg-white p-4 rounded-2xl border border-red-200 shadow-xs hover:border-red-300 transition-colors">
          <div className="text-xs text-red-700 font-medium mb-1 flex items-center justify-between">
            <span>Projected Production Deficit</span>
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-red-600">-3,800</span>
            <span className="text-xs text-red-700 font-semibold">Tonnes (-7.3%)</span>
          </div>
          <div className="text-[11px] text-red-700 mt-1 flex items-center space-x-1">
            <AlertTriangle className="w-3 h-3 text-red-600 shrink-0" />
            <span>Operational recovery intervention required</span>
          </div>
        </div>

        {/* Risk Level */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs hover:border-stone-300 transition-colors">
          <div className="text-xs text-stone-500 font-medium mb-1 flex items-center justify-between">
            <span>Fleet & Blasting Status</span>
            <span className="w-2 h-2 rounded-full bg-amber-600"></span>
          </div>
          <div className="flex items-center space-x-2 mt-0.5">
            <span className="px-2.5 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-800 font-semibold text-xs flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
              <span>High Risk Level</span>
            </span>
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            Mechanical Availability: 72.4% &bull; Blast Delays: 12.5h
          </div>
        </div>
      </div>

      {/* WHAT WILL HAPPEN IF WE DO NOTHING? — Executive Decision Briefing */}
      <div className="bg-[#faf9f6] p-4.5 rounded-2xl border border-stone-300 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-stone-200">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
            <span className="text-xs font-bold text-stone-900 uppercase tracking-wide">
              Operational Briefing &bull; What Will Happen If We Do Nothing?
            </span>
          </div>
          <span className="text-[11px] font-mono text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full font-semibold">
            Status: Corrective Action Required
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
          {/* Question 1: Will we meet target? */}
          <div className="bg-white p-3.5 rounded-xl border border-stone-200 space-y-1">
            <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wide block">
              1. Will we meet target?
            </span>
            <div className="text-sm font-bold text-red-600">
              No, current trend shows 12% shortfall.
            </div>
            <p className="text-stone-600 text-[11px] leading-relaxed">
              Planned target: 52,000 t &bull; Projected output: 48,200 t (-3,800 t to -6,200 t deficit).
            </p>
          </div>

          {/* Question 2: When will it happen? */}
          <div className="bg-white p-3.5 rounded-xl border border-stone-200 space-y-1">
            <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wide block">
              2. When will it happen?
            </span>
            <div className="text-sm font-bold text-stone-900">
              Around Month 4.
            </div>
            <p className="text-stone-600 text-[11px] leading-relaxed">
              Deficit compounds steadily; production run-rate breaches minimum recovery threshold by Month 4.
            </p>
          </div>

          {/* Question 3: Why? */}
          <div className="bg-white p-3.5 rounded-xl border border-stone-200 space-y-1">
            <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wide block">
              3. Why is it happening?
            </span>
            <div className="space-y-1 text-stone-800 text-[11px] font-medium pt-0.5">
              <div className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                <span>Decreasing grade at Mine B</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                <span>Slower excavation at Pit 3</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                <span>Equipment maintenance delays</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Workspace View Switcher Tabs */}
      <div className="bg-white px-3 py-2 rounded-xl border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveViewMode('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeViewMode === 'all'
                ? 'bg-stone-900 text-white shadow-2xs font-semibold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Advanced Visuals</span>
          </button>

          <button
            onClick={() => setActiveViewMode('waterfall')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeViewMode === 'waterfall'
                ? 'bg-stone-900 text-white shadow-2xs font-semibold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Waterfall Shortfall Gap</span>
          </button>

          <button
            onClick={() => setActiveViewMode('fleet')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeViewMode === 'fleet'
                ? 'bg-stone-900 text-white shadow-2xs font-semibold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>Fleet Allocation Donut</span>
          </button>

          <button
            onClick={() => setActiveViewMode('shifts')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeViewMode === 'shifts'
                ? 'bg-stone-900 text-white shadow-2xs font-semibold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Shift Density Heatmap</span>
          </button>

          <button
            onClick={() => setActiveViewMode('trajectory')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeViewMode === 'trajectory'
                ? 'bg-stone-900 text-white shadow-2xs font-semibold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Trajectory Curve</span>
          </button>
        </div>

        <div className="text-[11px] font-mono text-stone-500 hidden md:block">
          Interactive Hover & Detail Telemetry Enabled
        </div>
      </div>

      {/* Main Interactive Charts Area */}

      {/* 1. Cumulative Trajectory Chart (shown in 'all' or 'trajectory') */}
      {(activeViewMode === 'all' || activeViewMode === 'trajectory') && (
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-stone-100">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-stone-900"></span>
                <span className="text-xs sm:text-sm font-semibold text-stone-900 tracking-tight">
                  Cumulative Production Trajectory & Confidence Band
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200">
                  DAY 1 TO 30
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Day 1–21 (Verified Telemetry Actuals) &bull; Day 22–30 (P10–P90 Machine Learning Forecast Cone)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-0.5 border-t-2 border-dashed border-stone-400"></span>
                <span className="text-stone-600 text-xs">Target (52k t)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-1 bg-stone-900 rounded-full"></span>
                <span className="text-stone-900 font-semibold text-xs">Actuals (D1–D21)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-1 bg-red-600 rounded-full"></span>
                <span className="text-red-700 font-semibold text-xs">Forecast (48.2k t)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 bg-red-100 border border-red-300 rounded-xs"></span>
                <span className="text-stone-500 text-[11px] font-mono">P10–P90 Cone</span>
              </div>
            </div>
          </div>

          {/* SVG Time-Series Chart */}
          <div className="w-full overflow-x-auto no-scrollbar bg-[#faf9f6] p-2 sm:p-3 rounded-xl border border-stone-200">
            <svg
              viewBox={`0 0 ${chartW} ${chartH}`}
              className="w-full min-w-[700px] h-[250px] sm:h-[270px] select-none"
            >
              <defs>
                <linearGradient id="actualAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1c1917" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#1c1917" stopOpacity="0.01" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines */}
              {[0, 10000, 20000, 30000, 40000, 50000].map((val) => (
                <g key={val}>
                  <line
                    x1={padX}
                    y1={getY(val)}
                    x2={chartW - 20}
                    y2={getY(val)}
                    stroke="#e7e5e0"
                    strokeWidth="1"
                  />
                  <text
                    x={padX - 8}
                    y={getY(val) + 4}
                    fill="#78716c"
                    fontSize="10"
                    fontFamily="monospace"
                    textAnchor="end"
                  >
                    {(val / 1000).toFixed(0)}k t
                  </text>
                </g>
              ))}

              {/* Vertical Marker for Day 21 (Today) */}
              <line
                x1={getX(21)}
                y1={padY}
                x2={getX(21)}
                y2={chartH - padY}
                stroke="#b45309"
                strokeWidth="1.5"
                strokeDasharray="4,4"
              />
              <text
                x={getX(21)}
                y={padY - 8}
                fill="#b45309"
                fontSize="10"
                fontFamily="monospace"
                textAnchor="middle"
                fontWeight="bold"
              >
                DAY 21 (TELEMETRY CUTOFF)
              </text>

              {/* Confidence Band (P10 - P90) */}
              <path d={confidenceBandArea} fill="#fee2e2" fillOpacity="0.5" />

              {/* Shortfall gap highlight region */}
              <path
                d={`M ${getX(21)} ${getY(series[20].actualCumulativeTonnes || 33950)} L ${getX(30)} ${getY(52000)} L ${getX(30)} ${getY(48200)} Z`}
                fill="#fca5a5"
                fillOpacity="0.4"
              />
              <text
                x={getX(26.5)}
                y={getY(50100)}
                fill="#b91c1c"
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
              >
                -3,800 t GAP
              </text>

              {/* Shaded Area under actual */}
              <path d={actualArea} fill="url(#actualAreaGrad)" />

              {/* Planned Target Line (dashed) */}
              <path
                d={targetPath}
                fill="none"
                stroke="#78716c"
                strokeWidth="1.5"
                strokeDasharray="4,4"
              />

              {/* Actual Output Line (solid graphite) */}
              <path
                d={actualPath}
                fill="none"
                stroke="#1c1917"
                strokeWidth="2.5"
              />

              {/* Projected Forecast Line (coral) */}
              <path
                d={forecastPath}
                fill="none"
                stroke="#dc2626"
                strokeWidth="2"
                strokeDasharray="3,3"
              />

              {/* Data Points on actuals */}
              {series.map((pt) => {
                const cx = getX(pt.day);
                const cy = pt.isForecast
                  ? getY(pt.forecastCumulativeTonnes)
                  : getY(pt.actualCumulativeTonnes || 0);

                const hasIncident = !!pt.notes;
                const isHovered = hoveredPoint?.day === pt.day;

                return (
                  <g
                    key={pt.day}
                    onMouseEnter={() => setHoveredPoint(pt)}
                    onMouseLeave={() => setHoveredPoint(null)}
                    className="cursor-pointer"
                  >
                    {isHovered && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r="8"
                        fill="#b45309"
                        fillOpacity="0.2"
                      />
                    )}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={hasIncident ? 4.5 : pt.day === 21 ? 5 : isHovered ? 4.5 : 2.5}
                      fill={hasIncident ? '#dc2626' : pt.isForecast ? '#b45309' : '#1c1917'}
                      stroke="#ffffff"
                      strokeWidth={isHovered ? '2' : '1.5'}
                    />
                    {hasIncident && (
                      <text
                        x={cx}
                        y={cy - 9}
                        fill="#b91c1c"
                        fontSize="9"
                        fontFamily="sans-serif"
                        textAnchor="middle"
                        fontWeight="bold"
                      >
                        {pt.notes?.split(' ')[0]}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* X-axis day labels */}
              {[1, 5, 10, 15, 20, 21, 25, 30].map((d) => (
                <text
                  key={d}
                  x={getX(d)}
                  y={chartH - padY + 16}
                  fill={d === 21 ? '#b45309' : '#78716c'}
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="middle"
                  fontWeight={d === 21 ? 'bold' : 'normal'}
                >
                  {d === 21 ? 'D21*' : `D${d}`}
                </text>
              ))}
            </svg>
          </div>

          {/* Hovered Point Info Strip */}
          <div className="min-h-9 py-1.5 flex flex-wrap items-center justify-between text-xs font-mono text-stone-600 bg-[#fcfbf9] px-3.5 rounded-xl border border-stone-200 gap-2">
            {hoveredPoint ? (
              <>
                <div className="flex items-center space-x-2">
                  <span className="text-stone-900 font-bold">{hoveredPoint.dateStr} (Day {hoveredPoint.day})</span>
                  <span className="text-stone-400">&bull;</span>
                  <span>Target Cum: {hoveredPoint.targetCumulativeTonnes.toLocaleString()} t</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span>
                    {hoveredPoint.isForecast ? 'Forecast Cum: ' : 'Actual Cum: '}
                    <strong className={hoveredPoint.isForecast ? 'text-red-600' : 'text-stone-900'}>
                      {(hoveredPoint.isForecast ? hoveredPoint.forecastCumulativeTonnes : hoveredPoint.actualCumulativeTonnes)?.toLocaleString()} t
                    </strong>
                  </span>
                  {hoveredPoint.actualTonnes && (
                    <span className="text-stone-500 hidden sm:inline">
                      (Daily: {hoveredPoint.actualTonnes.toLocaleString()} t)
                    </span>
                  )}
                  {hoveredPoint.notes && (
                    <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 font-semibold border border-red-200">
                      {hoveredPoint.notes}
                    </span>
                  )}
                </div>
              </>
            ) : (
              <span className="text-stone-500">
                Scrub cursor across data nodes to inspect daily tonnage telemetry and logged breakdown bottlenecks.
              </span>
            )}
          </div>
        </div>
      )}

      {/* 2. Waterfall Shortfall Chart (shown in 'all' or 'waterfall') */}
      {(activeViewMode === 'all' || activeViewMode === 'waterfall') && (
        <ProductionWaterfallChart />
      )}

      {/* 3. Fleet & Resource Allocation Donut Chart (shown in 'all' or 'fleet') */}
      {(activeViewMode === 'all' || activeViewMode === 'fleet') && (
        <FleetDonutChart />
      )}

      {/* 4. Shift-by-Shift Performance Density Heatmap (shown in 'all' or 'shifts') */}
      {(activeViewMode === 'all' || activeViewMode === 'shifts') && (
        <ShiftHeatmapChart />
      )}

      {/* Sector-by-Sector Performance Matrix & Action CTA */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-stone-100">
          <div>
            <span className="text-xs font-semibold text-stone-800 uppercase tracking-wide block">
              Operational Sector Performance Matrix
            </span>
            <p className="text-xs text-stone-500">
              Site constraints, mechanical availability, and recovery priority for Balaghat, Dongri Buzurg, and Kandri
            </p>
          </div>

          <button
            onClick={onNavigateToActions}
            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold text-xs rounded-xl border border-amber-300 flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <span>Review Corrective Action Plan</span>
            <ChevronRight className="w-3.5 h-3.5 text-amber-800" />
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-stone-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#faf9f6] text-stone-600 font-semibold text-xs border-b border-stone-200">
              <tr>
                <th className="p-3">Sector</th>
                <th className="p-3">Type</th>
                <th className="p-3">Target</th>
                <th className="p-3">Forecast</th>
                <th className="p-3">Availability</th>
                <th className="p-3">Blast Delay</th>
                <th className="p-3">Status</th>
                <th className="p-3">Primary Bottleneck</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 bg-white text-xs">
              {MINE_SITES.map((m) => (
                <tr key={m.id} className="hover:bg-[#faf9f6] transition-colors">
                  <td className="p-3 font-semibold text-stone-900">{m.name}</td>
                  <td className="p-3 text-stone-600">{m.type}</td>
                  <td className="p-3 text-stone-700 font-mono">{m.targetTonnes.toLocaleString()} t</td>
                  <td className="p-3 text-amber-800 font-bold font-mono">{m.forecastTonnes.toLocaleString()} t</td>
                  <td className="p-3">
                    <span className={m.availabilityPct < 72 ? 'text-red-600 font-bold font-mono' : 'text-stone-700 font-mono'}>
                      {m.availabilityPct}%
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={m.blastingDelayHours > 10 ? 'text-red-600 font-bold font-mono' : 'text-stone-700 font-mono'}>
                      {m.blastingDelayHours}h
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        m.status === 'CRITICAL'
                          ? 'bg-red-50 text-red-800 border-red-200'
                          : m.status === 'ALERT'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="p-3 text-stone-600 max-w-xs">{m.keyConstraint}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* CTA to Scenario Simulator & Action Planner */}
        <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-stone-600">
            Recovery Protocol: Test lever sensitivities in What-If Simulator or commit targeted dispatch actions.
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={onNavigateToActions}
              className="flex-1 sm:flex-initial px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs rounded-xl transition-colors cursor-pointer border border-stone-300"
            >
              Open Action Protocols
            </button>
            <button
              onClick={onNavigateToScenarios}
              className="flex-1 sm:flex-initial px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs rounded-xl flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-xs"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-300" />
              <span>Launch What-If Simulator</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
