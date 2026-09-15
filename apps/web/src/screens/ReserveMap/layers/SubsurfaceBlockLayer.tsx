import { PointCloudLayer, ScatterplotLayer } from '@deck.gl/layers';

interface SubsurfaceBlockLayerProps {
  data: any[];
  depthRange: [number, number];
  visible: boolean;
}

export function getSubsurfaceBlockLayers({ data, depthRange, visible }: SubsurfaceBlockLayerProps) {
  if (!visible) return [];

  const filteredData = data.filter(
    (d: any) => d.depthMeters >= depthRange[0] && d.depthMeters <= depthRange[1]
  );

  const voxelLayer = new PointCloudLayer({
    id: 'subsurface-assays',
    data: filteredData,
    getPosition: (d: any) => [d.realLng, d.realLat, -d.depthMeters],
    getColor: (d: any) => 
      d.mnGrade >= 44 ? [16, 185, 129, 220] : 
      d.mnGrade >= 30 ? [245, 158, 11, 200] : 
      [217, 70, 239, 140],
    getNormal: [0, 0, 1],
    pointSize: 25,
    sizeUnits: 'meters',
    pickable: true,
    updateTriggers: {
      data: [depthRange]
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

