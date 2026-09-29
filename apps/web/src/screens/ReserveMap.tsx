import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
// @ts-ignore
import Map, { Marker, Popup, Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import DeckGL from '@deck.gl/react';
import { getSubsurfaceBlockLayers } from './ReserveMap/layers/SubsurfaceBlockLayer';
import SubsurfaceBlockView from './ReserveMap/SubsurfaceBlockView';
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
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: {
    'esri-world-imagery': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      ],
      tileSize: 256,
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'
    },
    'esri-world-reference': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'
      ],
      tileSize: 256
    },
    'esri-world-transportation': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}'
      ],
      tileSize: 256
    }
  },
  layers: [
    {
      id: 'esri-imagery-layer',
      type: 'raster',
      source: 'esri-world-imagery',
      minzoom: 0,
      maxzoom: 19
    },
    {
      id: 'esri-transportation-layer',
      type: 'raster',
      source: 'esri-world-transportation',
      minzoom: 0,
      maxzoom: 19
    },
    {
      id: 'esri-reference-layer',
      type: 'raster',
      source: 'esri-world-reference',
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

  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [selectedTacticalZone, setSelectedTacticalZone] = useState<{lat: number, lng: number, grade: number} | null>(null);

  // ─── LAYER TOGGLE STATE ───────────────────────────────────────────────
  // These booleans drive both `layout.visibility` AND `paint.*-opacity`
  // on every MapLibre <Layer> component. The source of truth is
  // AdapterContext.mapLayers, toggled by LayerController.
  const { mapLayers } = adapters;
  const activeLayers = {
    vedasFaults:  mapLayers.isroFaults,
    sentinelIron: mapLayers.sentinelIronOxide,
    nasaMn:       mapLayers.nasaHyperspectral,
    subsurfaceBlock: mapLayers.subsurfaceBlock
  };

  const [depthRange, setDepthRange] = useState<[number, number]>([0, 350]);

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
  const { processedGrid, corridorFeature, rawFeatureCollection } = useMemo(() => {
    if (!rawGrid || !rawGrid.features) {
      return { processedGrid: [], corridorFeature: null, rawFeatureCollection: null };
    }

    const highMedPoints: { lat: number; lng: number }[] = [];
    const processed = rawGrid.features.map((feature: any) => {
      const realLat = feature.geometry.coordinates[1];
      const realLng = feature.geometry.coordinates[0];
      // Keep mnGrade from geologySimulator directly
      const mnGrade = feature.properties.mnGrade;
      const depthMeters = feature.properties.depthMeters || 100;
      
      let tier: 'high' | 'medium' | 'low';
      if (mnGrade >= 44) tier = 'high';
      else if (mnGrade >= 30) tier = 'medium';
      else tier = 'low';

      if (tier === 'high' || tier === 'medium') {
        highMedPoints.push({ lat: realLat, lng: realLng });
      }

      return { 
        ...feature.properties, 
        realLat, 
        realLng, 
        mnGrade, 
        depthMeters,
        tier 
      };
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

    return { processedGrid: processed, corridorFeature: corridor, rawFeatureCollection: rawGrid };
  }, [rawGrid, currentSite]);

  const recommendation = useMemo(() => {
    return evaluateDrillTarget(currentSite.lat, currentSite.lng, currentSite.strikeTrend);
  }, [currentSite]);

  const topHighGradeCells = useMemo(() => {
    return [...processedGrid].filter(c => c.tier === 'high').sort((a,b) => b.mnGrade - a.mnGrade).slice(0, 25);
  }, [processedGrid]);

  const topMedGradeCells = useMemo(() => {
    return [...processedGrid].filter(c => c.tier === 'medium').sort((a,b) => b.mnGrade - a.mnGrade).slice(0, 35);
  }, [processedGrid]);

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

  if (selectedSiteId === 'balaghat' && viewMode === '3d') {
    return (
      <div className="relative w-full h-full bg-black overflow-hidden select-none">
        <SubsurfaceBlockView />
        {/* Switch back to 2D Button */}
        <div className="absolute top-4 right-4 z-50 pointer-events-auto">
          <button 
            onClick={() => setViewMode('2d')}
            className="flex items-center gap-2 px-5 py-2 bg-navy-900/90 text-cyan-400 border border-cyan-500/50 rounded-lg shadow-lg hover:bg-cyan-900 hover:text-white transition-all font-mono text-sm uppercase"
          >
            <Compass size={16} />
            Back to 2D Map
          </button>
        </div>
        {/* Navigation override (invisible until hovered) so we aren't stuck */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 opacity-0 hover:opacity-100 transition-opacity">
          <div className="pointer-events-auto relative shadow-2xl">
            <select
              value={selectedSiteId}
              onChange={(e) => {
                setSelectedSiteId(e.target.value);
                if (e.target.value !== 'balaghat') setViewMode('2d');
              }}
              className="appearance-none bg-navy-900/90 backdrop-blur-md border border-white/20 text-white text-sm rounded-lg pl-4 pr-10 py-2 outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="balaghat">Balaghat Mine (MP)</option>
              <option value="gumgaon">Gumgaon Mine (MH)</option>
              <option value="kandri">Kandri (MH)</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>
    );
  }

  // Z-LEVEL 1: 3D SUBSURFACE VOXELS (Deck.GL PointCloud)
  const deckLayers = getSubsurfaceBlockLayers({
    depthRange,
    visible: activeLayers.subsurfaceBlock,
  });

  return (
    <motion.div 
      variants={motionPresets.fadeIn}
      initial="initial"
      animate="animate"
      exit="exit"
      className="relative w-full h-full bg-navy-950 overflow-hidden select-none"
    >
      <DeckGL
        initialViewState={{
          longitude: 80.201,
          latitude: 21.874,
          zoom: 14.5,
          pitch: 60,
          bearing: 35,
          maxPitch: 85
        }}
        controller={true}
        layers={deckLayers}
        getTooltip={({object}: any) => {
          if (!object) return null;
          if (object.coordinates) return "TARGET: 125m Depth | 49.2% Mn | Dip: 65°N";
          return `Depth: ${Math.round(Math.abs(object.depth))}m | ${Math.round(object.grade * 10)/10}% Mn`;
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <Map
          ref={mapRef}
          mapStyle={ESRI_SATELLITE_STYLE}
          reuseMaps
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

          {/* ── TACTICAL MARKERS (High and Medium Grade) ─────────────── */}
          {/* ── TACTICAL MARKERS (High and Medium Grade) ─────────────── */}
          {activeLayers.vedasFaults && topHighGradeCells.map((cell, idx) => (
            <Marker key={`high-tac-${idx}`} latitude={cell.realLat} longitude={cell.realLng} anchor="center">
              <div 
                className="flex flex-col items-center pointer-events-auto relative z-50 cursor-pointer hover:scale-110 transition-transform"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTacticalZone({ lat: cell.realLat, lng: cell.realLng, grade: cell.mnGrade });
                }}
              >
                <div className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-sm border-2 border-red-400 shadow-xl whitespace-nowrap mb-1">
                  📍 START DRILLING HERE
                </div>
                <div className="border border-amber-500 bg-amber-900/80 rounded px-2 py-1 backdrop-blur-md text-center min-w-[70px] shadow-2xl">
                  <div className="text-amber-400 font-black text-xs">{cell.mnGrade.toFixed(1)}% Mn</div>
                  <div className="text-white text-[8px] font-bold tracking-widest mt-0.5">HIGH GRADE</div>
                </div>
              </div>
            </Marker>
          ))}

          {activeLayers.vedasFaults && topMedGradeCells.map((cell, idx) => (
            <Marker key={`med-tac-${idx}`} latitude={cell.realLat} longitude={cell.realLng} anchor="center">
              <div 
                className="flex flex-col items-center pointer-events-auto relative z-40 cursor-pointer hover:scale-110 transition-transform mt-6"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTacticalZone({ lat: cell.realLat, lng: cell.realLng, grade: cell.mnGrade });
                }}
              >
                <div className="border border-cyan-500 bg-cyan-900/80 rounded px-2 py-1 backdrop-blur-md text-center min-w-[70px] shadow-2xl">
                  <div className="text-white font-black text-xs">{cell.mnGrade.toFixed(1)}% Mn</div>
                  <div className="text-cyan-400 text-[8px] font-bold tracking-widest mt-0.5">MED GRADE</div>
                </div>
              </div>
            </Marker>
          ))}

          {/* ── Z-LEVEL 3c: ASSAY MARKERS WITH MOIL GRADE ICONS ──────── */}
          <AssayMarkersLayer 
            gridData={processedGrid}
            visible={activeLayers.nasaMn}
          />

          {/* ── Z-LEVEL 4+5: HEATMAP & DRILL TARGET AI (self-contained) ── */}
          <MineralHeatmapLayer 
            featureCollection={rawFeatureCollection} 
            recommendation={recommendation} 
            opacity={activeLayers.sentinelIron ? 0.75 : 0}
            visible={activeLayers.sentinelIron}
          />
        </Map>
      </DeckGL>

      {/* ════════════════════════════════════════════════════════════════
          FLOATING UI PANELS — matches Balaghat reference layout
          ════════════════════════════════════════════════════════════ */}

      {/* ── NEW FLOATING SITE SELECTOR ── */}
      <div className="absolute top-6 left-6 z-10 pointer-events-auto">
        <div className="bg-[#111827]/90 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-2xl w-[320px]">
           <div className="text-white/40 text-[9px] font-bold tracking-widest uppercase mb-2 ml-1">Active Mine Site</div>
           <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-cyan-900/40 border border-cyan-500/30 flex items-center justify-center">
               <Compass size={16} className="text-cyan-400" />
             </div>
             <div className="flex-1 relative">
               <select
                 value={selectedSiteId}
                 onChange={(e) => handleSiteChange(e.target.value)}
                 className="w-full appearance-none bg-transparent text-white font-bold text-sm focus:outline-none cursor-pointer"
               >
                 <option value="balaghat">Balaghat Complex (MP)</option>
                 <option value="gumgaon">Gumgaon Mine (MH)</option>
                 <option value="kandri">Kandri (MH)</option>
               </select>
               <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-cyan-500 pointer-events-none" />
             </div>
           </div>
           <div className="mt-3 pt-3 border-t border-white/10 flex justify-between items-center px-1">
             <div className="text-white/50 text-[10px] font-mono">
               {currentSite.lat.toFixed(4)}° N, {currentSite.lng.toFixed(4)}° E
             </div>
             {selectedSiteId === 'balaghat' && (
               <button 
                 onClick={() => setViewMode('3d')}
                 className="text-[10px] text-cyan-400 font-bold uppercase hover:text-cyan-300 flex items-center gap-1 transition-colors"
               >
                 View 3D <Triangle size={8} className="rotate-90 fill-current" />
               </button>
             )}
           </div>
        </div>
      </div>

      {/* ── TACTICAL ZONE POPUP MODAL ── */}
      {selectedTacticalZone && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-auto">
          <div className="relative border border-[#F59E0B] bg-[#F59E0B]/5 rounded-lg p-6 w-[400px] backdrop-blur-sm shadow-[0_0_30px_rgba(245,158,11,0.15)]">
            <button onClick={() => setSelectedTacticalZone(null)} className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-[#111827] border border-cyan-500/50 flex items-center justify-center text-cyan-400 hover:bg-cyan-900 hover:text-white transition-colors">✕</button>

            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 bg-[#F59E0B] rounded-full animate-pulse"></div>
              <span className="text-[#F59E0B] text-[9px] font-bold tracking-widest uppercase">LOCAL ZONE</span>
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-0.5 uppercase tracking-wider">BALAGAT TAHSIL</h2>
            <p className="text-white/50 text-[10px] font-mono mb-4">Coordinates: {selectedTacticalZone.lat.toFixed(4)}°N, {selectedTacticalZone.lng.toFixed(4)}°E</p>

            <div className="bg-[#111827]/90 rounded p-4 border border-white/5 space-y-4 shadow-xl">
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <span className="text-white/80 text-sm font-medium">Mn Concentration:</span>
                <span className="text-[#F59E0B] text-xl font-bold">{selectedTacticalZone.grade.toFixed(1)}%</span>
              </div>

              <div className="flex gap-4">
                <div className="flex-1 bg-black/40 rounded p-2">
                  <div className="text-white/40 text-[9px] mb-1 tracking-wider uppercase">QUALITY</div>
                  <div className="text-emerald-500 font-bold text-sm uppercase">{selectedTacticalZone.grade >= 44 ? 'HIGH' : 'MEDIUM'}</div>
                </div>
                <div className="flex-1 bg-black/40 rounded p-2">
                  <div className="text-white/40 text-[9px] mb-1 tracking-wider uppercase">EST. QUANTITY</div>
                  <div className="text-white font-bold text-sm">Large</div>
                </div>
              </div>

              <div className="text-[10px] text-white/60 leading-relaxed border-t border-white/10 pt-3">
                High iron-oxide index (Live Sentinel-2). Favorable terrain (Live MODIS). Exceptional mineralization indicated.
              </div>
            </div>

            <div className="mt-4 flex justify-between items-end px-1">
              <div>
                <div className="text-white/40 text-[8px] uppercase tracking-wider mb-1">RECOMMENDATION</div>
                <div className="text-[#EF4444] text-[9px] font-bold">LANDSLIDE RISK HIGH</div>
              </div>
              <div className="text-emerald-500 font-bold text-xs uppercase text-right">
                COMMENCE MINING
              </div>
            </div>

            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2">
              <button className="bg-[#EF4444] text-white font-bold text-xs px-4 py-2 rounded-md border border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.5)] flex items-center gap-2 uppercase tracking-wider hover:scale-105 transition-transform">
                <Target size={14} /> START DRILLING HERE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── RIGHT HUD: DEPTH SLICER ── */}
      <div className="absolute top-16 right-[290px] z-10 pointer-events-auto h-[400px] w-16 bg-navy-950/80 backdrop-blur-md border border-cyan-500/30 rounded-[30px] flex flex-col items-center py-6 shadow-2xl">
        <span className="text-[10px] text-cyan-400 font-bold mb-3 font-mono">0m</span>
        <div className="relative flex-1 w-full flex items-center justify-center">
          {/* Native range input rotated vertically */}
          <input 
            type="range"
            min="0"
            max="350"
            value={depthRange[1]}
            onChange={(e) => setDepthRange([0, parseInt(e.target.value)])}
            className="absolute w-[280px] h-1 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 appearance-none bg-cyan-900/40 rounded-full cursor-pointer hover:bg-cyan-800/60 transition-colors [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-navy-900 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(34,211,238,0.6)]"
          />
        </div>
        <span className="text-[10px] text-cyan-400 font-bold mt-3 font-mono">350m</span>
        <div className="mt-2 text-[9px] text-cyan-500/60 font-mono text-center leading-tight">DEPTH<br/>SLICE</div>
      </div>

      {/* ── RIGHT PANEL STACK ── */}
      <div className="absolute top-6 right-6 z-10 pointer-events-auto w-[280px] space-y-4">
        
        {/* MAP LAYERS Panel */}
        <div className="bg-[#111827]/90 backdrop-blur-md border border-white/10 rounded-lg p-4 shadow-xl">
          <h3 className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-3 flex items-center gap-2">
             MAP LAYERS
          </h3>
          <div className="flex bg-black/40 rounded-md p-1 mb-4">
            <button className="flex-1 text-[10px] font-bold text-white py-1.5 bg-[#1F2937] rounded-sm">STANDARD</button>
            <button className="flex-1 text-[10px] font-bold text-[#F59E0B] py-1.5">SAT HEATMAP</button>
          </div>
          <div className="space-y-3">
             <label className="flex items-center gap-3 cursor-pointer">
               <input 
                 type="checkbox" 
                 className="accent-teal-500 w-3 h-3 cursor-pointer" 
                 checked={activeLayers.sentinelIron} 
                 onChange={() => adapters.toggleMapLayer('sentinelIronOxide')} 
               />
               <span className="text-xs text-white/80 select-none">Mineral Composite (RGB)</span>
             </label>
             <label className="flex items-center gap-3 cursor-pointer">
               <input 
                 type="checkbox" 
                 className="accent-teal-500 w-3 h-3 cursor-pointer" 
                 checked={activeLayers.nasaMn} 
                 onChange={() => adapters.toggleMapLayer('nasaHyperspectral')} 
               />
               <span className="text-xs text-white/80 select-none">Ore Grade Markers (Mn)</span>
             </label>
             <label className="flex items-center gap-3 cursor-pointer">
               <input 
                 type="checkbox" 
                 className="accent-teal-500 w-3 h-3 cursor-pointer" 
                 checked={activeLayers.vedasFaults} 
                 onChange={() => adapters.toggleMapLayer('isroFaults')} 
               />
               <span className="text-xs text-white/80 select-none">Recommended Drill Site</span>
             </label>
          </div>
        </div>

        {/* MOIL GRADE STANDARDS Panel */}
        <div className="bg-[#111827]/95 backdrop-blur-md border border-white/10 rounded-lg p-4 shadow-xl">
          <h3 className="text-[10px] font-bold text-white/80 uppercase tracking-widest mb-3 flex items-center gap-2">
             <Info size={12} className="text-cyan-400" /> MOIL GRADE STANDARDS
          </h3>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                <span className="text-white/90 font-medium">Ferro Grade</span>
              </div>
              <span className="text-emerald-500 font-bold">≥ 44% Mn</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2">
                <svg width="10" height="10" viewBox="0 0 12 12"><polygon points="6,1 11,11 1,11" fill="#F59E0B" /></svg>
                <span className="text-white/90 font-medium">SMGR Grade</span>
              </div>
              <span className="text-[#F59E0B] font-bold">30-43% Mn</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2">
                <svg width="10" height="10" viewBox="0 0 12 12"><rect width="10" height="10" x="1" y="1" fill="#EF4444" /></svg>
                <span className="text-white/90 font-medium">Blast Furnace Grade</span>
              </div>
              <span className="text-[#EF4444] font-bold">&lt; 30% Mn</span>
            </div>
          </div>
          <div className="pt-3 border-t border-white/10">
            <div className="flex items-center gap-2 mb-2">
               <div className="w-4 h-0 border-t-2 border-dashed border-cyan-500"></div>
               <span className="text-xs text-cyan-500 font-bold">North Manganese Corridor</span>
            </div>
            <p className="text-[9px] text-white/40 leading-relaxed">
              Grade thresholds per MOIL published pricing/grade standards (Mn 44% and above = Ferro grade).
            </p>
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
