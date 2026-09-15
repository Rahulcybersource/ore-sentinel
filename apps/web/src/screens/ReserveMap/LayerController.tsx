import React from 'react';
import { motion } from 'framer-motion';
import { useAdapters } from '../../data/adapters/AdapterContext';
import { Layers } from 'lucide-react';

export const LayerController: React.FC = () => {
  const { mapLayers, toggleMapLayer } = useAdapters();

  return (
    <motion.div 
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className="bg-navy-950/80 backdrop-blur-md border border-cyan-400 p-4 rounded-2xl shadow-[0_0_15px_rgba(0,255,255,0.2)] w-64 pointer-events-auto"
    >
      <div className="flex items-center gap-2 mb-4 text-cyan-400">
        <Layers size={18} />
        <h3 className="font-bold text-xs tracking-wider uppercase">Advanced Layers</h3>
      </div>
      
      <div className="space-y-3 text-xs">
        {[
          { key: 'isroFaults', label: 'ISRO Structural Faults' },
          { key: 'sentinelIronOxide', label: 'Sentinel-2 Iron Oxide' },
          { key: 'nasaHyperspectral', label: 'NASA Hyperspectral Mn' }
        ].map((layer) => (
          <motion.label 
            key={layer.key}
            whileTap={{ scale: 0.95 }}
            className="flex items-center justify-between cursor-pointer group"
          >
            <span className={`transition-colors ${mapLayers[layer.key as keyof typeof mapLayers] ? 'text-cyan-300' : 'text-slate-400'}`}>
              {layer.label}
            </span>
            <div className="relative">
              <input 
                type="checkbox"
                checked={mapLayers[layer.key as keyof typeof mapLayers]}
                onChange={() => toggleMapLayer(layer.key as keyof typeof mapLayers)}
                className="sr-only"
              />
              <div className={`block w-8 h-4 rounded-full transition-colors ${mapLayers[layer.key as keyof typeof mapLayers] ? 'bg-cyan-500/50' : 'bg-navy-700'}`}></div>
              <motion.div 
                animate={{ x: mapLayers[layer.key as keyof typeof mapLayers] ? 16 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="absolute left-[2px] top-[2px] bg-cyan-300 w-3 h-3 rounded-full"
              />
            </div>
          </motion.label>
        ))}
      </div>
    </motion.div>
  );
};
