import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';

export const TerrainMap: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Generate a basic procedural heightmap using vertex displacement
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(20, 20, 32, 32);
    geo.rotateX(-Math.PI / 2);
    
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      // Simple pseudo-random sine wave displacement for topography
      const y = Math.sin(x * 0.5) * Math.cos(z * 0.5) * 1.5 + Math.sin(x * 0.2) * 2;
      pos.setY(i, y);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <mesh ref={meshRef} geometry={geometry} position={[5, -1, 5]}>
      <meshStandardMaterial 
        color="#111C30" 
        wireframe={true} 
        transparent 
        opacity={0.3} 
      />
    </mesh>
  );
};
