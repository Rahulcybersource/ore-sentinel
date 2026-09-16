import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Edges } from '@react-three/drei';
import * as THREE from 'three';
import { ChevronDown, Crosshair } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- DATA & MATERIALS --- //

const ORE_MATERIALS = {
  ferro: new THREE.MeshPhysicalMaterial({ color: '#10B981', emissive: '#059669', emissiveIntensity: 0.2, roughness: 0.4, metalness: 0.1 }),
  smgr: new THREE.MeshPhysicalMaterial({ color: '#F59E0B', emissive: '#D97706', emissiveIntensity: 0.2, roughness: 0.5, metalness: 0.1 }),
  bf: new THREE.MeshPhysicalMaterial({ color: '#D946EF', emissive: '#C026D3', emissiveIntensity: 0.1, roughness: 0.6, metalness: 0.1 }),
  host: new THREE.MeshPhysicalMaterial({ color: '#1E293B', transparent: true, opacity: 0.25, depthWrite: false, roughness: 0.8 })
};

// Generates a parametric U-shape syncline trough of voxels
function generateOreVoxels() {
  const voxels = [];
  const width = 100;
  const length = 100;
  const resolution = 2; // Step size
  
  for (let x = -width / 2; x < width / 2; x += resolution) {
    for (let y = -length / 2; y < length / 2; y += resolution) {
      // Base syncline depth equation (U-shape)
      const synclineZ = 0.02 * (x * x) - 40;
      
      // Random dispersion
      for (let i = 0; i < 3; i++) {
        const dispersionZ = (Math.random() - 0.5) * 15;
        const z = synclineZ + dispersionZ;
        
        if (z > 0 || z < -70) continue;
        
        let gradeType = 'bf';
        const depthTrue = z * 5; // Scale to real meters (e.g. -70 = -350m)
        
        if (depthTrue <= -120 && depthTrue >= -180 && Math.abs(x) < 20) {
          gradeType = 'ferro';
        } else if (depthTrue <= -80 && depthTrue >= -220 && Math.abs(x) < 35) {
          gradeType = 'smgr';
        }
        
        // Culling some points for performance & organic look
        if (Math.random() > 0.4) continue;
        
        voxels.push({ position: [x, z, y] as [number, number, number], type: gradeType });
      }
    }
  }
  return voxels;
}

const oreVoxels = generateOreVoxels();

// --- 3D COMPONENTS --- //

const InstancedOre = ({ depthLimit }: { depthLimit: number }) => {
  const ferroRef = useRef<THREE.InstancedMesh>(null);
  const smgrRef = useRef<THREE.InstancedMesh>(null);
  const bfRef = useRef<THREE.InstancedMesh>(null);
  
  const ferroData = useMemo(() => oreVoxels.filter(v => v.type === 'ferro'), []);
  const smgrData = useMemo(() => oreVoxels.filter(v => v.type === 'smgr'), []);
  const bfData = useMemo(() => oreVoxels.filter(v => v.type === 'bf'), []);
  
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(() => {
    // Update instances based on depthLimit slice
    const updateMesh = (ref: React.RefObject<THREE.InstancedMesh>, data: typeof oreVoxels) => {
      if (!ref.current) return;
      let count = 0;
      for (let i = 0; i < data.length; i++) {
        const { position } = data[i];
        if (position[1] >= -depthLimit / 5) { // Scale down from 350 to 70
          dummy.position.set(position[0], position[1], position[2]);
          dummy.scale.setScalar(1);
          dummy.updateMatrix();
          ref.current.setMatrixAt(count++, dummy.matrix);
        }
      }
      ref.current.count = count;
      ref.current.instanceMatrix.needsUpdate = true;
    };
    
    updateMesh(ferroRef, ferroData);
    updateMesh(smgrRef, smgrData);
    updateMesh(bfRef, bfData);
  });

  return (
    <>
      <instancedMesh ref={ferroRef} args={[undefined, undefined, ferroData.length]} material={ORE_MATERIALS.ferro}>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
      </instancedMesh>
      <instancedMesh ref={smgrRef} args={[undefined, undefined, smgrData.length]} material={ORE_MATERIALS.smgr}>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
      </instancedMesh>
      <instancedMesh ref={bfRef} args={[undefined, undefined, bfData.length]} material={ORE_MATERIALS.bf}>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
      </instancedMesh>
    </>
  );
};

