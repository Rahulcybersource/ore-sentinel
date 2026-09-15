import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
// @ts-ignore
import Map, { Marker, Popup, Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useAdapters } from '../data/adapters/AdapterContext';
import type { ReserveCell } from '../data/types/models';
import { motion } from 'framer-motion';
import { 
  Info, 
  Target, 
  Triangle, 
  Circle, 
  Diamond, 
  Compass,
  ChevronDown
} from 'lucide-react';
import { motionPresets } from '../theme/tokens';
import { ErrorState, SkeletonBar } from '../components/Skeletons';

import { NATIONAL_MN_REGISTRY } from '../data/constants/mineRegistry';
import { MineralHeatmapLayer } from './ReserveMap/layers/MineralHeatmapLayer';
import { AssayMarkersLayer } from './ReserveMap/layers/AssayMarkersLayer';
import { LayerController } from './ReserveMap/LayerController';
import { evaluateDrillTarget } from '../utils/drillTargetEvaluator';

// Helper to grab coords from the registry
const getSite = (id: string) => NATIONAL_MN_REGISTRY.find(m => m.id === id);

// Real MOIL Site coordinates per prompt specification
interface MineSiteConfig {
  id: string;
  name: string;
  state: string;
  lat: number;
  lng: number;
  strikeTrend: number;
  zoom: number;
  corridorName: string;
  corridorAvgGrade: string;
  roadDistance: string;
}

const MINE_SITES: Record<string, MineSiteConfig> = {
  balaghat: {
    id: 'balaghat',
    name: 'Balaghat Complex',
    state: 'Madhya Pradesh',
    lat: getSite('BAL-01')?.coordinates[1] || 0,
    lng: getSite('BAL-01')?.coordinates[0] || 0,
    strikeTrend: getSite('BAL-01')?.strikeTrend || 75,
    zoom: 14.5,
    corridorName: 'North Manganese Corridor',
    corridorAvgGrade: 'avg. 48.6% Mn',
    roadDistance: '340m'
  },
  gumgaon: {
    id: 'gumgaon',
    name: 'Gumgaon Mine',
    state: 'Maharashtra',
    lat: getSite('GUM-05')?.coordinates[1] || 0,
    lng: getSite('GUM-05')?.coordinates[0] || 0,
    strikeTrend: getSite('GUM-05')?.strikeTrend || 95,
    zoom: 14.5,
    corridorName: 'Gumgaon Main Lode Corridor',
    corridorAvgGrade: 'avg. 46.2% Mn',
    roadDistance: '220m'
  },
  kandri: {
    id: 'kandri',
    name: 'Kandri',
    state: 'Maharashtra',
    lat: getSite('KAN-04')?.coordinates[1] || 0,
    lng: getSite('KAN-04')?.coordinates[0] || 0,
    strikeTrend: getSite('KAN-04')?.strikeTrend || 120,
    zoom: 14.5,
    corridorName: 'Kandri Deep Vein',
    corridorAvgGrade: 'avg. 45.1% Mn',
    roadDistance: '150m'
  }
};

// Esri World Imagery Raster Tile Source — Standard high-resolution satellite basemap
// The basemap occupies Z-level 1 (bottom of the visual stack)
const ESRI_SATELLITE_STYLE: any = {
  version: 8,
  sources: {
    'esri-world-imagery': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      ],
      tileSize: 256,
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'
    }
  },
  layers: [
    {
      id: 'esri-imagery-layer',
      type: 'raster',
      source: 'esri-world-imagery',
      minzoom: 0,
      maxzoom: 19
    }
  ]
};

// Convex hull algorithm for computing the corridor boundary polygon over real lat/lng
function getConvexHull(points: { lat: number; lng: number }[]): number[][] {
  if (points.length < 3) return points.map((p) => [p.lng, p.lat]);
  const pts = [...points].sort((a, b) => a.lng === b.lng ? a.lat - b.lat : a.lng - b.lng);
  const cross = (o: any, a: any, b: any) => (a.lng - o.lng) * (b.lat - o.lat) - (a.lat - o.lat) * (b.lng - o.lng);
  const lower = [];
  for (let i = 0; i < pts.length; i++) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], pts[i]) <= 0) lower.pop();
    lower.push(pts[i]);
  }
  const upper = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], pts[i]) <= 0) upper.pop();
    upper.push(pts[i]);
  }
  upper.pop();
  lower.pop();
  const ring = lower.concat(upper).map((p) => [p.lng, p.lat]);
  if (ring.length > 0) ring.push(ring[0]); // close polygon
  return ring;
}

