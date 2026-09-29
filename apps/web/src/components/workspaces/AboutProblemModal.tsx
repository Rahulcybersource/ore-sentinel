import React from 'react';
import { X, ShieldCheck, Compass, TrendingUp, Award } from 'lucide-react';
import { SYSTEM_METADATA } from '../../data/systemMetadata';

interface AboutProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutProblemModal: React.FC<AboutProblemModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white border border-stone-300 w-full max-w-3xl rounded-xs shadow-xl overflow-hidden animate-in fade-in duration-150">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-[#faf9f6] border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded bg-stone-100 border border-stone-300 flex items-center justify-center text-amber-800">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
                Smart India Hackathon 2026 &bull; SIH26009
              </div>
              <h3 className="text-sm font-semibold text-stone-900">
                Manganese Reserve & Production Decision Intelligence Platform
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
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs text-stone-700">
          {/* Official Problem Statement Identification */}
          <div className="bg-[#faf9f6] p-4 rounded-xs border border-stone-200 space-y-2">
            <div className="text-stone-500 uppercase text-[10px] font-semibold tracking-wide">Problem Statement Details</div>
            <div className="text-stone-900 font-semibold text-sm">
              SIH26009: Using AI/ML and Space Technology to Identify Manganese Reserves and Overcome Production Shortfalls
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded bg-white border border-stone-200 text-stone-700">
                Organization: MOIL Limited
              </span>
              <span className="px-2 py-0.5 rounded bg-white border border-stone-200 text-stone-700">
                Ministry: Ministry of Steel, Govt. of India
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 font-medium">
                PROTOTYPE DEMONSTRATION MODE
              </span>
            </div>
          </div>

          {/* Two Core Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="bg-[#faf9f6] p-4 rounded-xs border border-stone-200 space-y-1.5">
              <div className="flex items-center space-x-2 text-amber-800 font-semibold text-xs">
                <Compass className="w-4 h-4" />
                <span>PILLAR 1: EXPLORATION & RESERVES</span>
              </div>
              <p className="text-stone-600 leading-relaxed text-xs">
                Integrates multi-source Earth observation (Sentinel-2 MSI, Landsat-8/9, ASTER DEM) with GSI Sausar Group structural lineaments, lithological units (Mansar formation), and drillhole records to calculate target favorability without pseudoscience.
              </p>
            </div>

            <div className="bg-[#faf9f6] p-4 rounded-xs border border-stone-200 space-y-1.5">
              <div className="flex items-center space-x-2 text-emerald-800 font-semibold text-xs">
                <TrendingUp className="w-4 h-4" />
                <span>PILLAR 2: PRODUCTION SHORTFALL CONTROL</span>
              </div>
              <p className="text-stone-600 leading-relaxed text-xs">
                Combines shift-level actuals, equipment availability, monsoon rainfall, and blasting delays with ML regressors to predict month-end shortfalls early, test What-If scenarios, and deliver prioritized corrective actions.
              </p>
            </div>
          </div>

          {/* Data Honesty & Reality Matrix */}
          <div className="bg-[#faf9f6] p-4 rounded-xs border border-stone-200 space-y-2.5">
            <div className="font-semibold text-stone-900 text-xs flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Scientific Honesty & Reality Matrix</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              <div className="p-3 bg-white rounded-xs border border-stone-200">
                <div className="font-semibold text-emerald-800 mb-1 text-xs">Real GIS & Spatial Logic</div>
                <div className="text-stone-600 leading-relaxed text-xs">
                  Actual geographic coordinates for Balaghat, Tirodi, Dongri Buzurg, Kandri, and Mansar mines. Sausar belt structural synclinal corridor geometry.
                </div>
              </div>

              <div className="p-3 bg-white rounded-xs border border-stone-200">
                <div className="font-semibold text-amber-800 mb-1 text-xs">Simulated / Proxy Data</div>
                <div className="text-stone-600 leading-relaxed text-xs">
                  Subsurface 3D block models, daily shift equipment logs, and drillhole intercepts are representative operational proxies generated to demonstrate decision-support logic.
                </div>
              </div>

              <div className="p-3 bg-white rounded-xs border border-stone-200">
                <div className="font-semibold text-stone-900 mb-1 text-xs">Decision Support Scope</div>
                <div className="text-stone-600 leading-relaxed text-xs">
                  Target grade and tonnage represent exploration target ranges under UNFC guidelines, not regulatory certified reserves. Designed for operational shift planners and mine management.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-[#faf9f6] border-t border-stone-200 flex justify-between items-center">
          <span className="text-xs text-stone-500 font-mono">Version {SYSTEM_METADATA.version} &bull; Smart India Hackathon</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xs text-xs font-semibold cursor-pointer shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
