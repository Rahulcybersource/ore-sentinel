import React, { useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

export const SceneControls: React.FC = () => {
  const { camera } = useThree();
  
  // The target position for the camera to animate to
  const targetPos = new THREE.Vector3(12, 10, 15);

  useEffect(() => {
    // Start the camera high up, looking straight down
    camera.position.set(5, 50, 5);
  }, [camera]);

  useFrame(() => {
    // Smoothly lerp camera into the angled viewing position on load
    camera.position.lerp(targetPos, 0.02);
  });

  return (
    <OrbitControls 
      target={[5, 0, 5]} 
      maxPolarAngle={Math.PI / 2.1} 
      minDistance={5} 
      maxDistance={40} 
    />
  );
};
