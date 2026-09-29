import React from 'react';
import { 
  Compass, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { ExplorationTarget, WorkflowStep } from '../../types';
import { CURRENT_PRODUCTION_SUMMARY } from '../../data/productionData';
import { INITIAL_RECOMMENDATIONS } from '../../data/recommendationData';

interface OverviewDashboardProps {
  targets: ExplorationTarget[];
  onSelectTarget: (t: ExplorationTarget) => void;
  onNavigateToStep: (step: WorkflowStep) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  targets,
  onSelectTarget,
  onNavigateToStep,
}) => {
  // Key data points
  const highTargets = targets.filter((t) => t.prospectivity === 'HIGH');
  const topTarget = targets.find((t) => t.code === 'T-07') || highTargets[0] || targets[0];
  const primaryRecommendation = INITIAL_RECOMMENDATIONS[0];

  return (
    <div className="space-y-4 select-none text-stone-900 pb-2">
      {/* ======================================================== */}
      {/* 1. COMPACT EXECUTIVE IDENTITY HEADER                     */}
      {/* ======================================================== */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-bold tracking-tight text-stone-950 text-lg sm:text-xl">
              MANGNEX
            </h1>
            <span className="text-stone-300 font-light hidden sm:inline">&bull;</span>
            <span className="text-xs sm:text-sm font-semibold text-stone-800">
              Manganese Exploration &amp; Production Intelligence
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 font-semibold">
              Balaghat–Nagpur Belt
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-600">
            AI-assisted decision support for manganese exploration and production.
          </p>
        </div>

        {/* Operating status context */}
        <div className="flex items-center space-x-2 text-xs text-stone-500 font-mono shrink-0">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Day {CURRENT_PRODUCTION_SUMMARY.currentDay} of {CURRENT_PRODUCTION_SUMMARY.totalDays}</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. TODAY'S INTELLIGENCE (4 HIGH-VALUE STATUS CARDS)      */}
      {/* ======================================================== */}
      <div className="bg-[#faf9f6] p-3.5 sm:p-4 rounded-2xl border border-stone-200/90 shadow-2xs">
        <div className="flex items-center justify-between pb-2 border-b border-stone-200/80 mb-3">
          <span className="text-[11px] font-bold text-stone-900 uppercase tracking-wider">
            Today&apos;s Intelligence
          </span>
          <span className="text-[11px] text-stone-500 font-medium">
            10-Second Executive Status
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Exploration */}
          <div
            onClick={() => onNavigateToStep('explore')}
            className="bg-white p-3.5 rounded-xl border border-stone-200/80 hover:border-amber-400 transition-all cursor-pointer shadow-2xs group"
          >
            <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
              <span className="uppercase tracking-wider text-[10px] font-semibold">Exploration</span>
              <Compass className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-700 transition-colors" />
            </div>
            <div className="mt-1 flex items-baseline space-x-1.5">
              <span className="text-xl font-bold font-mono text-stone-950">{highTargets.length}</span>
              <span className="text-xs font-semibold text-emerald-800">high-priority targets</span>
            </div>
            <div className="text-[11px] text-stone-500 mt-0.5 truncate">
              Top: <strong className="text-stone-800 font-semibold">{topTarget.code} {topTarget.name}</strong>
            </div>
          </div>

          {/* Card 2: Production Status */}
          <div
            onClick={() => onNavigateToStep('predict')}
            className="bg-white p-3.5 rounded-xl border border-red-200/90 hover:border-red-400 transition-all cursor-pointer shadow-2xs group"
          >
            <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
              <span className="uppercase tracking-wider text-[10px] font-semibold text-red-700">Production</span>
              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
            </div>
            <div className="mt-1 flex items-baseline space-x-2">
              <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-800 font-mono">
                AT RISK
              </span>
              <span className="text-xs text-stone-600 font-medium">Below Target</span>
            </div>
            <div className="text-[11px] text-red-700 mt-0.5 font-medium truncate">
              Forecast: 48.2 kt vs 52.0 kt plan
            </div>
          </div>

          {/* Card 3: Expected Shortfall */}
          <div
            onClick={() => onNavigateToStep('predict')}
            className="bg-white p-3.5 rounded-xl border border-stone-200/80 hover:border-stone-300 transition-all cursor-pointer shadow-2xs group"
          >
            <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
              <span className="uppercase tracking-wider text-[10px] font-semibold">Expected Shortfall</span>
              <TrendingUp className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 transition-colors" />
            </div>
            <div className="mt-1 flex items-baseline space-x-1.5">
              <span className="text-xl font-bold font-mono text-red-600">3.8 kt</span>
              <span className="text-xs text-stone-500">(-7.3% gap)</span>
            </div>
            <div className="text-[11px] text-stone-500 mt-0.5 truncate">
              Main driver: <strong className="text-stone-700 font-semibold">Equipment downtime</strong>
            </div>
          </div>

          {/* Card 4: Action Recommendations */}
          <div
            onClick={() => onNavigateToStep('act')}
            className="bg-white p-3.5 rounded-xl border border-stone-200/80 hover:border-emerald-400 transition-all cursor-pointer shadow-2xs group"
          >
            <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
              <span className="uppercase tracking-wider text-[10px] font-semibold">Actions</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-stone-400 group-hover:text-emerald-700 transition-colors" />
            </div>
            <div className="mt-1 flex items-baseline space-x-1.5">
              <span className="text-xl font-bold font-mono text-stone-950">2</span>
              <span className="text-xs font-semibold text-stone-700">recommendations ready</span>
            </div>
            <div className="text-[11px] text-emerald-800 mt-0.5 font-medium truncate">
              +2.5 kt recoverable yield
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. MAIN BODY: WHAT NEEDS ATTENTION?                      */}
      {/*    Strict Hierarchy: STATUS → WHY? → WHAT NEXT?          */}
      {/* ======================================================== */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-stone-200">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-amber-700" />
            <h2 className="text-sm font-bold text-stone-950 uppercase tracking-wide">
              What Needs Attention?
            </h2>
          </div>
          <span className="text-xs text-stone-500 hidden sm:inline font-sans">
            Prioritized operational and exploration decisions
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
          {/* ---------------------------------------------------- */}
          {/* DECISION CARD 1: EXPLORATION TARGET                  */}
          {/* ---------------------------------------------------- */}
          <div className="p-4 rounded-xl bg-[#faf9f6] border border-stone-200/90 hover:border-stone-300 transition-all flex flex-col justify-between space-y-3.5 shadow-2xs">
            <div className="space-y-3">
              {/* Card Label & ID */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-stone-200 text-stone-800">
                  01 EXPLORATION TARGET
                </span>
                <span className="font-mono font-bold text-xs text-stone-950 bg-white px-2 py-0.5 rounded border border-stone-200">
                  {topTarget.code}
                </span>
              </div>

              {/* Status & Headline */}
              <div>
                <span className="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  HIGH EXPLORATION POTENTIAL
                </span>
                <div className="text-sm font-bold text-stone-950 mt-1">
                  {topTarget.name}
                </div>
              </div>

              {/* Metric Impact */}
              <div className="bg-white p-2.5 rounded-lg border border-stone-200 text-xs flex items-center justify-between">
                <span className="text-stone-500 font-medium">Estimated target:</span>
                <span className="font-mono font-bold text-stone-950">
                  {topTarget.resourceSummary.targetResourceMt} Mt @ {topTarget.resourceSummary.gradeMnPct}% Mn
                </span>
              </div>

              {/* Why It Matters */}
              <div className="text-xs space-y-0.5">
                <div className="text-stone-500 font-semibold text-[11px] uppercase tracking-wider">
                  Why:
                </div>
                <p className="text-stone-700 leading-relaxed text-[11px]">
                  Favourable geological setting and supporting structural and satellite evidence along the Sausar Group contact.
                </p>
              </div>

              {/* What Next */}
              <div className="text-xs space-y-0.5">
                <div className="text-stone-500 font-semibold text-[11px] uppercase tracking-wider">
                  What next:
                </div>
                <p className="text-stone-800 font-medium text-[11px]">
                  Targeted drilling (200m grid core boreholes)
                </p>
              </div>
            </div>

            {/* Direct Action */}
            <button
              onClick={() => {
                onSelectTarget(topTarget);
                onNavigateToStep('explore');
              }}
              className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <span>View Target</span>
              <ChevronRight className="w-3.5 h-3.5 text-amber-300" />
            </button>
          </div>

          {/* ---------------------------------------------------- */}
          {/* DECISION CARD 2: PRODUCTION RISK                     */}
          {/* ---------------------------------------------------- */}
          <div className="p-4 rounded-xl bg-red-50/40 border border-red-200/90 hover:border-red-300 transition-all flex flex-col justify-between space-y-3.5 shadow-2xs">
            <div className="space-y-3">
              {/* Card Label & ID */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-200">
                  02 PRODUCTION
                </span>
                <span className="font-mono font-bold text-xs text-red-700">
                  DAY {CURRENT_PRODUCTION_SUMMARY.currentDay}/30
                </span>
              </div>

              {/* Status & Headline */}
              <div>
                <span className="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-600 text-white shadow-2xs">
                  AT RISK
                </span>
                <div className="text-sm font-bold text-stone-950 mt-1">
                  Forecast is below current target
                </div>
              </div>

              {/* Planned vs Forecast vs Shortfall */}
              <div className="bg-white p-2.5 rounded-lg border border-red-200 text-xs space-y-1">
                <div className="flex items-center justify-between text-stone-600">
                  <span>Planned:</span>
                  <span className="font-mono font-semibold">52.0 kt</span>
                </div>
                <div className="flex items-center justify-between text-stone-600">
                  <span>Forecast:</span>
                  <span className="font-mono font-semibold">48.2 kt</span>
                </div>
                <div className="flex items-center justify-between font-bold pt-1 border-t border-stone-100 text-red-700">
                  <span>Expected shortfall:</span>
                  <span className="font-mono text-sm">-3.8 kt</span>
                </div>
              </div>

              {/* Why It Matters */}
              <div className="text-xs space-y-0.5">
                <div className="text-stone-500 font-semibold text-[11px] uppercase tracking-wider">
                  Why:
                </div>
                <p className="text-stone-700 leading-relaxed text-[11px]">
                  Equipment downtime (41% of deficit) at Balaghat deep shaft and haulage cycle congestion.
                </p>
              </div>

              {/* What Next */}
              <div className="text-xs space-y-0.5">
                <div className="text-stone-500 font-semibold text-[11px] uppercase tracking-wider">
                  What next:
                </div>
                <p className="text-stone-800 font-medium text-[11px]">
                  Review shift bottlenecks &amp; fleet reallocations
                </p>
              </div>
            </div>

            {/* Direct Action */}
            <button
              onClick={() => onNavigateToStep('predict')}
              className="w-full py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <span>View Production</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* ---------------------------------------------------- */}
          {/* DECISION CARD 3: RECOMMENDED ACTION                  */}
          {/* ---------------------------------------------------- */}
          <div className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-200/90 hover:border-emerald-300 transition-all flex flex-col justify-between space-y-3.5 shadow-2xs">
            <div className="space-y-3">
              {/* Card Label & ID */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                  03 RECOMMENDATION
                </span>
                <span className="font-mono font-bold text-xs text-emerald-800">
                  {primaryRecommendation.code} &bull; {primaryRecommendation.priority}
                </span>
              </div>

              {/* Status & Headline */}
              <div>
                <span className="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-700 text-white shadow-2xs">
                  IMPROVE EQUIPMENT AVAILABILITY
                </span>
                <div className="text-sm font-bold text-stone-950 mt-1">
                  {primaryRecommendation.title}
                </div>
              </div>

              {/* Expected Recovery Metric */}
              <div className="bg-white p-2.5 rounded-lg border border-emerald-200 text-xs flex items-center justify-between">
                <span className="text-stone-500 font-medium">Expected recovery:</span>
                <span className="font-mono font-bold text-emerald-800">
                  +{primaryRecommendation.expectedRecoveryTonnes.toLocaleString()} t yield
                </span>
              </div>

              {/* Why It Matters */}
              <div className="text-xs space-y-0.5">
                <div className="text-stone-500 font-semibold text-[11px] uppercase tracking-wider">
                  Why:
                </div>
                <p className="text-stone-700 leading-relaxed text-[11px]">
                  Equipment availability is currently the strongest production constraint across primary production stopes.
                </p>
              </div>

              {/* What Next */}
              <div className="text-xs space-y-0.5">
                <div className="text-stone-500 font-semibold text-[11px] uppercase tracking-wider">
                  What next:
                </div>
                <p className="text-stone-800 font-medium text-[11px]">
                  Reallocate loader to recover +1,600 t yield within 24–48 hours.
                </p>
              </div>
            </div>

            {/* Direct Action */}
            <button
              onClick={() => onNavigateToStep('act')}
              className="w-full py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <span>Review Action</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
