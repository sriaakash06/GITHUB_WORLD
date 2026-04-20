import React from 'react';
import { PALETTE } from './Constants';

export const Tree = ({ position, scale = 1 }) => {
  return (
    <group position={position} scale={scale}>
      {/* Trunk */}
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.3, 1.5, 8]} />
        <meshStandardMaterial color={PALETTE.wood} />
      </mesh>
      
      {/* Foliage Layers */}
      <mesh position={[0, 1.8, 0]} castShadow>
        <sphereGeometry args={[0.8, 12, 12]} />
        <meshStandardMaterial color={PALETTE.grass[Math.floor(Math.random() * PALETTE.grass.length)]} />
      </mesh>
      
      <mesh position={[0, 2.4, 0]} castShadow scale={0.7}>
        <sphereGeometry args={[0.8, 12, 12]} />
        <meshStandardMaterial color={PALETTE.grass[0]} />
      </mesh>
    </group>
  );
};
