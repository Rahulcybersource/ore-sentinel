import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Layers, 
  Eye, 
  ShieldAlert,
  ChevronRight,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  Sliders,
  Crosshair,
  Compass,
  Check,
  Cuboid,
  Activity,
  Layers3,
  Target,
  Sun,
  Mountain
} from 'lucide-react';
import { Drillhole, ExplorationTarget } from '../../types';
import { ConceptualSubsurfaceBlock, generateConceptualBlocks } from '../../data/resourceData';
import { 
  generateRealisticTerrainGeometry, 
  generateRealisticSatelliteTexture, 
  generateRealisticBumpTexture,
  createRealisticDrillRigMesh 
} from '../../utils/terrainGenerator';

interface Exploration3DViewerProps {
  target: ExplorationTarget;
  targets?: ExplorationTarget[];
  onSelectTarget?: (target: ExplorationTarget) => void;
  drillholes: Drillhole[];
  onSelectDrillhole?: (dh: Drillhole) => void;
  onViewResource: () => void;
}

type CameraPreset = 'perspective' | 'top' | 'cross_ns' | 'long_ew' | 'underground';
type RenderShaderMode = 'pbr' | 'xray' | 'highgrade' | 'wireframe';

interface SceneState {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  terrainMesh: THREE.Mesh;
  terrainWire: THREE.Mesh;
  terrainMaterial: THREE.MeshStandardMaterial;
  terrainTexture: THREE.CanvasTexture;
  bumpTexture: THREE.CanvasTexture;
  prospectivityPlane: THREE.Mesh;
  blocksGroup: THREE.Group;
  drillholesGroup: THREE.Group;
  confidenceMesh: THREE.Mesh;
  depthGridGroup: THREE.Group;
  subsurfaceGlow: THREE.PointLight;
  selectionRing: THREE.Mesh;
  pickableBlocks: THREE.Mesh[];
  pickableDrillholes: THREE.Mesh[];
  isDragging: boolean;
  isRightDragging: boolean;
  prevMouse: { x: number; y: number };
  rotation: { x: number; y: number };
  targetRotation: { x: number; y: number };
  zoom: number;
  targetZoom: number;
  pan: { x: number; y: number };
  targetPan: { x: number; y: number };
}

