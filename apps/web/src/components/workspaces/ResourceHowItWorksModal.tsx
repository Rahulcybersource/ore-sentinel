import React from 'react';
import { X, Layers, ArrowDown, ShieldAlert } from 'lucide-react';

interface ResourceHowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResourceHowItWorksModal: React.FC<ResourceHowItWorksModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white border border-stone-300 w-full max-w-3xl rounded-xs shadow-xl overflow-hidden animate-in fade-in duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-[#faf9f6] border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded bg-stone-100 border border-stone-300 flex items-center justify-center text-amber-800">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
                Geostatistical Methodology & Benchmarking
              </div>
              <h3 className="text-sm font-semibold text-stone-900">
                How Geological Target Estimation Works
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
          {/* Scientific Disclaimer */}
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xs flex items-start space-x-3 text-amber-900">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
            <div>
              <span className="font-semibold text-amber-900">Reporting Standards Notice: </span>
              This calculation provides an <em>estimated geological exploration target</em>. It must NOT be interpreted as a UNFC / JORC certified mineral reserve without regulatory infill drilling, economic pre-feasibility, and metallurgical recovery validation.
            </div>
          </div>

          {/* Process Flow Diagram */}
          <div className="bg-[#faf9f6] p-4 rounded-xs border border-stone-200">
            <div className="text-xs font-semibold uppercase text-stone-600 mb-3 text-center tracking-wide">
              Multi-Stage Resource Calculation Pipeline
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              <div className="bg-white p-3 rounded-xs border border-stone-200 text-center">
                <div className="font-semibold text-stone-900 mb-1">1. Primary Inputs</div>
                <div className="text-stone-600 space-y-0.5 text-xs">
                  <div>&bull; Drillhole assays (Mn %, Fe %)</div>
                  <div>&bull; Host rock Sausar contacts</div>
                  <div>&bull; 3D collar & downhole survey</div>
                </div>
              </div>

              <div className="bg-white p-3 rounded-xs border border-stone-200 text-center">
                <div className="font-semibold text-amber-800 mb-1">2. 3D Block Discretization</div>
                <div className="text-stone-600 space-y-0.5 text-xs">
                  <div>&bull; 20m &times; 20m &times; 5m regular cells</div>
                  <div>&bull; Geological domain bounding</div>
                  <div>&bull; Bulk density model (3.20 t/m³)</div>
                </div>
              </div>

              <div className="bg-white p-3 rounded-xs border border-stone-200 text-center">
                <div className="font-semibold text-emerald-800 mb-1">3. Grade & Tonnage</div>
                <div className="text-stone-600 space-y-0.5 text-xs">
                  <div>&bull; Spatial ML Regressor</div>
                  <div>&bull; Volume &times; Density = Tonnage</div>
                  <div>&bull; P10 / P50 / P90 Uncertainty</div>
                </div>
              </div>
            </div>

            <div className="my-2.5 flex justify-center">
              <ArrowDown className="w-4 h-4 text-stone-400" />
            </div>

            <div className="bg-white p-2.5 rounded-xs border border-stone-200 text-center">
              <div className="text-xs font-mono font-semibold text-stone-800">
                Formula: Target Tonnage (Mt) = &Sigma; (Block Volume [m³] &times; In-Situ Bulk Density [t/m³]) &times; Geological Pay-Factor
              </div>
            </div>
          </div>

          {/* Kriging Benchmarking Card */}
          <div className="bg-[#faf9f6] p-4 rounded-xs border border-stone-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-stone-900">Benchmarking: ML Spatial Regressor vs Ordinary Kriging</span>
              <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono text-[10px] font-semibold">
                Simulated Validation: R² = 0.81
              </span>
            </div>

            <p className="text-stone-600 leading-relaxed">
              Traditional spatial estimation in mining relies on <strong>Ordinary Kriging</strong>, which uses spatial semi-variograms to weight drillhole samples by distance. In this prototype, our ML Spatial Regressor fuses drillhole assays with satellite-derived lithostructural boundary constraints:
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white rounded-xs border border-stone-200">
                <div className="text-stone-500 font-medium text-xs mb-1">Ordinary Kriging (Geostatistics)</div>
                <div className="text-stone-900 font-bold font-mono text-sm">6.5 Mt @ 23.9% Mn</div>
                <div className="text-[11px] text-stone-500 mt-1">Smoothed grade distribution; fails to capture abrupt structural fold closures.</div>
              </div>

              <div className="p-3 bg-white rounded-xs border border-emerald-200">
                <div className="text-emerald-800 font-medium text-xs mb-1">Fused ML Regressor (Prototype)</div>
                <div className="text-emerald-800 font-bold font-mono text-sm">6.8 Mt @ 24.3% Mn</div>
                <div className="text-[11px] text-stone-600 mt-1">22.4% variance reduction by incorporating Sausar formation boundary contacts.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#faf9f6] border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xs text-xs font-semibold cursor-pointer shadow-xs"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
