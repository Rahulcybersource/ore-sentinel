import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
// @ts-ignore
import Map, { Marker, Popup, Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useAdapters } from '../data/adapters/AdapterContext';
import type { ReserveCell } from '../data/types/models';
import { motion } from 'framer-motion';
import { 
  Layers, 
  Info, 
  Target, 
  Triangle, 
  Circle, 
  Diamond, 
  X, 
  Sparkles,
  Compass,
  ChevronDown
} from 'lucide-react';
import { motionPresets } from '../theme/tokens';
import { ErrorState, SkeletonBar } from '../components/Skeletons';

import { NATIONAL_MN_REGISTRY } from '../data/constants/mineRegistry';
import { HeatmapLayer } from './ReserveMap/layers/HeatmapLayer';
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
    zoom: 14.5, // slightly zoomed out to see 4.5km
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

  // Layer toggles
  const [showComposite, setShowComposite] = useState(true);
  const [showMarkers, setShowMarkers] = useState(true);
  const [showRecommendation, setShowRecommendation] = useState(true);

  // Recommendation callout state
  const [showPopup, setShowPopup] = useState(false);

  // Fetch reserve data for selected site
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // The adapter consumes the site ID (or falls back to balaghat if live proxy is running)
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
    setShowPopup(false);
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
      return { 
        processedGrid: [], 
        corridorFeature: null 
      };
    }

    const highMedPoints: { lat: number; lng: number }[] = [];

    // Anchor spacing: ~0.0022 deg lat (~240m) and ~0.0024 deg lng (~250m)
    // 10x10 grid spans roughly 2.2km x 2.4km, tightly surrounding the real mine site
    const processed = rawGrid.map((cell, index) => {
      const row = Math.floor(index / 10);
      const col = index % 10;
      
      const realLat = currentSite.lat + (row - 4.5) * 0.0022;
      const realLng = currentSite.lng + (col - 4.5) * 0.0024;

      // Realistic MOIL Manganese grade mapping (22% to 54% Mn)
      const mnGrade = (cell.probability * 32) + 22;
      
      // Strict MOIL Tier Standards
      let tier: 'high' | 'medium' | 'low';
      if (mnGrade >= 44) tier = 'high';        // Ferro Grade (>= 44% Mn)
      else if (mnGrade >= 30) tier = 'medium'; // SMGR Grade (30-43% Mn)
      else tier = 'low';                       // Blast Furnace Grade (< 30% Mn)

      if (tier === 'high' || tier === 'medium') {
        highMedPoints.push({ lat: realLat, lng: realLng });
      }

      const item = {
        ...cell,
        realLat,
        realLng,
        mnGrade,
        tier
      };

      return item;
    });

    // Compute the corridor boundary polygon over the real coordinates
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

    return { 
      processedGrid: processed, 
      corridorFeature: corridor 
    };
  }, [rawGrid, currentSite]);

  const recommendation = useMemo(() => {
    return evaluateDrillTarget(currentSite.lat, currentSite.lng, currentSite.strikeTrend);
  }, [currentSite]);

  // Geological Alteration Raster Grid (Iron-Oxide / Clay / Ferrous Mineral Composite)
  // Semi-transparent overlay directly on top of the satellite tiles
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

  // MapLibre layer styling for the geological alteration overlay (blended with satellite)
  const compositeFillLayer: any = {
    id: 'composite-fill',
    type: 'fill',
    paint: {
      'fill-color': [
        'interpolate', ['linear'], ['get', 'probability'],
        0.0, 'rgba(67, 56, 202, 0.15)',   // Low alteration: faint indigo
        0.4, 'rgba(16, 185, 129, 0.35)',  // Moderate alteration: translucent green
        0.7, 'rgba(245, 158, 11, 0.50)',  // Iron-oxide gossan signature: vibrant amber
        1.0, 'rgba(239, 68, 68, 0.65)'    // High-grade manganese anomaly: rich crimson
      ],
      'fill-opacity': showComposite ? 1 : 0
    }
  };

  const compositeLineLayer: any = {
    id: 'composite-lines',
    type: 'line',
    paint: {
      'line-color': 'rgba(255, 255, 255, 0.12)',
      'line-width': 1
    },
    layout: {
      visibility: showComposite ? 'visible' : 'none'
    }
  };

  const corridorLineLayer: any = {
    id: 'corridor-line',
    type: 'line',
    paint: {
      'line-color': '#00D9C0',
      'line-width': 2.5,
      'line-dasharray': [4, 3]
    },
    layout: {
      visibility: showMarkers ? 'visible' : 'none'
    }
  };

  const corridorFillLayer: any = {
    id: 'corridor-fill',
    type: 'fill',
    paint: {
      'fill-color': '#00D9C0',
      'fill-opacity': 0.12
    },
    layout: {
      visibility: showMarkers ? 'visible' : 'none'
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
      {/* MAPLIBRE GL JS CONTAINER WITH REAL SATELLITE TILES */}
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
        {/* SEMI-TRANSPARENT MINERAL COMPOSITE (ALTERATION OVERLAY ON SATELLITE) */}
        {compositeGeoJSON && (
          <Source type="geojson" data={compositeGeoJSON}>
            <Layer {...compositeFillLayer} />
            <Layer {...compositeLineLayer} />
          </Source>
        )}

        {/* CORRIDOR POLYGON ANCHORED OVER REAL MINE STRIKE */}
        {corridorFeature && (
          <Source type="geojson" data={corridorFeature}>
            <Layer {...corridorFillLayer} />
            <Layer {...corridorLineLayer} />
          </Source>
        )}

        {/* Corridor Label Tag */}
        {showMarkers && corridorFeature && (
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

          {/* KERNEL DENSITY ESTIMATION HEATMAP (SENTINEL-2 ALTERATION SIMULATION) */}
          {showMarkers && (
            <HeatmapLayer 
              centerLat={currentSite.lat} 
              centerLng={currentSite.lng} 
              strikeTrend={currentSite.strikeTrend} 
            />
          )}

          {/* RECOMMENDED NEXT DRILL SITE (PULSING STAR / TARGET ANCHORED TO REAL LAT/LNG) */}
          {showRecommendation && recommendation && (
            <Marker 
              latitude={recommendation.lat} 
              longitude={recommendation.lng} 
              anchor="bottom"
              onClick={(e: any) => { 
                e.originalEvent.stopPropagation(); 
                setShowPopup(true); 
              }}
            >
              <div className="relative flex flex-col items-center group cursor-pointer">
                {/* Radar pulse ripples directly over satellite pit */}
                <div className="absolute -top-3 w-10 h-10 bg-accent-400/40 rounded-full animate-ping pointer-events-none" />
                <div className="absolute -top-1 w-6 h-6 bg-accent-400/60 rounded-full animate-pulse pointer-events-none" />
                
                <div className="p-1.5 bg-accent-400 rounded-full text-app-bg shadow-[0_0_15px_rgba(0,240,255,0.8)] relative z-10 transition-transform group-hover:scale-110">
                  <Target size={20} className="stroke-[2.5]" />
                </div>
  
                <div className="mt-1 px-2.5 py-1 bg-app-bg/95 border border-accent-400/80 rounded-md text-[10px] font-bold text-accent-400 whitespace-nowrap shadow-2xl backdrop-blur-md uppercase tracking-wider relative z-10 font-mono">
                  Recommended Next Drill Site
                </div>
              </div>
            </Marker>
          )}
  
          {/* INLINE CALLOUT POPUP ANCHORED TO THAT EXACT DRILL LOCATION */}
          {showRecommendation && recommendation && showPopup && (
            <Popup 
              latitude={recommendation.lat} 
              longitude={recommendation.lng}
              anchor="top"
              onClose={() => setShowPopup(false)}
              closeButton={false}
              offset={[0, 12]}
            >
              <div className="bg-app-bg/95 border border-accent-400/50 p-5 rounded-xl shadow-[0_0_20px_rgba(0,240,255,0.15)] w-80 text-white backdrop-blur-md">
                <div className="flex justify-between items-start mb-3 border-b border-accent-400/20 pb-2.5">
                  <div>
                    <span className="telemetry-label flex items-center gap-1.5">
                      <Sparkles size={13} /> AI Exploration Target
                    </span>
                    <h4 className="font-bold text-white text-sm mt-0.5">
                      Recommended Next Drill Site
                    </h4>
                  </div>
                  <button 
                    onClick={() => setShowPopup(false)} 
                    className="text-muted-400 hover:text-white p-1 rounded-md hover:bg-card-bg transition-colors"
                  >
                    <X size={15} />
                  </button>
                </div>
  
                <div className="space-y-2.5 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-card-bg p-2 rounded-lg border border-accent-400/20">
                      <span className="text-muted-400 text-[10px] uppercase block mb-0.5">Latitude</span>
                      <span className="font-mono font-bold text-white">{recommendation.lat.toFixed(6)}°</span>
                    </div>
                    <div className="bg-card-bg p-2 rounded-lg border border-accent-400/20">
                      <span className="text-muted-400 text-[10px] uppercase block mb-0.5">Longitude</span>
                      <span className="font-mono font-bold text-white">{recommendation.lng.toFixed(6)}°</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-card-bg p-2 rounded-lg border border-accent-400/20">
                      <span className="text-muted-400 text-[10px] uppercase block mb-0.5">Target Horizon</span>
                      <span className="font-mono font-bold text-white">{recommendation.targetDepth}</span>
                    </div>
                    <div className="bg-card-bg p-2 rounded-lg border border-accent-400/20">
                      <span className="text-muted-400 text-[10px] uppercase block mb-0.5">Dip Angle</span>
                      <span className="font-mono font-bold text-white">{recommendation.dipAngle}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center bg-card-bg p-2.5 rounded-lg border border-accent-400/20 mt-2">
                    <span className="text-muted-400">Estimated Mn Grade:</span>
                    <span className="font-mono font-bold text-green-400 text-sm">
                      {(recommendation.mnGrade - 1.2).toFixed(1)}% &ndash; {(recommendation.mnGrade + 2.4).toFixed(1)}%
                    </span>
                  </div>
  
                  <div className="flex justify-between items-center bg-card-bg p-2.5 rounded-lg border border-accent-400/20">
                    <span className="text-muted-400">Confidence Score:</span>
                    <span className="font-mono font-bold text-accent-400 text-sm">
                      {(recommendation.confidenceScore * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            </Popup>
          )}
      </Map>

        {/* FLOATING UI PANELS - SPACE TECH TELEMETRY HUD */}
      <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between z-10">
        
        {/* CENTER CROSSHAIRS */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center opacity-60">
          <div className="w-48 h-px bg-accent-400/40 absolute"></div>
          <div className="w-px h-48 bg-accent-400/40 absolute"></div>
          <div className="w-10 h-10 border border-accent-400/80 rounded-full relative">
            <div className="absolute -top-1 left-1/2 w-1 h-2 bg-accent-400 -translate-x-1/2"></div>
            <div className="absolute -bottom-1 left-1/2 w-1 h-2 bg-accent-400 -translate-x-1/2"></div>
            <div className="absolute top-1/2 -left-1 w-2 h-1 bg-accent-400 -translate-y-1/2"></div>
            <div className="absolute top-1/2 -right-1 w-2 h-1 bg-accent-400 -translate-y-1/2"></div>
          </div>
          <span className="absolute -bottom-6 font-mono text-[10px] text-accent-400">
            {currentSite.lat.toFixed(5)} N, {currentSite.lng.toFixed(5)} E
          </span>
        </div>

        {/* TOP HUD: SITE & SENSOR CONTROLS */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Site Selector HUD */}
          <div className="glass-panel p-4 pointer-events-auto w-72">
            <div className="flex items-center gap-2 border-b border-accent-400/20 pb-2 mb-3">
              <Target size={16} className="text-accent-400" />
              <span className="telemetry-label">Orbital Lock</span>
            </div>
            <div className="relative">
              <select
                value={selectedSiteId}
                onChange={(e) => handleSiteChange(e.target.value)}
                className="appearance-none w-full bg-app-bg border border-accent-400/30 text-accent-400 font-mono text-sm py-2 pl-3 pr-8 focus:outline-none focus:border-accent-400 cursor-pointer transition-colors"
              >
                <option value="balaghat">BALAGHAT_COMPLEX_01</option>
                <option value="gumgaon">GUMGAON_SECTOR_05</option>
                <option value="kandri">KANDRI_DEEP_VEIN</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-accent-400 pointer-events-none" />
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3 text-[10px] font-mono text-accent-400/60">
              <div>AZIMUTH: {(currentSite.strikeTrend || 0).toFixed(1)}°</div>
              <div className="text-right">ALT: 18,400km</div>
            </div>
          </div>

          {/* Layer Toggle HUD */}
          <div className="glass-panel p-4 pointer-events-auto flex flex-col gap-3 w-64">
            <span className="telemetry-label border-b border-accent-400/20 pb-2">Sensor Array</span>
            <label className="flex items-center justify-between cursor-pointer group font-mono text-xs">
              <span className="text-pink-400 group-hover:text-pink-500 transition-colors">SAR (Manganese)</span>
              <input type="checkbox" checked={showComposite} onChange={(e) => setShowComposite(e.target.checked)} className="accent-pink-500" />
            </label>
            <label className="flex items-center justify-between cursor-pointer group font-mono text-xs">
              <span className="text-green-400 group-hover:text-green-500 transition-colors">NDVI (Vegetation)</span>
              <input type="checkbox" checked={showMarkers} onChange={(e) => setShowMarkers(e.target.checked)} className="accent-green-500" />
            </label>
            <label className="flex items-center justify-between cursor-pointer group font-mono text-xs">
              <span className="text-accent-400 group-hover:text-accent-500 transition-colors">LiDAR (Elevation)</span>
              <input type="checkbox" checked={showRecommendation} onChange={(e) => setShowRecommendation(e.target.checked)} className="accent-accent-400" />
            </label>
          </div>
        </div>

        {/* BOTTOM HUD: SLIDERS & ELEVATION */}
        <div className="flex flex-col md:flex-row items-end justify-between gap-4">
          
          {/* Spectral Wavelength Sliders */}
          <div className="glass-panel p-4 pointer-events-auto w-72">
            <span className="telemetry-label block border-b border-accent-400/20 pb-2 mb-4">Spectral Calibration</span>
            <div className="space-y-4 font-mono text-[10px] text-accent-400">
              <div>
                <div className="flex justify-between mb-1">
                  <span>SWIR (2.1 - 2.3 µm)</span>
                  <span>78%</span>
                </div>
                <div className="h-1 bg-app-bg border border-accent-400/30 rounded-full overflow-hidden">
                  <div className="h-full bg-pink-500 w-[78%]"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span>VNIR (0.4 - 1.0 µm)</span>
                  <span>42%</span>
                </div>
                <div className="h-1 bg-app-bg border border-accent-400/30 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 w-[42%]"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span>Thermal (8 - 14 µm)</span>
                  <span>91%</span>
                </div>
                <div className="h-1 bg-app-bg border border-accent-400/30 rounded-full overflow-hidden">
                  <div className="h-full bg-accent-400 w-[91%]"></div>
                </div>
              </div>
            </div>
          </div>

          {/* LiDAR Elevation Profile Mock */}
          <div className="glass-panel p-4 pointer-events-auto w-80 h-32 flex flex-col">
            <div className="flex justify-between items-center border-b border-accent-400/20 pb-2 mb-2">
              <span className="telemetry-label">Elevation Profile (LiDAR)</span>
              <span className="font-mono text-[10px] text-accent-400">SECTOR {currentSite.id.substring(0,3).toUpperCase()}</span>
            </div>
            <div className="flex-1 relative overflow-hidden flex items-end border-l border-b border-accent-400/30">
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                <path d="M0,100 L0,70 L10,65 L20,80 L35,50 L50,45 L65,60 L80,20 L90,15 L100,25 L100,100 Z" fill="rgba(0, 240, 255, 0.1)" stroke="#00F0FF" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                <path d="M65,60 L80,20 L90,15" stroke="#D946EF" strokeWidth="2.5" vectorEffect="non-scaling-stroke" fill="none" />
              </svg>
              <div className="absolute top-2 right-4 bg-app-bg/80 px-1 border border-pink-500 font-mono text-[8px] text-pink-400">
                Mn EXPOSURE DETECTED
              </div>
            </div>
          </div>

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
