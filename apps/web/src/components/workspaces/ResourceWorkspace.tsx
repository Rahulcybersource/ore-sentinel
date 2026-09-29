import React, { useState } from 'react';
import { 
  Layers, 
  HelpCircle, 
  ArrowRight, 
  ShieldAlert, 
  TrendingUp, 
  Compass, 
  ChevronDown,
  ChevronUp,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  Binary,
  Microscope,
  Info,
  ExternalLink
} from 'lucide-react';
import { ExplorationTarget } from '../../types';
import { TARGET_RESOURCE_MODELS } from '../../data/resourceData';
import { DRILLHOLES } from '../../data/explorationData';
import { ResourceHowItWorksModal } from './ResourceHowItWorksModal';
import { CrossSectionModal } from './CrossSectionModal';

interface ResourceWorkspaceProps {
  targets: ExplorationTarget[];
  selectedTarget: ExplorationTarget;
  onSelectTarget: (target: ExplorationTarget) => void;
  onNavigateToProduction: () => void;
  onNavigateToExploration: () => void;
}

export const ResourceWorkspace: React.FC<ResourceWorkspaceProps> = ({
  targets,
  selectedTarget,
  onSelectTarget,
  onNavigateToProduction,
  onNavigateToExploration,
}) => {
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [isCrossSectionOpen, setIsCrossSectionOpen] = useState(false);
  const [showTechnicalBasis, setShowTechnicalBasis] = useState(false);

  const modelData = TARGET_RESOURCE_MODELS[selectedTarget.id] || TARGET_RESOURCE_MODELS['T-07'];

  // Format confidence display:
  const confidenceLabel = 
    selectedTarget.id === 'T-07' 
      ? 'Medium–High' 
      : selectedTarget.resourceSummary.confidence === 'HIGH' 
        ? 'High' 
        : selectedTarget.resourceSummary.confidence === 'MEDIUM' 
          ? 'Medium–High' 
          : 'Low–Medium';

  return (
    <div className="space-y-4 select-none pb-8">
      {/* 1. TOP COMMAND BAR */}
      <div className="bg-white px-4 py-3 rounded-2xl border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-stone-900 tracking-wide font-mono">
            <Layers className="w-4 h-4 text-amber-700" />
            <span>02 RESOURCE ESTIMATION</span>
          </div>
          <span className="text-stone-300 hidden sm:inline">|</span>
          <div className="text-xs text-stone-600 hidden sm:inline">
            Answers: <strong className="text-stone-900">What could be there?</strong> &bull; Estimated Geological Resource
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onNavigateToExploration}
            className="px-3 py-1.5 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold rounded-xl border border-stone-300 flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
            title="Return to Exploration 2D / 3D Viewer"
          >
            <Compass className="w-3.5 h-3.5 text-stone-600" />
            <span>Return to Explore</span>
          </button>

          <button
            onClick={onNavigateToProduction}
            className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <span>Proceed to Production Forecast</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
          </button>
        </div>
      </div>

      {/* 2. TARGET SELECTOR TABS */}
      <div className="bg-white px-4 py-2 rounded-xl border border-stone-200 shadow-xs flex items-center space-x-2 overflow-x-auto no-scrollbar">
        <span className="text-xs text-stone-500 uppercase font-semibold mr-1 shrink-0">Select Target:</span>
        {targets.map((t) => {
          const isSelected = t.id === selectedTarget.id;
          return (
            <button
              key={t.id}
              onClick={() => onSelectTarget(t)}
              className={`px-3 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer shrink-0 border ${
                isSelected
                  ? 'bg-stone-900 text-white border-stone-900 font-semibold shadow-xs'
                  : 'bg-stone-50 text-stone-700 hover:text-stone-950 hover:bg-stone-100 border-stone-200'
              }`}
            >
              <span className="font-mono font-bold">{t.code}</span> &bull; {t.resourceSummary.targetResourceMt} Mt @ {t.resourceSummary.gradeMnPct}% Mn
            </button>
          );
        })}
      </div>

      {/* 3. FIRST VIEW: PRIMARY DECISION SCREEN HEADER */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
        {/* Target Header Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 font-mono font-bold text-xs">
                {selectedTarget.code}
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-stone-950 tracking-tight">
                {selectedTarget.name}
              </h2>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Sector: {selectedTarget.sector} &bull; Host: {selectedTarget.crossSection.hostFormation}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full bg-stone-100 text-stone-700 text-xs font-mono font-semibold border border-stone-200 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-600"></span>
              <span>Exploration Target &bull; Non-Certified</span>
            </span>
          </div>
        </div>

        {/* The 4 Primary Executive Decision Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Estimated Geological Resource */}
          <div className="bg-stone-50/80 p-4.5 rounded-xl border border-stone-200 flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-stone-500 font-semibold mb-1">
                ESTIMATED GEOLOGICAL RESOURCE
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl sm:text-4xl font-extrabold font-mono text-stone-950">
                  {selectedTarget.resourceSummary.targetResourceMt}
                </span>
                <span className="text-sm font-bold text-stone-600">Mt</span>
              </div>
            </div>
            <div className="text-[11px] text-stone-600 mt-3 pt-2 border-t border-stone-200/80">
              P50 expected mean tonnage &bull; Modelled Resource
            </div>
          </div>

          {/* Card 2: Estimated Grade */}
          <div className="bg-stone-50/80 p-4.5 rounded-xl border border-stone-200 flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-stone-500 font-semibold mb-1">
                ESTIMATED GRADE
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl sm:text-4xl font-extrabold font-mono text-amber-800">
                  {selectedTarget.resourceSummary.gradeMnPct}%
                </span>
                <span className="text-sm font-bold text-amber-800">Mn</span>
              </div>
            </div>
            <div className="text-[11px] text-stone-600 mt-3 pt-2 border-t border-stone-200/80">
              Core assay average &bull; Fe ~{modelData.gradeFePct}% (Mn/Fe {(selectedTarget.resourceSummary.gradeMnPct / modelData.gradeFePct).toFixed(1)}:1)
            </div>
          </div>

          {/* Card 3: Uncertainty Range */}
          <div className="bg-stone-50/80 p-4.5 rounded-xl border border-stone-200 flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-stone-500 font-semibold mb-1">
                UNCERTAINTY RANGE
              </div>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-3xl sm:text-4xl font-extrabold font-mono text-stone-900">
                  {selectedTarget.resourceSummary.likelyRangeMt[0]}–{selectedTarget.resourceSummary.likelyRangeMt[1]}
                </span>
                <span className="text-sm font-bold text-stone-600">Mt</span>
              </div>
            </div>
            <div className="text-[11px] text-stone-600 mt-3 pt-2 border-t border-stone-200/80">
              Likely range (P90 conservative &rarr; P10 upside)
            </div>
          </div>

          {/* Card 4: Confidence */}
          <div className="bg-stone-50/80 p-4.5 rounded-xl border border-stone-200 flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-stone-500 font-semibold mb-1">
                CONFIDENCE
              </div>
              <div className="flex items-center space-x-2 mt-0.5">
                <span className="px-3 py-1 rounded-lg bg-white border border-stone-300 text-stone-900 font-bold text-base font-mono shadow-2xs">
                  {confidenceLabel}
                </span>
              </div>
            </div>
            <div className="text-[11px] text-stone-600 mt-3 pt-2 border-t border-stone-200/80">
              Interpolated across {selectedTarget.resourceSummary.drillCoverageHoles} boreholes
            </div>
          </div>
        </div>
      </div>

      {/* 4. DECISION INTERPRETATION: WHAT THIS MEANS & NEXT BEST STEP */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* What This Means */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-amber-800 font-bold mb-2">
              <Info className="w-4 h-4 text-amber-700" />
              <span>WHAT THIS MEANS</span>
            </div>
            <p className="text-sm sm:text-base font-semibold text-stone-900 leading-snug">
              &ldquo;This target shows strong exploration potential, but additional drilling is needed to reduce subsurface uncertainty.&rdquo;
            </p>
            <p className="text-xs text-stone-600 leading-relaxed mt-2.5">
              The continuous mineralized intercepts confirm an economic manganese tabular body along strike. However, because drill spacing widens in northern sectors, volume calculations carry statistical variance that requires infill confirmation before capital commitment.
            </p>
          </div>
          <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
            <span className="text-stone-500 font-mono">Geological Assessment</span>
            <span className="text-emerald-800 font-semibold font-mono">High Prospectivity &bull; Strike {selectedTarget.crossSection.strikeLengthM}m</span>
          </div>
        </div>

        {/* Next Best Step */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-emerald-800 font-bold mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>NEXT BEST STEP</span>
            </div>
            <p className="text-sm sm:text-base font-semibold text-stone-900 leading-snug">
              &ldquo;Prioritize additional drilling / geological investigation.&rdquo;
            </p>
            <div className="mt-2.5 p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-700">
              <span className="font-semibold text-stone-900 block mb-0.5">Recommended Field Protocol:</span>
              {selectedTarget.suggestedNextStep}
            </div>
          </div>
          <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center gap-2">
            <button
              onClick={onNavigateToExploration}
              className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Compass className="w-3.5 h-3.5 text-amber-300" />
              <span>Plan Infill Boreholes in 3D View</span>
            </button>
            <button
              onClick={onNavigateToProduction}
              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs rounded-xl border border-stone-300 flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <TrendingUp className="w-3.5 h-3.5 text-stone-600" />
              <span>Assess Mine Output Impact</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. UNCERTAINTY EXPLAINED SIMPLY & CLEARLY */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-stone-100">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-amber-700" />
            <span className="text-xs font-mono uppercase tracking-wider text-stone-900 font-bold">
              UNDERSTANDING THE UNCERTAINTY RANGE
            </span>
          </div>
          <span className="text-xs text-stone-500 font-mono">P90 (Conservative) &rarr; P50 (Expected) &rarr; P10 (Upside)</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          {/* Visual Range Comparison */}
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-600">Conservative Estimate (P90):</span>
              <span className="font-bold font-mono text-stone-900">{modelData.p90TonnageMt} Mt</span>
            </div>
            <div className="flex items-center justify-between text-xs bg-amber-50/80 p-2 rounded-lg border border-amber-200">
              <span className="text-amber-900 font-bold">Estimated Geological Resource (P50):</span>
              <span className="font-extrabold font-mono text-amber-900 text-sm">{modelData.p50TonnageMt} Mt</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-600">Upside Potential (P10):</span>
              <span className="font-bold font-mono text-stone-900">{modelData.p10TonnageMt} Mt</span>
            </div>

            {/* Clear Horizontal Uncertainty Gauge */}
            <div className="relative pt-6 pb-2">
              <div className="w-full h-3.5 bg-stone-100 rounded-full border border-stone-300 relative overflow-hidden">
                <div
                  className="absolute h-full bg-gradient-to-r from-stone-400 via-amber-600 to-emerald-700 rounded-full opacity-90"
                  style={{
                    left: '15%',
                    width: '70%',
                  }}
                />
              </div>
              {/* Markers */}
              <div className="absolute top-0.5 left-[15%] -translate-x-1/2 text-[10px] font-mono text-stone-600 font-semibold">
                P90: {modelData.p90TonnageMt} Mt
              </div>
              <div className="absolute top-0.5 left-[50%] -translate-x-1/2 text-[10px] font-mono text-amber-900 font-bold bg-white px-1 rounded shadow-2xs border border-amber-300">
                Estimated: {modelData.p50TonnageMt} Mt
              </div>
              <div className="absolute top-0.5 left-[85%] -translate-x-1/2 text-[10px] font-mono text-emerald-800 font-semibold">
                P10: {modelData.p10TonnageMt} Mt
              </div>
            </div>
          </div>

          {/* Why is there uncertainty? */}
          <div className="lg:col-span-6 bg-stone-50 p-4.5 rounded-xl border border-stone-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-1.5 text-xs font-mono uppercase tracking-wider text-stone-900 font-bold mb-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>WHY IS THERE UNCERTAINTY?</span>
              </div>
              <p className="text-sm font-semibold text-stone-900 leading-snug mb-2">
                &ldquo;Subsurface information is limited in parts of the target area.&rdquo;
              </p>
              <p className="text-xs text-stone-600 leading-relaxed mb-2">
                {selectedTarget.resourceSummary.limitingFactor}.
              </p>
              <p className="text-[11px] text-stone-500 leading-normal">
                Kriging variance rises in areas where collar distance exceeds 150 meters. Performing targeted confirmation core drilling directly collapses this variance into verified resource classifications.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 6. WHAT SUPPORTS THE ESTIMATE? & VIEW TECHNICAL BASIS TOGGLE */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-100">
          <div>
            <div className="flex items-center space-x-2">
              <Microscope className="w-4 h-4 text-amber-700" />
              <h3 className="text-xs font-mono uppercase tracking-wider text-stone-900 font-bold">
                WHAT SUPPORTS THE ESTIMATE?
              </h3>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Empirical evidence and mathematical models underpinning the {selectedTarget.resourceSummary.targetResourceMt} Mt figure
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsCrossSectionOpen(true)}
              className="px-3 py-1.5 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold rounded-xl border border-stone-300 flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Layers className="w-3.5 h-3.5 text-stone-600" />
              <span>View Cross-Section</span>
            </button>

            <button
              onClick={() => setIsHowItWorksOpen(true)}
              className="px-3 py-1.5 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold rounded-xl border border-stone-300 flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
              <span>Calculation Guide</span>
            </button>
          </div>
        </div>

        {/* 4 Pillars of Evidence */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-stone-50/80 border border-stone-200 text-xs">
            <div className="font-bold text-stone-900 mb-1 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span>Drillhole Information</span>
            </div>
            <p className="text-stone-600 text-[11px] leading-relaxed">
              {selectedTarget.resourceSummary.drillCoverageHoles} diamond drillholes with core assays and continuous mineralized intercepts (e.g. DH-024: 92m–128m).
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-stone-50/80 border border-stone-200 text-xs">
            <div className="font-bold text-stone-900 mb-1 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-600" />
              <span>Geological Interpretation</span>
            </div>
            <p className="text-stone-600 text-[11px] leading-relaxed">
              Identical Sausar Group stratigraphic horizon to active Balaghat lode with confirmed Mansar schist host contacts along strike.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-stone-50/80 border border-stone-200 text-xs">
            <div className="font-bold text-stone-900 mb-1 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-600" />
              <span>Grade Evidence</span>
            </div>
            <p className="text-stone-600 text-[11px] leading-relaxed">
              Core assay averages {selectedTarget.resourceSummary.gradeMnPct}% Mn with pyrolusite-braunite mineralization and favourable {(selectedTarget.resourceSummary.gradeMnPct / modelData.gradeFePct).toFixed(1)}:1 Mn/Fe ratio.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-stone-50/80 border border-stone-200 text-xs">
            <div className="font-bold text-stone-900 mb-1 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-600" />
              <span>Spatial Modelling</span>
            </div>
            <p className="text-stone-600 text-[11px] leading-relaxed">
              3D block interpolation via Ordinary Kriging ({modelData.krigingComparison.ordinaryKrigingMt} Mt) and ML regression (R² = {modelData.krigingComparison.crossValidationR2}).
            </p>
          </div>
        </div>

        {/* The Toggle Button for Technical Basis */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-stone-100">
          <button
            onClick={() => setShowTechnicalBasis(!showTechnicalBasis)}
            className="w-full sm:w-auto px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold font-mono rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-xs"
          >
            <Binary className="w-4 h-4 text-amber-400" />
            <span>{showTechnicalBasis ? 'HIDE TECHNICAL BASIS' : 'VIEW TECHNICAL BASIS'}</span>
            {showTechnicalBasis ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <span className="text-xs text-stone-500 font-mono text-center sm:text-right">
            {showTechnicalBasis ? 'Showing block model, geostatistics & variograms' : 'Click to inspect block model dimensions, Kriging benchmarks & mitigations'}
          </span>
        </div>
      </div>

      {/* 7. TECHNICAL VIEW (Expanded behind [View Technical Basis]) */}
      {showTechnicalBasis && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-stone-100 px-4 py-2 rounded-xl border border-stone-200 flex items-center justify-between text-xs font-mono text-stone-700">
            <div className="flex items-center space-x-2 font-bold">
              <Binary className="w-4 h-4 text-amber-700" />
              <span>DETAILED TECHNICAL BASIS &bull; GEOSTATISTICAL INTERPOLATION</span>
            </div>
            <span className="text-stone-500 hidden sm:inline">Advanced Geological &amp; Variogram Diagnostics</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
            {/* Left Column: Physical & Block Model Parameters (5 Cols) */}
            <div className="lg:col-span-5 space-y-3.5">
              <div className="bg-white p-4.5 rounded-2xl border border-stone-200 shadow-xs">
                <div className="text-xs font-mono font-bold text-stone-900 uppercase tracking-wide mb-3 pb-2 border-b border-stone-100 flex items-center justify-between">
                  <span>Geometrical &amp; Physical Parameters</span>
                  <FileSpreadsheet className="w-3.5 h-3.5 text-stone-400" />
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="text-stone-600">Estimated Block Volume:</span>
                    <span className="font-mono font-bold text-stone-900">
                      {selectedTarget.resourceSummary.blockVolumeM3.toLocaleString()} m³
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="text-stone-600">In-Situ Bulk Density:</span>
                    <span className="font-mono font-bold text-stone-900">
                      {selectedTarget.resourceSummary.bulkDensityTpm3.toFixed(2)} t/m³
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="text-stone-600">Unit Cell Dimensions:</span>
                    <span className="font-mono text-stone-800">
                      {modelData.unitBlockSizeM.join('m × ')}m
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="text-stone-600">Modelled Blocks:</span>
                    <span className="font-mono text-stone-800">{modelData.blockCount.toLocaleString()} blocks</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="text-stone-600">Drillhole Data:</span>
                    <span className="font-mono font-bold text-amber-800">
                      {selectedTarget.resourceSummary.drillCoverageHoles} boreholes
                    </span>
                  </div>

                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600">
                    <span className="font-semibold text-stone-800 uppercase block mb-1 text-[10px] font-mono">
                      Spatial Continuity Diagnostic
                    </span>
                    {selectedTarget.resourceSummary.dataDensityNotes}
                  </div>
                </div>

                {/* Geostatistical Kriging Comparison Box */}
                <div className="mt-3.5 p-3.5 bg-stone-50 rounded-xl border border-stone-200">
                  <div className="flex items-center justify-between text-xs font-semibold text-stone-800 mb-2">
                    <span>Model Benchmark Comparison</span>
                    <span className="text-emerald-700 font-mono text-xs font-bold">R² = {modelData.krigingComparison.crossValidationR2}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white p-2.5 rounded-lg border border-stone-200">
                      <div className="text-[11px] text-stone-500">Ordinary Kriging</div>
                      <div className="text-stone-900 font-bold font-mono text-sm">{modelData.krigingComparison.ordinaryKrigingMt} Mt</div>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-stone-200">
                      <div className="text-[11px] text-emerald-700">ML Regressor</div>
                      <div className="text-emerald-800 font-bold font-mono text-sm">{modelData.krigingComparison.mlEnsembleMt} Mt</div>
                    </div>
                  </div>
                  <div className="text-[11px] text-stone-500 font-mono mt-2">
                    Variance Reduction: {modelData.krigingComparison.varianceReductionPct}% over univariate interpolation
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Uncertainty Breakdown & Mitigations (7 Cols) */}
            <div className="lg:col-span-7 space-y-3.5">
              <div className="bg-white p-4.5 rounded-2xl border border-stone-200 shadow-xs">
                <div className="text-xs font-mono font-bold text-stone-900 uppercase tracking-wide mb-3 pb-2 border-b border-stone-100 flex items-center justify-between">
                  <span>Geostatistical Uncertainty Breakdown &amp; Mitigation Roadmap</span>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                </div>

                <div className="space-y-2.5">
                  {modelData.uncertaintyBreakdown.map((item) => (
                    <div key={item.source} className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-stone-900">{item.source}</span>
                        <span className="font-mono font-bold text-amber-800 text-xs bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Variance Impact: {item.impactPct}%
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-600 mt-1">
                        <span className="text-stone-700 font-semibold">Recommended Mitigation: </span>
                        {item.mitigation}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Drillhole Distribution Overview */}
                <div className="mt-3.5 p-3.5 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                  <span className="font-bold text-stone-900 block mb-1">Drillhole Coverage Log</span>
                  <p className="text-stone-600 text-[11px] leading-relaxed">
                    {modelData.drillCoverageNotes}
                  </p>
                </div>

                {/* Direct Action Links */}
                <div className="mt-4 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <button
                    onClick={() => setIsCrossSectionOpen(true)}
                    className="text-amber-800 hover:text-amber-900 font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <span>Inspect Geological Cross-Section Dip Line &rarr;</span>
                  </button>

                  <button
                    onClick={() => setIsHowItWorksOpen(true)}
                    className="text-stone-600 hover:text-stone-900 font-medium flex items-center space-x-1 cursor-pointer"
                  >
                    <span>View full mathematical formulation</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. STANDARD REGULATORY NOTICE BANNER */}
      <div className="bg-amber-50/70 border border-amber-200 p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-950">
        <div className="flex items-start space-x-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <span>
            <strong>Exploration Target &amp; Modelled Resource Notice:</strong> This page calculates an estimated geological exploration target based on preliminary borehole intercepts and Sausar Group stratigraphic continuity. In strict accordance with mineral reporting codes (UNFC / JORC / NI 43-101), this figure does not constitute a certified mineral reserve until regulatory infill drilling, metallurgical testing, and economic mine pre-feasibility studies are completed.
          </span>
        </div>
      </div>

      {/* Modals */}
      <ResourceHowItWorksModal isOpen={isHowItWorksOpen} onClose={() => setIsHowItWorksOpen(false)} />
      <CrossSectionModal
        target={selectedTarget}
        drillholes={DRILLHOLES}
        isOpen={isCrossSectionOpen}
        onClose={() => setIsCrossSectionOpen(false)}
        onView3D={() => {
          setIsCrossSectionOpen(false);
          onNavigateToExploration();
        }}
      />
    </div>
  );
};