const HostRockBlock = ({ depthLimit, explodedOffset }: { depthLimit: number, explodedOffset: number }) => {
  const depthZ = depthLimit / 5; // Max 70
  
  return (
    <group position={[0, -depthZ / 2 + explodedOffset, 0]}>
      <mesh material={ORE_MATERIALS.host}>
        <boxGeometry args={[100, depthZ, 100]} />
        <Edges scale={1} threshold={15} color="#334155" />
      </mesh>
      
      {/* Grid Lines on the side */}
      <mesh position={[-50.1, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[100, depthZ]} />
        <meshBasicMaterial color="#0ea5e9" wireframe opacity={0.1} transparent />
      </mesh>
      <mesh position={[0, 0, 50.1]}>
        <planeGeometry args={[100, depthZ]} />
        <meshBasicMaterial color="#0ea5e9" wireframe opacity={0.1} transparent />
      </mesh>
    </group>
  );
};

const SurfacePlane = ({ onClick, explodedOffset }: { onClick: (pt: THREE.Vector3) => void, explodedOffset: number }) => {
  return (
    <group position={[0, 0 + explodedOffset, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} onClick={(e) => onClick(e.point)}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#2d3748" roughness={0.9} />
        {/* Mock surface satellite imagery via simple grid for now */}
        <Edges scale={1} threshold={15} color="#4ade80" />
      </mesh>
      
      {/* Labels */}
      <Html position={[-30, 2, -30]} center className="pointer-events-none">
        <div className="bg-navy-950/80 border border-white/20 text-[8px] text-white px-2 py-1 rounded backdrop-blur whitespace-nowrap">
          BHARVELI MINE SITE (SURFACE)
          <div className="absolute top-full left-1/2 w-0.5 h-4 bg-white/50 -translate-x-1/2"></div>
        </div>
      </Html>
      <Html position={[30, 2, -10]} center className="pointer-events-none">
        <div className="text-[10px] text-white/70 font-bold whitespace-nowrap">VILLAGE</div>
      </Html>
    </group>
  );
};

const DrillCore = ({ point }: { point: THREE.Vector3 | null }) => {
  const ref = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (ref.current && point) {
      // Animate drill down
      const targetY = -35;
      ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, targetY, 0.05);
      ref.current.scale.y = THREE.MathUtils.lerp(ref.current.scale.y, 70, 0.05);
    }
  });

  if (!point) return null;

  return (
    <group position={[point.x, point.y, point.z]}>
      <mesh ref={ref} position={[0, 0, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 1, 16]} />
        <meshBasicMaterial color="#06B6D4" transparent opacity={0.8} />
      </mesh>
      {/* Laser ring effect */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1, 1.2, 32]} />
        <meshBasicMaterial color="#06B6D4" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

// --- MAIN UI COMPONENT --- //