export const Exploration3DViewerComponent: React.FC<Exploration3DViewerProps> = ({
  target,
  targets = [],
  onSelectTarget,
  drillholes,
  onSelectDrillhole,
  onViewResource,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Scene state stored in ref — initialized to null so no WebGL contexts leak on re-render
  const sceneStateRef = useRef<SceneState | null>(null);

  // Drillholes filtered for current target
  const targetDrillholes = useMemo(() => {
    const matched = drillholes.filter((dh) => dh.targetId === target.id);
    return matched.length > 0 ? matched : drillholes;
  }, [drillholes, target.id]);

  const [selectedDh, setSelectedDh] = useState<Drillhole | null>(targetDrillholes[0] || null);
  const [selectedBlock, setSelectedBlock] = useState<ConceptualSubsurfaceBlock | null>(null);

  // UI States
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('perspective');
  const [renderMode, setRenderMode] = useState<RenderShaderMode>('pbr');
  const [terrainOpacity, setTerrainOpacity] = useState<number>(0.92); // 0.0 to 1.0
  const [gradeCutoff, setGradeCutoff] = useState<number>(0);
  const [maxDepthFilter, setMaxDepthFilter] = useState<number>(250);
  const [openDropdown, setOpenDropdown] = useState<'target' | 'camera' | 'render' | 'grade' | 'layers' | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  // Tooltip DOM Refs (bypasses React re-renders for smooth 60fps hovering)
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipDotRef = useRef<HTMLDivElement>(null);
  const tooltipTitleRef = useRef<HTMLSpanElement>(null);
  const tooltipSubtitleRef = useRef<HTMLDivElement>(null);
  const tooltipMetricsRef = useRef<HTMLDivElement>(null);

  // Layer Toggles
  const [layers, setLayers] = useState({
    terrain: true,
    satelliteImagery: true,
    prospectivity: true,
    conceptualBlocks: true,
    drillholes: true,
    drillRigs: true,
    confidence: true,
    depthGrid: true,
  });

  const toggleLayer = (layerKey: keyof typeof layers) => {
    setLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  // 1. SINGLE WebGL INITIALIZATION (Created once on mount, destroyed once on unmount)
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 580;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d1117);
    scene.fog = new THREE.FogExp2(0x0d1117, 0.0016);

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1500);
    camera.position.set(130, 110, 150);
    camera.lookAt(0, -20, 0);

    // 3. WebGL Renderer with High Precision & Filmic Tone Mapping
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true,
    });
    renderer.setClearColor(0x0d1117, 1.0);
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.outline = 'none';

    // Mount canvas cleanly
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 4. Geological Lighting: Directional Sun, Ambient Sky & Subsurface Ore Illumination
    // Subtle atmospheric blue-grey skylight with deep ground reflectance
    const hemiLight = new THREE.HemisphereLight(0x475569, 0x1e293b, 0.85);
    scene.add(hemiLight);

    // Primary Solar Directional Key Light (Cast crisp, realistic terrain shadows)
    const sunLight = new THREE.DirectionalLight(0xfffbf0, 1.7);
    sunLight.position.set(130, 190, 110);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 600;
    sunLight.shadow.camera.left = -160;
    sunLight.shadow.camera.right = 160;
    sunLight.shadow.camera.top = 160;
    sunLight.shadow.camera.bottom = -160;
    sunLight.shadow.bias = -0.0004;
    scene.add(sunLight);

    // Secondary fill light for unlit geological facets
    const skyFillLight = new THREE.DirectionalLight(0x334155, 0.55);
    skyFillLight.position.set(-110, 80, -100);
    scene.add(skyFillLight);

    // Warm Geological Subsurface Ore Illumination (Restrained, realistic)
    const subsurfaceGlow = new THREE.PointLight(0xd97706, 1.4, 320);
    subsurfaceGlow.position.set(0, -45, 0);
    scene.add(subsurfaceGlow);

    // 5. Realistic Terrain Setup
    const { geometry: terrainGeo, pitCenter } = generateRealisticTerrainGeometry(target.id, 280, 280, 120);
    const terrainTexture = generateRealisticSatelliteTexture(target.id, pitCenter);
    const bumpTexture = generateRealisticBumpTexture(pitCenter);

    const terrainMaterial = new THREE.MeshStandardMaterial({
      map: terrainTexture,
      bumpMap: bumpTexture,
      bumpScale: 0.85,
      roughness: 0.82,
      metalness: 0.12,
      transparent: true,
      opacity: terrainOpacity,
      depthWrite: terrainOpacity > 0.6,
      side: THREE.DoubleSide,
    });

    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMaterial);
    terrainMesh.rotation.x = -Math.PI / 2;
    terrainMesh.position.y = 0;
    terrainMesh.receiveShadow = true;
    terrainMesh.castShadow = true;
    scene.add(terrainMesh);

    // Contour Lines Wireframe Grid (overlay for CAD mode)
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x475569,
      wireframe: true,
      transparent: true,
      opacity: 0.2,
    });
    const terrainWire = new THREE.Mesh(terrainGeo, wireMat);
    terrainWire.rotation.x = -Math.PI / 2;
    terrainWire.position.y = 0.2;
    terrainWire.visible = false;
    scene.add(terrainWire);

    // 6. Surface AI Prospectivity Halo Plane
    const heatGeo = new THREE.PlaneGeometry(190, 190, 24, 24);
    const heatMat = new THREE.MeshBasicMaterial({
      color: 0x15803d,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
    });
    const prospectivityPlane = new THREE.Mesh(heatGeo, heatMat);
    prospectivityPlane.rotation.x = -Math.PI / 2;
    prospectivityPlane.position.y = 1.2;
    scene.add(prospectivityPlane);

    // 7. Subsurface Conceptual Blocks Group
    const blocksGroup = new THREE.Group();
    scene.add(blocksGroup);

    // 8. Drillholes & Surface Rig Group
    const drillholesGroup = new THREE.Group();
    scene.add(drillholesGroup);

    // 9. Borehole Selection Ring Indicator
    const ringGeo = new THREE.RingGeometry(4.5, 6.2, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xb45309,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    const selectionRing = new THREE.Mesh(ringGeo, ringMat);
    selectionRing.rotation.x = Math.PI / 2;
    selectionRing.position.set(0, 1.5, 0);
    scene.add(selectionRing);

    // 10. Spatial Confidence Bounding Box
    const confGeo = new THREE.BoxGeometry(180, 95, 140);
    const confMat = new THREE.MeshBasicMaterial({
      color: 0x475569,
      wireframe: true,
      transparent: true,
      opacity: 0.2,
    });
    const confidenceMesh = new THREE.Mesh(confGeo, confMat);
    confidenceMesh.position.set(0, -45, 0);
    scene.add(confidenceMesh);

    // 11. Subsurface Depth Grid Slices
    const depthGridGroup = new THREE.Group();
    [-50, -100, -150].forEach((d) => {
      const grid = new THREE.GridHelper(240, 12, 0x334155, 0x1e293b);
      grid.position.y = d * 0.45;
      depthGridGroup.add(grid);
    });
    scene.add(depthGridGroup);

    // Store state in ref
    const sceneState: SceneState = {
      scene,
      camera,
      renderer,
      terrainMesh,
      terrainWire,
      terrainMaterial,
      terrainTexture,
      bumpTexture,
      prospectivityPlane,
      blocksGroup,
      drillholesGroup,
      confidenceMesh,
      depthGridGroup,
      subsurfaceGlow,
      selectionRing,
      pickableBlocks: [],
      pickableDrillholes: [],
      isDragging: false,
      isRightDragging: false,
      prevMouse: { x: 0, y: 0 },
      rotation: { x: 0.48, y: -0.65 },
      targetRotation: { x: 0.48, y: -0.65 },
      zoom: 165,
      targetZoom: 165,
      pan: { x: 0, y: 0 },
      targetPan: { x: 0, y: 0 },
    };
    sceneStateRef.current = sceneState;

    // Tooltip & Raycasting utilities
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let lastHoveredKey = '';
    let lastHoveredMesh: THREE.Mesh | null = null;

    const hideTooltip = () => {
      if (tooltipRef.current) {
        tooltipRef.current.style.display = 'none';
        tooltipRef.current.style.opacity = '0';
      }
      if (lastHoveredMesh && lastHoveredMesh.userData?.originalEmissiveIntensity !== undefined) {
        (lastHoveredMesh.material as THREE.MeshStandardMaterial).emissiveIntensity =
          lastHoveredMesh.userData.originalEmissiveIntensity;
        lastHoveredMesh = null;
      }
      lastHoveredKey = '';
    };

    const showTooltip = (
      type: 'drillhole' | 'block',
      title: string,
      subtitle: string,
      metrics: string[],
      clientX: number,
      clientY: number,
      hitMesh?: THREE.Mesh
    ) => {
      const tooltip = tooltipRef.current;
      if (!tooltip || !container) return;

      const rect = renderer.domElement.getBoundingClientRect();
      const localX = clientX - rect.left;
      const localY = clientY - rect.top;

      const posX = Math.max(8, Math.min(rect.width - 240, localX + 14));
      const posY = Math.max(8, Math.min(rect.height - 110, localY + 14));

      tooltip.style.transform = `translate3d(${posX}px, ${posY}px, 0)`;

      const currentKey = `${type}-${title}`;
      if (lastHoveredKey !== currentKey) {
        lastHoveredKey = currentKey;
        if (tooltipDotRef.current) {
          tooltipDotRef.current.className = `w-2 h-2 rounded-full ${
            type === 'drillhole' ? 'bg-red-600' : 'bg-amber-700'
          }`;
        }
        if (tooltipTitleRef.current) tooltipTitleRef.current.textContent = title;
        if (tooltipSubtitleRef.current) tooltipSubtitleRef.current.textContent = subtitle;
        if (tooltipMetricsRef.current) {
          tooltipMetricsRef.current.innerHTML = metrics
            .map((m) => `<div class="text-stone-800">${m}</div>`)
            .join('');
        }
      }

      if (hitMesh && hitMesh !== lastHoveredMesh) {
        if (lastHoveredMesh && lastHoveredMesh.userData?.originalEmissiveIntensity !== undefined) {
          (lastHoveredMesh.material as THREE.MeshStandardMaterial).emissiveIntensity =
            lastHoveredMesh.userData.originalEmissiveIntensity;
        }
        if (hitMesh.material && (hitMesh.material as THREE.MeshStandardMaterial).emissiveIntensity !== undefined) {
          if (hitMesh.userData.originalEmissiveIntensity === undefined) {
            hitMesh.userData.originalEmissiveIntensity = (hitMesh.material as THREE.MeshStandardMaterial).emissiveIntensity;
          }
          (hitMesh.material as THREE.MeshStandardMaterial).emissiveIntensity =
            hitMesh.userData.originalEmissiveIntensity + 0.4;
          lastHoveredMesh = hitMesh;
        }
      }

      tooltip.style.display = 'block';
      tooltip.style.opacity = '1';
    };

    // User Event Handlers
    const onMouseDown = (e: MouseEvent) => {
      const state = sceneStateRef.current;
      if (!state) return;
      if (e.button === 2) {
        state.isRightDragging = true;
      } else {
        state.isDragging = true;
      }
      state.prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      const state = sceneStateRef.current;
      if (!state) return;
      const { isDragging, isRightDragging, prevMouse } = state;
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;

      if (isDragging) {
        state.targetRotation.y += dx * 0.008;
        state.targetRotation.x = Math.max(
          -Math.PI / 3,
          Math.min(Math.PI / 2 - 0.02, state.targetRotation.x + dy * 0.008)
        );
        hideTooltip();
      } else if (isRightDragging) {
        state.targetPan.x += dx * 0.22;
        state.targetPan.y -= dy * 0.22;
        hideTooltip();
      } else {
        // Raycasting for interactive hover feedback
        const rect = renderer.domElement.getBoundingClientRect();
        const isInside =
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom;

        if (!isInside) {
          hideTooltip();
        } else {
          mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
          raycaster.setFromCamera(mouse, camera);

          let hitFound = false;
          if (state.drillholesGroup.visible) {
            const dhHits = raycaster.intersectObjects(state.pickableDrillholes, false);
            if (dhHits.length > 0) {
              const hit = dhHits[0].object as THREE.Mesh;
              if (hit.userData?.data) {
                const dh = hit.userData.data as Drillhole;
                showTooltip(
                  'drillhole',
                  `Borehole ${dh.code}`,
                  `${dh.targetId} • Status: ${dh.dataStatus}`,
                  [
                    `Depth: ${dh.depthMeters} m`,
                    `Intercept: ${dh.mineralizedInterval[0]}m - ${dh.mineralizedInterval[1]}m`,
                    `Grade: ${dh.mnGradePct}% Mn (${dh.feGradePct}% Fe)`,
                  ],
                  e.clientX,
                  e.clientY,
                  hit
                );
                hitFound = true;
              }
            }
          }

          if (!hitFound && state.blocksGroup.visible) {
            const visibleBlocks = state.pickableBlocks.filter((b) => b.visible);
            const blockHits = raycaster.intersectObjects(visibleBlocks, false);
            if (blockHits.length > 0) {
              const hitBlock = blockHits[0].object as THREE.Mesh;
              if (hitBlock.userData?.data) {
                const blk = hitBlock.userData.data as ConceptualSubsurfaceBlock;
                showTooltip(
                  'block',
                  `Block ${blk.id}`,
                  `${blk.category} (${blk.confidence} Conf)`,
                  [
                    `Level: -${blk.z} m`,
                    `Grade: ${blk.gradeMnPct}% Mn`,
                    `Tonnage: ${blk.tonnes.toLocaleString()} t`,
                  ],
                  e.clientX,
                  e.clientY,
                  hitBlock
                );
                hitFound = true;
              }
            }
          }

          if (!hitFound) hideTooltip();
        }
      }
      state.prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      const state = sceneStateRef.current;
      if (!state) return;
      state.isDragging = false;
      state.isRightDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const state = sceneStateRef.current;
      if (!state) return;
      state.targetZoom = Math.max(35, Math.min(360, state.targetZoom + e.deltaY * 0.16));
    };

    const onClick = (e: MouseEvent) => {
      const state = sceneStateRef.current;
      if (!state) return;

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      if (state.drillholesGroup.visible) {
        const intersects = raycaster.intersectObjects(state.pickableDrillholes, false);
        if (intersects.length > 0) {
          const hit = intersects[0].object;
          if (hit.userData?.data) {
            const dh = hit.userData.data as Drillhole;
            setSelectedDh(dh);
            setIsInspectorOpen(true);
            if (onSelectDrillhole) onSelectDrillhole(dh);
            return;
          }
        }
      }

      if (state.blocksGroup.visible) {
        const visibleBlocks = state.pickableBlocks.filter((b) => b.visible);
        const blockIntersects = raycaster.intersectObjects(visibleBlocks, false);
        if (blockIntersects.length > 0) {
          const hitBlock = blockIntersects[0].object;
          if (hitBlock.userData?.data) {
            setSelectedBlock(hitBlock.userData.data as ConceptualSubsurfaceBlock);
            setIsInspectorOpen(true);
          }
        }
      }
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domElement.addEventListener('wheel', onWheel, { passive: false });
    domElement.addEventListener('click', onClick);
    domElement.addEventListener('mouseleave', hideTooltip);
    domElement.addEventListener('contextmenu', (e) => e.preventDefault());

    // Continuous Animation Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const state = sceneStateRef.current;
      if (!state) return;

      const elapsed = clock.getElapsedTime();

      // Smooth camera interpolation
      state.rotation.x += (state.targetRotation.x - state.rotation.x) * 0.12;
      state.rotation.y += (state.targetRotation.y - state.rotation.y) * 0.12;
      state.zoom += (state.targetZoom - state.zoom) * 0.12;
      state.pan.x += (state.targetPan.x - state.pan.x) * 0.12;
      state.pan.y += (state.targetPan.y - state.pan.y) * 0.12;

      const radius = state.zoom;
      state.camera.position.x = radius * Math.sin(state.rotation.y) * Math.cos(state.rotation.x) + state.pan.x;
      state.camera.position.y = radius * Math.sin(state.rotation.x) + state.pan.y;
      state.camera.position.z = radius * Math.cos(state.rotation.y) * Math.cos(state.rotation.x);
      state.camera.lookAt(state.pan.x, -25 + state.pan.y, 0);

      // Pulse Selection Ring around active borehole
      if (state.selectionRing) {
        const s = 1 + Math.sin(elapsed * 4) * 0.08;
        state.selectionRing.scale.set(s, s, s);
      }

      // Subtle pulse on subsurface ore glow
      if (state.subsurfaceGlow) {
        state.subsurfaceGlow.intensity = 2.2 + Math.sin(elapsed * 2.5) * 0.4;
      }

      state.renderer.render(state.scene, state.camera);
    };
    animate();

    // ResizeObserver: updates viewport without recreating context
    let lastW = Math.floor(width);
    let lastH = Math.floor(height);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newW = Math.floor(entry.contentRect.width);
        const newH = Math.floor(entry.contentRect.height);
        if (newW > 10 && newH > 10 && (Math.abs(newW - lastW) > 2 || Math.abs(newH - lastH) > 2)) {
          lastW = newW;
          lastH = newH;
          camera.aspect = newW / newH;
          camera.updateProjectionMatrix();
          renderer.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(container);

    // Initial build of blocks and drillholes for the target
    buildTargetContent(target, targetDrillholes, renderMode);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domElement.removeEventListener('wheel', onWheel);
      domElement.removeEventListener('click', onClick);
      domElement.removeEventListener('mouseleave', hideTooltip);
      renderer.dispose();
      terrainGeo.dispose();
      terrainTexture.dispose();
      bumpTexture.dispose();
      terrainMaterial.dispose();
      sceneStateRef.current = null;
    };
  }, []); // Strictly once on mount!

  // 2. MODULAR TARGET CONTENT BUILDER (Mutates existing scene without rebuilding WebGL context)
  const buildTargetContent = useCallback(
    (currentTarget: ExplorationTarget, currentDrillholes: Drillhole[], activeRenderMode: RenderShaderMode) => {
      const state = sceneStateRef.current;
      if (!state) return;

      // 1. Clear old blocks
      while (state.blocksGroup.children.length > 0) {
        const obj = state.blocksGroup.children[0] as THREE.Mesh;
        if (obj.geometry) obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else if (obj.material) {
          obj.material.dispose();
        }
        state.blocksGroup.remove(obj);
      }
      state.pickableBlocks = [];

      // 2. Clear old drillholes and rigs
      while (state.drillholesGroup.children.length > 0) {
        const obj = state.drillholesGroup.children[0];
        obj.traverse((child) => {
          const mesh = child as THREE.Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
          if (mesh.material) {
            if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose());
            else mesh.material.dispose();
          }
        });
        state.drillholesGroup.remove(obj);
      }
      state.pickableDrillholes = [];

      // 3. Update Terrain Topography for target
      const { geometry: newTerrainGeo, pitCenter } = generateRealisticTerrainGeometry(currentTarget.id, 280, 280, 120);
      state.terrainMesh.geometry.dispose();
      state.terrainMesh.geometry = newTerrainGeo;
      state.terrainWire.geometry.dispose();
      state.terrainWire.geometry = newTerrainGeo;

      // Update texture for current target
      state.terrainTexture.dispose();
      state.bumpTexture.dispose();
      state.terrainTexture = generateRealisticSatelliteTexture(currentTarget.id, pitCenter);
      state.bumpTexture = generateRealisticBumpTexture(pitCenter);
      state.terrainMaterial.map = state.terrainTexture;
      state.terrainMaterial.bumpMap = state.bumpTexture;
      state.terrainMaterial.needsUpdate = true;

      // 4. Rebuild Conceptual Subsurface Blocks
      const blocksData = generateConceptualBlocks(currentTarget.id);

      blocksData.forEach((blk) => {
        let blockColor = 0x475569; // Waste
        let emissiveColor = 0x000000;
        let emissiveIntensity = 0;
        let opacity = 0.25;

        if (blk.category === 'High-grade Ore') {
          blockColor = 0xb45309; // Rich Manganese Ore Amber-Brown
          emissiveColor = 0x92400e;
          emissiveIntensity = activeRenderMode === 'highgrade' ? 0.6 : 0.3;
          opacity = 0.94;
        } else if (blk.category === 'Medium-grade Ore') {
          blockColor = 0x15803d; // Economic Mineral Green Ore
          emissiveColor = 0x14532d;
          emissiveIntensity = 0.2;
          opacity = activeRenderMode === 'highgrade' ? 0.35 : 0.85;
        } else if (blk.category === 'Low-grade Mineralized') {
          blockColor = 0x78716c; // Weathered Slate-Schist
          opacity = activeRenderMode === 'highgrade' ? 0.1 : 0.55;
        } else {
          blockColor = 0x94a3b8; // Waste Limestone Rock
          opacity = activeRenderMode === 'highgrade' ? 0.04 : 0.16;
        }

        const boxGeo = new THREE.BoxGeometry(18, 12, 18);
        const boxMat = new THREE.MeshStandardMaterial({
          color: blockColor,
          emissive: emissiveColor,
          emissiveIntensity,
          roughness: 0.4,
          metalness: blk.category === 'High-grade Ore' ? 0.45 : 0.15,
          transparent: true,
          opacity,
          wireframe: activeRenderMode === 'wireframe',
        });
        const boxMesh = new THREE.Mesh(boxGeo, boxMat);

        const depthY = -(blk.z * 0.42);
        boxMesh.position.set(blk.x * 1.5, depthY, blk.y * 1.5);
        boxMesh.castShadow = true;
        boxMesh.receiveShadow = true;
        boxMesh.userData = {
          isBlock: true,
          data: blk,
          originalColor: blockColor,
          originalOpacity: opacity,
        };

        // Edge highlights
        const edges = new THREE.EdgesGeometry(boxGeo);
        const edgeColor = blk.category === 'High-grade Ore' ? 0xd97706 : 0x57534e;
        const line = new THREE.LineSegments(
          edges,
          new THREE.LineBasicMaterial({ color: edgeColor, transparent: true, opacity: 0.45 })
        );
        boxMesh.add(line);

        state.blocksGroup.add(boxMesh);
        state.pickableBlocks.push(boxMesh);
      });

      // 5. Rebuild Diamond Drillholes & Realistic Surface Derricks
      currentDrillholes.forEach((dh, index) => {
        const offsetX = (index - 1) * 45;
        const offsetZ = (index % 2 === 0 ? 1 : -1) * 24;
        const holeDepth = dh.depthMeters * 0.45;

        // Drill String / Core Barrel
        const traceGeo = new THREE.CylinderGeometry(0.9, 0.9, holeDepth, 16);
        const traceMat = new THREE.MeshStandardMaterial({
          color: 0x94a3b8,
          metalness: 0.8,
          roughness: 0.2,
        });
        const traceMesh = new THREE.Mesh(traceGeo, traceMat);
        traceMesh.position.set(offsetX, -holeDepth / 2, offsetZ);
        traceMesh.userData = { isDrillhole: true, data: dh };
        state.drillholesGroup.add(traceMesh);
        state.pickableDrillholes.push(traceMesh);

        // Realistic Diamond Drill Rig Tower on Collar Surface
        const drillRig = createRealisticDrillRigMesh(offsetX, 0.5, offsetZ);
        drillRig.userData = { isDrillhole: true, data: dh };
        state.drillholesGroup.add(drillRig);

        // Core Intercept Glow Cylinder along drill string
        const fromY = -(dh.mineralizedInterval[0] * 0.45);
        const toY = -(dh.mineralizedInterval[1] * 0.45);
        const intLen = Math.abs(toY - fromY);
        const intCenterY = (fromY + toY) / 2;

        const interceptGeo = new THREE.CylinderGeometry(2.0, 2.0, intLen, 16);
        const interceptMat = new THREE.MeshStandardMaterial({
          color: 0xb91c1c, // Mineralized Core Crimson Red
          emissive: 0x7f1d1d,
          emissiveIntensity: 0.5,
          roughness: 0.3,
        });
        const interceptMesh = new THREE.Mesh(interceptGeo, interceptMat);
        interceptMesh.position.set(offsetX, intCenterY, offsetZ);
        interceptMesh.userData = { isDrillhole: true, data: dh };
        state.drillholesGroup.add(interceptMesh);
        state.pickableDrillholes.push(interceptMesh);
      });

      // 6. Update Selection Ring Position
      if (currentDrillholes.length > 0) {
        const firstDh = currentDrillholes[0];
        const offX = -45;
        const offZ = 24;
        state.selectionRing.position.set(offX, 1.5, offZ);
      }
    },
    []
  );

  // 3. TARGET CHANGE LISTENER (Updates data without tearing down WebGL)
  useEffect(() => {
    buildTargetContent(target, targetDrillholes, renderMode);
    if (targetDrillholes.length > 0) {
      setSelectedDh(targetDrillholes[0]);
    }
  }, [target.id, buildTargetContent, renderMode, targetDrillholes]);

  // 4. RENDER SHADER MODE UPDATES (Updates materials directly without WebGL teardown)
  useEffect(() => {
    const state = sceneStateRef.current;
    if (!state) return;

    if (renderMode === 'pbr') {
      state.terrainMaterial.opacity = terrainOpacity;
      state.terrainMaterial.depthWrite = terrainOpacity > 0.6;
      state.terrainMaterial.wireframe = false;
      state.terrainWire.visible = false;
    } else if (renderMode === 'xray') {
      state.terrainMaterial.opacity = Math.min(terrainOpacity, 0.38);
      state.terrainMaterial.depthWrite = false;
      state.terrainMaterial.wireframe = false;
      state.terrainWire.visible = true;
    } else if (renderMode === 'highgrade') {
      state.terrainMaterial.opacity = 0.12;
      state.terrainMaterial.depthWrite = false;
      state.terrainMaterial.wireframe = false;
      state.terrainWire.visible = true;
    } else if (renderMode === 'wireframe') {
      state.terrainMaterial.opacity = 0.05;
      state.terrainMaterial.depthWrite = false;
      state.terrainMaterial.wireframe = true;
      state.terrainWire.visible = true;
    }

    // Update block opacities & emissives in place
    state.blocksGroup.children.forEach((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.userData?.data) {
        const blk = mesh.userData.data as ConceptualSubsurfaceBlock;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.wireframe = renderMode === 'wireframe';

        if (blk.category === 'High-grade Ore') {
          mat.emissiveIntensity = renderMode === 'highgrade' ? 0.8 : 0.4;
          mat.opacity = 0.94;
        } else if (blk.category === 'Medium-grade Ore') {
          mat.opacity = renderMode === 'highgrade' ? 0.3 : 0.85;
        } else {
          mat.opacity = renderMode === 'highgrade' ? 0.05 : 0.2;
        }
      }
    });
  }, [renderMode, terrainOpacity]);

  // 5. SELECTION RING UPDATE
  useEffect(() => {
    const state = sceneStateRef.current;
    if (!state || !selectedDh) return;
    const idx = targetDrillholes.findIndex((d) => d.id === selectedDh.id);
    if (idx !== -1) {
      const offX = (idx - 1) * 45;
      const offZ = (idx % 2 === 0 ? 1 : -1) * 24;
      state.selectionRing.position.set(offX, 1.5, offZ);
    }
  }, [selectedDh, targetDrillholes]);

  // 6. LAYER VISIBILITY UPDATES (Mutates .visible flag in place)
  useEffect(() => {
    const state = sceneStateRef.current;
    if (!state) return;

    state.terrainMesh.visible = layers.terrain;
    state.prospectivityPlane.visible = layers.prospectivity;
    state.blocksGroup.visible = layers.conceptualBlocks;
    state.drillholesGroup.visible = layers.drillholes;
    state.confidenceMesh.visible = layers.confidence;
    state.depthGridGroup.visible = layers.depthGrid;
  }, [layers]);

  // 7. GRADE CUTOFF & DEPTH FILTER UPDATES
  useEffect(() => {
    const state = sceneStateRef.current;
    if (!state) return;

    state.blocksGroup.children.forEach((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.userData?.data) {
        const blk = mesh.userData.data as ConceptualSubsurfaceBlock;
        const isBelowGrade = blk.gradeMnPct < gradeCutoff;
        const isTooDeep = blk.z > maxDepthFilter;
        mesh.visible = !(isBelowGrade || isTooDeep);
      }
    });
  }, [gradeCutoff, maxDepthFilter]);

  // Camera Presets
  const applyCameraPreset = (preset: CameraPreset) => {
    setCameraPreset(preset);
    setOpenDropdown(null);
    const state = sceneStateRef.current;
    if (!state) return;

    switch (preset) {
      case 'perspective':
        state.targetRotation = { x: 0.55, y: -0.65 };
        state.targetZoom = 160;
        state.targetPan = { x: 0, y: 0 };
        break;
      case 'top':
        state.targetRotation = { x: 1.56, y: 0 };
        state.targetZoom = 195;
        state.targetPan = { x: 0, y: 0 };
        break;
      case 'cross_ns':
        state.targetRotation = { x: 0.12, y: 0.05 };
        state.targetZoom = 150;
        state.targetPan = { x: 0, y: -20 };
        break;
      case 'long_ew':
        state.targetRotation = { x: 0.12, y: 1.57 };
        state.targetZoom = 150;
        state.targetPan = { x: 0, y: -20 };
        break;
      case 'underground':
        state.targetRotation = { x: -0.3, y: -0.75 };
        state.targetZoom = 145;
        state.targetPan = { x: 0, y: -30 };
        break;
    }
  };

  const resetCamera = () => applyCameraPreset('perspective');

  // Fullscreen toggle
  const toggleFullscreen = () => {
    setIsFullscreen((prev) => {
      const next = !prev;
      if (next && containerRef.current) {
        containerRef.current.requestFullscreen?.().catch(() => {});
      } else if (!next && document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
      return next;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false);
    };
    const handleFsChange = () => {
      if (!document.fullscreenElement && isFullscreen) setIsFullscreen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFsChange);
    };
  }, [isFullscreen]);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const targetEl = e.target as HTMLElement;
      if (!targetEl.closest('.dropdown-container')) {
        setOpenDropdown(null);
      }
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${
        isFullscreen
          ? 'fixed inset-0 z-[9999] w-screen h-screen bg-[#0d1117] border-0 rounded-none'
          : 'h-[540px] sm:h-[600px] lg:h-[650px] xl:h-[700px] bg-[#0d1117] rounded-2xl border border-stone-300/80 shadow-xs'
      } overflow-hidden flex flex-col select-none transition-all`}
    >
      {/* 1. TOP INDUSTRIAL COMMAND TOOLBAR */}
      <div className="px-3 py-2 bg-white/95 border-b border-stone-200 text-stone-900 flex flex-wrap items-center justify-between gap-2 z-30 backdrop-blur-md">
        
        {/* Left: Target Selector & Modelled Subsurface Interpretation Label */}
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></div>

          {/* Target Zone Selector Dropdown */}
          <div className="relative dropdown-container">
            <button
              onClick={() => setOpenDropdown(openDropdown === 'target' ? null : 'target')}
              className="flex items-center space-x-1.5 px-2.5 py-1 bg-stone-50 hover:bg-stone-100 text-stone-900 rounded-lg border border-stone-300/80 text-xs font-mono font-bold transition-colors cursor-pointer shadow-2xs"
            >
              <Target className="w-3.5 h-3.5 text-amber-700" />
              <span>{target.code}: {target.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
            </button>

            {openDropdown === 'target' && (
              <div className="absolute left-0 mt-1.5 w-72 bg-white border border-stone-200 rounded-xl shadow-xl py-1 z-50 backdrop-blur-xl text-stone-900">
                <div className="px-3 py-1.5 text-[10px] font-mono text-stone-500 uppercase tracking-wider border-b border-stone-100">
                  Select Exploration Target (3D)
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {targets.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        if (onSelectTarget) onSelectTarget(t);
                        setOpenDropdown(null);
                      }}
                      className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs font-mono transition-colors cursor-pointer ${
                        t.id === target.id
                          ? 'bg-amber-50 text-amber-900 font-bold border-l-2 border-amber-700'
                          : 'text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      <div>
                        <div>{t.code}: {t.name}</div>
                        <div className="text-[10px] text-stone-500 font-sans">{t.depositStyle}</div>
                      </div>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${
                          t.prospectivity === 'HIGH'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {t.prospectivity}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <span className="text-stone-300 hidden sm:inline">|</span>

          {/* Modelled Subsurface Interpretation Label */}
          <div className="hidden sm:flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200 text-[10px] font-mono text-stone-700 tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
            <span className="font-semibold text-stone-800">MODELLED SUBSURFACE INTERPRETATION</span>
          </div>
        </div>

        {/* Right: Camera Angle, Render Shader, Terrain Opacity, Grade Cutoff, Layers & Fullscreen */}
        <div className="flex items-center space-x-1.5 flex-wrap">
          
          {/* Camera View Angle Dropdown */}
          <div className="relative dropdown-container">
            <button
              onClick={() => setOpenDropdown(openDropdown === 'camera' ? null : 'camera')}
              className="flex items-center space-x-1 px-2 py-1 bg-stone-50 hover:bg-stone-100 text-stone-800 rounded-lg text-xs font-mono transition-colors border border-stone-300/80 cursor-pointer shadow-2xs"
              title="Camera View Preset"
            >
              <Compass className="w-3.5 h-3.5 text-stone-600" />
              <span className="capitalize">{cameraPreset.replace('_', ' ')}</span>
              <ChevronDown className="w-3 h-3 text-stone-500" />
            </button>

            {openDropdown === 'camera' && (
              <div className="absolute right-0 mt-1.5 w-56 bg-white border border-stone-200 rounded-xl shadow-xl py-1 z-50 backdrop-blur-xl text-stone-800">
                <div className="px-3 py-1 text-[10px] font-mono text-stone-500 uppercase tracking-wider border-b border-stone-100">
                  Camera Perspective
                </div>
                {[
                  { id: 'perspective', label: 'Perspective Orbit (3D Free)' },
                  { id: 'top', label: 'Top Plan View (Surface Map)' },
                  { id: 'cross_ns', label: 'Cross-Section (Along Dip / N-S)' },
                  { id: 'long_ew', label: 'Long-Section (Along Strike / E-W)' },
                  { id: 'underground', label: 'Underground Incline (Look Up)' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => applyCameraPreset(item.id as CameraPreset)}
                    className={`w-full px-3 py-1.5 text-left text-xs font-mono flex items-center justify-between cursor-pointer ${
                      cameraPreset === item.id ? 'bg-amber-50 text-amber-900 font-bold' : 'text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <span>{item.label}</span>
                    {cameraPreset === item.id && <Check className="w-3.5 h-3.5 text-amber-700" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Render Shader Mode Dropdown */}
          <div className="relative dropdown-container">
            <button
              onClick={() => setOpenDropdown(openDropdown === 'render' ? null : 'render')}
              className="flex items-center space-x-1 px-2 py-1 bg-stone-50 hover:bg-stone-100 text-stone-800 rounded-lg text-xs font-mono transition-colors border border-stone-300/80 cursor-pointer shadow-2xs"
              title="Shading & Visibility Mode"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span className="capitalize">{renderMode === 'pbr' ? 'Realistic Terrain' : `${renderMode} Mode`}</span>
              <ChevronDown className="w-3 h-3 text-stone-500" />
            </button>

            {openDropdown === 'render' && (
              <div className="absolute right-0 mt-1.5 w-64 bg-white border border-stone-200 rounded-xl shadow-xl py-1 z-50 backdrop-blur-xl text-stone-800">
                <div className="px-3 py-1 text-[10px] font-mono text-stone-500 uppercase tracking-wider border-b border-stone-100">
                  Render Shading Preset
                </div>
                {[
                  { id: 'pbr', label: 'Realistic Satellite Terrain PBR', desc: 'Opencast quarry benches, haul roads, laterite' },
                  { id: 'xray', label: 'Translucent Subsurface X-Ray', desc: 'Semi-transparent terrain with glowing ore' },
                  { id: 'highgrade', label: 'High-Grade Cutaway (>24% Mn)', desc: 'Isolates richest manganese vein' },
                  { id: 'wireframe', label: 'Structural Wireframe CAD', desc: 'Crisp geological grid boundaries' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setRenderMode(item.id as RenderShaderMode);
                      setOpenDropdown(null);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs font-mono flex flex-col cursor-pointer ${
                      renderMode === item.id ? 'bg-amber-50 text-amber-900 font-bold' : 'text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{item.label}</span>
                      {renderMode === item.id && <Check className="w-3.5 h-3.5 text-amber-700" />}
                    </div>
                    <span className="text-[10px] text-stone-500">{item.desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Realistic Terrain Opacity Quick Controller */}
          <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 bg-stone-50 rounded-lg border border-stone-200 text-[10px] font-mono text-stone-700 shadow-2xs">
            <span className="text-stone-500">SURFACE:</span>
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round(terrainOpacity * 100)}
              onChange={(e) => {
                const val = Number(e.target.value) / 100;
                setTerrainOpacity(val);
                if (val < 0.4 && renderMode === 'pbr') {
                  setRenderMode('xray');
                } else if (val >= 0.7 && renderMode === 'xray') {
                  setRenderMode('pbr');
                }
              }}
              className="w-16 h-1.5 bg-stone-200 rounded appearance-none cursor-pointer accent-amber-700"
              title="Surface Terrain Opacity (0% = Ore Only, 100% = Full Realistic Surface Terrain)"
            />
            <span className="w-7 text-right font-bold text-stone-900">{Math.round(terrainOpacity * 100)}%</span>
          </div>

          {/* Grade Cutoff Dropdown */}
          <div className="relative dropdown-container">
            <button
              onClick={() => setOpenDropdown(openDropdown === 'grade' ? null : 'grade')}
              className="flex items-center space-x-1 px-2 py-1 bg-stone-50 hover:bg-stone-100 text-stone-800 rounded-lg text-xs font-mono transition-colors border border-stone-300/80 cursor-pointer shadow-2xs"
              title="Mn Grade Cutoff Filter"
            >
              <Sliders className="w-3.5 h-3.5 text-emerald-700" />
              <span>{gradeCutoff === 0 ? 'All Grades' : `≥${gradeCutoff}% Mn`}</span>
              <ChevronDown className="w-3 h-3 text-stone-500" />
            </button>

            {openDropdown === 'grade' && (
              <div className="absolute right-0 mt-1.5 w-56 bg-white border border-stone-200 rounded-xl shadow-xl py-1 z-50 backdrop-blur-xl text-stone-800">
                <div className="px-3 py-1 text-[10px] font-mono text-stone-500 uppercase tracking-wider border-b border-stone-100">
                  Filter Blocks by Grade
                </div>
                {[
                  { cutoff: 0, label: 'Show All Units (Waste + Ore)' },
                  { cutoff: 15, label: 'Cutoff ≥ 15% Mn (Mineralized)' },
                  { cutoff: 20, label: 'Cutoff ≥ 20% Mn (Economic Ore)' },
                  { cutoff: 24, label: 'Cutoff ≥ 24% Mn (High-Grade Core)' },
                ].map((item) => (
                  <button
                    key={item.cutoff}
                    onClick={() => {
                      setGradeCutoff(item.cutoff);
                      setOpenDropdown(null);
                    }}
                    className={`w-full px-3 py-1.5 text-left text-xs font-mono flex items-center justify-between cursor-pointer ${
                      gradeCutoff === item.cutoff ? 'bg-emerald-50 text-emerald-900 font-bold' : 'text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <span>{item.label}</span>
                    {gradeCutoff === item.cutoff && <Check className="w-3.5 h-3.5 text-emerald-700" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 3D Layers Dropdown */}
          <div className="relative dropdown-container">
            <button
              onClick={() => setOpenDropdown(openDropdown === 'layers' ? null : 'layers')}
              className="flex items-center space-x-1 px-2 py-1 bg-stone-50 hover:bg-stone-100 text-stone-800 rounded-lg text-xs font-mono transition-colors border border-stone-300/80 cursor-pointer shadow-2xs"
            >
              <Layers3 className="w-3.5 h-3.5 text-stone-600" />
              <span>Layers ({Object.values(layers).filter(Boolean).length})</span>
              <ChevronDown className="w-3 h-3 text-stone-500" />
            </button>

            {openDropdown === 'layers' && (
              <div className="absolute right-0 mt-1.5 w-60 bg-white border border-stone-200 rounded-xl shadow-xl p-2 z-50 backdrop-blur-xl text-stone-800">
                <div className="px-1 py-1 text-[10px] font-mono text-stone-500 uppercase tracking-wider border-b border-stone-100 mb-1">
                  Toggle 3D Subsurface Layers
                </div>
                <div className="space-y-1 text-xs font-mono">
                  {[
                    { key: 'terrain', label: 'Realistic DEM Surface', color: 'bg-emerald-600' },
                    { key: 'prospectivity', label: 'AI Prospectivity Halo', color: 'bg-emerald-700' },
                    { key: 'conceptualBlocks', label: 'Block Model (Ore Body)', color: 'bg-amber-700' },
                    { key: 'drillholes', label: 'Drill Hole Traces & Rigs', color: 'bg-stone-600' },
                    { key: 'confidence', label: 'Confidence Bounding Box', color: 'bg-stone-400' },
                    { key: 'depthGrid', label: 'Depth Reference Slices', color: 'bg-stone-300' },
                  ].map((layer) => (
                    <label
                      key={layer.key}
                      className="flex items-center justify-between px-2 py-1 rounded hover:bg-stone-50 cursor-pointer text-stone-700"
                    >
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${layer.color}`} />
                        <span className="text-[11px]">{layer.label}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={layers[layer.key as keyof typeof layers]}
                        onChange={() => toggleLayer(layer.key as keyof typeof layers)}
                        className="rounded border-stone-300 text-amber-700 focus:ring-0 cursor-pointer accent-amber-700"
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border shadow-2xs ${
              isFullscreen
                ? 'bg-amber-700 text-white border-amber-800 shadow-xs'
                : 'bg-stone-900 hover:bg-stone-800 text-white border-stone-900'
            }`}
            title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Open 3D Map in Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5 text-amber-300" />}
            <span>{isFullscreen ? 'EXIT' : 'FULLSCREEN'}</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN 3D CANVAS STAGE */}
      <div className="relative flex-1 min-h-0 w-full cursor-grab active:cursor-grabbing overflow-hidden">
        
        {/* Three.js Canvas Container (Single mount, no flicker) */}
        <div ref={mountRef} className="absolute inset-0 w-full h-full overflow-hidden" />

        {/* 3D Navigation Controls */}
        <div className="absolute top-3 left-3 z-20 flex flex-col space-y-1 bg-white/95 p-1 rounded-xl border border-stone-300/80 shadow-md backdrop-blur-md text-stone-700">
          <button
            onClick={() => {
              if (sceneStateRef.current) {
                sceneStateRef.current.targetZoom = Math.max(35, sceneStateRef.current.targetZoom - 25);
              }
            }}
            className="p-1.5 text-stone-700 hover:text-stone-950 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (sceneStateRef.current) {
                sceneStateRef.current.targetZoom = Math.min(360, sceneStateRef.current.targetZoom + 25);
              }
            }}
            className="p-1.5 text-stone-700 hover:text-stone-950 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={resetCamera}
            className="p-1.5 text-stone-700 hover:text-stone-950 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
            title="Reset to 3D Orbit"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <div className="pt-1 border-t border-stone-200 text-[8px] font-mono text-center text-stone-500">
            ORBIT
          </div>
        </div>

        {/* Topographic Elevation & Stratigraphic Reference */}
        <div className="absolute top-3 left-14 z-20 bg-white/95 px-2.5 py-1.5 rounded-xl border border-stone-300/80 text-[9px] font-mono text-stone-600 backdrop-blur-md flex flex-col space-y-1 shadow-md">
          <div className="flex items-center space-x-1.5 text-stone-900 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>+25m to -35m Terraced Pit</span>
          </div>
          <div className="pl-2 border-l border-stone-300 space-y-0.5 text-stone-500">
            <div>-50m Saprolite Floor</div>
            <div className="text-amber-800 font-semibold">-100m Main Manganese Lode</div>
            <div>-150m Lower Gondite Footwall</div>
            <div>-200m Deep Scout Intercept</div>
          </div>
        </div>

        {/* DRILLHOLE & SUBSURFACE INSPECTOR DROPDOWN */}
        <div className="absolute top-3 right-3 z-20 select-none flex flex-col items-end">
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setIsInspectorOpen(!isInspectorOpen)}
              className="flex items-center space-x-2 px-3 py-1.5 bg-white/95 hover:bg-stone-50 border border-stone-300/80 hover:border-amber-700 rounded-xl text-xs font-mono text-stone-900 shadow-md backdrop-blur-xl transition-all cursor-pointer group"
              title={isInspectorOpen ? "Collapse Inspector" : "Expand Borehole & Subsurface Inspector"}
            >
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
                <span className="font-bold text-amber-800 tracking-wide text-[10px]">
                  BOREHOLE INSPECTOR
                </span>
              </div>
              {selectedDh && (
                <span className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-800 text-[9px] font-bold border border-stone-200">
                  {selectedDh.code} &bull; {selectedDh.mnGradePct}% Mn
                </span>
              )}
              {isInspectorOpen ? (
                <ChevronUp className="w-3.5 h-3.5 text-stone-500 group-hover:text-amber-700" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-stone-500 group-hover:text-amber-700" />
              )}
            </button>
          </div>

          {/* Inspector Panel */}
          {isInspectorOpen && (
            <div className="mt-1.5 w-80 sm:w-92 bg-white/98 p-3.5 rounded-2xl border border-stone-200 shadow-2xl backdrop-blur-xl flex flex-col max-h-[calc(100vh-160px)] sm:max-h-[510px] overflow-y-auto text-stone-900">
              <div className="pb-2.5 border-b border-stone-200 mb-2.5 flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <Crosshair className="w-3.5 h-3.5 text-amber-700" />
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-800 font-bold">
                    BOREHOLE & LITHOLOGY PROFILE
                  </span>
                </div>
                <button
                  onClick={() => setIsInspectorOpen(false)}
                  className="p-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Drillhole Dropdown */}
              <div className="mb-3">
                <select
                  value={selectedDh?.id || ''}
                  onChange={(e) => {
                    const dh = targetDrillholes.find((d) => d.id === e.target.value);
                    if (dh) {
                      setSelectedDh(dh);
                      if (onSelectDrillhole) onSelectDrillhole(dh);
                    }
                  }}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-stone-900 font-bold focus:outline-hidden focus:border-amber-700 cursor-pointer shadow-2xs"
                >
                  {targetDrillholes.map((dh) => (
                    <option key={dh.id} value={dh.id} className="bg-white text-stone-900">
                      {dh.code} &bull; {dh.depthMeters}m ({dh.mnGradePct}% Mn - {dh.mineralizedInterval[0]}m-{dh.mineralizedInterval[1]}m)
                    </option>
                  ))}
                </select>
              </div>

              {selectedDh ? (
                <div className="space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-stone-50 rounded-lg border border-stone-200">
                      <span className="text-[9px] text-stone-500 block font-mono">TOTAL DEPTH</span>
                      <span className="font-mono font-bold text-stone-900 text-sm">{selectedDh.depthMeters} m</span>
                    </div>
                    <div className="p-2 bg-stone-50 rounded-lg border border-stone-200">
                      <span className="text-[9px] text-stone-500 block font-mono">AVG ASSAY GRADE</span>
                      <span className="font-mono font-bold text-emerald-800 text-sm">{selectedDh.mnGradePct}% Mn</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-red-50/50 rounded-lg border border-red-200/80">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-stone-600 text-[11px]">Mineralized Intercept:</span>
                      <span className="font-mono font-bold text-red-700 text-xs">
                        {selectedDh.mineralizedInterval[0]}m &ndash; {selectedDh.mineralizedInterval[1]}m
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-stone-500">Lode True Thickness:</span>
                      <span className="font-semibold text-stone-800">
                        {(selectedDh.mineralizedInterval[1] - selectedDh.mineralizedInterval[0]).toFixed(1)} m
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono mt-1 pt-1 border-t border-red-100">
                      <span className="text-stone-500">Fe Contaminant:</span>
                      <span className="text-stone-700">{selectedDh.feGradePct}% Fe</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-stone-500 block text-[9px] uppercase font-mono mb-1">Lithology Profile</span>
                    <p className="text-[10px] text-stone-700 leading-relaxed bg-stone-50 p-2 rounded-lg border border-stone-200 font-sans">
                      {selectedDh.lithology}
                    </p>
                  </div>

                  {selectedBlock && (
                    <div className="mt-2 p-2 bg-amber-50/80 border border-amber-300 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-bold text-amber-900 text-xs">Block {selectedBlock.id}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-mono font-semibold">
                          {selectedBlock.confidence}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[9px] font-mono text-stone-700">
                        <div>Level: -{selectedBlock.z} m</div>
                        <div>Grade: <span className="font-bold text-emerald-800">{selectedBlock.gradeMnPct}% Mn</span></div>
                        <div>Tonnage: {selectedBlock.tonnes.toLocaleString()} t</div>
                        <div>Type: {selectedBlock.category}</div>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Depth Slicing Plane Slider */}
              <div className="mt-3 pt-2.5 border-t border-stone-200">
                <div className="flex items-center justify-between text-[10px] font-mono text-stone-600 mb-1">
                  <span>Depth Cutaway Slicing</span>
                  <span className="text-amber-800 font-bold">-{maxDepthFilter}m</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="250"
                  step="10"
                  value={maxDepthFilter}
                  onChange={(e) => setMaxDepthFilter(Number(e.target.value))}
                  className="w-full h-1.5 bg-stone-200 rounded appearance-none cursor-pointer accent-amber-700"
                />
              </div>

              {/* Action Link */}
              <div className="mt-3 pt-2 border-t border-stone-200 space-y-1.5">
                <button
                  onClick={onViewResource}
                  className="w-full py-2 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <span>ESTIMATE GEOLOGICAL RESOURCE</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Realistic Satellite & Legend Readout */}
        <div className="absolute bottom-3 left-3 z-20 bg-white/95 px-3 py-1.5 rounded-xl border border-stone-300/80 text-[9px] font-mono text-stone-700 flex flex-wrap items-center gap-3 backdrop-blur-md shadow-md">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded bg-[#3f4f34] border border-[#2b3823]"></span>
            <span>Natural Forest Canopy</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded bg-[#8b4b39] border border-[#6b3527]"></span>
            <span>Laterite Soil</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded bg-[#475569] border border-[#334155]"></span>
            <span>Quarry Pit & Ore Horizon</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded bg-[#b45309]"></span>
            <span>High-Grade Ore (&gt;24% Mn)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded bg-[#b91c1c]"></span>
            <span>Core Intercept</span>
          </div>
          <div className="flex items-center space-x-1 text-stone-500 hidden lg:inline">
            <span>&bull; Drag: Orbit | Right-Drag: Pan | Wheel: Zoom</span>
          </div>
        </div>

        {/* Datum / Coordinates Stamp */}
        <div className="absolute bottom-3 right-3 z-20 bg-white/95 px-2.5 py-1 rounded-xl border border-stone-300/80 text-[9px] font-mono text-stone-600 backdrop-blur-md flex items-center space-x-2 shadow-md">
          <div className="w-3 h-3 flex items-center justify-center font-bold text-red-600 border border-red-400 rounded-full text-[7px]">
            N
          </div>
          <span>UTM Zone 44N &bull; WGS84</span>
        </div>

        {/* Direct DOM Hover Tooltip (Zero React re-render overhead) */}
        <div
          ref={tooltipRef}
          className="absolute top-0 left-0 z-40 pointer-events-none bg-white/98 border border-stone-300 rounded-xl p-2.5 shadow-xl text-xs font-mono backdrop-blur-md max-w-xs transition-opacity duration-75 opacity-0 text-stone-900"
          style={{ willChange: 'transform', display: 'none' }}
        >
          <div className="flex items-center space-x-1.5 border-b border-stone-200 pb-1 mb-1">
            <div ref={tooltipDotRef} className="w-2 h-2 rounded-full bg-amber-700" />
            <span ref={tooltipTitleRef} className="font-bold text-stone-900 text-xs" />
          </div>
          <div ref={tooltipSubtitleRef} className="text-[9px] text-stone-500 mb-1" />
          <div ref={tooltipMetricsRef} className="space-y-0.5 text-[10px]" />
        </div>
      </div>
    </div>
  );
};

export const Exploration3DViewer = React.memo(Exploration3DViewerComponent);
