import React, { useState } from 'react';
import { 
  FLEET_ALLOCATION_DATA, 
  FleetAllocationItem 
} from '../../data/productionData';
import { 
  Truck, 
  Layers, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

interface FleetDonutChartProps {
  className?: string;
  onSelectCategory?: (category: FleetAllocationItem) => void;
}

export const FleetDonutChart: React.FC<FleetDonutChartProps> = ({
  className = '',
  onSelectCategory,
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string>('haul-dumpers');

  const fleet = FLEET_ALLOCATION_DATA;
  const totalUnits = fleet.reduce((acc, item) => acc + item.units, 0);

  const activeItem = fleet.find((f) => f.id === (hoveredId || selectedId)) || fleet[0];

  // SVG Donut geometry
  const size = 260;
  const center = size / 2;
  const radius = 95;
  const innerRadius = 60;

  // Polar coordinate helper
  const polarToCartesian = (centerX: number, centerY: number, rad: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + rad * Math.cos(angleInRadians),
      y: centerY + rad * Math.sin(angleInRadians),
    };
  };

  // SVG Arc generator
  const createArc = (startAngle: number, endAngle: number, outerRad: number, innerRad: number) => {
    // Avoid full 360 circle collision
    const angleDiff = Math.min(359.99, endAngle - startAngle);
    const adjustedEnd = startAngle + angleDiff;

    const startOuter = polarToCartesian(center, center, outerRad, adjustedEnd);
    const endOuter = polarToCartesian(center, center, outerRad, startAngle);
    const startInner = polarToCartesian(center, center, innerRad, startAngle);
    const endInner = polarToCartesian(center, center, innerRad, adjustedEnd);

    const largeArcFlag = angleDiff <= 180 ? '0' : '1';

    return [
      'M', startOuter.x, startOuter.y,
      'A', outerRad, outerRad, 0, largeArcFlag, 0, endOuter.x, endOuter.y,
      'L', startInner.x, startInner.y,
      'A', innerRad, innerRad, 0, largeArcFlag, 1, endInner.x, endInner.y,
      'Z',
    ].join(' ');
  };

  // Calculate cumulative angles with subtle gap
  let accumulatedAngle = 0;
  const gapAngle = 1.5; // Degree gap between slices

  const slices = fleet.map((item) => {
    const sliceAngle = (item.units / totalUnits) * 360;
    const startAngle = accumulatedAngle + gapAngle / 2;
    const endAngle = accumulatedAngle + sliceAngle - gapAngle / 2;
    accumulatedAngle += sliceAngle;

    const isHovered = hoveredId === item.id || selectedId === item.id;
    const currentOuterRadius = isHovered ? radius + 6 : radius;
    const currentInnerRadius = isHovered ? innerRadius - 2 : innerRadius;

    const pathData = createArc(startAngle, endAngle, currentOuterRadius, currentInnerRadius);

    return {
      ...item,
      startAngle,
      endAngle,
      pathData,
      isHovered,
    };
  });

  const handleSelect = (item: FleetAllocationItem) => {
    setSelectedId(item.id);
    if (onSelectCategory) onSelectCategory(item);
  };

  return (
    <div className={`bg-white rounded-2xl border border-stone-200 shadow-xs p-4 sm:p-5 ${className}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-100">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-stone-900"></span>
            <h3 className="text-xs sm:text-sm font-semibold text-stone-900 tracking-tight">
              Fleet & Heavy Asset Allocation
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200">
              62 TOTAL UNITS
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Operational distribution and active mechanical availability across MOIL sectors
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-stone-600 bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-200">
          <Activity className="w-3.5 h-3.5 text-amber-600" />
          <span>Fleet Availability: <strong className="text-stone-900">72.4%</strong></span>
        </div>
      </div>

      {/* Donut and Legend Layout */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Donut Chart Visual */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
          <div className="relative w-[260px] h-[260px]">
            <svg
              viewBox={`0 0 ${size} ${size}`}
              className="w-full h-full transform -rotate-90 select-none overflow-visible"
            >
              {slices.map((slice) => (
                <path
                  key={slice.id}
                  d={slice.pathData}
                  fill={slice.color}
                  className="cursor-pointer transition-all duration-200 hover:opacity-90"
                  onMouseEnter={() => setHoveredId(slice.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => handleSelect(slice)}
                  stroke="#ffffff"
                  strokeWidth={slice.isHovered ? '2.5' : '1.5'}
                />
              ))}
            </svg>

            {/* Central Summary Readout inside Donut */}
            <div 
              className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4"
              style={{ padding: '40px' }}
            >
              <span className="text-xs font-mono text-stone-400 uppercase tracking-wider">
                {activeItem ? activeItem.category : 'Fleet'}
              </span>
              <span className="text-2xl font-bold font-mono text-stone-900 leading-tight">
                {activeItem.units}
                <span className="text-xs font-normal text-stone-500 font-sans ml-1">units</span>
              </span>
              <span className="text-[11px] font-mono font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 mt-1">
                {activeItem.pct}% Share
              </span>
            </div>
          </div>

          <div className="text-[11px] text-stone-400 mt-2 font-mono">
            Hover or click slices to inspect allocation details
          </div>
        </div>

        {/* Interactive Legend List */}
        <div className="lg:col-span-7 space-y-2">
          {fleet.map((item) => {
            const isSelected = selectedId === item.id;
            const isHovered = hoveredId === item.id;

            return (
              <div
                key={item.id}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  isSelected || isHovered
                    ? 'bg-[#faf9f6] border-stone-400 shadow-2xs'
                    : 'bg-white border-stone-100 hover:bg-stone-50 hover:border-stone-200'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className="w-3.5 h-3.5 rounded-md shrink-0 border border-black/10"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="truncate">
                    <div className="text-xs font-semibold text-stone-900 truncate flex items-center space-x-2">
                      <span>{item.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold ${
                        item.status === 'ALERT'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : item.status === 'STANDBY'
                          ? 'bg-stone-100 text-stone-600 border border-stone-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-500 font-sans truncate">
                      {item.activeSector} &bull; Availability: <strong className="font-mono text-stone-700">{item.availabilityPct}%</strong>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 pl-3">
                  <div className="font-mono font-bold text-stone-900 text-xs">
                    {item.units} <span className="text-[10px] font-normal text-stone-500">units</span>
                  </div>
                  <div className="text-[10px] font-mono text-stone-500">
                    {item.pct}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Asset Deep Dive Card */}
      <div className="mt-4 p-3.5 bg-stone-50 rounded-xl border border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-stone-900">
              Active Focus: {activeItem.label}
            </span>
            <span className="font-mono text-[11px] text-stone-500">
              ({activeItem.activeSector})
            </span>
          </div>
          <p className="text-stone-600 text-[11px] leading-relaxed max-w-xl">
            {activeItem.description}
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <div className="bg-white px-3 py-1.5 rounded-lg border border-stone-200 text-center">
            <div className="text-[10px] text-stone-400 font-mono uppercase">Daily Impact</div>
            <div className="font-mono font-bold text-stone-900">
              {activeItem.dailyCapacityTonnes > 0 ? `${activeItem.dailyCapacityTonnes} t/day` : 'Support Role'}
            </div>
          </div>
          <div className="bg-white px-3 py-1.5 rounded-lg border border-stone-200 text-center">
            <div className="text-[10px] text-stone-400 font-mono uppercase">Readiness</div>
            <div className={`font-mono font-bold ${activeItem.availabilityPct < 70 ? 'text-red-600' : 'text-emerald-700'}`}>
              {activeItem.availabilityPct}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
