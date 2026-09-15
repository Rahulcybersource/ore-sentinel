import { useState } from 'react';
import { NATIONAL_MN_REGISTRY } from '../data/constants/mineRegistry';
import { IsroSatellitePanel } from '../components/IsroSatellitePanel';
import { Satellite, Map as MapIcon, Layers, Calendar, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export function SatelliteView() {
  const [selectedMine, setSelectedMine] = useState(NATIONAL_MN_REGISTRY[0].id);
  const mine = NATIONAL_MN_REGISTRY.find(m => m.id === selectedMine) || NATIONAL_MN_REGISTRY[0];
  const mineLat = mine.coordinates[1];
  const mineLng = mine.coordinates[0];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Satellite className="text-indigo-400" />
            ISRO VEDAS Intelligence
          </h1>
          <p className="text-slate-400 mt-1">Direct integration with SAC VEDAS for Earth Observation Data</p>
        </div>
        
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-1.5 rounded-lg">
          {NATIONAL_MN_REGISTRY.slice(0, 3).map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedMine(m.id)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                selectedMine === m.id
                  ? 'bg-slate-800 text-indigo-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900 border border-slate-800 rounded-xl p-6 relative overflow-hidden min-h-[400px] flex flex-col"
          >
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                <MapIcon size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-200">WMS Imagery Layer</h3>
                <p className="text-xs text-slate-400">Sentinel-2 FCC & Indices</p>
              </div>
            </div>
            
            <div className="flex-1 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-center relative overflow-hidden">
              {/* Fallback visual for WMS map */}
              <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)',
                backgroundSize: '24px 24px'
              }} />
              
              <div className="text-center relative z-10 p-6">
                <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h4 className="text-slate-300 font-medium mb-2">WMS Map Overlay</h4>
                <p className="text-slate-500 text-sm max-w-sm mx-auto">
                  The ISRO VEDAS WMS proxy is ready. To view the live map layer, the MapLibre component can be updated to include the 
                  <code>/api/isro/wms-tile</code> source.
                </p>
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-md text-xs text-slate-400 font-mono">
                  Coordinates: {mineLat.toFixed(4)}, {mineLng.toFixed(4)}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <IsroSatellitePanel />
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-900 border border-slate-800 rounded-xl p-6"
          >
            <h3 className="font-semibold text-slate-200 flex items-center gap-2 mb-4">
              <Activity className="text-teal-400" size={18} />
              Site Metadata
            </h3>
            
            <div className="space-y-4">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="text-xs text-slate-500 mb-1">Mine Identity</div>
                <div className="text-slate-200">{mine.name} ({mine.type})</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="text-xs text-slate-500 mb-1">Coordinates</div>
                <div className="text-slate-200 font-mono text-sm">{mineLat}, {mineLng}</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="text-xs text-slate-500 mb-1">Strike Trend</div>
                <div className="text-slate-200">{mine.strikeTrend}°</div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-900 border border-slate-800 rounded-xl p-6"
          >
            <h3 className="font-semibold text-slate-200 flex items-center gap-2 mb-4">
              <Calendar className="text-amber-400" size={18} />
              Recent Acquisitions
            </h3>
            
            <div className="space-y-3">
              {[
                { date: '2023-12-15', cloud: 12, quality: 'High' },
                { date: '2023-12-05', cloud: 45, quality: 'Medium' },
                { date: '2023-11-25', cloud: 8, quality: 'High' },
              ].map((pass, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-slate-800/50 bg-slate-800/20">
                  <div>
                    <div className="text-sm text-slate-200">{pass.date}</div>
                    <div className="text-xs text-slate-500">Sentinel-2 L2A</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs font-medium ${pass.quality === 'High' ? 'text-teal-400' : 'text-amber-400'}`}>
                      {pass.cloud}% Cloud
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
