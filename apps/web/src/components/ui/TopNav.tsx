import React from 'react';
import { useDashboardStore } from '../../store/useDashboardStore';
import { TelemetryService } from '../../services/TelemetryService';
import { Link, useLocation } from 'react-router-dom';

export const TopNav: React.FC = () => {
  const location = useLocation();
  const { activeState, activeDistrict, activeYear, toggleAi } = useDashboardStore();
  const telemetry = TelemetryService.getDistrictTelemetry(activeState, activeDistrict, activeYear);
  
  const avgTemp = telemetry?.Avg_Temperature_C?.toFixed(1) || '--';

  return (
    <header className="w-full bg-[#FAF9F5] border-b border-stone-200/90 z-50 px-4 lg:px-8 py-2.5 shadow-sm" data-purpose="institutional-header">
      <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Institutional Identity & Insignia */}
        <div className="flex items-center space-x-3.5">
          <div className="flex items-center space-x-3">
            {/* Tricolor Bar Accent */}
            <div className="w-1.5 h-10 rounded-full bg-gradient-to-b from-[#FF9933] via-[#FFFFFF] to-[#138808] border border-stone-300"></div>
            {/* Emblem & MOIL Logo Unit */}
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#0B3B24] flex items-center justify-center text-white shadow-md font-black text-xl tracking-tighter">
                <span className="text-amber-400">M</span>X
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-base tracking-tight text-slate-900">Ore-Sentinel</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-100 text-amber-900 border border-amber-300">DEMO MODE • SIH26009</span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium leading-none mt-0.5">
                  Ministry of Steel, Govt of India • MOIL Limited Decision-Support Platform
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Live Space & Ground Telemetry Feeds */}
        <div className="hidden xl:flex items-center space-x-3 text-xs bg-white/70 py-1.5 px-3.5 rounded-xl border border-stone-200 shadow-sm" data-purpose="telemetry-bar">
          {/* Sentinel-2 Status */}
          <div className="flex items-center space-x-1.5 pr-3 border-r border-stone-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] text-slate-600 font-medium">Copernicus Sentinel-2 SWIR:</span>
            <span className="text-[11px] font-semibold text-emerald-800">Pass 18m ago (T-07 Alteration Sync)</span>
          </div>

          {/* MODIS Soil Moisture / Temperature */}
          <div className="flex items-center space-x-1.5 pr-3 border-r border-stone-200">
            <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
            </svg>
            <span className="text-[11px] text-slate-600 font-medium">NASA MODIS LST:</span>
            <span className="text-[11px] font-semibold text-slate-800">{avgTemp}°C Dry Track (Haulage Normal)</span>
          </div>

          {/* Pilot Sector */}
          <div className="flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span className="text-[11px] text-slate-500">Grid:</span>
            <span className="text-[11px] font-bold text-slate-700">{activeDistrict}, {activeState}</span>
          </div>
        </div>

        {/* Main Navigation Modules */}
        <nav className="flex items-center space-x-1 bg-stone-100/80 p-1 rounded-xl border border-stone-200/80 text-xs font-semibold" data-purpose="module-navigation">
          <Link to="/" className={`px-3.5 py-1.5 rounded-lg shadow-sm border flex items-center space-x-1.5 transition ${location.pathname === '/' ? 'bg-white text-slate-900 border-stone-200/80' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 border-transparent'}`}>
            <svg className={`w-4 h-4 ${location.pathname === '/' ? 'text-emerald-700' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
            </svg>
            <span>Spatial Reserves</span>
          </Link>
          <Link to="/intelligence" className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition border ${location.pathname === '/intelligence' ? 'bg-white text-slate-900 border-stone-200/80 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 border-transparent'}`}>
            <svg className={`w-4 h-4 ${location.pathname === '/intelligence' ? 'text-indigo-600' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
            </svg>
            <span>Advanced Intelligence</span>
          </Link>
        </nav>

        {/* Action & Voice AI Directive Trigger */}
        <div className="flex items-center space-x-2.5">
          <button 
            onClick={toggleAi}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center space-x-2 shadow-sm transition active:scale-95 cursor-pointer" 
            title="Ask ORE-SENTINEL AI Assistant"
          >
            <svg className="w-3.5 h-3.5 text-amber-400 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
              <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"></path>
            </svg>
            <span>Ask ORE-SENTINEL AI</span>
          </button>
          
          {/* User Badge */}
          <div className="flex items-center space-x-2 pl-2 border-l border-stone-200">
            <div className="w-8 h-8 rounded-full bg-[#0B3B24]/10 border border-[#0B3B24]/20 flex items-center justify-center text-xs font-bold text-[#0B3B24]">
              CGM
            </div>
            <div className="hidden sm:block text-left text-xs leading-none">
              <p className="font-bold text-slate-800">Chief Gen. Manager</p>
              <p className="text-[10px] text-slate-500">MOIL Balaghat Core</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
