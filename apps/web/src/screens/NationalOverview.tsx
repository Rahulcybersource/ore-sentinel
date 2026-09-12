import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// @ts-ignore
import Map, { Marker, Popup, Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { motion } from 'framer-motion';
import { 
  Globe2, 
  MapPin, 
  Layers, 
  Info, 
  ShieldAlert, 
  Database, 
  ExternalLink,
  ChevronRight,
  X,
  PieChart as PieIcon,
  Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell 
} from 'recharts';
import { motionPresets } from '../theme/tokens';

// Real published national statistics (Source: GSI / Indian Minerals Yearbook 2020 / NMI UNFC)
const TOTAL_RESERVES_MT = 495.87;
const PROVED_RESERVES_MT = 93.47;
const REMAINING_RESOURCES_MT = 402.40;

const STATE_RESERVES = [
  { state: 'Odisha', share: 44, reservesMt: 218.18, color: '#00D9C0' },
  { state: 'Karnataka', share: 22, reservesMt: 109.09, color: '#38BDF8' },
  { state: 'Madhya Pradesh', share: 12, reservesMt: 59.50, color: '#818CF8' },
  { state: 'Maharashtra', share: 7, reservesMt: 34.71, color: '#F59E0B' },
  { state: 'Goa', share: 7, reservesMt: 34.71, color: '#EC4899' },
  { state: 'Andhra Pradesh', share: 4, reservesMt: 19.83, color: '#10B981' },
  { state: 'Jharkhand', share: 2, reservesMt: 9.92, color: '#A855F7' },
  { state: 'Other States', share: 2, reservesMt: 9.92, color: '#64748B' },
];

import { NATIONAL_MN_REGISTRY } from '../data/constants/mineRegistry';

// Map the new strict domain registry to the MapLibre visualization format
interface MinePoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'MOIL' | 'OTHER';
  state: string;
  operator: string;
  details: string;
  linkToReserveMap?: boolean;
}

const MINE_POINTS: MinePoint[] = NATIONAL_MN_REGISTRY.map(mine => {
  const isMoil = mine.operator === 'MOIL';
  return {
    id: mine.id,
    name: mine.name,
    lat: mine.coordinates[1],
    lng: mine.coordinates[0],
    type: isMoil ? 'MOIL' : 'OTHER',
    state: mine.name.includes('Balaghat') || mine.name.includes('Ukwa') ? 'Madhya Pradesh' 
         : mine.name.includes('Sandur') ? 'Karnataka' 
         : mine.name.includes('Barbil') ? 'Odisha' 
         : 'Maharashtra', // Rough state inference based on known Sausar belt locations
    operator: mine.operator,
    details: isMoil 
      ? `Flagship ${mine.type.toLowerCase()} manganese mine. Strike trend ${mine.strikeTrend}°. Annual capacity: ${(mine.annualCapacityMT / 100000).toFixed(2)} Lakh MT. Full core drilling datasets and ML grade prediction models available.`
      : `Key competitor in the ${mine.name} mineral belt. ${mine.type} operations with ${mine.strikeTrend}° strike trend. Annual capacity: ${(mine.annualCapacityMT / 100000).toFixed(2)} Lakh MT. No proprietary drilling log access; strictly non-modeled official data.`,
    linkToReserveMap: isMoil
  };
});

// Approximate regional manganese belt over Odisha
// Sundargarh, Keonjhar, Sambalpur, Balangir, Kalahandi, Koraput districts
const ODISHA_BELT_GEOJSON = {
  type: 'FeatureCollection' as const,
  features: [
    {
      type: 'Feature' as const,
      properties: {
        name: 'Odisha Manganese Regional Belt',
        districts: 'Sundargarh, Keonjhar, Sambalpur, Balangir, Kalahandi, Koraput',
        note: 'Regional belt — approximate, not a confirmed mine location.'
      },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [
          [
            [84.8, 22.4],
            [85.6, 22.0],
            [85.8, 21.3],
            [84.9, 20.8],
            [83.8, 20.2],
            [83.0, 19.8],
            [82.6, 18.7],
            [83.2, 18.4],
            [83.7, 19.3],
            [83.5, 20.6],
            [84.0, 21.7],
            [84.8, 22.4]
          ]
        ]
      }
    }
  ]
};

