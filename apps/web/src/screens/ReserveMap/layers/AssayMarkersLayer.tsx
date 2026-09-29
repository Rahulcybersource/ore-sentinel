import React, { useMemo } from 'react';
// @ts-ignore
import { Source, Layer, Marker } from 'react-map-gl/maplibre';

interface AssayPoint {
  realLat: number;
  realLng: number;
  mnGrade: number;
  tier: 'high' | 'medium' | 'low';
  confidenceScore: number;
}

interface AssayMarkersLayerProps {
  gridData: AssayPoint[];
  visible: boolean;
}

/**
 * MOIL Grade Markers Layer
 * 
 * Renders assay points with MOIL standard grade icons:
 *   - Ferro Grade (>=44%):        Green circles  — native MapLibre circle layer (GPU)
 *   - SMGR Grade (30-43%):        Amber triangles — React Marker SVG (custom shape)
 *   - Blast Furnace Grade (<30%):  Red diamonds   — React Marker SVG (custom shape)
 * 
 * Plus a native symbol layer for Mn% text labels on every point.
 */
export const AssayMarkersLayer: React.FC<AssayMarkersLayerProps> = ({ gridData, visible }) => {

  // Separate into ferro (native circle) vs custom SVG markers
  const { ferroGeoJSON, smgrPoints, blastPoints } = useMemo(() => {
    const ferroFeatures: any[] = [];
    const smgr: AssayPoint[] = [];
    const blast: AssayPoint[] = [];

    gridData.forEach(point => {
      if (point.tier === 'high') {
        ferroFeatures.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [point.realLng, point.realLat] },
          properties: { mnGrade: Math.round(point.mnGrade * 10) / 10, tier: 'high' }
        });
      } else if (point.tier === 'medium') {
        smgr.push(point);
      } else {
        blast.push(point);
      }
    });

    return {
      ferroGeoJSON: { type: 'FeatureCollection' as const, features: ferroFeatures },
      smgrPoints: smgr,
      blastPoints: blast,
    };
  }, [gridData]);

  // Full GeoJSON for text labels (all points)
  const allPointsGeoJSON = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: gridData.map(point => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [point.realLng, point.realLat] },
      properties: { mnGrade: Math.round(point.mnGrade * 10) / 10 }
    }))
  }), [gridData]);

  if (!visible) return null;

  return (
    <>
      {/* ── FERRO GRADE (>=44%): Native MapLibre circle layer (GPU-rendered) ── */}
      <Source id="assay-ferro-src" type="geojson" data={ferroGeoJSON}>
        <Layer
          id="assay-ferro-circles"
          type="circle"
          paint={{
            'circle-color': '#10b981',
            'circle-radius': 5,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1,
            'circle-opacity': 0.9,
          }}
        />
      </Source>

      {/* ── SMGR GRADE (30-43%): Amber triangle SVG markers (memoized) ── */}
      {smgrPoints.map((pt, i) => (
        <Marker key={`smgr-${i}`} latitude={pt.realLat} longitude={pt.realLng} anchor="center">
          <svg width="12" height="12" viewBox="0 0 12 12" className="drop-shadow-sm">
            <polygon points="6,1 11,11 1,11" fill="#f59e0b" stroke="#fff" strokeWidth="0.8" />
          </svg>
        </Marker>
      ))}

      {/* ── BLAST FURNACE GRADE (<30%): Red diamond SVG markers (memoized) ── */}
      {blastPoints.map((pt, i) => (
        <Marker key={`blast-${i}`} latitude={pt.realLat} longitude={pt.realLng} anchor="center">
          <svg width="12" height="12" viewBox="0 0 12 12" className="drop-shadow-sm">
            <polygon points="6,1 11,6 6,11 1,6" fill="#ef4444" stroke="#fff" strokeWidth="0.8" />
          </svg>
        </Marker>
      ))}

      {/* ── TEXT LABELS: Mn% next to assay points (HTML Markers to guarantee rendering) ── */}
      {gridData.filter(pt => pt.tier === 'high' || pt.tier === 'medium').map((pt, i) => (
        <Marker key={`label-${i}`} latitude={pt.realLat} longitude={pt.realLng} anchor="left">
          <div className="text-[#e2e8f0] text-[9px] font-mono font-bold ml-2.5 drop-shadow-[0_1px_2px_rgba(0,0,0,1)] select-none pointer-events-none" style={{ textShadow: '0 0 3px #000, 0 0 3px #000' }}>
            {pt.mnGrade.toFixed(1)}% Mn
          </div>
        </Marker>
      ))}
    </>
  );
};