export const ReserveMap: React.FC = () => {
  const adapters = useAdapters();
  const mapRef = useRef<any>(null);

  // Selected mine site state
  const [selectedSiteId, setSelectedSiteId] = useState<string>('balaghat');
  const currentSite = MINE_SITES[selectedSiteId] || MINE_SITES.balaghat;

  const [rawGrid, setRawGrid] = useState<ReserveCell[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─── LAYER TOGGLE STATE ───────────────────────────────────────────────
  // These booleans drive both `layout.visibility` AND `paint.*-opacity`
  // on every MapLibre <Layer> component. The source of truth is
  // AdapterContext.mapLayers, toggled by LayerController.
  const { mapLayers } = adapters;
  const activeLayers = {
    vedasFaults:  mapLayers.isroFaults,
    sentinelIron: mapLayers.sentinelIronOxide,
    nasaMn:       mapLayers.nasaHyperspectral,
  };

  // Fetch reserve data for selected site
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adapters.reserve.getReserveGrid(selectedSiteId);
      setRawGrid(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load reserve map data");
    } finally {
      setLoading(false);
    }
  }, [adapters, selectedSiteId]);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  // When switching sites, smoothly fly the map camera to the new coordinates
  const handleSiteChange = (siteId: string) => {
    setSelectedSiteId(siteId);
    const target = MINE_SITES[siteId];
    if (target && mapRef.current) {
      mapRef.current.flyTo({
        center: [target.lng, target.lat],
        zoom: target.zoom,
        pitch: 35,
        duration: 1200
      });
    }
  };

  // Anchor every cell around the real site coordinates (~1-2km radius)
  const { processedGrid, corridorFeature } = useMemo(() => {
    if (!rawGrid.length) {
      return { processedGrid: [], corridorFeature: null };
    }

    const highMedPoints: { lat: number; lng: number }[] = [];
    const processed = rawGrid.map((cell, index) => {
      const row = Math.floor(index / 10);
      const col = index % 10;
      
      const realLat = currentSite.lat + (row - 4.5) * 0.0022;
      const realLng = currentSite.lng + (col - 4.5) * 0.0024;
      const mnGrade = (cell.probability * 32) + 22;
      
      let tier: 'high' | 'medium' | 'low';
      if (mnGrade >= 44) tier = 'high';
      else if (mnGrade >= 30) tier = 'medium';
      else tier = 'low';

      if (tier === 'high' || tier === 'medium') {
        highMedPoints.push({ lat: realLat, lng: realLng });
      }

      return { ...cell, realLat, realLng, mnGrade, tier };
    });

    const hull = getConvexHull(highMedPoints);
    const corridor = hull.length > 3 ? {
      type: 'FeatureCollection' as const,
      features: [{
        type: 'Feature' as const,
        geometry: { type: 'Polygon' as const, coordinates: [hull] },
        properties: {
          name: currentSite.corridorName,
          grade: currentSite.corridorAvgGrade
        }
      }]
    } : null;

    return { processedGrid: processed, corridorFeature: corridor };
  }, [rawGrid, currentSite]);

  const recommendation = useMemo(() => {
    return evaluateDrillTarget(currentSite.lat, currentSite.lng, currentSite.strikeTrend);
  }, [currentSite]);

  // ─── Z-LEVEL 2: Sentinel-2 Iron Oxide Raster Overlay ──────────────────
  // GeoJSON polygon grid simulating spectral alteration composite
  const compositeGeoJSON = useMemo(() => {
    if (!processedGrid.length) return null;
    const halfLat = 0.0011;
    const halfLng = 0.0012;

    const features = processedGrid.map(cell => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[
          [cell.realLng - halfLng, cell.realLat - halfLat],
          [cell.realLng + halfLng, cell.realLat - halfLat],
          [cell.realLng + halfLng, cell.realLat + halfLat],
          [cell.realLng - halfLng, cell.realLat + halfLat],
          [cell.realLng - halfLng, cell.realLat - halfLat]
        ]]
      },
      properties: {
        probability: cell.probability,
        grade: cell.mnGrade
      }
    }));
    return { type: 'FeatureCollection' as const, features };
  }, [processedGrid]);

  // ─── LAYER DEFINITIONS (visibility + opacity dual-control) ────────────
  // Using BOTH layout.visibility AND paint.*-opacity ensures:
  //   • layout.visibility = 'none' → MapLibre skips rendering entirely (perf)
  //   • paint.*-opacity with transition → smooth crossfade when toggling

  // Z-LEVEL 2: Sentinel Iron Oxide composite fill
  const compositeFillLayer: any = {
    id: 'sentinel-iron-fill',
    type: 'fill',
    beforeId: 'waterway-label',
    layout: {
      visibility: activeLayers.sentinelIron ? 'visible' : 'none'
    },
    paint: {
      'fill-color': [
        'interpolate', ['linear'], ['get', 'probability'],
        0.0, 'rgba(67, 56, 202, 0.15)',
        0.4, 'rgba(16, 185, 129, 0.35)',
        0.7, 'rgba(245, 158, 11, 0.50)',
        1.0, 'rgba(239, 68, 68, 0.65)'
      ],
      'fill-opacity': 0.85
    }
  };

  // Z-LEVEL 2: Sentinel grid lines
  const compositeLineLayer: any = {
    id: 'sentinel-iron-lines',
    type: 'line',
    beforeId: 'waterway-label',
    layout: {
      visibility: activeLayers.sentinelIron ? 'visible' : 'none'
    },
    paint: {
      'line-color': 'rgba(255, 255, 255, 0.12)',
      'line-width': 1,
      'line-opacity': 1
    }
  };

  // Z-LEVEL 3: ISRO Structural Faults — corridor boundary fill
  const corridorFillLayer: any = {
    id: 'vedas-fault-fill',
    type: 'fill',
    beforeId: 'waterway-label',
    layout: {
      visibility: activeLayers.vedasFaults ? 'visible' : 'none'
    },
    paint: {
      'fill-color': '#00D9C0',
      'fill-opacity': 0.12
    }
  };

  // Z-LEVEL 3: ISRO Structural Faults — corridor dashed boundary line
  const corridorLineLayer: any = {
    id: 'vedas-fault-line',
    type: 'line',
    beforeId: 'waterway-label',
    layout: {
      visibility: activeLayers.vedasFaults ? 'visible' : 'none'
    },
    paint: {
      'line-color': '#06b6d4',
      'line-width': 3,
      'line-dasharray': [4, 2],
      'line-opacity': 0.8
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full bg-navy-900 p-8 flex flex-col gap-4">
        <SkeletonBar className="h-16 w-80" />
        <SkeletonBar className="flex-1 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <ErrorState message={error} onRetry={fetchData} />
      </div>
    );
  }

  return (
    <motion.div 
      variants={motionPresets.fadeIn}
      initial="initial"
      animate="animate"
      exit="exit"
      className="relative w-full h-full bg-navy-950 overflow-hidden select-none"
    >
      {/* ══════════════════════════════════════════════════════════════════
          MAPLIBRE GL JS — Z-ORDER STACK (bottom to top):
          1. Basemap (Esri Satellite)       — defined in mapStyle
          2. Raster Overlays                — sentinel-iron-fill/lines
          3. GeoJSON Polygons/Lines         — vedas-fault-fill/line
          4. GeoJSON Heatmaps               — mineral-heatmap-layer
          5. Symbols/Markers                — Drill site marker, labels
          ═══════════════════════════════════════════════════════════════ */}
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: currentSite.lng,
          latitude: currentSite.lat,
          zoom: currentSite.zoom,
          pitch: 35
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={ESRI_SATELLITE_STYLE}
        attributionControl={false}
      >
        {/* ── Z-LEVEL 2: SENTINEL-2 IRON OXIDE RASTER OVERLAY ────────── */}
        {compositeGeoJSON && (
          <Source id="sentinel-composite-src" type="geojson" data={compositeGeoJSON}>
            <Layer {...compositeFillLayer} />
            <Layer {...compositeLineLayer} />
          </Source>
        )}

        {/* ── Z-LEVEL 3: ISRO VEDAS STRUCTURAL FAULTS (CORRIDOR) ─────── */}
        {corridorFeature && (
          <Source id="vedas-corridor-src" type="geojson" data={corridorFeature}>
            <Layer {...corridorFillLayer} />
            <Layer {...corridorLineLayer} />
          </Source>
        )}

        {/* ── Z-LEVEL 3b: Corridor Label Tag (HTML Marker) ───────────── */}
        {activeLayers.vedasFaults && corridorFeature && (
          <Marker
            latitude={currentSite.lat + 0.007}
            longitude={currentSite.lng}
            anchor="center"
          >
            <div className="px-2.5 py-1 bg-navy-900/90 border border-teal-500/60 rounded-md text-[10px] font-mono text-teal-300 font-bold shadow-lg backdrop-blur-md pointer-events-none flex items-center gap-1.5">
              <span className="w-2 h-0 border-t-2 border-dashed border-teal-400 inline-block" />
              <span>{currentSite.corridorName} ({currentSite.corridorAvgGrade})</span>
            </div>
          </Marker>
        )}

        {/* ── Z-LEVEL 3c: ASSAY MARKERS WITH MOIL GRADE ICONS ──────── */}
        <AssayMarkersLayer 
          gridData={processedGrid}
          visible={activeLayers.sentinelIron}
        />

        {/* ── Z-LEVEL 4+5: HEATMAP & DRILL TARGET AI (self-contained) ── */}
        <MineralHeatmapLayer 
          gridData={processedGrid} 
          recommendation={recommendation} 
          opacity={activeLayers.nasaMn ? 0.75 : 0}
          visible={activeLayers.nasaMn}
        />
      </Map>

      {/* ════════════════════════════════════════════════════════════════
          FLOATING UI PANELS — matches Balaghat reference layout
          ════════════════════════════════════════════════════════════ */}

      {/* ── TOP BAR: Site name + Coordinates ── */}
      <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
        <div className="flex items-center justify-between px-5 py-3">
          {/* Left: Site name badge */}
          <div className="pointer-events-auto flex items-center gap-2 bg-navy-900/80 backdrop-blur-md border border-white/10 rounded-lg px-4 py-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-sm font-medium text-slate-100">{currentSite.name}</span>
          </div>

          {/* Center: Site selector dropdown */}
          <div className="pointer-events-auto relative">
            <select
              value={selectedSiteId}
              onChange={(e) => handleSiteChange(e.target.value)}
              className="appearance-none bg-navy-900/80 backdrop-blur-md border border-white/10 text-slate-100 font-medium text-sm py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:border-cyan-500/50 cursor-pointer transition-colors"
            >
              <option value="balaghat">Balaghat Complex (MP)</option>
              <option value="gumgaon">Gumgaon Mine (MH)</option>
              <option value="kandri">Kandri (MH)</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Right: Coordinates display */}
          <div className="pointer-events-auto flex items-center gap-2 bg-navy-900/80 backdrop-blur-md border border-white/10 rounded-lg px-4 py-2">
            <Compass size={14} className="text-cyan-400" />
            <span className="text-xs font-mono text-slate-300">
              {currentSite.lat.toFixed(3)}° N, {currentSite.lng.toFixed(3)}° E
            </span>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL: Advanced Layers + Assay Legend ── */}
      <div className="absolute top-16 right-4 z-10 pointer-events-auto w-64 space-y-3 max-h-[calc(100%-120px)] overflow-y-auto">

        {/* Advanced Layers Panel */}
        <div className="bg-navy-900/85 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-xl">
          <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider mb-4 flex items-center justify-between">
            Advanced Layers
            <Info size={14} className="text-slate-500" />
          </h3>
          <div className="space-y-3">
            {/* ISRO Structural Faults */}
            <label className="flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-2">
                <span className="w-4 h-0 border-t-2 border-dashed border-cyan-400 inline-block" />
                <span className="text-xs text-slate-300 group-hover:text-white transition-colors">ISRO Structural Faults</span>
              </div>
              <div className={`w-9 h-5 rounded-full relative transition-colors cursor-pointer ${activeLayers.vedasFaults ? 'bg-cyan-500' : 'bg-slate-600'}`}
                onClick={() => adapters.toggleMapLayer('isroFaults')}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${activeLayers.vedasFaults ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
            </label>

            {/* NASA Hyperspectral Mn */}
            <label className="flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-2">
                <span className="w-4 h-3 rounded-sm bg-gradient-to-r from-amber-500 via-emerald-500 to-pink-500 inline-block" />
                <span className="text-xs text-slate-300 group-hover:text-white transition-colors">NASA Hyperspectral Mn</span>
              </div>
              <div className={`w-9 h-5 rounded-full relative transition-colors cursor-pointer ${activeLayers.nasaMn ? 'bg-cyan-500' : 'bg-slate-600'}`}
                onClick={() => adapters.toggleMapLayer('nasaHyperspectral')}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${activeLayers.nasaMn ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
            </label>

            {/* Sentinel Iron Oxide / Assay markers */}
            <label className="flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white/60 inline-block" />
                <span className="text-xs text-slate-300 group-hover:text-white transition-colors">Mineral Corridor</span>
              </div>
              <div className={`w-9 h-5 rounded-full relative transition-colors cursor-pointer ${activeLayers.sentinelIron ? 'bg-cyan-500' : 'bg-slate-600'}`}
                onClick={() => adapters.toggleMapLayer('sentinelIronOxide')}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${activeLayers.sentinelIron ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
            </label>
          </div>
        </div>

        {/* Inspired Layers Info */}
        <div className="bg-navy-900/85 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-xl">
          <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider mb-3">ISRO VEDAS-inspired</h3>
          <div className="space-y-2 text-[10px] text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-4 h-0 border-t-2 border-dashed border-cyan-400 inline-block" />
              <span>ISRO VEDAS-inspired structural</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-0 border-t-2 border-dotted border-teal-400 inline-block" />
              <span>Convex Hull of the mineral corridor</span>
            </div>
          </div>
        </div>

        {/* Assay Points Legend */}
        <div className="bg-navy-900/85 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-xl">
          <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider mb-3 flex items-center justify-between">
            Assay Points
            <Info size={14} className="text-slate-500" />
          </h3>

          {/* Ferro Grade */}
          <div className="mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ferro Grade</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white/60 inline-block" />
              <span className="text-[11px] text-slate-300">≥44% Ferro Grade</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <svg width="12" height="12" viewBox="0 0 12 12"><polygon points="6,1 11,11 1,11" fill="#f59e0b" stroke="#fff" strokeWidth="0.8" /></svg>
              <span className="text-[11px] text-slate-300">30%-43% SMGR Grade</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <svg width="12" height="12" viewBox="0 0 12 12"><polygon points="6,1 11,6 6,11 1,6" fill="none" stroke="#ef4444" strokeWidth="1.2" /></svg>
              <span className="text-[11px] text-slate-300">&lt;30% Blast Furnace Grade</span>
            </div>
          </div>

          {/* Assay Points duplicated for reference clarity */}
          <div className="border-t border-white/10 pt-2 mt-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assay Points</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white/60 inline-block" />
              <span className="text-[11px] text-slate-300">≥44% Ferro Grade</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <svg width="12" height="12" viewBox="0 0 12 12"><polygon points="6,1 11,11 1,11" fill="#f59e0b" stroke="#fff" strokeWidth="0.8" /></svg>
              <span className="text-[11px] text-slate-300">30%-43% SMGR Grade</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <svg width="12" height="12" viewBox="0 0 12 12"><polygon points="6,1 11,6 6,11 1,6" fill="none" stroke="#ef4444" strokeWidth="1.2" /></svg>
              <span className="text-[11px] text-slate-300">&lt;30% Blast Furnace Grade</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM BAR: Attribution ── */}
      <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none">
        <div className="flex items-center justify-between px-5 py-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-medium">⊕ MapLibre GL</span>
          </div>
          <span className="text-[9px] text-slate-500 italic">
            Multispectral Mineral Composite Heatmap raster (Copernicus Sentinel-3/NASA EMIT inspired)
          </span>
          <span className="text-[9px] text-slate-500 pointer-events-auto cursor-pointer hover:text-slate-300 transition-colors">
            Data Sources & Attribution
          </span>
        </div>
      </div>

      <style>{`
        .maplibregl-popup-content {
          background: transparent !important;
          padding: 0 !important;
          box-shadow: none !important;
        }
        .maplibregl-popup-tip {
          border-top-color: rgba(11, 15, 25, 0.95) !important;
        }
      `}</style>
    </motion.div>
  );
};