const odishaFillLayer: any = {
  id: 'odisha-belt-fill',
  type: 'fill',
  paint: {
    'fill-color': '#818CF8',
    'fill-opacity': 0.18
  }
};

const odishaLineLayer: any = {
  id: 'odisha-belt-line',
  type: 'line',
  paint: {
    'line-color': '#818CF8',
    'line-width': 2,
    'line-dasharray': [4, 3]
  }
};

export const NationalOverview: React.FC = () => {
  const navigate = useNavigate();
  const [selectedMine, setSelectedMine] = useState<MinePoint | null>(null);
  const [showOdishaCallout, setShowOdishaCallout] = useState(false);
  const [activeTab, setActiveTab] = useState<'chart' | 'table'>('chart');

  return (
    <motion.div
      variants={motionPresets.fadeIn}
      initial="initial"
      animate="animate"
      exit="exit"
      className="relative w-full h-full bg-navy-900 flex flex-col overflow-hidden"
    >
      {/* Top Banner / Breadcrumb */}
      <header className="h-16 px-6 bg-navy-900/90 backdrop-blur border-b border-navy-700 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-500/10 border border-teal-500/30 rounded-lg text-teal-400">
            <Globe2 size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span className="hover:text-slate-200 cursor-pointer" onClick={() => navigate('/corporate')}>Corporate</span>
              <ChevronRight size={12} />
              <span className="text-teal-400">National Overview</span>
            </div>
            <h1 className="text-base md:text-lg font-bold text-slate-100 leading-tight">
              India Manganese Mineral Belt & Reserve Distribution
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/map')}
            className="flex items-center gap-2 px-3 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 rounded-lg text-xs font-medium transition-all active:scale-[0.98]"
          >
            <span>Mine-Level 3D/2D View</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </header>

      {/* Main Grid: Left Map (60-65%), Right Statistics Panel (35-40%) */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 relative">
        
        {/* MAP CONTAINER */}
        <div className="relative flex-1 h-[55vh] lg:h-full bg-navy-950 overflow-hidden">
          <Map
            initialViewState={{
              longitude: 79.5,
              latitude: 21.2,
              zoom: 5.2,
              pitch: 20
            }}
            mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
            attributionControl={false}
          >
            {/* Regional Belt Shaded Layer */}
            <Source type="geojson" data={ODISHA_BELT_GEOJSON}>
              <Layer {...odishaFillLayer} />
              <Layer {...odishaLineLayer} />
            </Source>

            {/* Regional Belt Label Marker */}
            <Marker
              latitude={20.6}
              longitude={84.3}
              anchor="center"
              onClick={(e: any) => {
                e.originalEvent.stopPropagation();
                setShowOdishaCallout(true);
              }}
            >
              <div className="cursor-pointer group flex flex-col items-center">
                <div className="px-2 py-1 bg-indigo-950/90 border border-indigo-500/60 rounded text-[10px] font-mono text-indigo-300 font-semibold shadow-lg backdrop-blur-sm group-hover:border-indigo-400 transition-colors">
                  Regional Belt: Odisha (44%)
                </div>
                <span className="text-[9px] text-indigo-400/80 mt-0.5 tracking-tight">
                  Sundargarh–Koraput Axis
                </span>
              </div>
            </Marker>

            {/* Individual Mine Markers */}
            {MINE_POINTS.map((mine) => {
              const isMoil = mine.type === 'MOIL';
              return (
                <Marker
                  key={mine.id}
                  latitude={mine.lat}
                  longitude={mine.lng}
                  anchor="bottom"
                  onClick={(e: any) => {
                    e.originalEvent.stopPropagation();
                    setSelectedMine(mine);
                  }}
                >
                  <div className="relative flex flex-col items-center group cursor-pointer">
                    {isMoil && (
                      <div className="absolute -top-1 w-6 h-6 bg-teal-400/30 rounded-full animate-ping pointer-events-none" />
                    )}
                    <div
                      className={`p-1.5 rounded-full border shadow-xl transition-transform group-hover:scale-110 ${
                        isMoil
                          ? 'bg-teal-500 border-teal-300 text-navy-900'
                          : 'bg-slate-700 border-slate-500 text-slate-300'
                      }`}
                    >
                      <MapPin size={18} className="fill-current" />
                    </div>
                    <div
                      className={`mt-1 px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap shadow-md backdrop-blur border ${
                        isMoil
                          ? 'bg-navy-900/95 border-teal-500/50 text-teal-300'
                          : 'bg-navy-900/95 border-slate-700 text-slate-300'
                      }`}
                    >
                      {mine.name}
                    </div>
                  </div>
                </Marker>
              );
            })}

            {/* MOIL / Other Mine Info Popup */}
            {selectedMine && (
              <Popup
                latitude={selectedMine.lat}
                longitude={selectedMine.lng}
                anchor="top"
                onClose={() => setSelectedMine(null)}
                closeButton={false}
                offset={[0, 10]}
              >
                <div className="bg-navy-800 border border-navy-700 p-4 rounded-xl shadow-2xl w-80 text-slate-200">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span
                        className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          selectedMine.type === 'MOIL'
                            ? 'bg-teal-500/20 text-teal-400 border border-teal-500/40'
                            : 'bg-slate-700 text-slate-300 border border-slate-600'
                        }`}
                      >
                        {selectedMine.type === 'MOIL' ? 'MOIL Operated' : 'Other Producer'}
                      </span>
                      <h3 className="font-bold text-slate-100 text-sm mt-1">{selectedMine.name}</h3>
                      <p className="text-xs text-slate-400">{selectedMine.state} &bull; {selectedMine.operator}</p>
                    </div>
                    <button
                      onClick={() => setSelectedMine(null)}
                      className="text-slate-400 hover:text-white p-1"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed my-3 bg-navy-900/60 p-2.5 rounded border border-navy-700/50">
                    {selectedMine.details}
                  </p>

                  {selectedMine.type === 'MOIL' ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-[11px] text-teal-400 bg-teal-500/10 p-2 rounded border border-teal-500/20 font-medium">
                        <Sparkles size={14} className="shrink-0" />
                        <span>ML-predicted ore grade available (drilling data access)</span>
                      </div>
                      <button
                        onClick={() => navigate('/map')}
                        className="w-full py-2 bg-teal-500 hover:bg-teal-400 text-navy-900 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-[0.98]"
                      >
                        <span>Open Mine-Level Reserve Map</span>
                        <ExternalLink size={13} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 text-[10px] text-amber-300/90 bg-amber-500/10 p-2.5 rounded border border-amber-500/20 leading-tight">
                      <ShieldAlert size={14} className="shrink-0 text-amber-400 mt-0.5" />
                      <span>
                        Published statistics only. No proprietary drilling access; no ML prediction generated.
                      </span>
                    </div>
                  )}
                </div>
              </Popup>
            )}

            {/* Odisha Regional Shaded Area Callout */}
            {showOdishaCallout && (
              <Popup
                latitude={20.6}
                longitude={84.3}
                anchor="bottom"
                onClose={() => setShowOdishaCallout(false)}
                closeButton={false}
                offset={[0, -10]}
              >
                <div className="bg-navy-800 border border-indigo-500/40 p-4 rounded-xl shadow-2xl w-80 text-slate-200">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                      <h3 className="font-bold text-slate-100 text-sm">Odisha Manganese Belt</h3>
                    </div>
                    <button
                      onClick={() => setShowOdishaCallout(false)}
                      className="text-slate-400 hover:text-white p-1"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="text-xs space-y-2 mt-2">
                    <p className="text-slate-300 leading-relaxed">
                      Encompasses major deposits across <strong>Sundargarh, Keonjhar, Sambalpur, Balangir, Kalahandi, and Koraput</strong> districts.
                    </p>
                    <div className="p-2 bg-navy-900 rounded border border-navy-700 text-[11px] font-mono text-indigo-300">
                      National Share: ~44% (218.18 Mt)
                    </div>
                    <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded text-[10px] text-indigo-300/90">
                      <strong>Note:</strong> Regional belt — approximate, not a confirmed mine location. Represents macro geological occurrence area from GSI / IBM inventories.
                    </div>
                  </div>
                </div>
              </Popup>
            )}
          </Map>

          {/* Floating Map Legend (Bottom-Left) */}
          <div className="absolute bottom-4 left-4 bg-navy-900/95 backdrop-blur-md border border-navy-700 rounded-xl p-4 shadow-xl max-w-xs z-10">
            <h4 className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Layers size={13} className="text-teal-400" /> Map Classification Legend
            </h4>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5">
                <div className="w-3.5 h-3.5 rounded-full bg-teal-400 border border-teal-200 shrink-0 mt-0.5 shadow-[0_0_8px_rgba(0,217,192,0.5)]" />
                <div>
                  <span className="font-semibold text-slate-200 block">MOIL Operated</span>
                  <span className="text-[10px] text-slate-400 leading-snug block">
                    ML-predicted grade available (drilling data access)
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-3.5 h-3.5 rounded-full bg-slate-500 border border-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-300 block">Other Producers</span>
                  <span className="text-[10px] text-slate-400 leading-snug block">
                    Published statistics only, no proprietary drilling access, no ML prediction generated
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 pt-1 border-t border-navy-800">
                <div className="w-3.5 h-3.5 rounded border-2 border-dashed border-indigo-400 bg-indigo-500/20 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-indigo-300 block">Odisha Manganese Belt</span>
                  <span className="text-[10px] text-slate-400 leading-snug block">
                    Regional belt — approximate, not a confirmed mine location
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SIDE PANEL: NATIONAL STATISTICS & CHARTS */}
        <aside className="w-full lg:w-[420px] bg-navy-800 border-t lg:border-t-0 lg:border-l border-navy-700 flex flex-col shrink-0 overflow-y-auto">
          
          {/* Header Summary */}
          <div className="p-6 border-b border-navy-700 bg-navy-850">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-teal-400 flex items-center gap-1.5 font-semibold">
                <Database size={13} /> National Mineral Inventory
              </span>
              <span className="text-[10px] px-2 py-0.5 bg-navy-700 text-slate-300 rounded font-mono">
                UNFC Standard
              </span>
            </div>
            
            <div className="bg-navy-900 border border-navy-700 rounded-xl p-4 shadow-inner">
              <span className="text-xs text-slate-400">Total National Manganese Ore Reserves</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-bold font-mono text-teal-400">{TOTAL_RESERVES_MT}</span>
                <span className="text-sm font-semibold text-slate-300">Million Tonnes (Mt)</span>
              </div>

              {/* Reserves vs Resources breakdown */}
              <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-navy-800">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">Proved Reserves</span>
                  <span className="text-base font-bold font-mono text-slate-200">{PROVED_RESERVES_MT} Mt</span>
                  <span className="text-[10px] text-teal-400 block font-mono">18.8% of Total</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">Remaining Resources</span>
                  <span className="text-base font-bold font-mono text-slate-200">{REMAINING_RESOURCES_MT} Mt</span>
                  <span className="text-[10px] text-indigo-400 block font-mono">81.2% of Total</span>
                </div>
              </div>
            </div>
          </div>

          {/* State-Wise Reserve Share Section */}
          <div className="p-6 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <PieIcon size={16} className="text-teal-400" /> State-Wise Reserve Share
                </h3>
                <p className="text-[11px] text-slate-400">Geological Survey of India (GSI) NMI breakdown</p>
              </div>

              {/* View Toggle */}
              <div className="flex bg-navy-900 rounded-lg p-0.5 border border-navy-700 text-xs">
                <button
                  onClick={() => setActiveTab('chart')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    activeTab === 'chart' ? 'bg-teal-500 text-navy-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Chart
                </button>
                <button
                  onClick={() => setActiveTab('table')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    activeTab === 'table' ? 'bg-teal-500 text-navy-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Table
                </button>
              </div>
            </div>

            {/* TAB CONTENT: CHART */}
            {activeTab === 'chart' ? (
              <div className="space-y-4">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={STATE_RESERVES}
                      layout="vertical"
                      margin={{ top: 0, right: 30, left: 20, bottom: 0 }}
                    >
                      <XAxis type="number" domain={[0, 50]} unit="%" stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                      <YAxis dataKey="state" type="category" stroke="#64748B" tick={{ fill: '#E2E8F0', fontSize: 11 }} width={85} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0F172A',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          color: '#F8FAFC',
                          fontSize: '12px'
                        }}
                        formatter={(value: any, _: any, item: any) => [
                          `${value}% (~${item.payload.reservesMt} Mt)`,
                          'National Share'
                        ]}
                      />
                      <Bar dataKey="share" radius={[0, 4, 4, 0]} animationDuration={800}>
                        {STATE_RESERVES.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Micro-insight */}
                <div className="bg-navy-900/70 border border-navy-700/60 rounded-lg p-3 text-xs text-slate-300 leading-relaxed">
                  <div className="font-semibold text-teal-400 mb-1 flex items-center gap-1.5">
                    <Info size={13} /> Regional Concentration
                  </div>
                  Odisha (44%) and Karnataka (22%) collectively hold two-thirds of India’s in-situ manganese reserves. MOIL’s primary operations span the strategic MP-Maharashtra belt (19% total share).
                </div>
              </div>
            ) : (
              /* TAB CONTENT: TABLE */
              <div className="border border-navy-700 rounded-lg overflow-hidden bg-navy-900">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-navy-700 bg-navy-850 font-mono text-[11px] text-slate-400">
                      <th className="py-2.5 px-3">State</th>
                      <th className="py-2.5 px-3 text-right">Share (%)</th>
                      <th className="py-2.5 px-3 text-right">Est. Reserves</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-800">
                    {STATE_RESERVES.map((row) => (
                      <tr key={row.state} className="hover:bg-navy-800/40 transition-colors">
                        <td className="py-2.5 px-3 font-medium text-slate-200 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
                          {row.state}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-200">
                          {row.share}%
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                          {row.reservesMt.toFixed(2)} Mt
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Official Source Citation Requirement */}
            <div className="mt-auto pt-6">
              <div className="p-3 bg-navy-900 border border-navy-700/80 rounded-xl space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">
                  Source Attribution & Standard
                </span>
                <p className="text-[10px] text-slate-400 leading-normal">
                  <strong>Source:</strong> National Mineral Inventory / Geological Survey of India (GSI), UNFC classification.
                </p>
                <p className="text-[9px] text-slate-500 font-mono">
                  Reference: Indian Minerals Yearbook (Manganese Ore Chapter) & Ministry of Mines, Govt. of India.
                </p>
              </div>

              {/* Strict Integrity Notice */}
              <div className="mt-3 flex items-start gap-2 p-2.5 bg-amber-500/5 border border-amber-500/20 rounded-lg text-[10px] text-amber-400/90 leading-snug">
                <ShieldAlert size={14} className="shrink-0 text-amber-400 mt-0.5" />
                <span>
                  <strong>Data Integrity Standard:</strong> Do not extrapolate ore-grade predictions for non-MOIL locations. Non-MOIL markers represent published official statistics only; zero synthetic ML modeling applied.
                </span>
              </div>
            </div>

          </div>
        </aside>

      </div>
    </motion.div>
  );
};
