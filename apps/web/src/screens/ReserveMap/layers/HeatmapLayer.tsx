import React, { useMemo } from 'react';
// @ts-ignore
import { Source, Layer } from 'react-map-gl/maplibre';

interface HeatmapLayerProps {
  centerLat: number;
  centerLng: number;
  strikeTrend: number;
  opacity?: number;
}

export const HeatmapLayer: React.FC<HeatmapLayerProps> = ({ centerLat, centerLng, strikeTrend, opacity = 0.75 }) => {
  const geojsonData = useMemo(() => {
    // Generate points along the strike trend spanning 4.5km
    const points: any[] = [];
    const numPoints = 200; // Dense enough for a good KDE heatmap
    const lengthKm = 4.5;
    
    // Bearing in radians
    const bearingRad = strikeTrend * (Math.PI / 180);
    
    const kmPerLat = 111.32;
    const kmPerLng = 111.32 * Math.cos(centerLat * (Math.PI / 180));
    
    // Generate synthetic sampling points mimicking Sentinel-2 / Drilling data
    for (let i = 0; i < numPoints; i++) {
      // Distance along the 4.5km line: from -2.25km to +2.25km
      const distanceAlongStrike = ((i / (numPoints - 1)) - 0.5) * lengthKm;
      
      // Lateral spread perpendicular to strike trend (normal-ish distribution)
      // Creates a corridor effect
      const u = Math.random() + Math.random() + Math.random(); // approx normal
      const lateralSpreadKm = (u - 1.5) * 0.4; // +/- 600m max, mostly clustered in center
      
      const dx = (distanceAlongStrike * Math.sin(bearingRad)) + (lateralSpreadKm * Math.cos(bearingRad));
      const dy = (distanceAlongStrike * Math.cos(bearingRad)) - (lateralSpreadKm * Math.sin(bearingRad));
      
      const pLat = centerLat + (dy / kmPerLat);
      const pLng = centerLng + (dx / kmPerLng);
      
      // Simulate grade clustering (higher grades in the center of the strike)
      const centerFactor = 1 - Math.abs(distanceAlongStrike) / (lengthKm / 2);
      const randomNoise = (Math.random() - 0.5) * 15;
      
      let baseGrade = 25 + (centerFactor * 25); // Range ~25 to 50
      let mnGrade = Math.max(15, Math.min(60, baseGrade + randomNoise));
      
      points.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [pLng, pLat]
        },
        properties: {
          mn_grade: mnGrade
        }
      });
    }

    return {
      type: 'FeatureCollection',
      features: points
    };
  }, [centerLat, centerLng, strikeTrend]);

  return (
    <Source id="heatmap-source" type="geojson" data={geojsonData}>
      <Layer
        id="mn-heatmap-layer"
        type="heatmap"
        paint={{
          // MOIL Grade Interpolation
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'mn_grade'],
            0, 0,
            30, 0.1, // Blast Furnace < 30%
            43, 0.5, // SMGR 30-43%
            44, 1.0, // Ferro Grade >= 44%
            60, 1.0
          ],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(11, 18, 32, 0)',
            0.2, '#00D9C0',  // Low Alteration
            0.5, '#F59E0B',  // SMGR Amber
            0.8, '#10B981',  // Ferro Grade Green
            1.0, '#EC4899'   // Peak Target Anomaly
          ],
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            11, 15,
            16, 60
          ],
          'heatmap-opacity': opacity,
          'heatmap-opacity-transition': { duration: 300 }
        }}
      />
    </Source>
  );
};
