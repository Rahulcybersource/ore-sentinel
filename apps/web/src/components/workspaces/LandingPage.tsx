import React from 'react';
import { 
  Compass, 
  Layers, 
  TrendingUp, 
  Sliders, 
  CheckSquare, 
  ArrowRight, 
  ShieldCheck, 
  Database,
  MapPin
} from 'lucide-react';
import { MainTab } from './Header';

interface LandingPageProps {
  onEnter: () => void;
  onNavigateTo: (tab: MainTab) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter, onNavigateTo }) => {
  const steps = [
    {
      step: '01',
      title: 'EXPLORATION',
      tab: 'exploration' as MainTab,
      question: 'Where are prospective zones located?',
      icon: Compass,
      desc: 'Multi-source satellite and GIS fusion prioritizing prospective manganese targets.',
    },
    {
      step: '02',
      title: 'RESOURCE',
      tab: 'resource' as MainTab,
      question: 'What is estimated tonnage & grade?',
      icon: Layers,
      desc: 'P10 / P50 / P90 target range estimation benchmarked against Ordinary Kriging.',
    },
    {
      step: '03',
      title: 'PRODUCTION',
      tab: 'production' as MainTab,
      question: 'Will operations meet dispatch targets?',
      icon: TrendingUp,
      desc: 'Shift telemetry and haul analytics forecasting dispatch shortfalls weeks early.',
    },
    {
      step: '04',
      title: 'SCENARIOS',
      tab: 'scenarios' as MainTab,
      question: 'What is the impact of operational changes?',
      icon: Sliders,
      desc: 'What-if simulator testing fleet reallocation, blast timing, and stockpile blending.',
    },
    {
      step: '05',
      title: 'ACTIONS',
      tab: 'actions' as MainTab,
      question: 'What are highest-impact interventions?',
      icon: CheckSquare,
      desc: 'Ranked operational directives prioritized by recovered tonnage and feasibility.',
    },
  ];

  return (
    <div className="min-h-[calc(100vh-100px)] bg-[#fbfaf8] text-stone-900 flex flex-col justify-between p-4 sm:p-6 lg:p-7 max-w-7xl mx-auto select-none">
      {/* Editorial Authority Header */}
      <div className="pt-2 sm:pt-5 text-center max-w-4xl mx-auto space-y-3">
        <div className="inline-flex items-center space-x-2.5 px-3.5 py-1 rounded-full bg-stone-100/90 border border-stone-300/80 text-stone-700 text-xs shadow-xs backdrop-blur-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
          <span className="font-semibold tracking-wide font-mono">Ore-Sentinel &bull; SIH26009</span>
          <span className="text-stone-300">|</span>
          <span className="text-stone-600">PROPOSED AI DECISION-SUPPORT FOR MOIL</span>
        </div>

        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-stone-900 font-serif">
          Ore-Sentinel <br className="hidden sm:inline" />
          <span className="text-stone-800 text-xl sm:text-3xl font-normal block mt-1 font-sans">
            Manganese Exploration &amp; Production Intelligence
          </span>
        </h1>

        <p className="text-sm sm:text-base text-stone-600 max-w-2xl mx-auto leading-relaxed">
          Unified decision-support platform integrating Earth observation, drillhole assays, and shift telemetry to accelerate discovery and resolve production shortfalls in the Balaghat–Nagpur Belt.
        </p>

        {/* Primary Command CTAs */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <button
            id="enter-mine-intelligence-btn"
            onClick={onEnter}
            className="w-full sm:w-auto px-5 py-3 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs tracking-wide rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-[0.99]"
          >
            <span>Launch Intelligence Center</span>
            <ArrowRight className="w-4 h-4 text-amber-400" />
          </button>

          <button
            onClick={() => onNavigateTo('exploration')}
            className="w-full sm:w-auto px-4 py-3 bg-white hover:bg-stone-50 text-stone-800 font-medium text-xs tracking-wide rounded-xl border border-stone-300 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2 active:scale-[0.99]"
          >
            <Compass className="w-3.5 h-3.5 text-amber-700" />
            <span>Open 2D / 3D Exploration Map</span>
          </button>

          <button
            onClick={() => onNavigateTo('sihmatrix')}
            className="w-full sm:w-auto px-4 py-3 bg-white hover:bg-stone-50 text-stone-600 hover:text-stone-900 font-medium text-xs tracking-wide rounded-xl border border-stone-200 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-center active:scale-[0.99]"
          >
            <span>SIH26009 Traceability Matrix</span>
          </button>
        </div>

        {/* Telemetry Specification Strip */}
        <div className="pt-1 flex justify-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-3.5 py-1 rounded-full bg-stone-100/70 border border-stone-200 text-xs text-stone-500 font-mono shadow-2xs">
            <span>PILOT: BALAGHAT–NAGPUR (21.80°N, 80.18°E)</span>
            <span className="text-stone-300">&bull;</span>
            <span>FORMATION: SAUSAR GROUP PRECAMBRIAN</span>
            <span className="text-stone-300">&bull;</span>
            <span>DATUM: WGS84 / UTM ZONE 44N</span>
          </div>
        </div>
      </div>

      {/* Editorial 5-Stage Pipeline */}
      <div className="my-5 sm:my-6">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-stone-200">
          <div className="text-xs uppercase font-semibold tracking-wider text-stone-500">
            Core Decision Flow — 5 Interlinked Workspaces
          </div>
          <div className="text-xs font-semibold text-amber-800">
            End-to-End Problem Resolution
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {steps.map((item) => {
            const Icon = item.icon;
            return (
              <div 
                key={item.step}
                onClick={() => onNavigateTo(item.tab)}
                className="bg-white border border-stone-200 hover:border-amber-600/50 p-3.5 sm:p-4 rounded-2xl transition-all cursor-pointer group flex flex-col justify-between shadow-xs hover:shadow-md hover:-translate-y-0.5"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 group-hover:bg-amber-50 group-hover:text-amber-800 transition-colors">
                      STAGE {item.step}
                    </span>
                    <div className="w-6 h-6 rounded-full bg-stone-50 group-hover:bg-amber-50 flex items-center justify-center transition-colors">
                      <Icon className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-800 transition-colors" />
                    </div>
                  </div>

                  <div className="text-sm font-semibold text-stone-900 group-hover:text-amber-800 flex items-center justify-between mt-1">
                    <span>{item.title}</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-amber-800" />
                  </div>

                  <div className="text-xs text-amber-800 font-medium my-1.5 leading-snug">
                    "{item.question}"
                  </div>

                  <p className="text-xs text-stone-600 leading-relaxed mt-1.5">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-3.5 pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                  <span className="group-hover:text-stone-900 font-medium">Open Workspace</span>
                  <span className="text-amber-800">&rarr;</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scientific Honesty & Pilot Context Footer */}
      <div className="bg-white border border-stone-200 rounded-2xl p-3.5 text-xs text-stone-600 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center space-x-2.5">
          <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
          </div>
          <span className="leading-relaxed text-[11px] sm:text-xs">
            <strong className="text-stone-900 font-semibold">Scientific Rigor Protocol:</strong> Surface indices delineate alteration and structures; subsurface estimates are uncertainty-bounded (P10/P50/P90) benchmarked against Ordinary Kriging geostatistics.
          </span>
        </div>
        <div className="flex items-center space-x-2 shrink-0 font-mono text-[11px] text-stone-500 bg-stone-50 px-3 py-1 rounded-full border border-stone-200/60">
          <span>BALAGHAT</span>
          <span className="text-stone-300">&bull;</span>
          <span>DONGRI BUZURG</span>
          <span className="text-stone-300">&bull;</span>
          <span>TIRODI</span>
          <span className="text-stone-300">&bull;</span>
          <span>MANSAR</span>
        </div>
      </div>
    </div>
  );
};