export default function SubsurfaceBlockView() {
  const [depthLimit, setDepthLimit] = useState(350);
  const [exploded, setExploded] = useState(false);
  const [drillPoint, setDrillPoint] = useState<THREE.Vector3 | null>(null);
  const [interceptMsg, setInterceptMsg] = useState<{ depth: number, grade: string, xp: number } | null>(null);

  const handleSurfaceClick = (pt: THREE.Vector3) => {
    setDrillPoint(pt);
    setInterceptMsg(null);
    
    // Simulate drill intercept calculation after 1.5s
    setTimeout(() => {
      // Find closest voxel under the click (x, z)
      const xMatch = oreVoxels.filter(v => Math.abs(v.position[0] - pt.x) < 3 && Math.abs(v.position[2] - pt.z) < 3);
      let grade = "Barren Host Rock (<10% Mn)";
      let hitDepth = 250;
      let xp = 50;
      
      if (xMatch.length > 0) {
        // Grab the highest grade hit
        const hit = xMatch.reduce((prev, current) => {
          if (current.type === 'ferro') return current;
          if (current.type === 'smgr' && prev.type !== 'ferro') return current;
          return prev;
        });
        
        hitDepth = Math.abs(hit.position[1] * 5); // back to true meters
        if (hit.type === 'ferro') { grade = "47.8% Mn (Ferro Grade)"; xp = 500; }
        else if (hit.type === 'smgr') { grade = "36.2% Mn (SMGR Grade)"; xp = 250; }
        else if (hit.type === 'bf') { grade = "24.1% Mn (Low Grade)"; xp = 100; }
      }
      
      setInterceptMsg({ depth: Math.round(hitDepth), grade, xp });
    }, 1500);
  };

  return (
    <div className="relative w-full h-full bg-navy-950 overflow-hidden font-sans select-none">
      
      {/* 3D Canvas Viewport */}
      <div className="absolute inset-0 cursor-crosshair">
        <Canvas camera={{ position: [80, 60, 80], fov: 45 }}>
          <color attach="background" args={['#020617']} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[100, 100, 50]} intensity={1.5} />
          <directionalLight position={[-100, 50, -50]} intensity={0.5} color="#0ea5e9" />
          
          <OrbitControls 
            target={[0, -20, 0]} 
            maxPolarAngle={Math.PI / 2 - 0.05} // don't go below ground
            minDistance={30}
            maxDistance={200}
          />

          <group position={[0, 0, 0]}>
            {/* The raw Ore Voxels (Static inside space) */}
            <InstancedOre depthLimit={depthLimit} />
            
            {/* Exploding / Culling wrapper for host rock and surface */}
            <HostRockBlock depthLimit={depthLimit} explodedOffset={exploded ? 20 : 0} />
            <SurfacePlane onClick={handleSurfaceClick} explodedOffset={exploded ? 20 : 0} />
            
            {/* Drilling Interaction */}
            <DrillCore point={drillPoint} />
          </group>

        </Canvas>
      </div>

      {/* TOP BAR / NAVIGATION */}
      <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
        <div className="flex items-center justify-between px-5 py-3">
          <div className="pointer-events-auto flex items-center gap-2 bg-navy-900/80 backdrop-blur-md border border-white/10 rounded-lg px-4 py-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-sm font-medium text-slate-100 flex items-center gap-2">
              BALAGHAT MANGANESE MINE (BHARVELI, MP)
              <span className="text-lg leading-none">🇮🇳</span>
            </span>
          </div>
        </div>
      </div>

      {/* LEFT INTERACTIONS (Depth Slider & Explode) */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-6">
        {/* Exploded View Toggle */}
        <div 
          className={`pointer-events-auto flex flex-col items-center justify-center w-14 h-14 rounded-2xl cursor-pointer transition-all border shadow-lg ${exploded ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400' : 'bg-navy-900/80 border-white/10 text-slate-400 hover:text-white'}`}
          onClick={() => setExploded(!exploded)}
        >
          <Crosshair size={20} className={exploded ? 'animate-pulse' : ''} />
          <span className="text-[9px] font-bold mt-1">EXPLODE</span>
        </div>

        {/* Depth Slicer */}
        <div className="pointer-events-auto h-[300px] w-14 bg-navy-900/80 backdrop-blur-md border border-white/10 rounded-full flex flex-col items-center py-5 shadow-2xl">
          <span className="text-[10px] text-white/50 font-bold mb-2">0m</span>
          <div className="relative flex-1 w-full flex items-center justify-center">
            <input 
              type="range"
              min="0"
              max="350"
              value={depthLimit}
              onChange={(e) => setDepthLimit(parseInt(e.target.value))}
              className="absolute w-[200px] h-1 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 appearance-none bg-slate-700/50 rounded-full cursor-pointer hover:bg-slate-600 transition-colors [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(255,255,255,0.5)]"
            />
          </div>
          <span className="text-[10px] text-white/50 font-bold mt-2">-350m</span>
        </div>
      </div>

      {/* RIGHT HUD TACTICAL PANEL */}
      <div className="absolute right-6 top-20 z-10 w-72 space-y-4 pointer-events-auto">
        {/* Legend */}
        <div className="bg-navy-900/85 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-xl">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Legend</h3>
          <div className="space-y-2 text-[10px] font-medium text-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-emerald-500" /> High-grade Ferro {'>'}44% Mn
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-amber-500" /> Medium Grade SMGR 30%-43%
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-fuchsia-500" /> Low Grade Blast Furnace {'<'}30%
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-slate-700/50 border border-slate-500" /> Barren host rock
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-navy-900/85 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-xl text-xs font-mono text-slate-300 space-y-2">
          <div className="flex justify-between">
            <span>AVG Mn% @ -120m:</span>
            <span className="text-white font-bold">46.5%</span>
          </div>
          <div className="flex justify-between">
            <span>EST. RESERVES:</span>
            <span className="text-white font-bold">12.4M TONNES</span>
          </div>
          <div className="flex justify-between">
            <span>EST. RES. (2024):</span>
            <span className="text-white font-bold">11.5M TONNES</span>
          </div>
        </div>

        {/* Depth Profile Chart Stub */}
        <div className="bg-navy-900/85 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-xl h-40 flex items-center justify-center relative overflow-hidden">
          <div className="text-[10px] text-slate-500 absolute top-2 left-2">DEPTH vs GRADE</div>
          <div className="w-full h-full opacity-30 bg-gradient-to-t from-transparent via-emerald-500/20 to-transparent" />
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polyline points="0,90 20,70 40,20 60,15 80,40 100,80" fill="none" stroke="#10B981" strokeWidth="2" strokeDasharray="4 2" />
          </svg>
        </div>

        {/* Mini Locator */}
        <div className="bg-navy-900/85 backdrop-blur-md border border-white/10 rounded-xl h-32 relative overflow-hidden flex items-center justify-center">
           {/* Abstract India Map Shape */}
           <svg className="w-20 h-20 text-slate-600/50" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
           </svg>
           <div className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-cyan-400 -translate-x-1/2 -translate-y-[120%] animate-ping" />
           <div className="absolute top-1/2 left-1/2 w-3 h-3 rounded-sm border border-cyan-400 -translate-x-1/2 -translate-y-[120%]" />
        </div>
      </div>

      {/* DRILL HUD POPUP */}
      <AnimatePresence>
        {interceptMsg && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          >
            <div className="bg-navy-900/90 backdrop-blur-xl border border-cyan-500/50 rounded-2xl p-6 shadow-[0_0_30px_rgba(6,182,212,0.3)] text-center min-w-[300px]">
              <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest mb-1">Drill Intercept Complete</div>
              <div className="text-2xl font-black text-white mb-2">TARGET @ -{interceptMsg.depth}m</div>
              <div className="text-sm text-slate-300 font-mono mb-4">{interceptMsg.grade}</div>
              
              <div className="inline-block bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                +{interceptMsg.xp} XP
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
}
