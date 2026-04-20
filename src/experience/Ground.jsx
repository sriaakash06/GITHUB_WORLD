import React, { useMemo } from 'react';
import { PALETTE } from './Constants';

function RoadTile({ position, rotation = [0, 0, 0], scale = [1, 1, 1] }) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Road Base */}
      <mesh receiveShadow>
        <boxGeometry args={[4, 0.1, 4]} />
        <meshStandardMaterial color={PALETTE.road} />
      </mesh>
      {/* Dashed Line */}
      <mesh position={[0, 0.051, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.2, 2]} />
        <meshStandardMaterial color={PALETTE.roadLine} transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

export function Ground() {
  const size = 60; 
  const spacing = 4;

  const tiles = useMemo(() => {
    const result = [];
    for (let x = -size / 2; x < size / 2; x++) {
      for (let z = -size / 2; z < size / 2; z++) {
        // Simple checkerboard for grass variation
        const color = PALETTE.grass[(Math.abs(x + z)) % PALETTE.grass.length];
        
        // Predetermined road pattern (simple crosses)
        const isRoad = (x % 10 === 0 && x !== 0) || (z % 10 === 0 && z !== 0);
        
        result.push({
          x: x * spacing,
          z: z * spacing,
          color: color,
          isRoad: isRoad,
          isHorizontal: x % 10 === 0,
          isVertical: z % 10 === 0
        });
      }
    }
    return result;
  }, []);

  return (
    <group>
      {tiles.map((tile, i) => {
        if (tile.isRoad) {
           return (
             <RoadTile 
               key={i} 
               position={[tile.x, -0.05, tile.z]} 
               rotation={[0, tile.isHorizontal ? 0 : Math.PI / 2, 0]} 
             />
           );
        }
        return (
          <mesh key={i} position={[tile.x, -0.1, tile.z]} receiveShadow>
            <boxGeometry args={[spacing, 0.1, spacing]} />
            <meshStandardMaterial color={tile.color} roughness={0.9} />
          </mesh>
        );
      })}

      {/* Decorative borders/base */}
      <mesh position={[0, -1, 0]} receiveShadow>
         <boxGeometry args={[size * spacing + 2, 1, size * spacing + 2]} />
         <meshStandardMaterial color={PALETTE.grassDark} />
      </mesh>
    </group>
  );
}

