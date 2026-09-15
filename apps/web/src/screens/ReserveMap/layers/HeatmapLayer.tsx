import React, { useMemo } from 'react';
// @ts-ignore
import { Source, Layer } from 'react-map-gl/maplibre';

interface HeatmapLayerProps {
  centerLat: number;
  centerLng: number;
  strikeTrend: number;
}

/**
 * Generates a realistic Mn-grade heatmap based on known Sausar Group ore-body geology.
 * The ore body follows a NE-SW corridor with 2-3 distinct high-grade pods (lenses),
 * which is the typical style of Mn deposits in the Balaghat / MOIL belt.
 */
export const HeatmapLayer: React.FC<HeatmapLayerProps> = ({ centerLat, centerLng, strikeTrend }) => {

  const geojsonData = useMemo(() => {
    const points: any[] = [];

    const bearingRad = strikeTrend * (Math.PI / 180);
    const kmPerLat = 111.32;
    const kmPerLng = 111.32 * Math.cos(centerLat * (Math.PI / 180));

    /**
     * Project a point offset along and across the strike direction.
     * @param alongKm  Distance along the strike axis (+ = strike direction)
     * @param acrossKm Distance perpendicular to strike (+ = right of strike)
     */
    const project = (alongKm: number, acrossKm: number) => {
      // along-strike unit vector
      const dx_along = Math.sin(bearingRad);
      const dy_along = Math.cos(bearingRad);
      // across-strike unit vector (rotate 90°)
      const dx_across = Math.cos(bearingRad);
      const dy_across = -Math.sin(bearingRad);

      const dx = alongKm * dx_along + acrossKm * dx_across;
      const dy = alongKm * dy_along + acrossKm * dy_across;

      return {
        lat: centerLat + dy / kmPerLat,
        lng: centerLng + dx / kmPerLng
      };
    };

    /**
     * Seed a single ore-body lens/pod with a bivariate Gaussian distribution.
     *
     * @param centerAlong   Centre position along strike (km from map centre)
     * @param centerAcross  Centre position across strike (km from map centre)
     * @param peakGrade     Peak Mn% at the centre of the pod
     * @param sigmaAlong    Std-dev of Gaussian along strike (km) — controls length
     * @param sigmaAcross   Std-dev of Gaussian across strike (km) — controls width
     * @param nPts          Number of sample points to scatter in this pod
     */
    const seedPod = (
      centerAlong: number,
      centerAcross: number,
      peakGrade: number,
      sigmaAlong: number,
      sigmaAcross: number,
      nPts: number
    ) => {
      for (let i = 0; i < nPts; i++) {
        // Box-Muller for Gaussian samples
        const u1 = Math.random(), u2 = Math.random();
        const z0 = Math.sqrt(-2 * Math.log(u1 + 1e-9)) * Math.cos(2 * Math.PI * u2);
        const z1 = Math.sqrt(-2 * Math.log(u1 + 1e-9)) * Math.sin(2 * Math.PI * u2);

        const along  = centerAlong  + z0 * sigmaAlong;
        const across = centerAcross + z1 * sigmaAcross;

        // Grade drops off proportionally to Gaussian distance from pod centre
        const distSq  = (z0 * z0) + (z1 * z1);
        const gradeFactor = Math.exp(-0.5 * distSq); // 1 at centre → 0 at edges
        const noise = (Math.random() - 0.5) * 4;
        const grade = Math.max(20, Math.min(60, peakGrade * gradeFactor + noise + peakGrade * 0.15));

        const { lat, lng } = project(along, across);
        points.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [lng, lat] },
          properties: { mn_grade: grade }
        });
      }
    };

    // ──────────────────────────────────────────────────────────────────
    // BALAGHAT BHARVELI ORE BODY  – three geological lenses as mapped
    // Reference: GSI & MOIL Geological Reports; Sausar Group Formation
    // ──────────────────────────────────────────────────────────────────

    // Lens 1 – Upper pod (NE end) – highest grade, tight cluster
    //   ~1.6km NE of map centre, slightly right of strike
    seedPod(+1.6, +0.05, 56, 0.35, 0.12, 280);

    // Lens 2 – Main (Central) pod – large, high grade
    //   At map centre, central corridor
    seedPod(0.0, -0.05, 52, 0.55, 0.18, 350);

    // Lens 3 – Lower pod (SW end) – medium-high grade, wider
    //   ~1.4km SW of map centre, slightly left of strike
    seedPod(-1.4, +0.08, 48, 0.45, 0.16, 260);

    // Background / halo around the main corridor – lower grade material
    // (SMGR / BF-grade disseminated Mn, extends the visible corridor)
    seedPod(+0.8,  0.0,  35, 0.70, 0.22, 120);
    seedPod(-0.6,  0.0,  33, 0.65, 0.20, 110);
    seedPod(+2.0, +0.10, 28, 0.40, 0.15,  60);
    seedPod(-2.0, -0.10, 26, 0.38, 0.14,  55);

    return { type: 'FeatureCollection', features: points };
  }, [centerLat, centerLng, strikeTrend]);

  return (
    <Source id="heatmap-source" type="geojson" data={geojsonData}>
      <Layer
        id="mn-heatmap-layer"
        type="heatmap"
        paint={{
          // Weight = how much each sample point contributes to the density
          // Samples with higher Mn grade contribute more strongly
          'heatmap-weight': [
            'interpolate', ['linear'], ['get', 'mn_grade'],
            20, 0.05,   // BF grade – barely visible
            30, 0.15,
            43, 0.55,   // SMGR threshold
            50, 0.85,
            56, 1.0     // Peak Ferro grade
          ],

          // Color ramp: transparent → teal → amber → green → pink
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0,    'rgba(0, 0, 0, 0)',
            0.2,  'rgba(20, 184, 166, 0.5)',  // Teal
            0.4,  'rgba(245, 158, 11, 0.7)',  // Amber
            0.6,  'rgba(16, 185, 129, 0.8)',  // Green
            0.8,  'rgba(236, 72, 153, 0.9)',  // Pink
            1.0,  'rgba(244, 114, 182, 1.0)'  // Lighter pink
          ],

          // Radius scales with zoom so the corridor looks correct at all zoom levels
          'heatmap-radius': [
            'interpolate', ['linear'], ['zoom'],
            10, 18,
            13, 40,
            15, 70,
            17, 120
          ],

          // Intensity amplifier – boosts the visible contrast of the pods
          'heatmap-intensity': [
            'interpolate', ['linear'], ['zoom'],
            10, 1.2,
            15, 2.5
          ],

          'heatmap-opacity': 0.82
        }}
      />
    </Source>
  );
};
