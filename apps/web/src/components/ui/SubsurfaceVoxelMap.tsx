import React, { useMemo } from 'react';
import { useDashboardStore } from '../../store/useDashboardStore';
import { Exploration3DViewerComponent } from './Exploration3DViewer';
import { EXPLORATION_TARGETS as mockExplorationTargets, DRILLHOLES as mockDrillholes } from '../../data/explorationData';

export const SubsurfaceVoxelMap: React.FC = () => {
  const { strataLayers, activeDistrict } = useDashboardStore();
  
  // Find target based on district. If none matches exactly, default to T-07 (Balaghat)
  const target = useMemo(() => {
    let t = mockExplorationTargets.find(t => t.name.includes(activeDistrict));
    if (!t) t = mockExplorationTargets.find(t => t.id === 'T-07');
    return t || mockExplorationTargets[0];
  }, [activeDistrict]);

  return (
    <div className="absolute inset-0 z-0">
      <Exploration3DViewerComponent 
        target={target}
        targets={mockExplorationTargets}
        drillholes={mockDrillholes}
        onViewResource={() => {
          console.log("View resource clicked");
        }}
      />
    </div>
  );
};
