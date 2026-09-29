import React from 'react';
import { X, Layers } from 'lucide-react';
import { ExplorationTarget, Drillhole } from '../../types';

interface CrossSectionModalProps {
  target: ExplorationTarget | null;
  drillholes: Drillhole[];
  isOpen: boolean;
  onClose: () => void;
  onView3D: () => void;
}

export const CrossSectionModal: React.FC<CrossSectionModalProps> = ({
  target,
  drillholes,
  isOpen,
  onClose,
  onView3D,
}) => {
  if (!isOpen || !target) return null;

  const targetDrillholes = drillholes.filter((dh) => dh.targetId === target.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white border border-stone-300 w-full max-w-3xl rounded-xs shadow-xl overflow-hidden animate-in fade-in duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-[#faf9f6] border-b border-stone-200 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
              Interpreted Geological Cross-Section &bull; {target.code}
            </div>
            <h3 className="text-sm font-semibold text-stone-900">
              Schematic Dip-Section (Looking ENE Along Strike)
            </h3>
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
          {/* Subsurface schematic SVG cross section */}
          <div className="bg-[#faf9f6] p-4 rounded-xs border border-stone-200">
            <div className="flex items-center justify-between text-xs text-stone-500 mb-2 font-mono">
              <span>Section Line CS-07A (Dip {target.crossSection.dipAngleDeg}° North)</span>
              <span className="text-amber-800 font-semibold text-[10px]">SIMULATED INTERPRETATION ONLY</span>
            </div>

            <svg viewBox="0 0 700 320" className="w-full h-auto bg-white rounded-xs border border-stone-200">
              <defs>
                <pattern id="schistPattern" width="12" height="12" patternUnits="userSpaceOnUse">
                  <path d="M0,6 L12,6 M6,0 L6,12" stroke="#e7e5e4" strokeWidth="0.8" />
                </pattern>
                <pattern id="orePattern" width="8" height="8" patternUnits="userSpaceOnUse">
                  <circle cx="4" cy="4" r="1.5" fill="#b45309" />
                </pattern>
              </defs>

              {/* Surface Terrain Profile */}
              <path
                d="M 20 80 Q 180 65 350 75 T 680 90 L 680 300 L 20 300 Z"
                fill="#fafaf9"
              />
              <path
                d="M 20 80 Q 180 65 350 75 T 680 90"
                stroke="#15803d"
                strokeWidth="2.5"
                fill="none"
              />
              <text x="35" y="70" fill="#15803d" fontSize="10" fontFamily="monospace" fontWeight="bold">Surface Elevation (342m RL)</text>

              {/* Overburden saprolite layer */}
              <path
                d="M 20 80 Q 180 65 350 75 T 680 90 L 680 115 Q 350 100 20 105 Z"
                fill="#fef3c7"
                fillOpacity="0.7"
              />
              <text x="480" y="110" fill="#92400e" fontSize="9" fontFamily="monospace" fontWeight="bold">Lateritic Regolith & Saprolite (18m)</text>

              {/* Hanging wall Mansar Mica Schist */}
              <polygon points="20,105 380,100 480,290 20,290" fill="#f5f5f4" />
              <polygon points="20,105 380,100 480,290 20,290" fill="url(#schistPattern)" />
              <text x="120" y="190" fill="#57534e" fontSize="11" fontWeight="bold">Hanging Wall: Mansar Muscovite-Schist</text>

              {/* Manganese Mineralized Lode band */}
              <polygon
                points="380,100 420,100 530,295 480,295"
                fill="#b45309"
                fillOpacity="0.85"
                stroke="#78350f"
                strokeWidth="1.5"
              />
              <polygon points="380,100 420,100 530,295 480,295" fill="url(#orePattern)" fillOpacity="0.5" />

              {/* Annotation for ore body */}
              <line x1="450" y1="160" x2="560" y2="140" stroke="#78350f" strokeWidth="1" strokeDasharray="3,3" />
              <circle cx="450" cy="160" r="3" fill="#78350f" />
              <rect x="555" y="120" width="135" height="44" fill="#ffffff" rx="3" stroke="#b45309" strokeWidth="1" />
              <text x="563" y="135" fill="#78350f" fontSize="10" fontWeight="bold">Braunite Orebody Lode</text>
              <text x="563" y="148" fill="#44403c" fontSize="9" fontFamily="monospace">Dip: 68° N | Thick: ~8.5m</text>
              <text x="563" y="159" fill="#0369a1" fontSize="9" fontFamily="monospace">Mean Grade: 24.3% Mn</text>

              {/* Footwall: Sitasaongi Quartzite */}
              <polygon points="420,100 680,115 680,290 530,290" fill="#e7e5e4" />
              <text x="540" y="240" fill="#57534e" fontSize="11" fontWeight="bold">Footwall: Sitasaongi Quartzite</text>

              {/* Drillhole Traces */}
              {targetDrillholes.map((dh, index) => {
                const startX = 260 + index * 90;
                const startY = 72;
                const endX = startX + 35;
                const endY = startY + 160;
                const oreStartY = startY + (dh.mineralizedInterval[0] / dh.depthMeters) * 160;
                const oreEndY = startY + (dh.mineralizedInterval[1] / dh.depthMeters) * 160;

                return (
                  <g key={dh.id}>
                    <line x1={startX} y1={startY} x2={endX} y2={endY} stroke="#78716c" strokeWidth="1.5" strokeDasharray="3,3" />
                    <line
                      x1={startX + ((oreStartY - startY) / (endY - startY)) * (endX - startX)}
                      y1={oreStartY}
                      x2={startX + ((oreEndY - startY) / (endY - startY)) * (endX - startX)}
                      y2={oreEndY}
                      stroke="#dc2626"
                      strokeWidth="3.5"
                    />
                    <circle cx={startX} cy={startY} r="3" fill="#0284c7" />
                    <text x={startX - 15} y={startY - 6} fill="#0369a1" fontSize="9" fontFamily="monospace" fontWeight="bold">
                      {dh.code} ({dh.depthMeters}m)
                    </text>
                  </g>
                );
              })}

              {/* Grid / Depth marks */}
              <line x1="20" y1="150" x2="680" y2="150" stroke="#d6d3d1" strokeWidth="0.8" strokeDasharray="4,4" />
              <text x="25" y="145" fill="#78716c" fontSize="9" fontFamily="monospace">100m Depth Level (242m RL)</text>
              <line x1="20" y1="230" x2="680" y2="230" stroke="#d6d3d1" strokeWidth="0.8" strokeDasharray="4,4" />
              <text x="25" y="225" fill="#78716c" fontSize="9" fontFamily="monospace">200m Depth Level (142m RL)</text>
            </svg>
          </div>

          {/* Geological Geometry Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-[#faf9f6] p-2.5 rounded-xs border border-stone-200">
              <span className="text-stone-500 block text-[10px] uppercase font-semibold">Strike Length</span>
              <span className="font-bold font-mono text-stone-900">{target.crossSection.strikeLengthM} m</span>
            </div>
            <div className="bg-[#faf9f6] p-2.5 rounded-xs border border-stone-200">
              <span className="text-stone-500 block text-[10px] uppercase font-semibold">Dip Angle</span>
              <span className="font-bold font-mono text-stone-900">{target.crossSection.dipAngleDeg}° North</span>
            </div>
            <div className="bg-[#faf9f6] p-2.5 rounded-xs border border-stone-200">
              <span className="text-stone-500 block text-[10px] uppercase font-semibold">Host Formation</span>
              <span className="font-bold text-stone-900 truncate block">{target.crossSection.hostFormation}</span>
            </div>
            <div className="bg-[#faf9f6] p-2.5 rounded-xs border border-stone-200">
              <span className="text-stone-500 block text-[10px] uppercase font-semibold">Overburden</span>
              <span className="font-bold font-mono text-stone-900">{target.crossSection.overburdenThicknessM} m</span>
            </div>
          </div>

          <div className="bg-[#faf9f6] p-3 rounded-xs border border-stone-200 text-xs text-stone-700">
            <span className="font-semibold text-stone-900">Orebody Geometry: </span>
            {target.crossSection.oreBodyGeometry}. Drillhole intercepts confirm consistent braunite mineralization between 92m and 128m downhole.
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#faf9f6] border-t border-stone-200 flex items-center justify-between">
          <button onClick={onClose} className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900 font-medium">
            Close
          </button>
          <button
            onClick={() => {
              onClose();
              onView3D();
            }}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xs flex items-center space-x-2 transition-colors cursor-pointer shadow-xs"
          >
            <Layers className="w-4 h-4 text-amber-300" />
            <span>Open Sub-Surface 3D Terrain Viewer</span>
          </button>
        </div>
      </div>
    </div>
  );
};
