import React, { useState, useRef, useEffect } from 'react';
import { 
  Layers, 
  Compass, 
  Box, 
  ChevronRight,
  ChevronDown,
  Sparkles,
  SplitSquareVertical,
  ArrowRight,
  X
} from 'lucide-react';
import { ExplorationTarget, Drillhole } from '../../types';
import { MAP_LAYERS } from '../../data/explorationData';
import { ExplorationMap2D } from './ExplorationMap2D';
import { Exploration3DViewer } from './Exploration3DViewer';
import { EvidenceModal } from './EvidenceModal';
import { CrossSectionModal } from './CrossSectionModal';

interface ExplorationWorkspaceProps {
  targets: ExplorationTarget[];
  selectedTarget: ExplorationTarget;
  onSelectTarget: (t: ExplorationTarget) => void;
  drillholes: Drillhole[];
  onNavigateToResource: (targetId: string) => void;
}

export const ExplorationWorkspace: React.FC<ExplorationWorkspaceProps> = ({
  targets,
  selectedTarget,
  onSelectTarget,
  drillholes,
  onNavigateToResource,
}) => {
  const [viewMode, setViewMode] = useState<'2D' | '3D'>('2D');
  const [rankingFilter, setRankingFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [layerStates, setLayerStates] = useState<Record<string, boolean>>({
    prospectivity: true,
    mineralization: true,
    lineaments: true,
    geology: true,
    occurrences: true,
    satellite: true,
    terrain: false,
    geomorphology: false,
    confidence: false,
  });

  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [isCrossSectionModalOpen, setIsCrossSectionModalOpen] = useState(false);
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const layerPanelRef = useRef<HTMLDivElement>(null);

  // Close layer dropdown on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (layerPanelRef.current && !layerPanelRef.current.contains(event.target as Node)) {
        setShowLayerPanel(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowLayerPanel(false);
      }
    };
    if (showLayerPanel) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showLayerPanel]);

  const toggleLayer = (layerId: string) => {
    setLayerStates((prev) => ({ ...prev, [layerId]: !prev[layerId] }));
  };

  const toggleAllLayers = (enable: boolean) => {
    const next: Record<string, boolean> = {};
    MAP_LAYERS.forEach((layer) => {
      next[layer.id] = enable;
    });
    setLayerStates(next);
  };

  const setLayerPreset = (preset: 'all' | 'geology' | 'ai' | 'minimal') => {
    const next: Record<string, boolean> = {};
    MAP_LAYERS.forEach((layer) => {
      if (preset === 'all') {
        next[layer.id] = true;
      } else if (preset === 'geology') {
        next[layer.id] = ['geology', 'lineaments', 'mineralization', 'occurrences'].includes(layer.id);
      } else if (preset === 'ai') {
        next[layer.id] = ['prospectivity', 'confidence', 'mineralization'].includes(layer.id);
      } else {
        next[layer.id] = ['prospectivity', 'mineralization'].includes(layer.id);
      }
    });
    setLayerStates(next);
  };

  const filteredTargets = targets.filter((t) => {
    if (rankingFilter === 'ALL') return true;
    return t.prospectivity === rankingFilter;
  });

  const activeLayerCount = Object.values(layerStates).filter(Boolean).length;

  const layerCategories = [
    {
      title: 'EXPLORATION',
      items: [
        { id: 'prospectivity', name: 'Exploration Targets', color: '#10b981' },
        { id: 'mineralization', name: 'Drillholes & Intercepts', color: '#0284c7' },
        { id: 'occurrences', name: 'Mines & Occurrences', color: '#eab308' },
      ],
    },
    {
      title: 'GEOLOGY',
      items: [
        { id: 'geology', name: 'Geological Units (Sausar)', color: '#f59e0b' },
        { id: 'lineaments', name: 'Structural Lineaments', color: '#ef4444' },
        { id: 'geomorphology', name: 'Geomorphology & Regolith', color: '#ec4899' },
      ],
    },
    {
      title: 'TERRAIN',
      items: [
        { id: 'terrain', name: 'Elevation & Relief', color: '#8b5cf6' },
      ],
    },
    {
      title: 'EARTH OBSERVATION',
      items: [
        { id: 'satellite', name: 'Sentinel-2 Spectral Indices', color: '#06b6d4' },
        { id: 'confidence', name: 'Spatial Confidence Grid', color: '#3b82f6' },
      ],
    },
  ];

  return (
    <div className="space-y-3.5 select-none">
      {/* SIMPLIFIED TOP TOOLBAR */}
      <div className="bg-white px-4 py-2.5 rounded-2xl border border-stone-200/90 shadow-sm flex flex-wrap items-center justify-between gap-3">
        {/* Left: View Controls */}
        <div className="flex items-center space-x-2.5">
          {/* Primary View Toggle: 2D MAP | 3D TERRAIN */}
          <div className="flex items-center bg-stone-100 p-0.5 rounded-xl border border-stone-300 shadow-2xs">
            <button
              onClick={() => setViewMode('2D')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer ${
                viewMode === '2D'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>2D MAP</span>
            </button>
            <button
              onClick={() => setViewMode('3D')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer ${
                viewMode === '3D'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>3D TERRAIN</span>
            </button>
          </div>

          {/* Grouped Layers Selector Dropdown */}
          <div className="relative" ref={layerPanelRef}>
            <button
              onClick={() => setShowLayerPanel(!showLayerPanel)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all flex items-center space-x-1.5 cursor-pointer ${
                showLayerPanel
                  ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                  : 'bg-white text-stone-700 hover:bg-stone-50 border-stone-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-stone-600" />
              <span>Layers ({activeLayerCount})</span>
              <ChevronDown className="w-3 h-3 ml-0.5 text-stone-400" />
            </button>

            {showLayerPanel && (
              <div 
                className="absolute left-0 top-full mt-2 w-80 max-w-[calc(100vw-32px)] bg-white border border-stone-300 rounded-2xl shadow-2xl p-3 z-[100] text-stone-800 animate-in fade-in zoom-in-95"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-200 text-xs">
                  <div className="flex items-center space-x-1.5">
                    <Layers className="w-4 h-4 text-amber-700" />
                    <span className="font-bold text-stone-900 uppercase tracking-wider text-[11px]">GIS Layer Overlays</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="space-x-1 text-stone-500 text-[11px]">
                      <button 
                        onClick={() => toggleAllLayers(true)} 
                        className="hover:text-stone-900 cursor-pointer font-semibold underline text-[11px]"
                      >
                        All
                      </button>
                      <span>|</span>
                      <button 
                        onClick={() => toggleAllLayers(false)} 
                        className="hover:text-stone-900 cursor-pointer font-semibold underline text-[11px]"
                      >
                        Clear
                      </button>
                    </div>
                    <button
                      onClick={() => setShowLayerPanel(false)}
                      className="p-1 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                      title="Close"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-[min(360px,50vh)] overflow-y-auto pr-1">
                  {layerCategories.map((cat) => (
                    <div key={cat.title} className="space-y-0.5">
                      <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider px-2 py-0.5 bg-stone-100/70 rounded">
                        {cat.title}
                      </div>
                      {cat.items.map((item) => {
                        const isActive = !!layerStates[item.id];
                        return (
                          <label 
                            key={item.id}
                            className="flex items-center justify-between p-1.5 rounded-lg hover:bg-stone-50 cursor-pointer text-xs transition-colors"
                          >
                            <div className="flex items-center space-x-2 min-w-0">
                              <input 
                                type="checkbox"
                                checked={isActive}
                                onChange={() => toggleLayer(item.id)}
                                className="accent-stone-800 rounded cursor-pointer w-3.5 h-3.5 shrink-0"
                              />
                              <span className={`text-xs truncate ${isActive ? 'text-stone-900 font-medium' : 'text-stone-500'}`}>
                                {item.name}
                              </span>
                            </div>
                            <span 
                              className="w-2.5 h-2.5 rounded-full shrink-0 border border-stone-300" 
                              style={{ backgroundColor: item.color }} 
                            />
                          </label>
                        );
                      })}
                    </div>
                  ))}
                </div>

                <div className="mt-2 pt-2 border-t border-stone-200 flex items-center justify-between text-[10px] text-stone-500">
                  <span className="font-medium text-stone-400">Presets:</span>
                  <div className="space-x-1.5">
                    <button 
                      onClick={() => setLayerPreset('geology')}
                      className="px-2 py-0.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer font-medium transition-colors"
                    >
                      Geology
                    </button>
                    <button 
                      onClick={() => setLayerPreset('ai')}
                      className="px-2 py-0.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer font-medium transition-colors"
                    >
                      Prospectivity
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center: Target Filter & Target Selector */}
        <div className="flex items-center space-x-2 flex-wrap">
          <div className="flex items-center bg-stone-100 p-0.5 rounded-xl border border-stone-200 text-xs">
            {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setRankingFilter(lvl)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  rankingFilter === lvl
                    ? 'bg-white text-stone-900 font-bold shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {lvl === 'ALL' ? 'All' : lvl.charAt(0) + lvl.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Compact Target Selector Dropdown */}
          <select
            value={selectedTarget.id}
            onChange={(e) => {
              const t = targets.find((item) => item.id === e.target.value);
              if (t) onSelectTarget(t);
            }}
            className="bg-stone-50 hover:bg-stone-100 border border-stone-300 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-stone-900 cursor-pointer focus:outline-hidden focus:border-amber-700 shadow-2xs"
          >
            {filteredTargets.map((t) => (
              <option key={t.id} value={t.id}>
                {t.code} &bull; {t.name} ({t.resourceSummary.targetResourceMt} Mt @ {t.resourceSummary.gradeMnPct}% Mn)
              </option>
            ))}
          </select>
        </div>

        {/* Right: Strong Action */}
        <div>
          <button
            onClick={() => onNavigateToResource(selectedTarget.id)}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs"
          >
            <span>Estimate Resource</span>
            <ChevronRight className="w-3.5 h-3.5 text-amber-300" />
          </button>
        </div>
      </div>

      {/* Target Pills Strip (Horizontal visual indicator) */}
      <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
        {filteredTargets.map((t) => {
          const isSelected = t.id === selectedTarget.id;
          const isHigh = t.prospectivity === 'HIGH';
          const dotColor = isHigh ? 'bg-emerald-600' : t.prospectivity === 'MEDIUM' ? 'bg-amber-600' : 'bg-stone-400';

          return (
            <button
              key={t.id}
              onClick={() => onSelectTarget(t)}
              className={`px-3 py-1 rounded-xl text-xs font-medium flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap border ${
                isSelected
                  ? 'bg-stone-900 text-white border-stone-900 shadow-xs font-bold'
                  : 'bg-white text-stone-600 hover:text-stone-900 hover:bg-stone-50 border-stone-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
              <span className="font-mono">{t.code}</span>
              <span className={`text-[11px] font-mono font-normal ${isSelected ? 'text-amber-300' : 'text-stone-500'}`}>
                {t.score.toFixed(2)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Workspace Layout: Map / 3D Canvas (8 cols) + Target Intelligence (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        {/* MAP / 3D CANVAS (8 Cols) */}
        <div className="lg:col-span-8 transition-all duration-200">
          <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm overflow-hidden relative isolate">
            {/* Viewport Canvas (2D GIS or 3D Subsurface) */}
            <div className="relative">
              {viewMode === '2D' ? (
                <ExplorationMap2D
                  targets={targets}
                  selectedTarget={selectedTarget}
                  onSelectTarget={onSelectTarget}
                  activeLayers={layerStates}
                  onToggleLayer={toggleLayer}
                  onToggleAll={toggleAllLayers}
                  onSetPreset={setLayerPreset}
                  drillholes={drillholes}
                />
              ) : (
                <Exploration3DViewer
                  target={selectedTarget}
                  targets={targets}
                  onSelectTarget={onSelectTarget}
                  drillholes={drillholes}
                  onViewResource={() => onNavigateToResource(selectedTarget.id)}
                />
              )}
            </div>
          </div>
        </div>

        {/* TARGET INTELLIGENCE PANEL (4 Cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white p-4.5 rounded-2xl border border-stone-200/90 shadow-sm space-y-3.5">
            {/* 1. TARGET HEADER */}
            <div className="pb-3 border-b border-stone-200">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block">
                    Exploration Target
                  </span>
                  <h3 className="text-xl font-bold text-stone-900 font-mono mt-0.5">TARGET {selectedTarget.code}</h3>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                    selectedTarget.prospectivity === 'HIGH'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : selectedTarget.prospectivity === 'MEDIUM'
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-stone-100 text-stone-700 border-stone-200'
                  }`}
                >
                  {selectedTarget.prospectivity} POTENTIAL
                </span>
              </div>
              <div className="text-xs text-stone-600 mt-1 flex items-center space-x-1.5">
                <span className="font-semibold text-stone-700">Location:</span>
                <span>{selectedTarget.name}</span>
              </div>
            </div>

            {/* 2. WHY? (Plain Language Geological Validation) */}
            <div className="space-y-2 bg-[#fcfbf9] p-3.5 rounded-xl border border-stone-200">
              <span className="text-xs font-bold text-stone-900 uppercase tracking-wide block">Why?</span>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-start space-x-2 text-stone-700">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span>Favourable geological setting (Mansar mica-schist host horizon)</span>
                </div>
                <div className="flex items-start space-x-2 text-stone-700">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span>Supporting structural evidence (Within {selectedTarget.evidence.structural.distM}m of regional shear corridor)</span>
                </div>
                <div className="flex items-start space-x-2 text-stone-700">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span>Supporting satellite evidence (Sentinel-2 SWIR alteration signature confirmed)</span>
                </div>
              </div>
            </div>

            {/* 3. ESTIMATED TARGET & KEY METRICS */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-[#fcfbf9] rounded-xl border border-stone-200">
                <span className="text-[10px] text-stone-500 uppercase font-medium block">Estimated Target</span>
                <span className="text-base font-bold font-mono text-stone-900">
                  {selectedTarget.resourceSummary.targetResourceMt} Mt
                </span>
              </div>
              <div className="p-2.5 bg-[#fcfbf9] rounded-xl border border-stone-200">
                <span className="text-[10px] text-stone-500 uppercase font-medium block">Estimated Grade</span>
                <span className="text-base font-bold font-mono text-stone-900">
                  {selectedTarget.resourceSummary.gradeMnPct}% Mn
                </span>
              </div>
              <div className="p-2.5 bg-[#fcfbf9] rounded-xl border border-stone-200">
                <span className="text-[10px] text-stone-500 uppercase font-medium block">Confidence</span>
                <span className="text-xs font-semibold text-amber-800">
                  {selectedTarget.confidence >= 75 ? 'Medium–High' : 'Medium'} ({selectedTarget.confidence}%)
                </span>
              </div>
              <div className="p-2.5 bg-[#fcfbf9] rounded-xl border border-stone-200">
                <span className="text-[10px] text-stone-500 uppercase font-medium block">Next Step</span>
                <span className="text-xs font-medium text-stone-800 truncate block">
                  Targeted drilling
                </span>
              </div>
            </div>

            {/* 4. VIEW EVIDENCE BUTTON (Progressive Disclosure) */}
            <button
              onClick={() => setIsEvidenceModalOpen(true)}
              className="w-full py-2 bg-[#f7f6f2] hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-xl border border-stone-300 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>View Evidence</span>
            </button>

            {/* 5. SUGGESTED EXPLORATION PRIORITY CALLOUT */}
            <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-xl space-y-1">
              <div className="flex items-center space-x-1.5 text-[10px] font-bold text-amber-900 uppercase tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                <span>Suggested Exploration Priority</span>
              </div>
              <p className="text-xs text-amber-950 leading-relaxed">
                High exploration potential combined with limited subsurface information makes <strong>Target {selectedTarget.code}</strong> a priority for further drilling to systematically resolve geological uncertainty.
              </p>
            </div>

            {/* 6. PRIMARY ACTION BUTTONS */}
            <div className="space-y-2 pt-1">
              <button
                onClick={() => onNavigateToResource(selectedTarget.id)}
                className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs rounded-xl flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-xs"
              >
                <span>Estimate Resource ({selectedTarget.resourceSummary.targetResourceMt} Mt)</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsCrossSectionModalOpen(true)}
                className="w-full py-2 bg-white hover:bg-stone-50 text-stone-700 text-xs font-medium rounded-xl border border-stone-300 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
              >
                <SplitSquareVertical className="w-3.5 h-3.5 text-stone-500" />
                <span>Cross-Section Schematic</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <EvidenceModal
        target={selectedTarget}
        isOpen={isEvidenceModalOpen}
        onClose={() => setIsEvidenceModalOpen(false)}
        onViewResource={() => onNavigateToResource(selectedTarget.id)}
      />

      <CrossSectionModal
        target={selectedTarget}
        drillholes={drillholes}
        isOpen={isCrossSectionModalOpen}
        onClose={() => setIsCrossSectionModalOpen(false)}
        onView3D={() => setViewMode('3D')}
      />
    </div>
  );
};
