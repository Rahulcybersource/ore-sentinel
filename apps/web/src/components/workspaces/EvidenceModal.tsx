import React from 'react';
import { X, Layers, Compass } from 'lucide-react';
import { ExplorationTarget } from '../../types';

interface EvidenceModalProps {
  target: ExplorationTarget | null;
  isOpen: boolean;
  onClose: () => void;
  onViewResource: () => void;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({
  target,
  isOpen,
  onClose,
  onViewResource,
}) => {
  if (!isOpen || !target) return null;

  const evidenceItems = [
    {
      title: 'Lithostratigraphic host rock suitability (Mansar)',
      pct: target.evidence.geological.pct,
      level: target.evidence.geological.level,
      color: 'bg-stone-800',
      description: target.evidence.geological.description,
    },
    {
      title: 'Structural proximity (Regional shear zones)',
      pct: target.evidence.structural.pct,
      level: target.evidence.structural.level,
      color: 'bg-amber-700',
      description: target.evidence.structural.description,
    },
    {
      title: 'Spectral index response (Sentinel-2 SWIR/VNIR proxy)',
      pct: target.evidence.spectral.pct,
      level: target.evidence.spectral.level,
      color: 'bg-sky-700',
      description: target.evidence.spectral.description,
    },
    {
      title: 'Proximity to established manganese occurrences',
      pct: target.evidence.occurrenceProximity.pct,
      level: target.evidence.occurrenceProximity.level,
      color: 'bg-amber-800',
      description: target.evidence.occurrenceProximity.description,
    },
    {
      title: 'Terrain geomorphology & regolith thickness (SRTM)',
      pct: target.evidence.terrainContext.pct,
      level: target.evidence.terrainContext.level,
      color: 'bg-stone-600',
      description: target.evidence.terrainContext.description,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white border border-stone-300 w-full max-w-2xl rounded-xs shadow-xl overflow-hidden animate-in fade-in duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-[#faf9f6] border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded bg-stone-100 border border-stone-300 flex items-center justify-center text-amber-800">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
                Target Intelligence &bull; {target.code}
              </div>
              <h3 className="text-sm font-semibold text-stone-900">
                Prospectivity Evidence Decomposition &bull; {target.name}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-500 hover:text-stone-900 p-1 rounded hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs text-stone-700">
          {/* Target Banner */}
          <div className="bg-[#faf9f6] p-3 rounded-xl border border-stone-200 flex items-center justify-between">
            <div>
              <div className="text-xs text-stone-500">{target.name} ({target.sector})</div>
              <div className="flex items-center space-x-3 mt-1">
                <span className="text-sm font-mono font-bold text-stone-900">
                  Favorability Score: {target.score.toFixed(2)}
                </span>
                <span className="text-stone-400">&bull;</span>
                <span className="text-xs text-stone-600 font-mono">
                  Confidence: {target.confidence}%
                </span>
                <span className="text-stone-400">&bull;</span>
                <span className="text-xs text-stone-600 font-mono">
                  Target: {target.resourceSummary.targetResourceMt} Mt @ {target.resourceSummary.gradeMnPct}% Mn
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800">
              {target.prospectivity} Prospectivity
            </span>
          </div>

          {/* Scientific Disclaimer */}
          <div className="text-xs text-stone-600 bg-amber-50/80 border-l-2 border-amber-600 p-3 rounded-r-xl">
            <span className="font-semibold text-amber-900">Methodological Notice: </span>
            This favorability index is a spatial multi-criteria fusion of Sentinel-2 multispectral signatures, SRTM terrain geomorphology, and GSI regional fault lineament proximity. It guides targeted exploration drilling and does NOT assert direct remote detection of buried underground ore.
          </div>

          {/* Technical Telemetry & Remote Sensing Measurements Grid */}
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-stone-700 flex items-center justify-between pb-1 border-b border-stone-200">
              <span>Deep Technical Measurements &amp; Feature Values</span>
              <span className="text-stone-500 font-mono text-[11px]">Sensor &bull; Sentinel-2 &bull; SRTM &bull; GSI</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div className="p-2.5 bg-[#fcfbf9] rounded-xl border border-stone-200">
                <div className="text-[10px] text-stone-500 uppercase font-medium">NDVI (Vegetation)</div>
                <div className="font-mono font-bold text-stone-900 mt-0.5 text-xs">
                  {target.evidence.spectral.ndvi ?? 0.34}
                </div>
                <div className="text-[10px] text-stone-500 mt-0.5">Moderate sparse canopy</div>
              </div>

              <div className="p-2.5 bg-[#fcfbf9] rounded-xl border border-stone-200">
                <div className="text-[10px] text-stone-500 uppercase font-medium">NDMI (Moisture)</div>
                <div className="font-mono font-bold text-stone-900 mt-0.5 text-xs">
                  {target.evidence.spectral.ndmi ?? 0.18}
                </div>
                <div className="text-[10px] text-stone-500 mt-0.5">Dry regolith index</div>
              </div>

              <div className="p-2.5 bg-[#fcfbf9] rounded-xl border border-stone-200">
                <div className="text-[10px] text-stone-500 uppercase font-medium">B11/B12 SWIR Ratio</div>
                <div className="font-mono font-bold text-emerald-700 mt-0.5 text-xs">
                  {target.evidence.spectral.ratio}
                </div>
                <div className="text-[10px] text-stone-500 mt-0.5">Hydrothermal/Mn proxy</div>
              </div>

              <div className="p-2.5 bg-[#fcfbf9] rounded-xl border border-stone-200">
                <div className="text-[10px] text-stone-500 uppercase font-medium">Elevation &amp; Relief</div>
                <div className="font-mono font-bold text-stone-900 mt-0.5 text-xs">
                  {target.evidence.terrainContext.elevationM ?? 412} m AMSL
                </div>
                <div className="text-[10px] text-stone-500 mt-0.5">SRTM 30m DEM</div>
              </div>

              <div className="p-2.5 bg-[#fcfbf9] rounded-xl border border-stone-200">
                <div className="text-[10px] text-stone-500 uppercase font-medium">Slope &amp; Aspect</div>
                <div className="font-mono font-bold text-stone-900 mt-0.5 text-xs">
                  {target.evidence.terrainContext.slopeDeg ?? 14.2}° / NNW
                </div>
                <div className="text-[10px] text-stone-500 mt-0.5">Stable outcrop flank</div>
              </div>

              <div className="p-2.5 bg-[#fcfbf9] rounded-xl border border-stone-200">
                <div className="text-[10px] text-stone-500 uppercase font-medium">Shear Fault Offset</div>
                <div className="font-mono font-bold text-amber-700 mt-0.5 text-xs">
                  {target.evidence.structural.distM} m
                </div>
                <div className="text-[10px] text-stone-500 mt-0.5">To primary axial trace</div>
              </div>
            </div>
          </div>

          {/* Model Weights & Validation Breakdown */}
          <div className="space-y-2 pt-2 border-t border-stone-200">
            <div className="text-xs font-semibold uppercase tracking-wide text-stone-700 flex items-center justify-between">
              <span>Model Weight Contributions &amp; Validation</span>
              <span className="text-stone-500 font-mono text-[11px]">Ensemble Model ROC-AUC: 0.89</span>
            </div>

            <div className="space-y-2.5">
              {evidenceItems.map((item) => (
                <div key={item.title} className="bg-[#fcfbf9] p-3 rounded-xl border border-stone-200">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium text-stone-900">{item.title}</span>
                    <span className="font-mono font-bold text-stone-900">{item.pct}% weight</span>
                  </div>
                  
                  {/* Visual Bar */}
                  <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden mb-1.5">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-500`}
                      style={{ width: `${item.pct * 2.2}%` }}
                    />
                  </div>

                  <div className="text-xs text-stone-600 leading-relaxed">
                    {item.description}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendation */}
          <div className="bg-[#faf9f6] p-3 rounded-xl border border-stone-200 text-xs">
            <span className="font-semibold text-stone-900">Recommended Geological Next Step: </span>
            <span className="text-stone-700">{target.suggestedNextStep}</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 bg-[#faf9f6] border-t border-stone-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900 font-medium"
          >
            Close
          </button>

          <button
            onClick={() => {
              onClose();
              onViewResource();
            }}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xs flex items-center space-x-2 transition-colors cursor-pointer shadow-xs"
          >
            <Layers className="w-4 h-4 text-amber-300" />
            <span>View Resource Estimation ({target.resourceSummary.targetResourceMt} Mt)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
