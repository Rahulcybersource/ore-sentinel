import React from 'react';

import type { ReserveCell } from '../data/types/models';

interface Props {
  grid: ReserveCell[];
  onCellClick: (cell: ReserveCell) => void;
  layers: { satellite: boolean; confidence: boolean; drilling: boolean };
}

export const ReserveHeatmap: React.FC<Props> = ({ grid, onCellClick, layers }) => {
  // We use instanced mesh or just map over boxes. For 100 cells, mapping is fine.
  
  return (
    <group>
      {grid.map((cell) => {
        // Map 10x10 grid to world coordinates (0-10)
        // Extract row and col from our mock data lat/lng pattern
        const x = (cell.lat - 21.8) / 0.005;
        const z = (cell.lng - 80.2) / 0.005;
        
        // Height based on probability
        const h = cell.probability * 2;
        
        // Color coding: green (teal) = high probability, amber/red = low
        let color = '#E03D00'; // Danger red-orange
        if (cell.probability > 0.7) color = '#00D9C0'; // Teal (high)
        else if (cell.probability > 0.4) color = '#FFB020'; // Amber (medium)

        // Visibility based on layers (for demo, if satellite is off, we hide the heatmap)
        if (!layers.satellite) return null;

        return (
          <mesh 
            key={cell.id} 
            position={[x, h / 2, z]}
            onClick={(e) => {
              e.stopPropagation();
              onCellClick(cell);
            }}
            onPointerOver={() => (document.body.style.cursor = 'pointer')}
            onPointerOut={() => (document.body.style.cursor = 'auto')}
          >
            <boxGeometry args={[0.9, h, 0.9]} />
            <meshStandardMaterial 
              color={color} 
              transparent 
              opacity={0.8}
            />
          </mesh>
        );
      })}
    </group>
  );
};

