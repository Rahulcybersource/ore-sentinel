import React from 'react';
import { useDashboardStore } from '../../store/useDashboardStore';

export const LeftPanel: React.FC = () => {
  const { strataLayers, toggleStrataLayer } = useDashboardStore();
  
  const activeCount = strataLayers.filter(l => l.visible).length;

  return (
    <div className="absolute left-6 top-4 z-30 w-72 flex flex-col space-y-3 pointer-events-auto" data-purpose="geological-layer-toggles">
      {/* Primary Layer Toggles Glass Card */}
      <div className="bg-white/82 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-white/80">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200/80">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-800">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </div>
            <h2 className="font-bold text-xs text-slate-800 uppercase tracking-wider">GIS Strata Layers</h2>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 bg-stone-200/70 text-slate-700 rounded-full font-mono">{activeCount}/{strataLayers.length} ON</span>
        </div>

        {/* Layer Checklist */}
        <div className="mt-3 space-y-2 text-xs">
          {strataLayers.map((layer, index) => {
            const colors = [
              'bg-violet-500/80',
              'bg-amber-500/80',
              'bg-emerald-500/80',
              'bg-blue-500/80',
              'bg-cyan-400/60'
            ];
            
            return (
              <label key={layer.id} className="flex items-center justify-between p-1.5 rounded-lg hover:bg-stone-100/70 cursor-pointer">
                <span className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    checked={layer.visible}
                    onChange={() => toggleStrataLayer(layer.id)}
                    className="rounded text-[#0B3B24] focus:ring-[#0B3B24] border-stone-300" 
                  />
                  <span className={`font-medium ${layer.visible ? 'text-slate-700' : 'text-slate-500'}`}>{layer.name}</span>
                </span>
                <span className={`w-3 h-3 rounded-full shadow-sm ${colors[index % colors.length]}`}></span>
              </label>
            );
          })}
        </div>

        {/* Perspective Preset Quick Selectors */}
        <div className="mt-4 pt-3 border-t border-stone-200/80 flex items-center justify-between">
          <span className="text-[10px] text-slate-500 font-semibold uppercase">Viewport Camera:</span>
          <div className="flex space-x-1">
            <button className="px-2 py-1 text-[11px] rounded bg-white shadow-sm font-bold text-slate-700 hover:bg-stone-50 border border-stone-200">3D Angled</button>
            <button className="px-2 py-1 text-[11px] rounded bg-stone-100 text-slate-600 hover:bg-white hover:shadow-sm">Nadir 2D</button>
            <button className="px-2 py-1 text-[11px] rounded bg-stone-100 text-slate-600 hover:bg-white hover:shadow-sm">Cutaway</button>
          </div>
        </div>
      </div>

      {/* Grade Legend Glass Card */}
      <div className="bg-white/82 backdrop-blur-md p-3.5 rounded-2xl shadow-lg border border-white/80 text-xs mt-3">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-[11px] uppercase tracking-wider text-slate-700">Manganese Grade Spectrum</span>
          <span className="text-[10px] text-slate-500">UNFC Code 111/122</span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-gradient-to-r from-stone-300 via-amber-400 via-emerald-500 to-indigo-600 shadow-inner"></div>
        <div className="flex justify-between text-[10px] font-mono text-slate-600 mt-1.5 font-bold">
          <span>&lt; 20% (Low)</span>
          <span>35% (Med)</span>
          <span>44% (Ferro)</span>
          <span className="text-indigo-700 font-extrabold">&gt; 50% Mn</span>
        </div>
      </div>
    </div>
  );
};
