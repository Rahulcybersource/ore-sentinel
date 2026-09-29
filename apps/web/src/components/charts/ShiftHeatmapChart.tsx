import React, { useState, useMemo } from 'react';
import { 
  generateShiftPerformanceMatrix, 
  ShiftPerformanceCell 
} from '../../data/productionData';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Filter, 
  Activity, 
  Info,
  Calendar,
  Layers
} from 'lucide-react';

interface ShiftHeatmapChartProps {
  className?: string;
  onSelectCell?: (cell: ShiftPerformanceCell) => void;
}

export const ShiftHeatmapChart: React.FC<ShiftHeatmapChartProps> = ({
  className = '',
  onSelectCell,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'CRITICAL' | 'A' | 'B' | 'C'>('ALL');
  const [hoveredCell, setHoveredCell] = useState<ShiftPerformanceCell | null>(null);
  const [selectedCell, setSelectedCell] = useState<ShiftPerformanceCell | null>(null);

  const matrix = useMemo(() => generateShiftPerformanceMatrix(), []);

  // Filtered cells if applicable
  const displayMatrix = useMemo(() => {
    if (selectedFilter === 'CRITICAL') {
      return matrix.filter((c) => c.status === 'critical' || c.status === 'degraded');
    }
    if (selectedFilter === 'A') {
      return matrix.filter((c) => c.shiftCode === 'A');
    }
    if (selectedFilter === 'B') {
      return matrix.filter((c) => c.shiftCode === 'B');
    }
    if (selectedFilter === 'C') {
      return matrix.filter((c) => c.shiftCode === 'C');
    }
    return matrix;
  }, [matrix, selectedFilter]);

  // Days 1 through 21
  const days = Array.from({ length: 21 }, (_, i) => i + 1);
  const shifts: ('A' | 'B' | 'C')[] = ['A', 'B', 'C'];

  const shiftLabels: Record<'A' | 'B' | 'C', string> = {
    A: 'Shift A (06:00–14:00)',
    B: 'Shift B (14:00–22:00)',
    C: 'Shift C (22:00–06:00)',
  };

  // Color mapping based on Modern Geological palette
  const getCellColorClass = (cell: ShiftPerformanceCell) => {
    switch (cell.status) {
      case 'optimal':
        return 'bg-emerald-700 text-white hover:bg-emerald-600 border-emerald-800';
      case 'normal':
        return 'bg-stone-700 text-white hover:bg-stone-600 border-stone-800';
      case 'degraded':
        return 'bg-amber-600 text-white hover:bg-amber-500 border-amber-700';
      case 'critical':
        return 'bg-red-600 text-white hover:bg-red-500 border-red-700 animate-pulse';
      default:
        return 'bg-stone-200 text-stone-700 border-stone-300';
    }
  };

  const getStatusBadge = (status: ShiftPerformanceCell['status']) => {
    switch (status) {
      case 'optimal':
        return <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[10px] font-bold">OPTIMAL &gt;100%</span>;
      case 'normal':
        return <span className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-800 border border-stone-200 font-mono text-[10px]">ON TARGET</span>;
      case 'degraded':
        return <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-mono text-[10px] font-semibold">DEGRADED 78-89%</span>;
      case 'critical':
        return <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 font-mono text-[10px] font-bold">CRITICAL &lt;78%</span>;
    }
  };

  const activeInspectCell = hoveredCell || selectedCell || matrix[25]; // default to an interesting cell

  const handleCellClick = (cell: ShiftPerformanceCell) => {
    setSelectedCell(cell);
    if (onSelectCell) onSelectCell(cell);
  };

  // Performance summary stats
  const totalTonnes = matrix.reduce((acc, c) => acc + c.actualTonnes, 0);
  const criticalCount = matrix.filter((c) => c.status === 'critical').length;
  const optimalCount = matrix.filter((c) => c.status === 'optimal').length;

  return (
    <div className={`bg-white rounded-2xl border border-stone-200 shadow-xs p-4 sm:p-5 ${className}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-100">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
            <h3 className="text-xs sm:text-sm font-semibold text-stone-900 tracking-tight">
              Shift-by-Shift Performance Density Heatmap
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200">
              63 SHIFTS &bull; DAY 1 TO 21
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Temporal density of ore haulage and mechanical bottlenecks across daily 8-hour shift cycles
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
          {(['ALL', 'CRITICAL', 'A', 'B', 'C'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors border cursor-pointer ${
                selectedFilter === filter
                  ? 'bg-stone-900 text-white border-stone-900 font-semibold shadow-2xs'
                  : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
              }`}
            >
              {filter === 'ALL'
                ? 'All Shifts'
                : filter === 'CRITICAL'
                ? 'Bottlenecks'
                : `Shift ${filter}`}
            </button>
          ))}
        </div>
      </div>

      {/* Heatmap Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-2 text-xs border-b border-stone-100">
        <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-stone-600">
          <span className="text-stone-400">Density Scale:</span>
          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-3.5 rounded bg-emerald-700 border border-emerald-800 inline-block"></span>
            <span>Optimal (&gt;100%)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-3.5 rounded bg-stone-700 border border-stone-800 inline-block"></span>
            <span>Nominal (90–100%)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-3.5 rounded bg-amber-600 border border-amber-700 inline-block"></span>
            <span>Degraded (78–89%)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-3.5 rounded bg-red-600 border border-red-700 inline-block"></span>
            <span>Critical (&lt;78% / Event)</span>
          </div>
        </div>

        <div className="text-[11px] font-mono text-stone-500">
          Target per shift: <strong className="text-stone-800">578 tonnes</strong>
        </div>
      </div>

      {/* Main Heatmap Matrix Grid */}
      <div className="mt-3 overflow-x-auto no-scrollbar pb-2">
        <div className="min-w-[720px] bg-[#faf9f6] p-3 rounded-xl border border-stone-200">
          {/* Day Numbers Header Row */}
          <div className="grid grid-cols-[140px_repeat(21,1fr)] gap-1.5 mb-2 items-center text-center">
            <div className="text-left font-mono text-[11px] font-semibold text-stone-500 pl-1">
              Shift \ Date (Sep)
            </div>
            {days.map((d) => (
              <div
                key={d}
                className={`font-mono text-[10px] font-medium ${
                  d === 21 ? 'text-amber-800 font-bold bg-amber-100/70 rounded py-0.5' : 'text-stone-500'
                }`}
              >
                {d}
              </div>
            ))}
          </div>

          {/* 3 Shift Rows */}
          {shifts.map((shiftCode) => {
            const isRowDimmed = selectedFilter !== 'ALL' && selectedFilter !== 'CRITICAL' && selectedFilter !== shiftCode;

            return (
              <div
                key={shiftCode}
                className={`grid grid-cols-[140px_repeat(21,1fr)] gap-1.5 mb-1.5 items-center transition-opacity ${
                  isRowDimmed ? 'opacity-30' : 'opacity-100'
                }`}
              >
                {/* Row Header Label */}
                <div className="text-left pl-1 pr-2 truncate">
                  <span className="font-semibold text-xs text-stone-800 block">
                    Shift {shiftCode}
                  </span>
                  <span className="font-mono text-[10px] text-stone-400 block truncate">
                    {shiftCode === 'A' ? '06–14h Mucking' : shiftCode === 'B' ? '14–22h Blasting' : '22–06h Hoisting'}
                  </span>
                </div>

                {/* 21 Day Cells for this Shift */}
                {days.map((day) => {
                  const cell = matrix.find((c) => c.day === day && c.shiftCode === shiftCode);
                  if (!cell) return <div key={day} className="h-9 rounded bg-stone-100" />;

                  const isCellHovered = hoveredCell?.id === cell.id;
                  const isCellSelected = selectedCell?.id === cell.id;
                  const isMatchCritical = selectedFilter === 'CRITICAL' && (cell.status === 'critical' || cell.status === 'degraded');
                  const isCellDimmed = selectedFilter === 'CRITICAL' && !isMatchCritical;

                  return (
                    <div
                      key={day}
                      onClick={() => handleCellClick(cell)}
                      onMouseEnter={() => setHoveredCell(cell)}
                      onMouseLeave={() => setHoveredCell(null)}
                      className={`h-9 rounded-lg border flex flex-col items-center justify-center cursor-pointer transition-all duration-150 relative ${getCellColorClass(
                        cell
                      )} ${isCellHovered || isCellSelected ? 'ring-2 ring-stone-900 scale-105 z-10 shadow-xs' : ''} ${
                        isCellDimmed ? 'opacity-20' : 'opacity-100'
                      }`}
                      title={`${cell.dateStr} Shift ${cell.shiftCode}: ${cell.actualTonnes}t (${cell.performancePct}%)`}
                    >
                      <span className="font-mono text-[10px] font-bold leading-none">
                        {cell.actualTonnes}
                      </span>
                      <span className="font-mono text-[8px] opacity-80 leading-none mt-0.5">
                        {cell.performancePct}%
                      </span>

                      {/* Small dot for critical events */}
                      {cell.status === 'critical' && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white border border-red-600"></span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Inspector Details for Active Cell */}
      {activeInspectCell && (
        <div className="mt-3 p-3.5 bg-stone-50 rounded-xl border border-stone-200 transition-all">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-stone-200/80">
            <div className="flex items-center space-x-2">
              <Calendar className="w-3.5 h-3.5 text-stone-500" />
              <span className="font-mono font-bold text-xs text-stone-900">
                {activeInspectCell.dateStr} (Day {activeInspectCell.day}) &bull; {activeInspectCell.shift}
              </span>
              {getStatusBadge(activeInspectCell.status)}
            </div>

            <div className="flex items-center space-x-3 font-mono text-xs">
              <span>
                Actual: <strong className="text-stone-900 font-bold">{activeInspectCell.actualTonnes} t</strong>
              </span>
              <span className="text-stone-400">/</span>
              <span className="text-stone-500">
                Target: 578 t
              </span>
              <span className={`font-bold ${activeInspectCell.varianceTonnes >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                ({activeInspectCell.varianceTonnes >= 0 ? '+' : ''}{activeInspectCell.varianceTonnes} t)
              </span>
            </div>
          </div>

          <div className="mt-2.5 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="bg-white p-2.5 rounded-lg border border-stone-200/80">
              <span className="text-[10px] uppercase font-mono text-stone-400 block mb-0.5">
                Active Bench & Location
              </span>
              <span className="font-semibold text-stone-800 text-xs">
                {activeInspectCell.benchLevel}
              </span>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-stone-200/80">
              <span className="text-[10px] uppercase font-mono text-stone-400 block mb-0.5">
                Fleet Deployment
              </span>
              <span className="font-mono text-stone-800 text-xs">
                {activeInspectCell.activeUnits} Haulage & Loading Units Active
              </span>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-stone-200/80">
              <span className="text-[10px] uppercase font-mono text-stone-400 block mb-0.5">
                Operational Telemetry Note
              </span>
              <span className={`text-xs ${activeInspectCell.status === 'critical' ? 'text-red-700 font-medium' : 'text-stone-700'}`}>
                {activeInspectCell.primaryConstraint}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
