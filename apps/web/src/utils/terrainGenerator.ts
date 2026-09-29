import * as THREE from 'three';

// Procedural multi-frequency Perlin/Simplex-style noise approximation
function pseudoNoise2D(x: number, y: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

function smoothNoise(x: number, y: number): number {
  const i = Math.floor(x);
  const j = Math.floor(y);
  const fx = x - i;
  const fy = y - j;

  // Hermite interpolation curve
  const u = fx * fx * (3.0 - 2.0 * fx);
  const v = fy * fy * (3.0 - 2.0 * fy);

  const n00 = pseudoNoise2D(i, j);
  const n10 = pseudoNoise2D(i + 1, j);
  const n01 = pseudoNoise2D(i, j + 1);
  const n11 = pseudoNoise2D(i + 1, j + 1);

  return (
    n00 * (1 - u) * (1 - v) +
    n10 * u * (1 - v) +
    n01 * (1 - u) * v +
    n11 * u * v
  );
}

function fbm(x: number, y: number, octaves = 4): number {
  let val = 0;
  let amp = 0.5;
  let freq = 1.0;
  for (let o = 0; o < octaves; o++) {
    val += smoothNoise(x * freq, y * freq) * amp;
    freq *= 2.1;
    amp *= 0.48;
  }
  return val;
}

/**
 * Generates a realistic Digital Elevation Model (DEM) geometry
 * matching the geology of the Sausar Manganese Belt in Central India
 * (steep strike ridges, terraced open-cast mining pits, haul ramps, and overburden dumps).
 */
export function generateRealisticTerrainGeometry(
  targetId: string,
  width = 280,
  height = 280,
  segments = 120
): { geometry: THREE.PlaneGeometry; pitCenter: { x: number; y: number } } {
  const geometry = new THREE.PlaneGeometry(width, height, segments, segments);
  const pos = geometry.attributes.position;

  // Target-specific pit and ridge parameters
  let pitRadiusX = 65;
  let pitRadiusY = 45;
  let maxPitDepth = 32;
  let ridgeAngle = 0.35; // ENE strike orientation
  let ridgeHeight = 26;
  let pitCenterX = 0;
  let pitCenterY = 5;

  if (targetId === 'T-07') {
    // Balaghat: massive main pit, deep working faces, high ridge behind
    pitRadiusX = 75;
    pitRadiusY = 50;
    maxPitDepth = 36;
    ridgeHeight = 30;
    pitCenterX = -5;
    pitCenterY = 0;
  } else if (targetId === 'T-18') {
    // Tirodi: undulating terrain, dual working pits, moderate depth
    pitRadiusX = 58;
    pitRadiusY = 42;
    maxPitDepth = 24;
    ridgeHeight = 20;
    pitCenterX = 10;
    pitCenterY = -8;
  } else if (targetId === 'T-12') {
    // Dongri Buzurg: high ridge opencast with peroxide deposit
    pitRadiusX = 80;
    pitRadiusY = 46;
    maxPitDepth = 38;
    ridgeHeight = 34;
    pitCenterX = 5;
    pitCenterY = 12;
  } else if (targetId === 'T-22') {
    // Ukwa: long strike cut, shallow dipping orebody
    pitRadiusX = 90;
    pitRadiusY = 32;
    maxPitDepth = 22;
    ridgeHeight = 18;
    pitCenterX = 0;
    pitCenterY = 0;
  }

  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i);
    const vy = pos.getY(i);

    // 1. Regional Satpura Range Topography (Folded syncline strike ridge)
    // Ridge aligned along ENE direction (vx * cos - vy * sin)
    const rotatedAlongStrike = vx * Math.cos(ridgeAngle) + vy * Math.sin(ridgeAngle);
    const rotatedAcrossStrike = -vx * Math.sin(ridgeAngle) + vy * Math.cos(ridgeAngle);

    // Asymmetric mountain ridge (steep scarp face on north, gentler dip slope on south)
    const ridgeProfile = Math.exp(-Math.pow((rotatedAcrossStrike + 30) / 45, 2)) * ridgeHeight;

    // Multi-scale natural terrain noise
    const noiseLarge = fbm(vx * 0.012 + 10, vy * 0.012 + 10, 3) * 16;
    const noiseDetail = fbm(vx * 0.035 + 20, vy * 0.035 + 20, 4) * 5;
    const noiseMicro = fbm(vx * 0.12, vy * 0.12, 2) * 1.5;

    let baseElevation = ridgeProfile + noiseLarge + noiseDetail + noiseMicro - 8;

    // 2. Open-Pit Quarry Excavation (Terraced benches & pit bowl)
    const dx = vx - pitCenterX;
    const dy = vy - pitCenterY;
    const distNorm = Math.sqrt(
      Math.pow(dx / pitRadiusX, 2) + Math.pow(dy / pitRadiusY, 2)
    );

    if (distNorm < 1.15) {
      // Inside or on pit perimeter
      const pitT = Math.min(1.0, distNorm);
      // Smooth bowl profile
      const rawExcavation = Math.cos(pitT * Math.PI * 0.5) * maxPitDepth;

      // Realistic Mining Benches (Stepped terraced ledges at ~7m intervals)
      // Stepped floor using quantizing function with smooth transitions
      const benchInterval = 6.5;
      const benchLevel = Math.floor(rawExcavation / benchInterval);
      const benchFraction = (rawExcavation % benchInterval) / benchInterval;
      // Steep bench batter (face angle ~70°) with flat safety berm
      const steepness = Math.pow(benchFraction, 2.8);
      const steppedExcavation = benchLevel * benchInterval + steepness * benchInterval;

      // Haul road ramp winding into pit
      const roadAngle = Math.atan2(dy, dx);
      const roadSpiral = (roadAngle + Math.PI) / (2 * Math.PI);
      const roadWidth = 8;
      const distFromRoadCenter = Math.abs(distNorm - (0.3 + roadSpiral * 0.65)) * pitRadiusX;
      let roadCut = 0;
      if (distFromRoadCenter < roadWidth) {
        roadCut = (1 - distFromRoadCenter / roadWidth) * 3.5;
      }

      // Blend base elevation with excavation
      baseElevation -= steppedExcavation + roadCut;
    }

    // 3. Overburden / Waste Rock Dump (Terraced spoil heaps on the flank)
    const dumpX = vx - (pitCenterX - 85);
    const dumpY = vy - (pitCenterY + 65);
    const distDump = Math.sqrt(dumpX * dumpX + dumpY * dumpY);
    if (distDump < 45) {
      const dumpT = 1 - distDump / 45;
      // Stepped spoil dump terrace
      const dumpHeight = Math.floor(dumpT * 3) * 6 + Math.pow(dumpT, 1.5) * 5;
      baseElevation += dumpHeight;
    }

    pos.setZ(i, baseElevation);
  }

  geometry.computeVertexNormals();
  return { geometry, pitCenter: { x: pitCenterX, y: pitCenterY } };
}

