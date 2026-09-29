import React from 'react';
import { GitBranch, ShieldCheck } from 'lucide-react';

export const SystemArchitectureView: React.FC = () => {
  return (
    <div className="space-y-3.5 select-none">
      {/* Header */}
      <div className="bg-white p-4 rounded-xs border border-stone-200 shadow-xs">
        <div className="flex items-center space-x-2 text-xs font-semibold text-stone-900 mb-1">
          <GitBranch className="w-4 h-4 text-amber-700" />
          <span>SYSTEM ARCHITECTURE</span>
        </div>
        <h2 className="text-base font-semibold text-stone-900">Multi-Source Spatial & Production Intelligence Pipeline</h2>
        <p className="text-xs text-stone-600 mt-1">
          End-to-end processing pipeline: Ingestion &bull; Preprocessing &bull; Spatial Feature Engineering &bull; Predictive Forecasting &bull; Decision Directives.
        </p>
      </div>

      {/* Architecture Stages */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Layer 1: Ingestion */}
        <div className="bg-white p-4 rounded-xs border border-stone-200 shadow-xs space-y-2.5">
          <div className="w-7 h-7 rounded bg-stone-100 border border-stone-300 flex items-center justify-center text-stone-800 font-mono font-bold text-xs">
            01
          </div>
          <h3 className="text-xs font-semibold text-stone-900 uppercase tracking-wide">Multi-Source Ingestion</h3>
          <p className="text-xs text-stone-600">Heterogeneous earth observation, sensor, and ERP ingestion</p>
          <div className="p-2.5 bg-[#fcfbf9] rounded-xs border border-stone-200 text-xs text-stone-700 space-y-1">
            <div>&bull; Sentinel-2 MSI (10m bands)</div>
            <div>&bull; SRTM / ASTER Elevation DEM</div>
            <div>&bull; GSI 1:50k Sausar Lithology</div>
            <div>&bull; Daily Shift Production Logs (Proxy)</div>
            <div>&bull; CHIRPS / IMD Weather Grids</div>
          </div>
        </div>

        {/* Layer 2: Spatial AI Engine */}
        <div className="bg-white p-4 rounded-xs border border-stone-200 shadow-xs space-y-2.5">
          <div className="w-7 h-7 rounded bg-amber-50 border border-amber-300 flex items-center justify-center text-amber-800 font-mono font-bold text-xs">
            02
          </div>
          <h3 className="text-xs font-semibold text-stone-900 uppercase tracking-wide">Spatial Prospectivity</h3>
          <p className="text-xs text-stone-600">Prospectivity modeling and block discretization</p>
          <div className="p-2.5 bg-[#fcfbf9] rounded-xs border border-stone-200 text-xs text-stone-700 space-y-1">
            <div>&bull; Band Ratio Indices (SWIR1/SWIR2)</div>
            <div>&bull; Structural Proximity to Faults</div>
            <div>&bull; Mansar Formation Pay-Zones</div>
            <div>&bull; 3D Block Discretization (20m)</div>
            <div>&bull; Kriging vs ML Regressor</div>
          </div>
        </div>

        {/* Layer 3: Production Forecasting */}
        <div className="bg-white p-4 rounded-xs border border-stone-200 shadow-xs space-y-2.5">
          <div className="w-7 h-7 rounded bg-red-50 border border-red-300 flex items-center justify-center text-red-800 font-mono font-bold text-xs">
            03
          </div>
          <h3 className="text-xs font-semibold text-stone-900 uppercase tracking-wide">Production Forecast</h3>
          <p className="text-xs text-stone-600">Time-series forecasting and causal attribution</p>
          <div className="p-2.5 bg-[#fcfbf9] rounded-xs border border-stone-200 text-xs text-stone-700 space-y-1">
            <div>&bull; Cumulative Shift Run-rates</div>
            <div>&bull; Fleet Availability Regressors</div>
            <div>&bull; Blasting Clearance Delay Lag</div>
            <div>&bull; Precipitation Infiltration Bias</div>
            <div>&bull; Shapley Causal Decomposition</div>
          </div>
        </div>

        {/* Layer 4: Decision Support */}
        <div className="bg-white p-4 rounded-xs border border-stone-200 shadow-xs space-y-2.5">
          <div className="w-7 h-7 rounded bg-emerald-50 border border-emerald-300 flex items-center justify-center text-emerald-800 font-mono font-bold text-xs">
            04
          </div>
          <h3 className="text-xs font-semibold text-stone-900 uppercase tracking-wide">Decision & What-If</h3>
          <p className="text-xs text-stone-600">Scenario simulation and ranked corrective action</p>
          <div className="p-2.5 bg-[#fcfbf9] rounded-xs border border-stone-200 text-xs text-stone-700 space-y-1">
            <div>&bull; Sensitivity Sliders</div>
            <div>&bull; Fleet Reallocation Optimizer</div>
            <div>&bull; Blasting Shift Synchronization</div>
            <div>&bull; High-Grade Balaghat Surge</div>
            <div>&bull; Operational Action Plan Export</div>
          </div>
        </div>
      </div>

      {/* Security and Governance */}
      <div className="bg-white p-4 rounded-xs border border-stone-200 shadow-xs flex items-start space-x-3">
        <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
        <div className="text-xs">
          <div className="font-semibold text-stone-900 uppercase text-xs">National Mineral & Spatial Data Compliance</div>
          <p className="text-stone-600 mt-0.5 leading-relaxed">
            Engineered for deployment on private sovereign cloud infrastructure. Complies with National Geospatial Policy (2022) guidelines for high-resolution topographical and mineral reserve datasets.
          </p>
        </div>
      </div>
    </div>
  );
};
