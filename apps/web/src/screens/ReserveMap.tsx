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
  ChevronDown,
  MapPin
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
  const [viewMode, setViewMode] = useState<'standard' | 'heatmap'>('heatmap');
  const [showComposite, setShowComposite] = useState(true);
  const [showMarkers, setShowMarkers] = useState(true);
  const [showRecommendation, setShowRecommendation] = useState(true);

  // Callout states
  const [showPopup, setShowPopup] = useState(false);
  const [selectedZone, setSelectedZone] = useState<any>(null);

  // Satellite Imagery State
  const [satelliteImageUrl, setSatelliteImageUrl] = useState<string | null>(null);
  const dLat = 0.02;
  const dLng = 0.02;
  const imageCoordinates = useMemo(() => [
    [currentSite.lng - dLng, currentSite.lat + dLat],
    [currentSite.lng + dLng, currentSite.lat + dLat],
    [currentSite.lng + dLng, currentSite.lat - dLat],
    [currentSite.lng - dLng, currentSite.lat - dLat]
  ] as [[number, number], [number, number], [number, number], [number, number]], [currentSite]);

  // State for dynamic location labels
const [locationLabels, setLocationLabels] = useState<Array<{ name: string; lat: number; lng: number }>>([]);

// Fetch place names via reverse geocoding when site changes
useEffect(() => {
  const points = [
    { lat: currentSite.lat + 0.003, lng: currentSite.lng - 0.004 },
    { lat: currentSite.lat - 0.006, lng: currentSite.lng + 0.005 },
    { lat: currentSite.lat + 0.004, lng: currentSite.lng + 0.007 },
    { lat: currentSite.lat - 0.005, lng: currentSite.lng - 0.006 },
  ];
  const fetchNames = async () => {
    const labeled = await Promise.all(
      points.map(async (p) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${p.lat}&lon=${p.lng}`);
          const data = await res.json();
          const name =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.display_name?.split(',')[0] ||
            `${currentSite.name} Area`;
          return { ...p, name };
        } catch {
          return { ...p, name: `${currentSite.name} Area` };
        }
      })
    );
    setLocationLabels(labeled);
  };
  fetchNames();
}, [currentSite]);

// Fetch reserve data
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

  // Fetch Copernicus Satellite Imagery
  useEffect(() => {
    let mounted = true;
    const fetchImage = async () => {
      try {
        const bbox = [
          currentSite.lng - dLng,
          currentSite.lat - dLat,
          currentSite.lng + dLng,
          currentSite.lat + dLat
        ];
        const res = await fetch('http://localhost:4000/api/satellite/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bbox })
        });
        if (res.ok && mounted) {
          const blob = await res.blob();
          setSatelliteImageUrl(URL.createObjectURL(blob));
        }
      } catch (err) {
        console.error('Failed to fetch satellite image', err);
      }
    };
    fetchImage();
    return () => { mounted = false; };
  }, [currentSite]);

  // Fetch Landslide Risk on Zone Selection
  const [landslideRisk, setLandslideRisk] = useState<any>(null);
  useEffect(() => {
    if (!selectedZone) return;
    let mounted = true;
    setLandslideRisk(null);
    const fetchRisk = async () => {
      try {
        const res = await fetch(`http://localhost:4000/api/risk/landslide?lat=${selectedZone.realLat}&lng=${selectedZone.realLng}`);
        if (res.ok && mounted) {
          setLandslideRisk(await res.json());
        }
      } catch (err) {
        if (mounted) setLandslideRisk({ risk: 'UNKNOWN', factor: 'Network error' });
      }
    };
    fetchRisk();
    return () => { mounted = false; };
  }, [selectedZone]);

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
    // Enlarge bounds significantly so cells overlap to form smooth, continuous geological polygons instead of a grid
    const halfLat = 0.0025; 
    const halfLng = 0.0028;

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
      'fill-color': viewMode === 'heatmap' ? [
        'step', ['get', 'grade'],
        'rgba(240, 230, 140, 0.90)',    // < 20: Khaki / Alluvium
        20, 'rgba(143, 188, 143, 0.90)', // 20-35: DarkSeaGreen / Schist
        35, 'rgba(100, 149, 237, 0.90)', // 35-45: CornflowerBlue / Phyllite
        45, 'rgba(255, 99, 71, 0.90)',   // 45-55: Tomato / High Grade Ore
        55, 'rgba(218, 112, 214, 0.95)'  // > 55: Orchid / Ultra Ore
      ] : [
        'interpolate', ['linear'], ['get', 'probability'],
        0.0, 'rgba(67, 56, 202, 0.15)',   
        0.4, 'rgba(16, 185, 129, 0.35)',  
        0.7, 'rgba(245, 158, 11, 0.50)',  
        1.0, 'rgba(239, 68, 68, 0.65)'    
      ],
      'fill-opacity': showComposite ? 1 : 0
    }
  };

  const compositeLineLayer: any = {
    id: 'composite-lines',
    type: 'line',
    paint: {
      'line-color': viewMode === 'heatmap' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.12)',
      'line-width': viewMode === 'heatmap' ? 1.5 : 1
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

        {/* NEW SATELLITE BASE LAYER FROM COPERNICUS */}
        {viewMode === 'heatmap' && satelliteImageUrl && (
          <Source type="image" id="satellite-img" url={satelliteImageUrl} coordinates={imageCoordinates}>
            <Layer 
              id="satellite-img-layer" 
              type="raster" 
              paint={{ "raster-opacity": 0.6 }} 
            />
          </Source>
        )}

        {/* STATIC LOCATION LABELS FOR GEOLOGICAL MAP */}
        {viewMode === 'heatmap' && locationLabels.map((lbl, idx) => (
          <Marker key={`label-${idx}`} latitude={lbl.lat} longitude={lbl.lng} anchor="center">
            <div className="text-white font-mono font-bold text-[10px] md:text-xs uppercase tracking-widest px-2 py-1 rounded bg-navy-950/40 border border-slate-500/20 backdrop-blur-[2px] shadow-sm pointer-events-none" style={{ textShadow: '1px 1px 2px black' }}>
              {lbl.name}
            </div>
          </Marker>
        ))}

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
            <div className="px-2.5 py-1 bg-navy-900/90 border border-teal-500/60 rounded-md text-[10px] font-bold shadow-lg backdrop-blur-md pointer-events-none flex items-center gap-1.5" style={{ color: '#00D9C0' }}>
              <span className="w-2 h-0 border-t-2 border-dashed inline-block" style={{ borderColor: '#00D9C0' }} />
              <span>North Manganese Corridor (avg. 48.6% Mn)</span>
            </div>
          </Marker>
        )}

        {/* MANGANESE PERCENTAGE LABELS (for Heatmap mode) */}
        {viewMode === 'heatmap' && processedGrid.filter((cell: any) => cell.tier !== 'low').map((cell: any, idx: number) => {
          const isHigh = cell.tier === 'high';
          const badgeBorder = isHigh ? 'border-orange-500/80' : 'border-slate-400/50';
          const topColor = isHigh ? 'text-orange-400' : 'text-slate-200';
          const bottomColor = isHigh ? 'text-orange-400/80' : 'text-slate-400';
          const label = isHigh ? 'HIGH GRADE' : 'MED GRADE';

          return (
            <Marker 
              key={`mn-marker-${idx}`}
              latitude={cell.realLat} 
              longitude={cell.realLng} 
              anchor="center"
              onClick={(e: any) => { 
                e.originalEvent.stopPropagation(); 
                setSelectedZone(cell);
              }}
            >
              <div className="relative flex flex-col items-center" style={{ zIndex: isHigh ? 20 : 10 }}>
                {isHigh && (
                  <div className="absolute -top-7 bg-red-500/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg whitespace-nowrap border border-red-400 pointer-events-none">
                    <MapPin size={10} /> START DRILLING HERE
                  </div>
                )}
                <div className={`cursor-pointer transition-transform hover:scale-110 px-2 py-1 rounded text-center border ${badgeBorder} bg-navy-950/40 shadow-lg backdrop-blur-[2px]`}>
                  <div className={`text-[11px] font-bold ${topColor}`}>
                    {cell.mnGrade.toFixed(1)}% Mn
                  </div>
                  <div className={`text-[9px] font-bold uppercase mt-0.5 ${bottomColor}`}>
                    {label}
                  </div>
                </div>
              </div>
            </Marker>
          );
        })}

        {/* CLICK-FOR-DETAILS POPUP (ISRO THEME) */}
        {selectedZone && viewMode === 'heatmap' && (
          <Popup
            latitude={selectedZone.realLat}
            longitude={selectedZone.realLng}
            anchor="bottom"
            onClose={() => setSelectedZone(null)}
            closeButton={false}
            offset={[0, -35]}
            className="z-50"
          >
            <div className="bg-navy-950/90 border border-orange-500/70 p-4 rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.15)] w-80 text-slate-100 backdrop-blur-md">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                    <Target size={12} /> LOCAL ZONE
                  </span>
                  <h4 className="font-bold text-white text-lg mt-0.5 uppercase tracking-wide">
                    {landslideRisk?.location?.subArea || 'BALAGAT TAHSIL'}
                  </h4>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Coordinates: {selectedZone.realLat.toFixed(4)}°N, {selectedZone.realLng.toFixed(4)}°E
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedZone(null)} 
                  className="text-slate-400 hover:text-white p-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/40 border border-blue-500/30 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-3 text-xs mt-4">
                <div className="flex justify-between items-center bg-navy-900/60 p-2.5 rounded-lg border border-navy-700/60">
                  <span className="text-slate-300 font-medium">Mn Concentration:</span>
                  <span className="font-bold text-orange-400 text-base">
                    {selectedZone.mnGrade.toFixed(1)}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-navy-900/60 p-2.5 rounded-lg border border-navy-700/60">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Quality</span>
                    <span className={`font-bold text-sm ${selectedZone.tier === 'high' ? 'text-green-400' : selectedZone.tier === 'medium' ? 'text-orange-400' : 'text-red-400'}`}>
                      {selectedZone.tier.toUpperCase()}
                    </span>
                  </div>
                  <div className="bg-navy-900/60 p-2.5 rounded-lg border border-navy-700/60">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Est. Quantity</span>
                    <span className="font-bold text-white text-sm">
                      {selectedZone.probability > 0.8 ? 'Large' : selectedZone.probability > 0.5 ? 'Moderate' : 'Small'}
                    </span>
                  </div>
                </div>

                <div className="bg-navy-900/40 p-3 rounded-lg border border-navy-700/40">
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {selectedZone.contributingFactors.join('. ')}. 
                    {selectedZone.tier === 'high' ? ' Exceptional mineralization indicated.' : ' Standard geology.'}
                  </p>
                </div>

                <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-navy-700/60">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Recommendation</span>
                    <span className={`text-[11px] font-bold ${selectedZone.tier === 'high' ? 'text-green-400' : 'text-slate-400'}`}>
                      {selectedZone.tier === 'high' ? 'COMMENCE MINING' : 'FURTHER STUDY'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center" title={landslideRisk?.factor || 'Loading...'}>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Landslide Risk</span>
                    <span className={`text-[11px] font-bold ${
                      !landslideRisk ? 'text-slate-500 animate-pulse' :
                      landslideRisk.risk === 'LOW' ? 'text-green-400' : 
                      landslideRisk.risk === 'MEDIUM' ? 'text-saffron-400' : 
                      'text-red-500'
                    }`}>
                      {!landslideRisk ? 'CALCULATING...' : landslideRisk.risk}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Popup>
        )}

          {/* KERNEL DENSITY ESTIMATION HEATMAP (SENTINEL-2 ALTERATION SIMULATION) */}
          {showMarkers && (
            <HeatmapLayer 
              centerLat={currentSite.lat} 
              centerLng={currentSite.lng} 
              strikeTrend={currentSite.strikeTrend} 
            />
          )}

          {/* RECOMMENDED NEXT DRILL SITE */}
          {viewMode === 'heatmap' && showRecommendation && recommendation && (
            <Marker 
              latitude={recommendation.lat} 
              longitude={recommendation.lng} 
              anchor="bottom"
              onClick={(e: any) => { 
                e.originalEvent.stopPropagation(); 
                setShowPopup(true); 
              }}
            >
              <div className="relative flex flex-col items-center group cursor-pointer -mt-4">
                <div className="absolute -inset-4 bg-teal-400/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="bg-teal-500 p-2 rounded-full text-white shadow-[0_0_15px_rgba(20,184,166,0.5)] border-2 border-white relative z-10 animate-bounce">
                  <Target size={18} />
                </div>
                <div className="mt-1 px-2 py-0.5 bg-navy-900/90 border border-teal-500/30 rounded text-[10px] font-bold shadow-lg backdrop-blur-md">
                  AI Drill Target
                </div>
              </div>
            </Marker>
          )}
  
          {/* INLINE CALLOUT POPUP ANCHORED TO THAT EXACT DRILL LOCATION */}
          {viewMode === 'heatmap' && showRecommendation && recommendation && showPopup && (
            <Popup 
              latitude={recommendation.lat} 
              longitude={recommendation.lng}
              anchor="left"
              onClose={() => setShowPopup(false)}
              closeButton={false}
              offset={[45, 0]}
            >
              <div className="bg-[#1C2538]/95 border border-cyan-500/50 p-4 rounded-xl shadow-2xl w-[260px] text-slate-100 backdrop-blur-md relative font-mono text-xs">
                {/* Close Button */}
                <button 
                  onClick={() => setShowPopup(false)} 
                  className="absolute top-3 right-3 text-slate-400 hover:text-white"
                >
                  <X size={14} />
                </button>

                <div className="text-[10px] text-cyan-400 mb-1 flex items-center gap-1"><Sparkles size={12}/> AI Exploration Target</div>
                <div className="font-bold text-cyan-300 text-sm mb-3">TARGET BH-34-GAMMA</div>

                <div className="mb-1 text-slate-200">Grade: {recommendation.mnGrade.toFixed(1)}% Mn</div>
                <div className="mb-3 text-slate-200">Confidence: {(recommendation.confidenceScore * 100).toFixed(0)}%</div>

                <div className="text-slate-400 mb-1">Contributing Factors:</div>
                <ul className="list-none text-slate-300 mb-3 space-y-0.5">
                  <li><span className="text-slate-500">•</span> ISRO Fault Alignment [95%]</li>
                  <li><span className="text-slate-500">•</span> Sentinel Iron Index [100%]</li>
                  <li><span className="text-slate-500">•</span> NASA Hyperspectral Mn [92%]</li>
                </ul>

                <div className="mb-1 text-slate-200">Target Depth: {recommendation.targetDepth}</div>
                <div className="mb-4 text-slate-200">Dip: {recommendation.dipAngle}</div>

                {/* Progress bar */}
                <div className="h-1.5 w-full bg-navy-900 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" style={{ width: '98%' }} />
                </div>
                <div className="text-right text-[10px] text-cyan-400 font-bold mb-3">98%</div>

                {/* XP badge */}
                <div className="flex justify-end">
                  <div className="border border-saffron-500/50 text-saffron-400 text-[9px] px-2 py-0.5 rounded-sm bg-saffron-500/10">
                    XP gained +500 <span className="text-yellow-400">⚡</span>
                  </div>
                </div>
              </div>
            </Popup>
          )}
      </Map>

      {/* FLOATING UI PANELS OVER THE SATELLITE BASEMAP */}
      <div className="absolute inset-0 pointer-events-none p-5 flex flex-col justify-between z-10">
        
        {/* TOP ROW: SITE SWITCHER & LAYER CONTROLS */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          
          {/* Top-Left: Site Selector Dropdown */}
          <div className="bg-navy-900/90 backdrop-blur-md border border-navy-700/80 p-3 rounded-2xl shadow-2xl pointer-events-auto flex items-center gap-3">
            <div className="p-2 bg-teal-500/10 border border-teal-500/30 rounded-xl text-teal-400">
              <Compass size={18} />
            </div>
            <div>
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block">Active Mine Site</span>
              <div className="relative mt-0.5">
                <select
                  value={selectedSiteId}
                  onChange={(e) => handleSiteChange(e.target.value)}
                  className="appearance-none bg-navy-800 border border-navy-700 text-teal-300 font-bold text-sm py-1 pl-2.5 pr-8 rounded-lg focus:outline-none focus:border-teal-400 cursor-pointer transition-colors"
                >
                  <option value="balaghat">Balaghat Complex (MP)</option>
                  <option value="gumgaon">Gumgaon Mine (MH)</option>
                  <option value="kandri">Kandri Mine (MH)</option>
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-teal-400 pointer-events-none" />
              </div>
            </div>
            <div className="hidden sm:block pl-3 border-l border-navy-700 text-[10px] font-mono text-slate-400">
              <span>{currentSite.lat.toFixed(4)}° N, {currentSite.lng.toFixed(4)}° E</span>
            </div>
          </div>

          {/* Top-Right: Map Layers Controls */}
          <div className="bg-navy-950 backdrop-blur-md border border-saffron-500/20 p-4 rounded-xl shadow-2xl w-64 pointer-events-auto">
            <div className="flex items-center gap-2 mb-3 text-saffron-500">
              <Layers size={16} />
              <h3 className="font-mono font-bold text-xs tracking-wider uppercase text-slate-100">Map Layers</h3>
            </div>

            {/* VIEW MODE TOGGLE */}
            <div className="flex bg-navy-900 p-1 rounded-lg border border-saffron-500/20 mb-4">
              <button
                onClick={() => setViewMode('standard')}
                className={`flex-1 text-[10px] font-bold font-mono uppercase tracking-wider py-1.5 rounded-md transition-colors ${
                  viewMode === 'standard' ? 'bg-saffron-500/10 text-saffron-400 border border-saffron-500/30 shadow' : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                Standard
              </button>
              <button
                onClick={() => setViewMode('heatmap')}
                className={`flex-1 text-[10px] font-bold font-mono uppercase tracking-wider py-1.5 rounded-md transition-colors ${
                  viewMode === 'heatmap' ? 'bg-saffron-500/10 text-saffron-400 border border-saffron-500/30 shadow' : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                Sat Heatmap
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={showComposite} 
                  onChange={(e) => setShowComposite(e.target.checked)} 
                  className="accent-teal-500 w-4 h-4 cursor-pointer rounded" 
                />
                <span className="text-slate-200 group-hover:text-white transition-colors">
                  Mineral Composite (RGB)
                </span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={showMarkers} 
                  onChange={(e) => setShowMarkers(e.target.checked)} 
                  className="accent-teal-500 w-4 h-4 cursor-pointer rounded" 
                />
                <span className="text-slate-200 group-hover:text-white transition-colors">
                  Ore Grade Markers (Mn)
                </span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={showRecommendation} 
                  onChange={(e) => setShowRecommendation(e.target.checked)} 
                  className="accent-teal-500 w-4 h-4 cursor-pointer rounded" 
                />
                <span className="text-slate-200 group-hover:text-white transition-colors">
                  Recommended Drill Site
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* BOTTOM ROW: MOIL GRADE STANDARDS LEGEND */}
        <div className="self-end bg-navy-900/90 backdrop-blur-md border border-navy-700/80 p-4 rounded-2xl shadow-2xl w-80 pointer-events-auto">
          <h3 className="font-bold text-xs tracking-wider text-slate-200 mb-3 uppercase flex items-center gap-2">
            <Info size={15} className="text-teal-400" /> MOIL Grade Standards
          </h3>
          
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-200">
                <Circle size={14} className="fill-green-500 text-green-400 shrink-0 shadow-sm" />
                <span className="font-medium">Ferro Grade</span>
              </div>
              <span className="font-mono text-xs font-bold text-green-400">&ge; 44% Mn</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-200">
                <Triangle size={14} className="fill-amber-500 text-amber-400 shrink-0 shadow-sm" />
                <span className="font-medium">SMGR Grade</span>
              </div>
              <span className="font-mono text-xs font-bold text-amber-400">30&ndash;43% Mn</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-200">
                <Diamond size={13} className="text-red-400 fill-red-900/60 shrink-0" />
                <span className="font-medium">Blast Furnace Grade</span>
              </div>
              <span className="font-mono text-xs font-bold text-red-400">&lt; 30% Mn</span>
            </div>
          </div>

          <div className="mt-3.5 pt-3 border-t border-navy-700/80 space-y-1.5">
            <div className="flex items-center gap-2 text-[11px] text-teal-300">
              <span className="w-3.5 h-0 border-t-2 border-dashed border-teal-400 shrink-0" />
              <span className="font-medium truncate">{currentSite.corridorName}</span>
            </div>
            <p className="text-[9px] text-slate-400 leading-tight">
              Grade thresholds per MOIL published pricing/grade standards (Mn-44% and above = Ferro grade).
            </p>
          </div>
        </div>

      </div>

      {/* Global CSS for custom transparent maplibre popup styling */}
      <style>{`
        .maplibregl-popup-content {
          background: transparent !important;
          padding: 0 !important;
          box-shadow: none !important;
        }
        .maplibregl-popup-tip {
          border-top-color: rgba(15, 23, 42, 0.95) !important;
        }
      `}</style>
    </motion.div>
  );
};
