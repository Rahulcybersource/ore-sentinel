import React, { createContext, useContext, useMemo } from 'react';
import type { ReserveDataAdapter } from './ReserveDataAdapter';
import type { ProductionDataAdapter } from './ProductionDataAdapter';
import type { AlertsAdapter } from './AlertsAdapter';
import type { RecommendationsAdapter } from './RecommendationsAdapter';
import { MockReserveAdapter } from './MockReserveAdapter';
import { MockProductionAdapter } from './MockProductionAdapter';
import { MockAlertsAdapter } from './MockAlertsAdapter';
import { MockRecommendationsAdapter } from './MockRecommendationsAdapter';
import { LiveReserveAdapter } from './LiveReserveAdapter';
import type { IsroSatelliteAdapter } from './IsroSatelliteAdapter';
import { MockIsroSatelliteAdapter, LiveIsroSatelliteAdapter } from './IsroSatelliteAdapter';

export interface Adapters {
  reserve: ReserveDataAdapter;
  production: ProductionDataAdapter;
  alerts: AlertsAdapter;
  recommendations: RecommendationsAdapter;
  isro: IsroSatelliteAdapter;
}

const AdapterContext = createContext<Adapters | null>(null);

export const AdapterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const adapters = useMemo(() => {
    const useLive = import.meta.env.VITE_USE_LIVE_DATA === 'true';
    console.log(`[AdapterContext] Initializing adapters. VITE_USE_LIVE_DATA: ${useLive}`);
    
    return {
      reserve: useLive ? new LiveReserveAdapter() : new MockReserveAdapter(),
      production: new MockProductionAdapter(),
      alerts: new MockAlertsAdapter(),
      recommendations: new MockRecommendationsAdapter(),
      isro: useLive ? new LiveIsroSatelliteAdapter() : new MockIsroSatelliteAdapter(),
    };
  }, []);

  return <AdapterContext.Provider value={adapters}>{children}</AdapterContext.Provider>;
};

export const useAdapters = () => {
  const context = useContext(AdapterContext);
  if (!context) throw new Error("useAdapters must be used within AdapterProvider");
  return context;
};
