import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { Crosshair } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── PROCEDURAL SATELLITE CANVAS TEXTURE ────────────────────────────────── //

function createSatelliteTexture(): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Base terrain (olive-brown earth)
  ctx.fillStyle = '#3B3424';
  ctx.fillRect(0, 0, size, size);

  // Random terrain patches (foliage, exposed soil, water)
  const rng = (min: number, max: number) => Math.random() * (max - min) + min;

  for (let i = 0; i < 600; i++) {
    const x = rng(0, size);
    const y = rng(0, size);
    const r = rng(4, 30);
    const colors = ['#2D4A2E', '#4A6741', '#5C4033', '#8B7355', '#6B4423', '#3A5F3A', '#2E4E2E'];
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
    ctx.fill();
  }

  // Open-cast pit scar (central reddish-brown crater)
  const cx = size / 2;
  const cy = size / 2;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 140, 100, -0.3, 0, Math.PI * 2);
  ctx.fillStyle = '#5C3A1E';
  ctx.fill();

  // Pit terraces (concentric rings)
  for (let ring = 0; ring < 5; ring++) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, 140 - ring * 22, 100 - ring * 16, -0.3, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(139, 90, 43, ${0.6 - ring * 0.1})`;
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // Deepest pit center (dark shadow)
  ctx.beginPath();
  ctx.ellipse(cx + 5, cy + 5, 35, 25, -0.3, 0, Math.PI * 2);
  ctx.fillStyle = '#1A0F08';
  ctx.fill();

  // Haul roads (light tan lines)
  ctx.strokeStyle = '#A0896C';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx + 140, cy);
  ctx.lineTo(size - 50, cy - 80);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - 50, cy + 100);
  ctx.lineTo(50, size - 100);
  ctx.stroke();

  // Pit pond (small blue patch)
  ctx.beginPath();
  ctx.ellipse(cx + 60, cy + 50, 18, 12, 0.5, 0, Math.PI * 2);
  ctx.fillStyle = '#1E3A5F';
  ctx.fill();

  // Noise grain overlay
  for (let i = 0; i < 8000; i++) {
    const nx = rng(0, size);
    const ny = rng(0, size);
    ctx.fillStyle = `rgba(${rng(0, 50)}, ${rng(0, 40)}, ${rng(0, 30)}, ${rng(0.02, 0.08)})`;
    ctx.fillRect(nx, ny, 2, 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// ─── ORE MATERIALS (shared, created once) ───────────────────────────────── //

const FERRO_MAT = new THREE.MeshPhysicalMaterial({
  color: 0x10B981, emissive: 0x059669, emissiveIntensity: 0.35,
  roughness: 0.35, metalness: 0.15,
});
const SMGR_MAT = new THREE.MeshPhysicalMaterial({
  color: 0xF59E0B, emissive: 0xD97706, emissiveIntensity: 0.25,
  roughness: 0.4, metalness: 0.1,
});
const BF_MAT = new THREE.MeshPhysicalMaterial({
  color: 0xD946EF, emissive: 0xA21CAF, emissiveIntensity: 0.2,
  roughness: 0.5, metalness: 0.1,
});

// ─── VOXEL GENERATION (syncline fold) ───────────────────────────────────── //

interface Voxel {
  x: number;
  y: number;
  z: number;
  grade: 'ferro' | 'smgr' | 'bf';
  mnPercent: number;
}

function generateSynclineVoxels(count: number): Voxel[] {
  const voxels: Voxel[] = [];
  let attempts = 0;

  while (voxels.length < count && attempts < 200000) {
    attempts++;
    const x = (Math.random() - 0.5) * 80; // ±40 units
    const y = (Math.random() - 0.5) * 80;

    // Parametric syncline fold equation
    const foldZ = -120 - Math.pow(x / 14, 2) * 8 - Math.pow(y / 18, 2) * 4;
    const dispersion = (Math.random() - 0.5) * 30;
    const z = foldZ + dispersion;

    // Reject points outside the block boundaries
    if (z > -20 || z < -300) continue;

    // Determine grade based on distance from fold axis
    const distFromCore = Math.abs(z - foldZ);
    let grade: 'ferro' | 'smgr' | 'bf';
    let mnPercent: number;

    if (distFromCore < 8) {
      grade = 'ferro';
      mnPercent = 44 + Math.random() * 8;
    } else if (distFromCore < 16) {
      grade = 'smgr';
      mnPercent = 30 + Math.random() * 13;
    } else {
      grade = 'bf';
      mnPercent = 12 + Math.random() * 17;
    }

    voxels.push({ x, y: z / 5, z: y, grade, mnPercent }); // y maps to vertical axis in Three.js
  }
  return voxels;
}

const ALL_VOXELS = generateSynclineVoxels(2800);

// ─── 3D SCENE COMPONENTS ────────────────────────────────────────────────── //

/** Instanced ore voxels with depth-slice filtering */
function OreBody({ depthLimit }: { depthLimit: number }) {
  const ferroRef = useRef<THREE.InstancedMesh>(null);
  const smgrRef = useRef<THREE.InstancedMesh>(null);
  const bfRef = useRef<THREE.InstancedMesh>(null);

  const ferroData = useMemo(() => ALL_VOXELS.filter(v => v.grade === 'ferro'), []);
  const smgrData = useMemo(() => ALL_VOXELS.filter(v => v.grade === 'smgr'), []);
  const bfData = useMemo(() => ALL_VOXELS.filter(v => v.grade === 'bf'), []);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const scaledLimit = depthLimit / 5; // 350 -> 70

  useFrame(() => {
    const update = (ref: React.RefObject<THREE.InstancedMesh | null>, data: Voxel[]) => {
      if (!ref.current) return;
      let count = 0;
      for (const v of data) {
        if (v.y >= -scaledLimit) {
          dummy.position.set(v.x, v.y, v.z);
          dummy.updateMatrix();
          ref.current.setMatrixAt(count++, dummy.matrix);
        }
      }
      ref.current.count = count;
      ref.current.instanceMatrix.needsUpdate = true;
    };

    update(ferroRef, ferroData);
    update(smgrRef, smgrData);
    update(bfRef, bfData);
  });

  const geo = useMemo(() => new THREE.BoxGeometry(1.8, 1.8, 1.8), []);

  return (
    <>
      <instancedMesh ref={ferroRef} args={[geo, FERRO_MAT, ferroData.length]} />
      <instancedMesh ref={smgrRef} args={[geo, SMGR_MAT, smgrData.length]} />
      <instancedMesh ref={bfRef} args={[geo, BF_MAT, bfData.length]} />
    </>
  );
}

/** Back + Bottom + Left bedrock walls (front and right are open for cutaway view) */
function BedrockWalls({ depthLimit }: { depthLimit: number }) {
  const h = depthLimit / 5;
  const wallMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x111827, side: THREE.DoubleSide, transparent: true, opacity: 0.85,
  }), []);
  const ghostMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x111827, side: THREE.DoubleSide, transparent: true, opacity: 0.08,
  }), []);
  const lineMat = useMemo(() => new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 }), []);

  const depthMarks = [-50, -100, -150, -200, -250, -300, -350];

  return (
    <group>
      {/* BACK wall (solid) */}
      <mesh position={[0, -h / 2, -50]} material={wallMat}>
        <planeGeometry args={[100, h]} />
      </mesh>
      {/* LEFT wall (solid) */}
      <mesh position={[-50, -h / 2, 0]} rotation={[0, Math.PI / 2, 0]} material={wallMat}>
        <planeGeometry args={[100, h]} />
      </mesh>
      {/* BOTTOM wall (solid) */}
      <mesh position={[0, -h, 0]} rotation={[Math.PI / 2, 0, 0]} material={wallMat}>
        <planeGeometry args={[100, 100]} />
      </mesh>

      {/* FRONT wall (ghost wireframe cutaway) */}
      <mesh position={[0, -h / 2, 50]} material={ghostMat}>
        <planeGeometry args={[100, h]} />
      </mesh>
      {/* RIGHT wall (ghost wireframe cutaway) */}
      <mesh position={[50, -h / 2, 0]} rotation={[0, -Math.PI / 2, 0]} material={ghostMat}>
        <planeGeometry args={[100, h]} />
      </mesh>

      {/* Depth graduation lines on the FRONT face */}
      {depthMarks.map(mark => {
        const localY = mark / 5; // e.g. -50m -> -10 units
        if (Math.abs(localY) > h) return null;
        return (
          <group key={`front-${mark}`}>
            <line_>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  array={new Float32Array([-50, localY, 50.05, 50, localY, 50.05])}
                  count={2}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color="#ffffff" transparent opacity={0.4} />
            </line_>
            <Text position={[48, localY + 1.2, 50.1]} fontSize={2} color="white" anchorX="right" fillOpacity={0.7}>
              {mark}m
            </Text>
          </group>
        );
      })}

      {/* Depth graduation lines on the RIGHT face */}
      {depthMarks.map(mark => {
        const localY = mark / 5;
        if (Math.abs(localY) > h) return null;
        return (
          <group key={`right-${mark}`}>
            <line_>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  array={new Float32Array([50.05, localY, -50, 50.05, localY, 50])}
                  count={2}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color="#ffffff" transparent opacity={0.4} />
            </line_>
            <Text position={[50.1, localY + 1.2, -48]} rotation={[0, -Math.PI / 2, 0]} fontSize={2} color="white" anchorX="left" fillOpacity={0.7}>
              {mark}m
            </Text>
          </group>
        );
      })}
    </group>
  );
}

/** Top terrain surface with procedural satellite texture */
function TerrainSurface({
  explodedOffset,
  onClick,
}: {
  explodedOffset: number;
  onClick: (pt: THREE.Vector3) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useMemo(() => createSatelliteTexture(), []);
  const targetY = useRef(0);

  useEffect(() => { targetY.current = explodedOffset; }, [explodedOffset]);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY.current, 0.06);
    }
  });

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      onClick={(e) => { e.stopPropagation(); onClick(e.point); }}
    >
      <planeGeometry args={[100, 100]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
}

/** Animated drill core laser */
function DrillLaser({ origin }: { origin: THREE.Vector3 | null }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (ref.current && origin) {
      ref.current.scale.y = THREE.MathUtils.lerp(ref.current.scale.y, 70, 0.04);
      ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, -35, 0.04);
    }
  });

  if (!origin) return null;

  return (
    <group position={[origin.x, origin.y, origin.z]}>
      <mesh ref={ref} position={[0, 0, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 1, 12]} />
        <meshBasicMaterial color="#06B6D4" transparent opacity={0.7} />
      </mesh>
      {/* Surface impact ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.8, 1.1, 24]} />
        <meshBasicMaterial color="#22D3EE" side={THREE.DoubleSide} transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

// ─── MAIN EXPORTED COMPONENT ────────────────────────────────────────────── //

export default function SubsurfaceBlockView() {
  const [depthLimit, setDepthLimit] = useState(350);
  const [exploded, setExploded] = useState(false);
  const [drillPoint, setDrillPoint] = useState<THREE.Vector3 | null>(null);
  const [intercept, setIntercept] = useState<{ depth: number; grade: string; xp: number } | null>(null);

  const handleDrill = useCallback((pt: THREE.Vector3) => {
    setDrillPoint(pt);
    setIntercept(null);

    setTimeout(() => {
      // Find closest voxel under click
      const hits = ALL_VOXELS.filter(v => Math.abs(v.x - pt.x) < 4 && Math.abs(v.z - pt.z) < 4);
      if (hits.length === 0) {
        setIntercept({ depth: 200, grade: 'Barren Host Rock (<10% Mn)', xp: 25 });
        return;
      }
      const best = hits.reduce((a, b) => (a.mnPercent > b.mnPercent ? a : b));
      const depthM = Math.round(Math.abs(best.y * 5));
      const gradeLabels: Record<string, string> = {
        ferro: `${best.mnPercent.toFixed(1)}% Mn (Ferro Grade)`,
        smgr: `${best.mnPercent.toFixed(1)}% Mn (SMGR Grade)`,
        bf: `${best.mnPercent.toFixed(1)}% Mn (Low Grade)`,
      };
      const xpMap: Record<string, number> = { ferro: 500, smgr: 250, bf: 100 };
      setIntercept({ depth: depthM, grade: gradeLabels[best.grade], xp: xpMap[best.grade] });
    }, 1400);
  }, []);

  return (
    <div className="relative w-full h-full bg-[#020617] overflow-hidden font-sans select-none">

      {/* ── THREE.JS CANVAS ── */}
      <div className="absolute inset-0 cursor-crosshair">
        <Canvas camera={{ position: [90, 50, 90], fov: 42 }} gl={{ antialias: true }}>
          <color attach="background" args={['#020617']} />
          <ambientLight intensity={0.6} />
          <directionalLight position={[80, 100, 60]} intensity={1.8} />
          <directionalLight position={[-60, 40, -40]} intensity={0.4} color="#38bdf8" />
          <pointLight position={[0, -30, 0]} intensity={0.3} color="#10B981" />

          <OrbitControls
            target={[0, -25, 0]}
            maxPolarAngle={Math.PI / 2 - 0.02}
            minDistance={40}
            maxDistance={220}
            enableDamping
            dampingFactor={0.08}
          />

          <OreBody depthLimit={depthLimit} />
          <BedrockWalls depthLimit={depthLimit} />
          <TerrainSurface explodedOffset={exploded ? 50 : 0} onClick={handleDrill} />
          <DrillLaser origin={drillPoint} />
        </Canvas>
      </div>

      {/* ── TOP BAR ── */}
      <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
        <div className="flex items-center px-5 py-3">
          <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-lg px-4 py-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-sm font-medium text-slate-100">
              BALAGHAT MANGANESE MINE (BHARVELI, MP) 🇮🇳
            </span>
          </div>
        </div>
      </div>

      {/* ── LEFT CONTROLS ── */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-6">
        {/* Explode Toggle */}
        <div
          className={`pointer-events-auto flex flex-col items-center justify-center w-14 h-14 rounded-2xl cursor-pointer transition-all border shadow-lg ${exploded ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400' : 'bg-slate-900/80 border-white/10 text-slate-400 hover:text-white'}`}
          onClick={() => setExploded(!exploded)}
        >
          <Crosshair size={20} className={exploded ? 'animate-pulse' : ''} />
          <span className="text-[9px] font-bold mt-1">EXPLODE</span>
        </div>

        {/* Depth Slicer */}
        <div className="pointer-events-auto h-[300px] w-14 bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-full flex flex-col items-center py-5 shadow-2xl">
          <span className="text-[10px] text-white/50 font-bold mb-2">0m</span>
          <div className="relative flex-1 w-full flex items-center justify-center">
            <input
              type="range"
              min="0"
              max="350"
              value={depthLimit}
              onChange={(e) => setDepthLimit(parseInt(e.target.value))}
              className="absolute w-[200px] h-1 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 appearance-none bg-slate-700/50 rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(255,255,255,0.5)]"
            />
          </div>
          <span className="text-[10px] text-white/50 font-bold mt-2">-350m</span>
        </div>
      </div>

      {/* ── RIGHT HUD ── */}
      <div className="absolute right-6 top-20 z-10 w-72 space-y-4 pointer-events-auto">
        {/* Legend */}
        <div className="bg-slate-900/85 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-xl">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Legend</h3>
          <div className="space-y-2 text-[10px] font-medium text-slate-200">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-emerald-500" /> High-grade Ferro {'>'}44% Mn</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-amber-500" /> Medium Grade SMGR 30%-43%</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-fuchsia-500" /> Low Grade Blast Furnace {'<'}30%</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-slate-700/50 border border-slate-500" /> Barren host rock</div>
          </div>
        </div>

        {/* Metrics */}
        <div className="bg-slate-900/85 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-xl text-xs font-mono text-slate-300 space-y-2">
          <div className="flex justify-between"><span>AVG Mn% @ -120m:</span><span className="text-white font-bold">46.5%</span></div>
          <div className="flex justify-between"><span>EST. RESERVES:</span><span className="text-white font-bold">12.4M TONNES</span></div>
          <div className="flex justify-between"><span>EST. RES. (2024):</span><span className="text-white font-bold">11.5M TONNES</span></div>
        </div>

        {/* Depth vs Grade Profile */}
        <div className="bg-slate-900/85 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-xl h-40 relative overflow-hidden">
          <div className="text-[10px] text-slate-500 absolute top-2 left-3 font-bold uppercase tracking-wider">Depth vs Grade</div>
          <svg className="absolute inset-0 w-full h-full pt-6" viewBox="0 0 100 80" preserveAspectRatio="none">
            <defs>
              <linearGradient id="gradeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polygon points="0,75 10,68 25,42 40,18 55,12 70,20 85,50 100,72 100,80 0,80" fill="url(#gradeGrad)" />
            <polyline points="0,75 10,68 25,42 40,18 55,12 70,20 85,50 100,72" fill="none" stroke="#10B981" strokeWidth="2" />
          </svg>
        </div>
      </div>

      {/* ── DRILL INTERCEPT POPUP ── */}
      <AnimatePresence>
        {intercept && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          >
            <div className="bg-slate-900/90 backdrop-blur-xl border border-cyan-500/50 rounded-2xl p-6 shadow-[0_0_30px_rgba(6,182,212,0.3)] text-center min-w-[300px]">
              <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest mb-1">Core Intercept Complete</div>
              <div className="text-2xl font-black text-white mb-2">CORE INTERCEPT @ -{intercept.depth}m</div>
              <div className="text-sm text-slate-300 font-mono mb-4">Assay: {intercept.grade}</div>
              <div className="inline-block bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                Drill Success: +{intercept.xp} XP
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