/**
 * Creates a photorealistic 2048x2048 satellite ortho-imagery texture
 * representing real-life Indian manganese mine landscapes:
 * - Dry deciduous forest and scrub canopy
 * - Terraced opencast quarry with exposed dark metallic braunite/pyrolusite ore
 * - Lateritic red-brown soils and weathered metamorphic schist
 * - Compacted gravel haul roads, safety berms, and drill pads
 * - Geological strike fault traces and geological contact boundaries
 */
export function generateRealisticSatelliteTexture(
  targetId: string,
  pitCenter = { x: 0, y: 0 }
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 2048;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const W = canvas.width;
  const H = canvas.height;

  // Scale: 280m terrain mapped to 2048px (approx 7.3 pixels per meter)
  const toCanvasX = (terrainX: number) => ((terrainX + 140) / 280) * W;
  const toCanvasY = (terrainY: number) => ((-terrainY + 140) / 280) * H; // Three.js Y is inverted on plane

  // 1. BASE TERRAIN: Laterite Red Soil & Metamorphic Bedrock
  // Natural gradient of weathered Sausar group lateritic crust
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0.0, '#3f4f34'); // Northern vegetated ridge slope
  bgGrad.addColorStop(0.3, '#5c4837'); // Weathered laterite plateau
  bgGrad.addColorStop(0.6, '#8b4b39'); // Rich red-brown ferric soil
  bgGrad.addColorStop(1.0, '#4a573a'); // Southern valley acacia scrub
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // 2. PROCEDURAL MULTI-OCTAVE SATELLITE NOISE & CANOPY TEXTURE
  const imgData = ctx.getImageData(0, 0, W, H);
  const data = imgData.data;

  // We add fine granular satellite noise across the terrain
  for (let y = 0; y < H; y += 4) {
    for (let x = 0; x < W; x += 4) {
      const nx = x / W;
      const ny = y / H;

      // Vegetation clustering noise
      const vegNoise = fbm(nx * 8, ny * 8, 3);
      const rockNoise = fbm(nx * 18 + 5, ny * 18 + 5, 2);
      const isVeg = vegNoise > 0.44;

      // Color selection per pixel block
      let r = 120;
      let g = 85;
      let b = 65;

      if (isVeg) {
        // Dry-deciduous forest green canopy
        const canopyVariation = (rockNoise - 0.5) * 40;
        r = Math.max(35, Math.min(85, 55 + canopyVariation * 0.4));
        g = Math.max(50, Math.min(105, 75 + canopyVariation * 0.6));
        b = Math.max(30, Math.min(75, 45 + canopyVariation * 0.3));
      } else {
        // Weathered reddish lateritic soil / weathered quartz-mica schist
        const soilVariation = (rockNoise - 0.5) * 35;
        r = Math.max(90, Math.min(165, 135 + soilVariation));
        g = Math.max(60, Math.min(125, 95 + soilVariation * 0.7));
        b = Math.max(45, Math.min(100, 75 + soilVariation * 0.5));
      }

      // Paint 4x4 block for performance
      for (let dy = 0; dy < 4 && y + dy < H; dy++) {
        for (let dx = 0; dx < 4 && x + dx < W; dx++) {
          const idx = ((y + dy) * W + (x + dx)) * 4;
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = 255;
        }
      }
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // 3. OVERBURDEN / WASTE ROCK DUMP (Step terraced spoil bank in Northwest)
  const dumpCenterX = toCanvasX(pitCenter.x - 85);
  const dumpCenterY = toCanvasY(pitCenter.y + 65);
  const dumpRadius = (45 / 280) * W;

  const dumpGrad = ctx.createRadialGradient(
    dumpCenterX,
    dumpCenterY,
    dumpRadius * 0.15,
    dumpCenterX,
    dumpCenterY,
    dumpRadius
  );
  dumpGrad.addColorStop(0.0, '#75685a');
  dumpGrad.addColorStop(0.4, '#877a6a');
  dumpGrad.addColorStop(0.7, '#635647');
  dumpGrad.addColorStop(1.0, 'transparent');
  ctx.fillStyle = dumpGrad;
  ctx.beginPath();
  ctx.arc(dumpCenterX, dumpCenterY, dumpRadius, 0, Math.PI * 2);
  ctx.fill();

  // Draw concentric spoil dump berm lines
  ctx.strokeStyle = '#4e4336';
  ctx.lineWidth = 4;
  for (let r = dumpRadius * 0.35; r < dumpRadius; r += dumpRadius * 0.25) {
    ctx.beginPath();
    ctx.arc(dumpCenterX, dumpCenterY, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 4. OPEN-CAST QUARRY PIT (Terraced Benches, Exposed Black Manganese Lode, Haul Roads)
  const pX = toCanvasX(pitCenter.x);
  const pY = toCanvasY(pitCenter.y);
  const rx = (75 / 280) * W;
  const ry = (50 / 280) * H;

  // Pit outer boundary shadow
  const pitGrad = ctx.createRadialGradient(pX, pY, rx * 0.1, pX, pY, rx);
  pitGrad.addColorStop(0.0, '#1c1f24'); // Deep pit floor (darkest manganese exposure)
  pitGrad.addColorStop(0.35, '#282f3a'); // Active working bench
  pitGrad.addColorStop(0.65, '#454a54'); // Mid bench
  pitGrad.addColorStop(0.85, '#6a6256'); // Top bench weathered rock
  pitGrad.addColorStop(1.0, '#9c6e54'); // Pit crest / safety berm
  ctx.fillStyle = pitGrad;

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(pX, pY, rx, ry, -0.22, 0, Math.PI * 2);
  ctx.fill();

  // Terraced mining bench lines (concentric elliptical rings)
  const benchCount = 6;
  for (let b = 1; b <= benchCount; b++) {
    const factor = b / benchCount;
    // Bench batter shadow (steep vertical face)
    ctx.strokeStyle = '#181b20';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.ellipse(pX, pY, rx * factor, ry * factor, -0.22, 0, Math.PI * 2);
    ctx.stroke();

    // Catch berm edge highlight (chalky crushed rock dust)
    ctx.strokeStyle = '#82807a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(pX, pY, rx * factor - 3, ry * factor - 2, -0.22, 0, Math.PI * 2);
    ctx.stroke();
  }

  // EXPOSED HIGH-GRADE MANGANESE ORE VEIN (Braunite / Psilomelane Seam)
  // Striking across the pit along Sausar formation line
  ctx.strokeStyle = '#121417'; // Lustrous sub-metallic black/charcoal
  ctx.lineWidth = 32;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(pX - rx * 0.95, pY + ry * 0.35);
  ctx.bezierCurveTo(
    pX - rx * 0.3,
    pY + ry * 0.1,
    pX + rx * 0.3,
    pY - ry * 0.1,
    pX + rx * 0.95,
    pY - ry * 0.35
  );
  ctx.stroke();

  // Secondary braunite veinlet with specular sparkle
  ctx.strokeStyle = '#272d38';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(pX - rx * 0.85, pY + ry * 0.45);
  ctx.bezierCurveTo(
    pX - rx * 0.2,
    pY + ry * 0.2,
    pX + rx * 0.4,
    pY - ry * 0.05,
    pX + rx * 0.85,
    pY - ry * 0.25
  );
  ctx.stroke();

  // 5. HAUL ROADS (Compacted tan gravel roads connecting pit benches to surface)
  ctx.strokeStyle = '#b8a992'; // Compacted surface gravel
  ctx.lineWidth = 16;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // Road 1: Main incline ramp descending into pit
  ctx.beginPath();
  ctx.moveTo(toCanvasX(-130), toCanvasY(20));
  ctx.bezierCurveTo(
    toCanvasX(-70),
    toCanvasY(25),
    toCanvasX(-45),
    toCanvasY(10),
    pX - rx * 0.7,
    pY + ry * 0.5
  );
  ctx.bezierCurveTo(
    pX,
    pY + ry * 0.8,
    pX + rx * 0.6,
    pY + ry * 0.3,
    pX + rx * 0.3,
    pY - ry * 0.1
  );
  ctx.bezierCurveTo(pX - rx * 0.2, pY - ry * 0.2, pX, pY, pX + 5, pY + 5);
  ctx.stroke();

  // Road wheel ruts (subtle twin dark lines)
  ctx.strokeStyle = '#8f816c';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Road 2: Overburden haul route
  ctx.strokeStyle = '#ad9e87';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(toCanvasX(-130), toCanvasY(20));
  ctx.bezierCurveTo(
    toCanvasX(-110),
    toCanvasY(50),
    toCanvasX(-95),
    toCanvasY(60),
    dumpCenterX,
    dumpCenterY
  );
  ctx.stroke();

  // 6. BOREHOLE DRILL PADS (Cleared bulldozed square pads with gravel fill)
  const drillPadPositions = [
    { x: -50, y: 35 },
    { x: 0, y: 40 },
    { x: 50, y: 30 },
    { x: -25, y: -40 },
    { x: 30, y: -35 },
    { x: 75, y: 5 },
  ];

  drillPadPositions.forEach((pad) => {
    const cx = toCanvasX(pad.x);
    const cy = toCanvasY(pad.y);
    const padSize = (14 / 280) * W;

    // Cleared pad gravel
    ctx.fillStyle = '#b0a088';
    ctx.fillRect(cx - padSize / 2, cy - padSize / 2, padSize, padSize);
    ctx.strokeStyle = '#5a4d3f';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - padSize / 2, cy - padSize / 2, padSize, padSize);

    // Collar borehole center mark
    ctx.fillStyle = '#0284c7'; // Cyan drill collar marker
    ctx.beginPath();
    ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Access track from main road to drill pad
    ctx.strokeStyle = '#a6967f';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + (Math.random() - 0.5) * 40, cy + 30);
    ctx.stroke();
  });

  // 7. EXPLORATION BASE CAMP / CORE SHED FOOTPRINT
  const campX = toCanvasX(-105);
  const campY = toCanvasY(-60);
  ctx.fillStyle = '#7a756b'; // Concrete pad
  ctx.fillRect(campX, campY, 45, 30);
  ctx.fillStyle = '#cbd5e1'; // Metal roof shine
  ctx.fillRect(campX + 4, campY + 4, 37, 22);

  // 8. SUBTLE GEOLOGICAL STRIKE LINES & TOPOGRAPHIC CONTOURS
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
  ctx.lineWidth = 1;
  ctx.setLineDash([8, 8]);
  for (let c = 100; c < W; c += 180) {
    ctx.beginPath();
    ctx.moveTo(0, c);
    ctx.bezierCurveTo(W * 0.3, c + 35, W * 0.7, c - 25, W, c + 15);
    ctx.stroke();
  }
  ctx.setLineDash([]); // reset

  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 8;
  return texture;
}

/**
 * Generates a realistic bump/normal texture for high-fidelity micro-relief,
 * rock fissures, and steep pit walls.
 */
export function generateRealisticBumpTexture(pitCenter = { x: 0, y: 0 }): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const W = canvas.width;
  const H = canvas.height;

  // Base neutral grey
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, W, H);

  const imgData = ctx.getImageData(0, 0, W, H);
  const data = imgData.data;

  for (let y = 0; y < H; y += 2) {
    for (let x = 0; x < W; x += 2) {
      const nx = x / W;
      const ny = y / H;
      const n1 = fbm(nx * 20, ny * 20, 3);
      const n2 = fbm(nx * 40 + 2, ny * 40 + 2, 2);
      const val = Math.floor(100 + (n1 * 0.7 + n2 * 0.3) * 110);

      for (let dy = 0; dy < 2 && y + dy < H; dy++) {
        for (let dx = 0; dx < 2 && x + dx < W; dx++) {
          const idx = ((y + dy) * W + (x + dx)) * 4;
          data[idx] = val;
          data[idx + 1] = val;
          data[idx + 2] = val;
          data[idx + 3] = 255;
        }
      }
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // Pit bench cliffs have sharp high-contrast normal steps
  const toCanvasX = (terrainX: number) => ((terrainX + 140) / 280) * W;
  const toCanvasY = (terrainY: number) => ((-terrainY + 140) / 280) * H;
  const pX = toCanvasX(pitCenter.x);
  const pY = toCanvasY(pitCenter.y);
  const rx = (75 / 280) * W;
  const ry = (50 / 280) * H;

  for (let b = 1; b <= 6; b++) {
    const factor = b / 6;
    ctx.strokeStyle = '#ffffff'; // Crest edge
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(pX, pY, rx * factor, ry * factor, -0.22, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#202020'; // Base shadow of bench
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(pX, pY, rx * factor - 3, ry * factor - 2, -0.22, 0, Math.PI * 2);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  return texture;
}

/**
 * Creates realistic 3D Diamond Drill Rig models (Collar mast, lattice derrick, engine shed)
 */
export function createRealisticDrillRigMesh(
  collarX: number,
  collarY: number,
  collarZ: number
): THREE.Group {
  const rigGroup = new THREE.Group();
  rigGroup.position.set(collarX, collarY, collarZ);

  // 1. Concrete / Timber Drill Pad Base
  const padGeo = new THREE.BoxGeometry(6, 0.4, 6);
  const padMat = new THREE.MeshStandardMaterial({
    color: 0x8b8579,
    roughness: 0.9,
  });
  const padMesh = new THREE.Mesh(padGeo, padMat);
  padMesh.position.y = 0.2;
  padMesh.receiveShadow = true;
  rigGroup.add(padMesh);

  // 2. Power Unit & Hydraulic Feed Skid
  const shedGeo = new THREE.BoxGeometry(2.4, 1.6, 3.2);
  const shedMat = new THREE.MeshStandardMaterial({
    color: 0x2563eb, // MOIL Industrial Blue
    roughness: 0.5,
    metalness: 0.4,
  });
  const shedMesh = new THREE.Mesh(shedGeo, shedMat);
  shedMesh.position.set(-1.2, 1.2, 0);
  shedMesh.castShadow = true;
  rigGroup.add(shedMesh);

  // 3. Drill Rig Derrick Mast (Angled lattice mast)
  const mastGeo = new THREE.CylinderGeometry(0.12, 0.4, 8, 4);
  const mastMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b, // High-visibility safety amber
    metalness: 0.7,
    roughness: 0.3,
  });
  const mastMesh = new THREE.Mesh(mastGeo, mastMat);
  mastMesh.position.set(1.0, 4.4, 0);
  mastMesh.rotation.z = -0.15; // Realistic 80° inclination angle
  mastMesh.castShadow = true;
  rigGroup.add(mastMesh);

  // Crown sheave on top
  const crownGeo = new THREE.SphereGeometry(0.35, 8, 8);
  const crownMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.5 });
  const crown = new THREE.Mesh(crownGeo, crownMat);
  crown.position.set(1.6, 8.2, 0);
  rigGroup.add(crown);

  // Core tube feed spindle
  const spindleGeo = new THREE.CylinderGeometry(0.08, 0.08, 3.5, 8);
  const spindleMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.1 });
  const spindle = new THREE.Mesh(spindleGeo, spindleMat);
  spindle.position.set(1.0, 2.0, 0);
  spindle.rotation.z = -0.15;
  rigGroup.add(spindle);

  return rigGroup;
}
