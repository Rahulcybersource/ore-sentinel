import { useState, useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { Crosshair, Award, Layers, Sparkles } from 'lucide-react';

// ─── TYPES ───────────────────────────────────────────────────────────────── //

interface VoxelData {
  x: number;
  y: number;
  z: number;
  depthM: number;
  grade: 'ferro' | 'smgr' | 'bf';
  mnPercent: number;
  color: THREE.Color;
}

interface InterceptData {
  depth: number;
  gradeLabel: string;
  mnPercent: number;
  xp: number;
}

// ─── PROCEDURAL SATELLITE TEXTURE ────────────────────────────────────────── //

function generateSatelliteTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Dark forest green terrain base
  ctx.fillStyle = '#1b2f1f';
  ctx.fillRect(0, 0, size, size);

  // Organic foliage variations
  const greens = ['#233c27', '#162819', '#2a482d', '#1f3522', '#142517'];
  for (let i = 0; i < 240; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 35 + 8;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = greens[Math.floor(Math.random() * greens.length)];
    ctx.fill();
  }

  // Reddish-brown open-pit quarry cut
  const cx = size * 0.52;
  const cy = size * 0.48;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.28);

  const pitTones = ['#54361e', '#654124', '#462b17', '#382111', '#28170b'];
  for (let step = 0; step < 5; step++) {
    ctx.beginPath();
    ctx.ellipse(0, 0, 115 - step * 18, 80 - step * 12, 0, 0, Math.PI * 2);
    ctx.fillStyle = pitTones[step % pitTones.length];
    ctx.fill();
    ctx.strokeStyle = '#825528';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  // Deepest pit crater center
  ctx.beginPath();
  ctx.ellipse(0, 0, 26, 17, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#120b06';
  ctx.fill();

  // Quarry haul tracks
  ctx.strokeStyle = '#9c8163';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(95, 0);
  ctx.lineTo(size * 0.44, -size * 0.35);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-80, 35);
  ctx.lineTo(-size * 0.42, size * 0.38);
  ctx.stroke();

  // Pit water sump
  ctx.beginPath();
  ctx.ellipse(50, 42, 18, 11, 0.4, 0, Math.PI * 2);
  ctx.fillStyle = '#1c3944';
  ctx.fill();

  ctx.restore();

  // Surface texture noise
  for (let i = 0; i < 3500; i++) {
    const nx = Math.random() * size;
    const ny = Math.random() * size;
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.1})`;
    ctx.fillRect(nx, ny, 2, 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// ─── COMPONENT ──────────────────────────────────────────────────────────── //

export default function SubsurfaceBlockView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webglError, setWebglError] = useState(false);
  const [depthLimit, setDepthLimit] = useState<number>(350);
  const [exploded, setExploded] = useState<boolean>(false);
  const [intercept, setIntercept] = useState<InterceptData | null>(null);

  // Dynamic references for render loop
  const depthLimitRef = useRef(depthLimit);
  depthLimitRef.current = depthLimit;

  const explodedRef = useRef(exploded);
  explodedRef.current = exploded;

  const voxelDataRef = useRef<VoxelData[]>([]);
  const instancedMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const topMeshRef = useRef<THREE.Mesh | null>(null);
  const drillLaserRef = useRef<THREE.Mesh | null>(null);

  // Handle drill intercept triggered by raycast or button
  const triggerDrillAt = useCallback((worldX: number, worldZ: number) => {
    const voxels = voxelDataRef.current;
    if (voxels.length === 0) return;

    // Find closest voxels horizontally
    const nearby = voxels.filter(v => Math.hypot(v.x - worldX, v.z - worldZ) < 5);
    let selected: VoxelData;

    if (nearby.length > 0) {
      selected = nearby.reduce((max, v) => (v.mnPercent > max.mnPercent ? v : max), nearby[0]);
    } else {
      selected = voxels[Math.floor(Math.random() * voxels.length)];
    }

    const depthInt = Math.round(selected.depthM);
    let gradeLabel = 'Low-grade Blast Furnace (<30% Mn)';
    let xp = 100;

    if (selected.grade === 'ferro') {
      gradeLabel = `${selected.mnPercent.toFixed(1)}% Mn (High-grade Ferro)`;
      xp = 500;
    } else if (selected.grade === 'smgr') {
      gradeLabel = `${selected.mnPercent.toFixed(1)}% Mn (Medium-grade SMGR)`;
      xp = 250;
    }

    if (drillLaserRef.current) {
      drillLaserRef.current.position.set(worldX, 0, worldZ);
      drillLaserRef.current.visible = true;
      drillLaserRef.current.scale.set(1, 1, 1);
    }

    setIntercept({
      depth: depthInt,
      gradeLabel,
      mnPercent: selected.mnPercent,
      xp
    });
  }, []);

  // ─── THREE.JS LIFECYCLE ───────────────────────────────────────────────── //

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationId = 0;
    let renderer: THREE.WebGLRenderer | null = null;

    try {
      const width = container.clientWidth || 800;
      const height = container.clientHeight || 600;

      // 1. Scene & Renderer
      const scene = new THREE.Scene();
      scene.background = null;

      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);

      // 2. Camera Setup (Isometric view of cutaway block)
      const camera = new THREE.PerspectiveCamera(42, width / height, 1, 1000);
      let radius = 100;
      let theta = 0.85; // Azimuth
      let phi = 0.95;   // Altitude
      const target = new THREE.Vector3(0, -18, 0);

      const updateCamera = () => {
        camera.position.x = target.x + radius * Math.sin(phi) * Math.sin(theta);
        camera.position.y = target.y + radius * Math.cos(phi);
        camera.position.z = target.z + radius * Math.sin(phi) * Math.cos(theta);
        camera.lookAt(target);
      };
      updateCamera();

      // 3. Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
      scene.add(ambientLight);

      const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
      dirLight.position.set(60, 80, 50);
      scene.add(dirLight);

      const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.4);
      fillLight.position.set(-50, 40, -40);
      scene.add(fillLight);

      const internalGlow = new THREE.PointLight(0x10b981, 0.6, 60);
      internalGlow.position.set(0, -20, 0);
      scene.add(internalGlow);

      // 4. Cutaway Bedrock Walls (Size: 60 x 60 horizontal, 40 vertical depth = 0 to -350m)
      const wallMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.85,
        metalness: 0.15,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
      });

      // BACK Wall (z = -30)
      const backWall = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), wallMat);
      backWall.position.set(0, -20, -30);
      scene.add(backWall);

      // LEFT Wall (x = -30)
      const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), wallMat);
      leftWall.rotation.y = Math.PI / 2;
      leftWall.position.set(-30, -20, 0);
      scene.add(leftWall);

      // BOTTOM Bedrock Floor (y = -40)
      const floorMat = new THREE.MeshStandardMaterial({
        color: 0x080e1a,
        roughness: 0.95
      });
      const bottomFloor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), floorMat);
      bottomFloor.rotation.x = -Math.PI / 2;
      bottomFloor.position.set(0, -40, 0);
      scene.add(bottomFloor);

      // Edge Depth Graduation Ticks (-50m, -100m, -150m, -200m, -300m, -350m)
      const tickDepths = [-50, -100, -150, -200, -300, -350];
      const linePositions: number[] = [];

      tickDepths.forEach(depthM => {
        const y = (depthM / 350) * 40; // negative
        // Back wall horizontal tick line
        linePositions.push(-30, y, -29.9, -22, y, -29.9);
        // Left wall horizontal tick line
        linePositions.push(-29.9, y, -30, -29.9, y, -22);
        // Corner front tick
        linePositions.push(-30, y, 30, -26, y, 30);
      });

      const tickGeo = new THREE.BufferGeometry();
      tickGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
      const tickMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
      const tickLines = new THREE.LineSegments(tickGeo, tickMat);
      scene.add(tickLines);

      // 5. Top Surface Plane with Procedural Satellite Texture
      const satTexture = generateSatelliteTexture();
      const topMat = new THREE.MeshStandardMaterial({
        map: satTexture,
        roughness: 0.8,
        metalness: 0.05
      });
      const topMesh = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), topMat);
      topMesh.rotation.x = -Math.PI / 2;
      topMesh.position.set(0, 0, 0);
      scene.add(topMesh);
      topMeshRef.current = topMesh;

      // Surface bounding wireframe
      const topOutlineGeo = new THREE.EdgesGeometry(new THREE.PlaneGeometry(60, 60));
      const topOutlineMat = new THREE.LineBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.4 });
      const topOutline = new THREE.LineSegments(topOutlineGeo, topOutlineMat);
      topMesh.add(topOutline);

      // 6. Drill Core Animated Laser
      const laserGeo = new THREE.CylinderGeometry(0.3, 0.3, 40, 16);
      const laserMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.75 });
      const drillLaser = new THREE.Mesh(laserGeo, laserMat);
      drillLaser.position.set(0, -20, 0);
      drillLaser.visible = false;
      scene.add(drillLaser);
      drillLaserRef.current = drillLaser;

      // 7. Dense Syncline Ore Body (1800 Voxels)
      const voxelCount = 1800;
      const boxGeo = new THREE.BoxGeometry(1.4, 1.4, 1.4);
      const voxelMat = new THREE.MeshStandardMaterial({
        roughness: 0.3,
        metalness: 0.15
      });

      const instancedMesh = new THREE.InstancedMesh(boxGeo, voxelMat, voxelCount);
      instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

      const ferroColor = new THREE.Color('#10b981');
      const smgrColor = new THREE.Color('#f59e0b');
      const bfColor = new THREE.Color('#d946ef');

      const voxels: VoxelData[] = [];
      const dummy = new THREE.Object3D();

      for (let i = 0; i < voxelCount; i++) {
        const x = (Math.random() - 0.5) * 50;
        const z = (Math.random() - 0.5) * 50;

        // U-trough syncline fold equation dipping between -100m and -250m
        const foldDepth = 115 + Math.pow(x / 14, 2) * 85 + Math.pow(z / 20, 2) * 20;
        const jitter = (Math.random() - 0.5) * 30;
        const depthM = Math.max(75, Math.min(335, foldDepth + jitter));
        const y = -(depthM / 350) * 40;

        let grade: 'ferro' | 'smgr' | 'bf';
        let color: THREE.Color;
        let mnPercent: number;

        const distFromAxis = Math.abs(depthM - foldDepth) + Math.abs(x) * 0.35;

        if (distFromAxis < 16 && depthM >= 95 && depthM <= 190) {
          grade = 'ferro';
          color = ferroColor;
          mnPercent = 44 + Math.random() * 8;
        } else if (distFromAxis < 32 && depthM >= 85 && depthM <= 240) {
          grade = 'smgr';
          color = smgrColor;
          mnPercent = 30 + Math.random() * 13;
        } else {
          grade = 'bf';
          color = bfColor;
          mnPercent = 15 + Math.random() * 14;
        }

        voxels.push({ x, y, z, depthM, grade, mnPercent, color });

        dummy.position.set(x, y, z);
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(i, dummy.matrix);
        instancedMesh.setColorAt(i, color);
      }

      instancedMesh.instanceMatrix.needsUpdate = true;
      if (instancedMesh.instanceColor) instancedMesh.instanceColor.needsUpdate = true;

      scene.add(instancedMesh);
      instancedMeshRef.current = instancedMesh;
      voxelDataRef.current = voxels;

      // 8. Pointer / Drag Controls (Built-in, zero addon dependency)
      let isDragging = false;
      let hasDragged = false;
      let prevMouseX = 0;
      let prevMouseY = 0;
      const raycaster = new THREE.Raycaster();
      const mouseVec = new THREE.Vector2();

      const onPointerDown = (e: PointerEvent) => {
        isDragging = true;
        hasDragged = false;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      };

      const onPointerMove = (e: PointerEvent) => {
        if (!isDragging) return;
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
          hasDragged = true;
        }

        if (e.buttons === 1) {
          // Orbit rotate
          theta -= deltaX * 0.007;
          phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.04, phi - deltaY * 0.007));
          updateCamera();
        } else if (e.buttons === 2) {
          // Pan
          target.y += deltaY * 0.05;
          updateCamera();
        }

        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      };

      const onPointerUp = (e: PointerEvent) => {
        if (!hasDragged && e.button === 0) {
          // Raycast click-to-drill on top surface
          const rect = renderer!.domElement.getBoundingClientRect();
          mouseVec.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          mouseVec.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

          raycaster.setFromCamera(mouseVec, camera);
          const intersects = raycaster.intersectObject(topMesh);

          if (intersects.length > 0) {
            triggerDrillAt(intersects[0].point.x, intersects[0].point.z);
          } else {
            // Default drill near center
            triggerDrillAt((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20);
          }
        }
        isDragging = false;
      };

      const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        radius = Math.max(35, Math.min(170, radius + e.deltaY * 0.06));
        updateCamera();
      };

      const onContextMenu = (e: MouseEvent) => e.preventDefault();

      const dom = renderer.domElement;
      dom.addEventListener('pointerdown', onPointerDown);
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      dom.addEventListener('wheel', onWheel, { passive: false });
      dom.addEventListener('contextmenu', onContextMenu);

      // 9. Resize Handling
      const handleResize = () => {
        if (!container || !renderer) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener('resize', handleResize);

      // 10. Animation Loop
      const dummyObj = new THREE.Object3D();
      let lastDepthLimit = 350;

      const animate = () => {
        animationId = requestAnimationFrame(animate);

        // Smoothly animate Top Surface Y when exploded
        const targetTopY = explodedRef.current ? 30 : 0;
        topMesh.position.y += (targetTopY - topMesh.position.y) * 0.08;

        // Dynamic depth slicing: scale voxels deeper than depthLimit to 0
        const currentDepthLimit = depthLimitRef.current;
        if (currentDepthLimit !== lastDepthLimit && instancedMesh) {
          lastDepthLimit = currentDepthLimit;
          const allVoxels = voxelDataRef.current;

          for (let i = 0; i < allVoxels.length; i++) {
            const v = allVoxels[i];
            if (v.depthM > currentDepthLimit) {
              dummyObj.position.set(v.x, v.y, v.z);
              dummyObj.scale.set(0, 0, 0);
            } else {
              dummyObj.position.set(v.x, v.y, v.z);
              dummyObj.scale.set(1, 1, 1);
            }
            dummyObj.updateMatrix();
            instancedMesh.setMatrixAt(i, dummyObj.matrix);
          }
          instancedMesh.instanceMatrix.needsUpdate = true;
        }

        renderer!.render(scene, camera);
      };

      animate();

      // Cleanup
      return () => {
        if (animationId) cancelAnimationFrame(animationId);
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);

        dom.removeEventListener('pointerdown', onPointerDown);
        dom.removeEventListener('wheel', onWheel);
        dom.removeEventListener('contextmenu', onContextMenu);

        if (container.contains(dom)) {
          container.removeChild(dom);
        }

        renderer?.dispose();
        satTexture.dispose();
        topMat.dispose();
        wallMat.dispose();
        floorMat.dispose();
        voxelMat.dispose();
        boxGeo.dispose();
        laserGeo.dispose();
        laserMat.dispose();
      };
    } catch (err) {
      console.error('Three.js Initialization failed:', err);
      setWebglError(true);
    }
  }, [triggerDrillAt]);

  return (
    <div className="relative w-full h-full min-h-[600px] bg-[#080d1a]/95 rounded-2xl overflow-hidden border border-cyan-500/30 flex">
      {/* Canvas Mount Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* WebGL Fallback (if initialization fails) */}
      {webglError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-center p-6">
          <Layers size={48} className="text-cyan-400 mb-3 animate-pulse" />
          <h3 className="text-lg font-bold text-white mb-1">Geological Cross-Section Model (SVG Mode)</h3>
          <p className="text-xs text-slate-400 max-w-md mb-4">
            WebGL acceleration fallback triggered. Displaying schematic U-trough syncline profile for Balaghat Bharveli Mine.
          </p>
          <div className="w-80 h-44 border border-cyan-500/40 rounded-xl bg-slate-900/80 p-3 relative overflow-hidden">
            <div className="text-[10px] text-cyan-400 font-mono">SYNCLINE AXIS (BHARVELI)</div>
            <svg className="w-full h-32" viewBox="0 0 200 100">
              <path d="M 10 20 Q 100 95 190 20 L 190 90 L 10 90 Z" fill="#0f172a" />
              <path d="M 25 25 Q 100 85 175 25" stroke="#d946ef" strokeWidth="6" fill="none" />
              <path d="M 40 32 Q 100 75 160 32" stroke="#f59e0b" strokeWidth="6" fill="none" />
              <path d="M 60 42 Q 100 68 140 42" stroke="#10b981" strokeWidth="8" fill="none" />
            </svg>
          </div>
        </div>
      )}

      {/* ── HUD OVERLAYS ── */}
      <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
        {/* Top Breadcrumb */}
        <div className="flex items-center justify-between">
          <div className="pointer-events-auto flex items-center gap-2.5 bg-slate-900/85 backdrop-blur-md border border-cyan-500/30 rounded-xl px-4 py-2.5 shadow-xl">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
            <span className="text-xs font-semibold tracking-wide text-slate-100 uppercase">
              BALAGHAT MANGANESE MINE (BHARVELI, MP) 🇮🇳 &mdash; CROSS-SECTION DEPTH MAP
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-cyan-400 bg-slate-900/70 border border-cyan-500/20 px-3 py-1.5 rounded-lg">
            <span>DRAG: ORBIT</span>
            <span className="text-slate-600">|</span>
            <span>SCROLL: ZOOM</span>
            <span className="text-slate-600">|</span>
            <span>CLICK: DRILL</span>
          </div>
        </div>

        {/* Middle Area: Left Controls & Right HUD */}
        <div className="flex justify-between items-center my-auto">
          {/* Left Controls: Explode & Depth Slicer */}
          <div className="flex flex-col gap-4">
            {/* Explode Toggle */}
            <button
              onClick={() => setExploded(prev => !prev)}
              className={`pointer-events-auto flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all border shadow-2xl ${
                exploded
                  ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                  : 'bg-slate-900/85 border-white/10 text-slate-400 hover:text-white hover:border-cyan-500/40'
              }`}
              title="Explode top terrain upwards"
            >
              <Crosshair size={20} className={exploded ? 'animate-spin' : ''} />
              <span className="text-[9px] font-bold mt-1 tracking-wider">EXPLODE</span>
            </button>

            {/* Vertical Depth Slicer */}
            <div className="pointer-events-auto h-[260px] w-14 bg-slate-900/85 backdrop-blur-md border border-cyan-500/30 rounded-2xl flex flex-col items-center py-4 shadow-2xl">
              <span className="text-[9px] font-mono text-cyan-400 font-bold mb-1">0m</span>
              <div className="relative flex-1 w-full flex items-center justify-center">
                <input
                  type="range"
                  min="0"
                  max="350"
                  value={depthLimit}
                  onChange={(e) => setDepthLimit(parseInt(e.target.value))}
                  className="absolute w-[180px] h-1.5 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 appearance-none bg-slate-700/60 rounded-full cursor-pointer hover:bg-slate-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_10px_#22d3ee]"
                />
              </div>
              <span className="text-[9px] font-mono text-cyan-400 font-bold mt-1">-{depthLimit}m</span>
              <span className="text-[8px] font-mono text-slate-400 tracking-tighter mt-1">DEPTH</span>
            </div>
          </div>

          {/* Right Tactical Panel */}
          <div className="w-64 space-y-3 pointer-events-auto">
            {/* Legend */}
            <div className="bg-slate-900/85 backdrop-blur-md border border-cyan-500/30 rounded-xl p-3 shadow-xl">
              <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Layers size={12} /> Ore Grade Horizon
              </div>
              <div className="space-y-1.5 text-[10px] font-medium text-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-[#10b981] shadow-[0_0_6px_#10b981]" />
                  <span>High-grade Ferro (&ge;44% Mn)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-[#f59e0b] shadow-[0_0_6px_#f59e0b]" />
                  <span>Medium-grade SMGR (30&ndash;43% Mn)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-[#d946ef] shadow-[0_0_6px_#d946ef]" />
                  <span>Low-grade BF (&lt;30% Mn)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-[#0f172a] border border-slate-600" />
                  <span className="text-slate-400">Barren host rock</span>
                </div>
              </div>
            </div>

            {/* Metrics Card */}
            <div className="bg-slate-900/85 backdrop-blur-md border border-cyan-500/30 rounded-xl p-3 shadow-xl text-xs font-mono text-slate-300 space-y-2">
              <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                <span className="text-[10px] text-slate-400">AVG Mn% @ -120m</span>
                <span className="text-cyan-300 font-bold">46.5%</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                <span className="text-[10px] text-slate-400">EST. RESERVES</span>
                <span className="text-emerald-400 font-bold">12.4M T</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-400">EST. RES. (2024)</span>
                <span className="text-white font-bold">11.5M T</span>
              </div>
            </div>

            {/* SVG Sparkline: Depth vs Grade Profile */}
            <div className="bg-slate-900/85 backdrop-blur-md border border-cyan-500/30 rounded-xl p-3 shadow-xl relative overflow-hidden">
              <div className="text-[9px] text-slate-400 uppercase font-mono mb-1">Depth vs Grade Profile</div>
              <svg className="w-full h-16" viewBox="0 0 100 45" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="gradeFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polygon points="0,42 15,36 30,22 45,8 60,6 75,18 90,34 100,40 100,45 0,45" fill="url(#gradeFill)" />
                <polyline points="0,42 15,36 30,22 45,8 60,6 75,18 90,34 100,40" fill="none" stroke="#10b981" strokeWidth="2" />
                <line x1="45" y1="0" x2="45" y2="45" stroke="#22d3ee" strokeDasharray="2 2" strokeWidth="0.8" opacity="0.6" />
                <circle cx="45" cy="8" r="2" fill="#22d3ee" />
              </svg>
              <div className="flex justify-between text-[8px] font-mono text-slate-500 mt-0.5">
                <span>0m</span>
                <span className="text-cyan-400">-120m (PEAK)</span>
                <span>-350m</span>
              </div>
            </div>
          </div>
        </div>

        {/* Drill Intercept HUD Notification Card */}
        {intercept && (
          <div className="mx-auto pointer-events-auto bg-slate-950/90 backdrop-blur-xl border border-cyan-500/60 rounded-2xl px-6 py-3.5 shadow-[0_0_25px_rgba(6,182,212,0.35)] flex items-center gap-4 transition-all">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <div>
              <div className="text-[10px] text-cyan-400 font-mono font-bold tracking-widest uppercase">
                Core Intercept @ -{intercept.depth}m
              </div>
              <div className="text-sm font-bold text-white">{intercept.gradeLabel}</div>
            </div>
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 text-xs font-extrabold px-3 py-1.5 rounded-lg shadow">
              <Award size={14} /> +{intercept.xp} XP
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
