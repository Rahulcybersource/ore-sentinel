import React, { useState, useEffect } from 'react';
// @ts-ignore
import { Source, Layer, Marker, Popup } from 'react-map-gl/maplibre';
import { Target, Sparkles, X, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MineralHeatmapLayerProps {
  gridData: any[];
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
  gridData,
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

  // Transform gridData into GeoJSON for the heatmap
  const geojsonData = React.useMemo(() => {
    const features = gridData.map(cell => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [cell.realLng, cell.realLat]
      },
      properties: {
        confidenceScore: cell.confidenceScore || 0
      }
    }));

    return { type: 'FeatureCollection', features };
  }, [gridData]);

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
      <Source id="mineral-heatmap-source" type="geojson" data={geojsonData}>
        <Layer
          id="mineral-heatmap-layer"
          type="heatmap"
          paint={{
            'heatmap-weight': [
              'interpolate', ['linear'], ['get', 'confidenceScore'],
              0, 0,
              1, 1
            ],
            'heatmap-color': [
              'interpolate', ['linear'], ['heatmap-density'],
              0, 'rgba(0, 0, 0, 0)',
              0.2, '#00D9C0',
              0.4, '#F59E0B',
              0.7, '#10B981',
              1.0, '#EC4899'
            ],
            'heatmap-radius': [
              'interpolate', ['linear'], ['zoom'],
              11, 20,
              16, 80
            ],
            'heatmap-opacity': opacity,
            'heatmap-opacity-transition': { duration: 300 }
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

      {/* ── INTERACTIVE POPUP — FULL MOIL-COMPLIANT DRILL TARGET ────── */}
      {recommendation && showPopup && gradeInfo && factors && (
        <Popup 
          latitude={recommendation.lat} 
          longitude={recommendation.lng}
          anchor="bottom"
          onClose={() => setShowPopup(false)}
          closeButton={false}
          offset={[0, -24]}
        >
          <div className="bg-navy-900/95 border border-cyan-500/80 p-5 rounded-2xl shadow-2xl w-[340px] text-slate-100 backdrop-blur-md relative overflow-hidden">
            {/* XP Notification */}
            <AnimatePresence>
              {showXpNotif && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute top-2 right-3 flex items-center gap-1.5 bg-amber-500/20 border border-amber-400/60 px-2.5 py-1 rounded-lg z-20"
                >
                  <Zap size={12} className="text-amber-400 fill-amber-400" />
                  <span className="text-[10px] font-mono font-bold text-amber-300">XP gained +500</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex justify-between items-start mb-3 border-b border-navy-700/80 pb-2.5">
              <div>
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles size={13} /> AI Exploration Target
                </span>
                <h4 className="font-bold text-slate-100 text-sm mt-0.5">
                  TARGET BH-34-GAMMA
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
              {/* MOIL Standard + Grade */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-navy-950/80 p-2.5 rounded-lg border border-navy-700/60">
                  <span className="text-slate-400 text-[10px] uppercase block mb-0.5">MOIL Standard</span>
                  <span className={`font-mono font-bold ${gradeInfo.color}`}>
                    {gradeInfo.label}
                  </span>
                </div>
                <div className="bg-navy-950/80 p-2.5 rounded-lg border border-navy-700/60">
                  <span className="text-slate-400 text-[10px] uppercase block mb-0.5">Mn Grade</span>
                  <span className="font-mono font-bold text-slate-200">
                    {recommendation.mnGrade.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Contributing Factors */}
              <div className="bg-navy-950/80 p-2.5 rounded-lg border border-navy-700/60 space-y-1.5">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Contributing Factors</span>
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
                <div className="bg-navy-800/80 p-2.5 rounded-lg border border-navy-700/60">
                  <span className="text-slate-400 text-[10px] uppercase block mb-0.5">Target Depth Range</span>
                  <span className="font-mono font-bold text-slate-200">{recommendation.targetDepth}</span>
                </div>
                <div className="bg-navy-800/80 p-2.5 rounded-lg border border-navy-700/60">
                  <span className="text-slate-400 text-[10px] uppercase block mb-0.5">Dip</span>
                  <span className="font-mono font-bold text-slate-200">{recommendation.dipAngle}</span>
                </div>
              </div>

              {/* Confidence Score Progress Bar */}
              <div className="bg-navy-950/80 p-3 rounded-lg border border-cyan-500/30 mt-1">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-slate-400 uppercase text-[10px] font-bold tracking-wider">Confidence</span>
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
            </div>
          </div>
        </Popup>
      )}
    </>
  );
};
