import React, { useMemo } from 'react';
import { PALETTE } from './Constants';

export function Tree({ position }) {
  const height = useMemo(() => 1.2 + Math.random() * 0.8, []);
  const branchColor = useMemo(() => PALETTE.grass[Math.floor(Math.random() * PALETTE.grass.length)], []);

  return (
    <group position={position}>
      {/* Trunk */}
      <mesh position={[0, height / 4, 0]} castShadow>
        <boxGeometry args={[0.2, height / 2, 0.2]} />
        <meshStandardMaterial color={PALETTE.woodDark} roughness={0.9} />
      </mesh>
      
      {/* Leaves / Top */}
      <group position={[0, height / 2 + 0.3, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.8, 0.8, 0.8]} />
          <meshStandardMaterial color={branchColor} roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.4, 0]} scale={0.7} castShadow>
          <boxGeometry args={[0.8, 0.8, 0.8]} />
          <meshStandardMaterial color={branchColor} roughness={0.8} />
        </mesh>
      </group>
    </group>
  );
}
