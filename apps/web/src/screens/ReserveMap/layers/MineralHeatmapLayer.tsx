import React, { useState, useEffect } from 'react';
// @ts-ignore
import { Source, Layer, Marker, Popup } from 'react-map-gl/maplibre';
import { Target, Sparkles, X, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MineralHeatmapLayerProps {
  featureCollection: any; // GeoJSON FeatureCollection
  recommendation: {
    lat: number;
    lng: number;
    targetDepth: string;
    dipAngle: string;
    mnGrade: number;
    confidenceScore: number;
  } | null;
  opacity: number;
  /** Controls layout.visibility on the heatmap layer for full z-order compliance */
  visible?: boolean;
}

export const MineralHeatmapLayer: React.FC<MineralHeatmapLayerProps> = ({
  featureCollection,
  recommendation,
  opacity,
  visible = true,
}) => {
  const [showPopup, setShowPopup] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [showXpNotif, setShowXpNotif] = useState(false);

  // Animate confidence score bar from 0 → target on popup open
  useEffect(() => {
    if (showPopup && recommendation) {
      setAnimatedScore(0);
      setShowXpNotif(false);
      const targetScore = recommendation.confidenceScore * 100;
      const duration = 1000;
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 4); // easeOutQuart
        setAnimatedScore(targetScore * ease);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Show XP notification after bar finishes
          setShowXpNotif(true);
          setTimeout(() => setShowXpNotif(false), 2500);
        }
      };
      requestAnimationFrame(animate);
    }
  }, [showPopup, recommendation]);

  // MOIL grade classification
  const getMoilGradeLabel = (grade: number) => {
    if (grade >= 44) return { label: 'Ferro Grade', color: 'text-green-400', bar: 'bg-green-500', badge: '🟢' };
    if (grade >= 30) return { label: 'SMGR Grade', color: 'text-amber-400', bar: 'bg-amber-500', badge: '🟡' };
    return { label: 'Blast Furnace Grade', color: 'text-red-400', bar: 'bg-red-500', badge: '🔴' };
  };

  const gradeInfo = recommendation ? getMoilGradeLabel(recommendation.mnGrade) : null;

  // Contributing factor scores (simulated from confidenceScore)
  const factors = recommendation ? {
    isroFault: Math.min(99, Math.round(recommendation.confidenceScore * 100 * 0.97)),
    sentinelIron: Math.min(100, Math.round(recommendation.confidenceScore * 100 * 1.02)),
    nasaMn: Math.min(99, Math.round(recommendation.confidenceScore * 100 * 0.94)),
  } : null;

  return (
    <>
      {/* ── Z-LEVEL 4: HEATMAP (confidence score KDE) ──────────────── */}
      <Source id="mineral-heatmap-source" type="geojson" data={featureCollection}>
        <Layer
          id="nasa-hyperspectral-heatmap"
          type="heatmap"
          beforeId="waterway-label"
          layout={{ visibility: visible ? 'visible' : 'none' }}
          paint={{
            'heatmap-weight': [
              'interpolate', ['linear'], ['get', 'confidenceScore'],
              0, 0,
              1, 1
            ],
            'heatmap-color': [
              'interpolate', ['linear'], ['heatmap-density'],
              0, 'rgba(0,0,0,0)',
              0.3, '#d97706',
              0.6, '#10b981',
              0.8, '#d946ef',
              1.0, '#be185d'
            ],
            'heatmap-radius': [
              'interpolate', ['linear'], ['zoom'],
              10, 15,
              15, 50
            ],
            'heatmap-opacity': 0.65
          }}
        />
      </Source>

      {/* ── Z-LEVEL 5: RECOMMENDED DRILL SITE (pulsing HTML marker) ── */}
      {recommendation && (
        <Marker 
          latitude={recommendation.lat} 
          longitude={recommendation.lng} 
          anchor="center"
          onClick={(e: any) => { 
            e.originalEvent.stopPropagation(); 
            setShowPopup(true); 
          }}
        >
          <div className="relative flex items-center justify-center cursor-pointer group">
            {/* Neon cyan ripple — CSS keyframe ping */}
            <div className="absolute w-14 h-14 bg-cyan-400/30 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] pointer-events-none" />
            <div className="absolute w-10 h-10 bg-cyan-400/20 rounded-full animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite_0.5s] pointer-events-none" />
            <div className="absolute w-8 h-8 bg-cyan-400/40 rounded-full animate-pulse pointer-events-none" />
            
            <div className="w-9 h-9 flex items-center justify-center bg-cyan-500 rounded-full text-navy-950 shadow-[0_0_24px_rgba(0,255,255,0.9)] relative z-10 transition-transform group-hover:scale-110 active:scale-[0.97]">
              <Target size={19} className="stroke-[2.5]" />
            </div>
          </div>
        </Marker>
      )}

      {/* ── INTERACTIVE POPUP — TARGET IDENTIFIED GAMIFIED CARD ────── */}
      {recommendation && showPopup && gradeInfo && factors && (
        <Popup 
          latitude={recommendation.lat} 
          longitude={recommendation.lng}
          anchor="bottom"
          onClose={() => setShowPopup(false)}
          closeButton={false}
          offset={[0, -24]}
        >
          <div className="bg-navy-950/90 border border-cyan-500/30 p-5 rounded-2xl shadow-2xl w-[340px] text-slate-100 backdrop-blur-md relative overflow-hidden">
            
            {/* Subtle top glow line */}
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(6,182,212,0.6),transparent)' }} />

            {/* Header */}
            <div className="flex justify-between items-start mb-3 border-b border-cyan-500/20 pb-2.5">
              <div>
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Target size={13} className="text-cyan-400" /> TARGET IDENTIFIED
                </span>
                <h4 className="font-bold text-cyan-300 text-sm mt-0.5 font-mono tracking-wide">
                  REC-BH-GAMMA
                </h4>
              </div>
              <button 
                onClick={() => setShowPopup(false)} 
                className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-navy-800 transition-colors active:scale-[0.97]"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              {/* Grade + Confidence */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-navy-900/80 p-2.5 rounded-lg border border-cyan-500/20">
                  <span className="text-slate-400 text-[10px] uppercase block mb-0.5">Grade</span>
                  <span className="font-mono font-bold text-slate-100 text-sm">
                    {recommendation.mnGrade.toFixed(1)}% Mn
                  </span>
                </div>
                <div className="bg-navy-900/80 p-2.5 rounded-lg border border-cyan-500/20">
                  <span className="text-slate-400 text-[10px] uppercase block mb-0.5">Confidence</span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono font-bold text-cyan-300 text-sm">
                      {animatedScore.toFixed(0)}%
                    </span>
                    <span className={`text-[9px] font-mono ${gradeInfo.color}`}>{gradeInfo.label}</span>
                  </div>
                </div>
              </div>

              {/* Contributing Factors */}
              <div className="bg-navy-900/80 p-2.5 rounded-lg border border-cyan-500/20 space-y-1.5">
                <span className="text-cyan-400/80 text-[10px] uppercase font-bold tracking-wider block">Contributing Factors</span>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">ISRO Fault Alignment</span>
                  <span className="font-mono font-bold text-cyan-300">[{factors.isroFault}%]</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Sentinel Iron Index</span>
                  <span className="font-mono font-bold text-cyan-300">[{factors.sentinelIron}%]</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">NASA Hyperspectral Mn</span>
                  <span className="font-mono font-bold text-cyan-300">[{factors.nasaMn}%]</span>
                </div>
              </div>

              {/* Depth + Dip */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-navy-900/80 p-2.5 rounded-lg border border-cyan-500/20">
                  <span className="text-slate-400 text-[10px] uppercase block mb-0.5">Target Depth Range</span>
                  <span className="font-mono font-bold text-slate-200">{recommendation.targetDepth}</span>
                </div>
                <div className="bg-navy-900/80 p-2.5 rounded-lg border border-cyan-500/20">
                  <span className="text-slate-400 text-[10px] uppercase block mb-0.5">Dip</span>
                  <span className="font-mono font-bold text-slate-200">{recommendation.dipAngle}</span>
                </div>
              </div>

              {/* Confidence Progress Bar */}
              <div className="bg-navy-900/80 p-3 rounded-lg border border-cyan-500/30 mt-1">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-slate-400 uppercase text-[10px] font-bold tracking-wider">AI Confidence</span>
                  <span className="font-mono font-bold text-cyan-300 text-sm">
                    {animatedScore.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full h-3 bg-navy-800 rounded-full overflow-hidden relative">
                  <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-emerald-400 rounded-full shadow-[0_0_12px_rgba(34,211,238,0.9)]"
                    style={{ width: `${animatedScore}%`, transition: 'width 0.05s linear' }}
                  />
                </div>
              </div>

              {/* Gamified XP Footer */}
              <AnimatePresence>
                {showXpNotif && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center justify-center gap-2 bg-emerald-500/10 border border-emerald-400/40 px-3 py-2 rounded-lg"
                  >
                    <Zap size={14} className="text-emerald-400 fill-emerald-400" />
                    <span className="text-sm font-mono font-bold text-emerald-400">XP gained +500</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </Popup>
      )}
    </>
  );
};
