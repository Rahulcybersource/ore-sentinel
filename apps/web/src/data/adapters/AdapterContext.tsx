import React, { createContext, useContext, useMemo, useState } from 'react';
import type { ReserveDataAdapter } from './ReserveDataAdapter';
import type { ProductionDataAdapter } from './ProductionDataAdapter';
import type { AlertsAdapter } from './AlertsAdapter';
import type { RecommendationsAdapter } from './RecommendationsAdapter';
import { MockReserveAdapter } from './MockReserveAdapter';
import { MockProductionAdapter } from './MockProductionAdapter';
import { MockAlertsAdapter } from './MockAlertsAdapter';
import { MockRecommendationsAdapter } from './MockRecommendationsAdapter';
import { LiveReserveAdapter } from './LiveReserveAdapter';

export interface MapLayerState {
  isroFaults: boolean;
  sentinelIronOxide: boolean;
  nasaHyperspectral: boolean;
}

export interface Adapters {
  reserve: ReserveDataAdapter;
  production: ProductionDataAdapter;
  alerts: AlertsAdapter;
  recommendations: RecommendationsAdapter;
  mapLayers: MapLayerState;
  toggleMapLayer: (layer: keyof MapLayerState) => void;
}

const AdapterContext = createContext<Adapters | null>(null);

export const AdapterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mapLayers, setMapLayers] = useState<MapLayerState>({
    isroFaults: true,
    sentinelIronOxide: true,
    nasaHyperspectral: true,
  });

  const adapters = useMemo(() => {
    const useLive = import.meta.env.VITE_USE_LIVE_DATA === 'true';
    console.log(`[AdapterContext] Initializing adapters. VITE_USE_LIVE_DATA: ${useLive}`);
    
    return {
      reserve: useLive ? new LiveReserveAdapter() : new MockReserveAdapter(),
      production: new MockProductionAdapter(),
      alerts: new MockAlertsAdapter(),
      recommendations: new MockRecommendationsAdapter(),
    };
  }, []);

  const toggleMapLayer = (layer: keyof MapLayerState) => {
    setMapLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  const value = useMemo(() => ({
    ...adapters,
    mapLayers,
    toggleMapLayer
  }), [adapters, mapLayers]);

  return <AdapterContext.Provider value={value}>{children}</AdapterContext.Provider>;
};

export const useAdapters = () => {
  const context = useContext(AdapterContext);
  if (!context) throw new Error("useAdapters must be used within AdapterProvider");
  return context;
};
