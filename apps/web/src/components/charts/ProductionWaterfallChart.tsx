import React, { useState } from 'react';
import { 
  WATERFALL_SHORTFALL_STEPS, 
  WaterfallStep 
} from '../../data/productionData';
import { 
  TrendingDown, 
  AlertTriangle, 
  Layers, 
  ArrowRight, 
  Wrench, 
  Zap, 
  CloudRain, 
  Truck,
  CheckCircle2,
  Info
} from 'lucide-react';

interface ProductionWaterfallChartProps {
  onSelectFactor?: (factorId: string) => void;
  className?: string;
}

export const ProductionWaterfallChart: React.FC<ProductionWaterfallChartProps> = ({
  onSelectFactor,
  className = '',
}) => {
  const [activeStepId, setActiveStepId] = useState<string | null>('equipment');
  const [showPercentages, setShowPercentages] = useState(true);

  const steps = WATERFALL_SHORTFALL_STEPS;
  const activeStep = steps.find((s) => s.id === activeStepId) || steps[1];

  // SVG dimensions
  const svgWidth = 780;
  const svgHeight = 290;
  const padLeft = 60;
  const padRight = 30;
  const padTop = 35;
  const padBottom = 45;

  const chartPlotWidth = svgWidth - padLeft - padRight;
  const chartPlotHeight = svgHeight - padTop - padBottom;

  // Value scale: from 46,000 to 53,500
  const yMin = 46000;
  const yMax = 53500;
  const yRange = yMax - yMin;

  const getY = (val: number) => {
    const clamped = Math.max(yMin, Math.min(yMax, val));
    return padTop + chartPlotHeight - ((clamped - yMin) / yRange) * chartPlotHeight;
  };

  const colWidth = chartPlotWidth / steps.length;
  const barWidth = Math.min(68, colWidth * 0.72);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Equipment':
        return Wrench;
      case 'Blasting':
        return Zap;
      case 'Weather':
        return CloudRain;
      case 'Logistics':
        return Truck;
      case 'Target':
      case 'Forecast':
      default:
        return Layers;
    }
  };

  return (
    <div className={`bg-white rounded-2xl border border-stone-200 shadow-xs p-4 sm:p-5 transition-all ${className}`}>
      {/* Chart Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-100">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
            <h3 className="text-xs sm:text-sm font-semibold text-stone-900 tracking-tight">
              Production Shortfall Waterfall Analysis
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200">
              SHAPLEY CAUSAL FLOW
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Tracing how the 52,000 t target degraded to a 48,200 t month-end forecast (-3,800 t gap)
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowPercentages(!showPercentages)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors border cursor-pointer ${
              showPercentages 
                ? 'bg-amber-50 text-amber-900 border-amber-300 font-semibold' 
                : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
            }`}
          >
            {showPercentages ? 'Showing: % of Gap' : 'Showing: Tonnage'}
          </button>
          <div className="hidden sm:flex items-center space-x-1.5 text-xs text-stone-500 bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-200">
            <span className="font-mono text-stone-700 font-semibold">Net Gap: -3,800 t</span>
            <span className="text-red-600 font-mono font-bold">(-7.3%)</span>
          </div>
        </div>
      </div>

      {/* Main SVG Waterfall Graphic */}
      <div className="mt-3 relative bg-[#faf9f6] rounded-xl border border-stone-200/80 p-2 sm:p-3 overflow-x-auto no-scrollbar">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full min-w-[660px] h-[240px] sm:h-[270px] select-none"
        >
          <defs>
            {/* Soft grid line pattern */}
            <linearGradient id="barTargetGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#292524" />
              <stop offset="100%" stopColor="#1c1917" />
            </linearGradient>
            <linearGradient id="barForecastGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#44403c" />
              <stop offset="100%" stopColor="#292524" />
            </linearGradient>
            <linearGradient id="barOchreGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
            <linearGradient id="barRedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#dc2626" />
            </linearGradient>
          </defs>

          {/* Horizontal Reference Grids */}
          {[46000, 48000, 50000, 52000].map((val) => {
            const y = getY(val);
            return (
              <g key={val}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={svgWidth - padRight}
                  y2={y}
                  stroke="#e7e5e0"
                  strokeWidth="1"
                  strokeDasharray={val === 52000 ? '4,4' : undefined}
                />
                <text
                  x={padLeft - 10}
                  y={y + 3.5}
                  fill="#78716c"
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  {(val / 1000).toFixed(0)}k t
                </text>
              </g>
            );
          })}

          {/* Reference baseline target line */}
          <line
            x1={padLeft}
            y1={getY(52000)}
            x2={svgWidth - padRight}
            y2={getY(52000)}
            stroke="#a8a29e"
            strokeWidth="1.5"
            strokeDasharray="4,4"
          />

          {/* Render Waterfall Bars and Connecting Step Bridges */}
          {steps.map((step, idx) => {
            const centerX = padLeft + idx * colWidth + colWidth / 2;
            const barX = centerX - barWidth / 2;

            let barTop = 0;
            let barBottom = 0;
            let isNegative = step.change < 0;

            if (step.type === 'start') {
              barTop = getY(step.endVal);
              barBottom = getY(yMin);
            } else if (step.type === 'end') {
              barTop = getY(step.endVal);
              barBottom = getY(yMin);
            } else {
              // Floating step bar
              barTop = getY(Math.max(step.startVal, step.endVal));
              barBottom = getY(Math.min(step.startVal, step.endVal));
            }

            const barHeight = Math.max(6, barBottom - barTop);
            const isHovered = activeStepId === step.id;

            // Connector line to the next pillar
            const nextStep = steps[idx + 1];
            let connectorLine = null;
            if (nextStep) {
              const currentExitY = getY(step.endVal);
              const nextCenterX = padLeft + (idx + 1) * colWidth + colWidth / 2;
              const nextBarX = nextCenterX - barWidth / 2;

              connectorLine = (
                <line
                  x1={barX + barWidth}
                  y1={currentExitY}
                  x2={nextBarX}
                  y2={currentExitY}
                  stroke="#a8a29e"
                  strokeWidth="1.2"
                  strokeDasharray="2,2"
                />
              );
            }

            // Fill styling according to modern geological palette
            let fillColor = '#1c1917';
            if (step.type === 'start') {
              fillColor = '#1c1917';
            } else if (step.type === 'end') {
              fillColor = '#292524';
            } else if (step.id === 'equipment') {
              fillColor = '#dc2626'; // Deep Rust Red
            } else if (step.id === 'blasting') {
              fillColor = '#d97706'; // Mineral Ochre
            } else if (step.id === 'weather') {
              fillColor = '#0284c7'; // Pit Rain Slate Blue
            } else {
              fillColor = '#b45309'; // Warm Terracotta
            }

            return (
              <g
                key={step.id}
                className="cursor-pointer transition-all duration-150"
                onClick={() => {
                  setActiveStepId(step.id);
                  if (onSelectFactor) onSelectFactor(step.id);
                }}
                onMouseEnter={() => setActiveStepId(step.id)}
              >
                {/* Horizontal Step Connector */}
                {connectorLine}

                {/* Bar Column Glow / Highlight Halo when active */}
                {isHovered && (
                  <rect
                    x={barX - 4}
                    y={barTop - 4}
                    width={barWidth + 8}
                    height={barHeight + 8}
                    rx="8"
                    fill={fillColor}
                    fillOpacity="0.15"
                  />
                )}

                {/* Primary Bar Rect */}
                <rect
                  x={barX}
                  y={barTop}
                  width={barWidth}
                  height={barHeight}
                  rx="6"
                  fill={fillColor}
                  stroke={isHovered ? '#ffffff' : 'transparent'}
                  strokeWidth="2"
                  className="transition-all duration-200"
                />

                {/* Floating Value Label on top of bar */}
                <text
                  x={centerX}
                  y={barTop - 8}
                  fill={isHovered ? '#1c1917' : '#44403c'}
                  fontSize="11"
                  fontFamily="monospace"
                  fontWeight={isHovered ? 'bold' : '600'}
                  textAnchor="middle"
                >
                  {step.type === 'start' || step.type === 'end'
                    ? `${(step.endVal / 1000).toFixed(1)}k`
                    : showPercentages
                    ? `-${step.pctOfTotalGap}%`
                    : `${step.change} t`}
                </text>

                {/* Column Base Label */}
                <text
                  x={centerX}
                  y={svgHeight - padBottom + 16}
                  fill={isHovered ? '#1c1917' : '#78716c'}
                  fontSize="10"
                  fontWeight={isHovered ? '700' : '500'}
                  textAnchor="middle"
                >
                  {step.label.length > 12 ? `${step.label.slice(0, 11)}…` : step.label}
                </text>
                <text
                  x={centerX}
                  y={svgHeight - padBottom + 28}
                  fill="#a8a29e"
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {step.type === 'start'
                    ? 'Baseline'
                    : step.type === 'end'
                    ? 'Month-End'
                    : `-${Math.abs(step.change)} t`}
                </text>
              </g>
            );
          })}

          {/* Gap Bracket Indicator on the right */}
          <g>
            <path
              d={`M ${svgWidth - padRight + 6} ${getY(52000)} L ${svgWidth - padRight + 14} ${getY(52000)} L ${svgWidth - padRight + 14} ${getY(48200)} L ${svgWidth - padRight + 6} ${getY(48200)}`}
              fill="none"
              stroke="#dc2626"
              strokeWidth="1.5"
            />
            <text
              x={svgWidth - padRight + 18}
              y={(getY(52000) + getY(48200)) / 2 + 3}
              fill="#dc2626"
              fontSize="10"
              fontFamily="monospace"
              fontWeight="bold"
            >
              -3.8k t
            </text>
          </g>
        </svg>
      </div>

      {/* Interactive Detail Card for Hovered / Selected Step */}
      <div className="mt-3 p-3.5 bg-stone-50 rounded-xl border border-stone-200 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-start space-x-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
            activeStep.type === 'start' || activeStep.type === 'end'
              ? 'bg-stone-900 text-white'
              : activeStep.category === 'Equipment'
              ? 'bg-red-100 text-red-700 border border-red-200'
              : activeStep.category === 'Blasting'
              ? 'bg-amber-100 text-amber-700 border border-amber-200'
              : activeStep.category === 'Weather'
              ? 'bg-sky-100 text-sky-700 border border-sky-200'
              : 'bg-stone-200 text-stone-800'
          }`}>
            {React.createElement(getCategoryIcon(activeStep.category), { className: 'w-4 h-4' })}
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-stone-900 text-xs sm:text-sm">
                {activeStep.label}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white border border-stone-200 text-stone-600">
                {activeStep.sector}
              </span>
              {activeStep.pctOfTotalGap > 0 && activeStep.type !== 'end' && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-red-50 border border-red-200 text-red-700 font-bold">
                  {activeStep.pctOfTotalGap}% of Gap
                </span>
              )}
            </div>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed max-w-2xl">
              {activeStep.details}
            </p>
          </div>
        </div>

        {/* Recommended Action Pill */}
        <div className="w-full md:w-auto md:min-w-[280px] bg-white p-2.5 rounded-lg border border-stone-200 shadow-2xs text-xs">
          <div className="text-[10px] uppercase font-bold tracking-wider text-amber-800 flex items-center space-x-1 mb-0.5">
            <CheckCircle2 className="w-3 h-3 text-amber-700" />
            <span>Targeted Recovery Lever</span>
          </div>
          <div className="text-stone-700 text-[11px] leading-snug">
            {activeStep.mitigation}
          </div>
        </div>
      </div>
    </div>
  );
};
