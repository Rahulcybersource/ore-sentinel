import { PointCloudLayer, ScatterplotLayer } from '@deck.gl/layers';

interface SubsurfaceBlockLayerProps {
  depthRange: [number, number];
  visible: boolean;
}

// Procedural Ore Body Generator forming a syncline fold structure
const ORE_BODY_VOXELS = (() => {
  const points = [];
  const centerLat = 21.874;
  const centerLng = 80.201;
  const strike = 75; // ENE
  const strikeRad = (90 - strike) * (Math.PI / 180);
  
  for (let i = 0; i < 400; i++) {
    // Length along strike
    const lengthMeters = (Math.random() - 0.5) * 2000;
    // Dispersion perpendicular to strike
    const dispersionMeters = (Math.random() - 0.5) * 600;
    
    // Syncline fold depth profile: deeper in the middle
    const baseDepth = -50 - Math.cos(lengthMeters / 1000) * 150 + (Math.random() * 50);
    const depth = Math.min(-20, Math.max(-300, baseDepth));
    
    // Grade formula: peak grades (45-52% Mn) between -100m and -180m
    let grade = 20 + Math.random() * 15; // Low grade default
    if (depth <= -100 && depth >= -180) {
      grade = 45 + Math.random() * 7; // High grade
    } else if (depth <= -60 && depth >= -220) {
      grade = 30 + Math.random() * 13; // Medium grade
    }

    const dx = lengthMeters * Math.cos(strikeRad) + dispersionMeters * Math.cos(strikeRad + Math.PI/2);
    const dy = lengthMeters * Math.sin(strikeRad) + dispersionMeters * Math.sin(strikeRad + Math.PI/2);
    
    const lng = centerLng + dx / (111111 * Math.cos(centerLat * Math.PI / 180));
    const lat = centerLat + dy / 111111;

    points.push({ lng, lat, depth, grade });
  }
  return points;
})();

export function getSubsurfaceBlockLayers({ depthRange, visible }: SubsurfaceBlockLayerProps) {
  if (!visible) return [];

  const currentSliderDepth = depthRange[1];

  const filteredData = ORE_BODY_VOXELS.filter(
    (d: any) => Math.abs(d.depth) <= currentSliderDepth
  );

  const voxelLayer = new PointCloudLayer({
    id: 'subsurface-ore-voxels',
    data: filteredData,
    getPosition: (d: any) => [d.lng, d.lat, d.depth],
    getColor: (d: any) => 
      d.grade >= 44 ? [16, 185, 129, 230] : 
      d.grade >= 30 ? [245, 158, 11, 210] : 
      [217, 70, 239, 160],
    getNormal: [0, 1, 0],
    pointSize: 18,
    sizeUnits: 'meters',
    pickable: true,
    updateTriggers: {
      data: [currentSliderDepth]
    }
  });

  const targetPinLayer = new ScatterplotLayer({
    id: 'target-pin',
    data: [{ coordinates: [80.201, 21.874, -125] }],
    getPosition: (d: any) => d.coordinates,
    getFillColor: [6, 182, 212, 255],
    getLineColor: [255, 255, 255, 255],
    lineWidthMinPixels: 2,
    getRadius: 40,
    radiusUnits: 'meters',
    stroked: true,
    pickable: true,
  });

  return [voxelLayer, targetPinLayer];
}

