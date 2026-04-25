import React from 'react';
import { PALETTE } from './Constants';

export const Tree = ({ position = [0, 0, 0], scale = 1 }) => {
  return (
    <group position={position} scale={scale}>
      {/* Trunk – orange, slightly tapered */}
      <mesh position={[0, 0.65, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.18, 0.26, 1.3, 7]} />
        <meshStandardMaterial color={PALETTE.trunk} roughness={0.9} flatShading />
      </mesh>

      {/* Main foliage sphere – round and fluffy */}
      <mesh position={[0, 1.9, 0]} castShadow>
        <sphereGeometry args={[0.82, 7, 7]} />
        <meshStandardMaterial color={PALETTE.foliage} roughness={0.85} flatShading />
      </mesh>

      {/* Upper smaller sphere for fluffy look */}
      <mesh position={[0.1, 2.55, 0.05]} castShadow>
        <sphereGeometry args={[0.52, 7, 7]} />
        <meshStandardMaterial color={PALETTE.foliageDark} roughness={0.85} flatShading />
      </mesh>

      {/* Side puff */}
      <mesh position={[-0.45, 2.1, 0.2]} castShadow>
        <sphereGeometry args={[0.42, 6, 6]} />
        <meshStandardMaterial color={PALETTE.foliage} roughness={0.85} flatShading />
      </mesh>
    </group>
  );
};
