import { create } from 'zustand';

interface StratumLayer {
  id: string;
  name: string;
  visible: boolean;
}

interface DashboardState {
  activeState: string;
  activeDistrict: string;
  activeYear: string;
  
  strataLayers: StratumLayer[];
  
  setActiveLocation: (state: string, district: string) => void;
  setActiveYear: (year: string) => void;
  toggleStrataLayer: (id: string) => void;
  isAiOpen: boolean;
  toggleAi: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  activeState: 'Madhya Pradesh',
  activeDistrict: 'Balaghat',
  activeYear: '2025-26', // Based on the CSV latest
  
  strataLayers: [
    { id: 'sentinel', name: 'Sentinel-2 SWIR Alteration', visible: true },
    { id: 'mansar', name: 'Mansar Schist & Gondite Horizon', visible: true },
    { id: 'core-assay', name: 'Core Assay Intercepts (>20% Mn)', visible: true },
    { id: 'kriging', name: 'Ordinary Kriging Variance Mesh', visible: true },
    { id: 'drainage', name: 'Pit Incline Drainage & Waterways', visible: false }
  ],
  
  setActiveLocation: (state, district) => set({ activeState: state, activeDistrict: district }),
  setActiveYear: (year) => set({ activeYear: year }),
  
  toggleStrataLayer: (id) => set((state) => ({
    strataLayers: state.strataLayers.map(layer => 
      layer.id === id ? { ...layer, visible: !layer.visible } : layer
    )
  })),
  isAiOpen: false,
  toggleAi: () => set((state) => ({ isAiOpen: !state.isAiOpen })),
}));
