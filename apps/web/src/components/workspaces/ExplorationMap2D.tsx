import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { ExplorationTarget, Drillhole } from '../../types';
import { KNOWN_OCCURRENCES } from '../../data/explorationData';
import { MapInteractiveLegend } from './MapInteractiveLegend';
import { Layers, Map as MapIcon, Image as ImageIcon } from 'lucide-react';

interface ExplorationMap2DProps {
  targets: ExplorationTarget[];
  selectedTarget: ExplorationTarget;
  onSelectTarget: (target: ExplorationTarget) => void;
  activeLayers: Record<string, boolean>;
  onToggleLayer?: (layerId: string) => void;
  onToggleAll?: (enable: boolean) => void;
  onSetPreset?: (preset: 'all' | 'geology' | 'ai' | 'minimal') => void;
  drillholes: Drillhole[];
}

type BasemapType = 'topo' | 'satellite' | 'terrain';

export const ExplorationMap2D: React.FC<ExplorationMap2DProps> = ({
  targets,
  selectedTarget,
  onSelectTarget,
  activeLayers,
  onToggleLayer,
  onToggleAll,
  onSetPreset,
  drillholes,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [basemap, setBasemap] = useState<BasemapType>('topo');

  const layersGroupRef = useRef<{
    targetsGroup?: L.LayerGroup;
    occurrencesGroup?: L.LayerGroup;
    lineamentsGroup?: L.LayerGroup;
    geologyGroup?: L.LayerGroup;
    prospectivityGroup?: L.LayerGroup;
    satelliteGroup?: L.LayerGroup;
    terrainGroup?: L.LayerGroup;
    confidenceGroup?: L.LayerGroup;
    drillholesGroup?: L.LayerGroup;
  }>({});

  // Basemap URLs
  const basemapsConfig: Record<BasemapType, { url: string; attribution: string; subdomains?: string }> = {
    topo: {
      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      attribution: '&copy; CartoDB &copy; OpenStreetMap | MOIL Geological GIS',
      subdomains: 'abcd',
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; Esri World Imagery &bull; Sentinel-2 Fusion',
    },
    terrain: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; Esri World Topo Map &bull; USGS DEM',
    },
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [21.65, 79.85],
        zoom: 9,
        minZoom: 8,
        maxZoom: 14,
        zoomControl: false,
      });

      L.control.zoom({ position: 'topleft' }).addTo(map);

      // Basemap
      const config = basemapsConfig[basemap];
      tileLayerRef.current = L.tileLayer(config.url, {
        attribution: config.attribution,
        subdomains: config.subdomains || 'abc',
        maxZoom: 18,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear previous dynamic layers
    Object.values(layersGroupRef.current).forEach((grp) => {
      if (grp && typeof (grp as L.LayerGroup).clearLayers === 'function') {
        (grp as L.LayerGroup).clearLayers();
      }
    });

    // 1. Prospectivity Favorability Zones (heat / buffer polygons)
    const prospectivityGroup = L.layerGroup();
    targets.forEach((t) => {
      const isHigh = t.prospectivity === 'HIGH';
      const color = isHigh ? '#15803d' : t.prospectivity === 'MEDIUM' ? '#d97706' : '#78716c';
      const radius = t.score * 12000;

      // Outer favorability halo
      L.circle(t.coordinates, {
        radius,
        color: color,
        fillColor: color,
        fillOpacity: 0.12,
        weight: 1,
        dashArray: '4,4',
      }).addTo(prospectivityGroup);

      // Inner concentrated core
      L.circle(t.coordinates, {
        radius: radius * 0.45,
        color: color,
        fillColor: color,
        fillOpacity: 0.25,
        weight: 1.5,
      }).addTo(prospectivityGroup);
    });
    if (activeLayers.prospectivity) prospectivityGroup.addTo(map);
    layersGroupRef.current.prospectivityGroup = prospectivityGroup;

    // 2. Regional Geology Belt (Sausar Group Meta-sediments)
    const geologyGroup = L.layerGroup();
    const sausarPolygonCoords: L.LatLngExpression[] = [
      [21.98, 80.55],
      [21.85, 80.30],
      [21.72, 79.80],
      [21.58, 79.50],
      [21.45, 79.20],
      [21.35, 78.95],
      [21.28, 79.10],
      [21.36, 79.40],
      [21.50, 79.85],
      [21.65, 80.25],
      [21.88, 80.55],
    ];
    L.polygon(sausarPolygonCoords, {
      color: '#b45309',
      fillColor: '#f59e0b',
      fillOpacity: 0.1,
      weight: 1.5,
      dashArray: '5,5',
    })
      .bindTooltip('Sausar Group Manganese-Bearing Metasedimentary Belt (Mansar & Sitasaongi Fm.)', {
        sticky: true,
        className: 'bg-white text-stone-900 text-xs border border-stone-300 p-1.5 shadow-sm',
      })
      .addTo(geologyGroup);
    if (activeLayers.geology) geologyGroup.addTo(map);
    layersGroupRef.current.geologyGroup = geologyGroup;

    // 3. Structural Lineaments (ENE-WSW shears & fold hinges)
    const lineamentsGroup = L.layerGroup();
    const lineaments: { name: string; dip: string; coords: L.LatLngExpression[] }[] = [
      { name: 'Balaghat-Bharweli Thrust Shear', dip: '65° NW', coords: [[21.80, 80.12], [21.88, 80.32]] },
      { name: 'Tirodi Metamorphic Complex Trend', dip: '70° N', coords: [[21.68, 79.62], [21.75, 79.82]] },
      { name: 'Dongri Buzurg Axial Fold Plane', dip: '60° NW', coords: [[21.52, 79.65], [21.58, 79.82]] },
      { name: 'Mansar-Kandri Fold Synform Axis', dip: '55° SE', coords: [[21.38, 79.20], [21.45, 79.35]] },
      { name: 'Gumgaon Overturned Limb Shear', dip: '75° S', coords: [[21.36, 78.95], [21.42, 79.10]] },
    ];
    lineaments.forEach((lin) => {
      L.polyline(lin.coords, {
        color: '#b91c1c',
        weight: 2.5,
        dashArray: '6,4',
        opacity: 0.85,
      })
        .bindTooltip(`Structural Lineament: ${lin.name} (Dip ${lin.dip})`, { 
          sticky: true,
          className: 'bg-white text-stone-900 text-xs border border-stone-300 p-1.5 shadow-sm'
        })
        .addTo(lineamentsGroup);
    });
    if (activeLayers.lineaments) lineamentsGroup.addTo(map);
    layersGroupRef.current.lineamentsGroup = lineamentsGroup;

    // 4. Known MOIL Occurrences & Operating Mines
    const occurrencesGroup = L.layerGroup();
    KNOWN_OCCURRENCES.forEach((occ) => {
      const mineIcon = L.divIcon({
        className: 'custom-mine-marker',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <div style="
              width: 18px; 
              height: 18px; 
              border-radius: 50%; 
              background: #1c1917; 
              border: 2px solid #ffffff; 
              box-shadow: 0 2px 4px rgba(0,0,0,0.2); 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              font-size: 8px; 
              font-weight: 800; 
              color: #ffffff;
            ">
              M
            </div>
            <div style="
              position: absolute; 
              bottom: -16px; 
              white-space: nowrap; 
              padding: 1px 4px; 
              background: rgba(255,255,255,0.95); 
              border: 1px solid #d6d3cc; 
              font-size: 9px; 
              font-weight: 600; 
              color: #1c1917; 
              border-radius: 3px; 
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              pointer-events: none;
            ">
              ${occ.name.split(' ')[0]}
            </div>
          </div>
        `,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      L.marker(occ.coords, { icon: mineIcon })
        .bindPopup(`
          <div class="p-3 text-xs space-y-1">
            <div class="font-bold text-stone-900 text-sm mb-1">${occ.name}</div>
            <div class="text-stone-600"><span class="font-semibold text-stone-700">Operation:</span> ${occ.type}</div>
            <div class="text-stone-600"><span class="font-semibold text-stone-700">Working Depth:</span> ${occ.depth}</div>
            <div class="text-stone-600"><span class="font-semibold text-stone-700">Run-of-Mine Grade:</span> ${occ.grade}</div>
            <div class="mt-1 pt-1 border-t border-stone-200 text-[10px] text-stone-400 font-mono">MOIL Operational Benchmark</div>
          </div>
        `)
        .addTo(occurrencesGroup);
    });
    if (activeLayers.occurrences) occurrencesGroup.addTo(map);
    layersGroupRef.current.occurrencesGroup = occurrencesGroup;

    // 5. Mineralization Evidence / Drillhole Collars & Assays
    const isMineralizationVisible = activeLayers.mineralization ?? activeLayers.drillholes ?? true;
    const drillholesGroup = L.layerGroup();
    drillholes.forEach((dh) => {
      const isHighGrade = dh.mnGradePct >= 22.0;
      
      const dhMarker = L.circleMarker(dh.coordinates, {
        radius: isHighGrade ? 5.5 : 4,
        color: '#ffffff',
        fillColor: isHighGrade ? '#0284c7' : '#0369a1',
        fillOpacity: 0.95,
        weight: 1.5,
      });

      dhMarker.bindTooltip(
        `<div class="text-xs p-1">
          <div class="font-bold text-stone-900 font-mono">Core Collar: ${dh.code}</div>
          <div class="text-stone-700">Depth: ${dh.depthMeters}m | <span class="font-bold text-emerald-700">${dh.mnGradePct}% Mn</span></div>
          <div class="text-[10px] text-stone-500">Interval: ${dh.intervalStart}m - ${dh.intervalEnd}m (${(dh.intervalEnd - dh.intervalStart).toFixed(1)}m)</div>
        </div>`,
        { sticky: true, className: 'bg-white text-stone-900 border border-stone-300 shadow-sm' }
      );

      dhMarker.bindPopup(`
        <div class="p-3 text-xs space-y-1.5">
          <div class="font-bold text-stone-900 font-mono text-sm border-b border-stone-200 pb-1">Drillhole ${dh.code}</div>
          <div class="text-stone-600">Target Zone: <span class="font-mono font-bold text-stone-800">${dh.targetId}</span></div>
          <div class="text-stone-600">Total Depth: <span class="font-mono">${dh.depthMeters} m</span></div>
          <div class="text-stone-600">Mineralized Intercept: <span class="font-mono font-bold text-stone-900">${dh.intervalStart}m – ${dh.intervalEnd}m</span></div>
          <div class="text-stone-600">Assay Grade: <span class="font-mono font-bold text-emerald-700">${dh.mnGradePct}% Mn</span></div>
          <div class="text-stone-400 text-[10px] mt-1 pt-1 border-t border-stone-200 font-mono">Verified Diamond Drill Core / MOIL Assay Lab</div>
        </div>
      `);

      dhMarker.addTo(drillholesGroup);
    });
    if (isMineralizationVisible) drillholesGroup.addTo(map);
    layersGroupRef.current.drillholesGroup = drillholesGroup;

    // 6. Sentinel-2 SWIR Alteration Spectral Indices
    const satelliteGroup = L.layerGroup();
    const swirAnomalies: { coords: L.LatLngExpression[]; label: string }[] = [
      {
        coords: [[21.84, 80.25], [21.87, 80.35], [21.82, 80.37], [21.79, 80.27]],
        label: 'SWIR B11/B12 Alteration Anomaly Zone 1 (Hydrothermal/Supergene signature)',
      },
      {
        coords: [[21.57, 79.75], [21.61, 79.82], [21.55, 79.85], [21.52, 79.77]],
        label: 'SWIR B11/B12 Alteration Anomaly Zone 2 (Dongri Buzurg western extension)',
      },
      {
        coords: [[21.43, 79.31], [21.47, 79.38], [21.42, 79.42], [21.39, 79.34]],
        label: 'SWIR B11/B12 Alteration Anomaly Zone 3 (Mansar-Kandri manganese horizon proxy)',
      },
    ];
    swirAnomalies.forEach((sw) => {
      L.polygon(sw.coords, {
        color: '#0891b2',
        fillColor: '#06b6d4',
        fillOpacity: 0.18,
        weight: 1.5,
        dashArray: '3,3',
      })
        .bindTooltip(sw.label, { 
          sticky: true,
          className: 'bg-white text-stone-900 text-xs border border-stone-300 shadow-sm p-1'
        })
        .addTo(satelliteGroup);
    });
    if (activeLayers.satellite) satelliteGroup.addTo(map);
    layersGroupRef.current.satelliteGroup = satelliteGroup;

    // 7. SRTM Topographic Ridges
    const terrainGroup = L.layerGroup();
    const ridgeLines: L.LatLngExpression[][] = [
      [[21.90, 80.05], [21.95, 80.40]],
      [[21.62, 79.45], [21.72, 79.95]],
      [[21.45, 79.10], [21.50, 79.45]],
    ];
    ridgeLines.forEach((ridge) => {
      L.polyline(ridge, {
        color: '#7c3aed',
        weight: 2,
        dashArray: '4,4',
        opacity: 0.75,
      })
        .bindTooltip('NASA SRTM 30m DEM: Topographic Ridge Crest (>380m Elevation)', { 
          sticky: true,
          className: 'bg-white text-stone-900 text-xs border border-stone-300 shadow-sm p-1'
        })
        .addTo(terrainGroup);
    });
    if (activeLayers.terrain) terrainGroup.addTo(map);
    layersGroupRef.current.terrainGroup = terrainGroup;

    // 8. Exploration Targets Markers
    const targetsGroup = L.layerGroup();
    targets.forEach((target) => {
      const isSelected = target.id === selectedTarget.id;
      const isHigh = target.prospectivity === 'HIGH';
      const color = isHigh ? '#15803d' : target.prospectivity === 'MEDIUM' ? '#d97706' : '#78716c';

      const markerHtml = `
        <div style="position: relative; cursor: pointer; user-select: none;">
          <div style="
            background: #ffffff;
            border: 2px solid ${isSelected ? '#1c1917' : color};
            box-shadow: 0 3px 8px rgba(0,0,0,0.18);
            border-radius: 4px;
            padding: 2px 6px;
            display: flex;
            align-items: center;
            gap: 5px;
            transform: ${isSelected ? 'scale(1.1)' : 'scale(1.0)'};
            transition: transform 0.15s ease;
          ">
            <span style="
              width: 7px;
              height: 7px;
              border-radius: 50%;
              background: ${color};
              display: inline-block;
            "></span>
            <span style="font-family: monospace; font-weight: 700; font-size: 11px; color: #1c1917;">
              ${target.code}
            </span>
            <span style="font-family: monospace; font-size: 9px; color: ${color}; font-weight: 600;">
              ${target.score.toFixed(2)}
            </span>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-target-marker',
        html: markerHtml,
        iconSize: [68, 26],
        iconAnchor: [34, 13],
      });

      const marker = L.marker(target.coordinates, { icon: customIcon });
      marker.on('click', () => {
        onSelectTarget(target);
      });
      marker.addTo(targetsGroup);
    });
    targetsGroup.addTo(map);
    layersGroupRef.current.targetsGroup = targetsGroup;

  }, [targets, selectedTarget.id, activeLayers, drillholes, onSelectTarget, basemap]);

  // Handle basemap switch
  const handleSwitchBasemap = (type: BasemapType) => {
    setBasemap(type);
    if (mapInstanceRef.current && tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
      const config = basemapsConfig[type];
      tileLayerRef.current = L.tileLayer(config.url, {
        attribution: config.attribution,
        subdomains: config.subdomains || 'abc',
        maxZoom: 18,
      }).addTo(mapInstanceRef.current);
      tileLayerRef.current.bringToBack();
    }
  };

  // Center smoothly when selected target changes
  useEffect(() => {
    if (mapInstanceRef.current && selectedTarget) {
      mapInstanceRef.current.flyTo(selectedTarget.coordinates, 11, {
        animate: true,
        duration: 0.8,
      });
    }
  }, [selectedTarget.id]);

  // Ensure map resizes and invalidates size smoothly on window or container size changes
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });

    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className="relative isolate z-0 w-full h-[540px] sm:h-[600px] lg:h-[650px] xl:h-[700px] bg-[#f5f4f0] overflow-hidden">
      {/* Top Left Basemap Selector */}
      <div className="absolute top-3 left-12 z-25 bg-white/95 backdrop-blur-xs border border-stone-300 rounded shadow-xs p-1 flex items-center space-x-1">
        <button
          onClick={() => handleSwitchBasemap('topo')}
          className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
            basemap === 'topo'
              ? 'bg-stone-900 text-white'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
          title="Topographic Cartographic Map"
        >
          Topographic
        </button>
        <button
          onClick={() => handleSwitchBasemap('satellite')}
          className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
            basemap === 'satellite'
              ? 'bg-stone-900 text-white'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
          title="Satellite Ortho Imagery"
        >
          Satellite
        </button>
        <button
          onClick={() => handleSwitchBasemap('terrain')}
          className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
            basemap === 'terrain'
              ? 'bg-stone-900 text-white'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
          title="Shaded Relief Terrain"
        >
          Relief
        </button>
      </div>

      {/* Top Right Coordinate / Datum HUD */}
      <div className="absolute top-3 right-3 z-25 bg-white/95 backdrop-blur-xs border border-stone-300 px-3 py-1.5 rounded text-[11px] font-mono text-stone-600 shadow-xs pointer-events-none flex items-center space-x-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
        <span className="font-sans font-medium text-stone-800">Balaghat–Nagpur Belt</span>
        <span className="text-stone-300">|</span>
        <span>WGS84 / UTM 44N</span>
      </div>

      {/* Map Surface */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Interactive Map Legend Overlay on Map Surface */}
      <MapInteractiveLegend
        activeLayers={activeLayers}
        onToggleLayer={onToggleLayer || (() => {})}
        onToggleAll={onToggleAll}
        onSetPreset={onSetPreset}
        targetsCount={targets.length}
        drillholesCount={drillholes.length}
        occurrencesCount={KNOWN_OCCURRENCES.length}
      />
    </div>
  );
};
