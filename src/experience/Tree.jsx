import React, { useMemo } from 'react';
import { PALETTE } from './Constants';
import * as THREE from 'three';

export function Tree({ position }) {
  const type = useMemo(() => Math.random() > 0.5 ? 'cone' : 'sphere', []);
  const color = useMemo(() => PALETTE.autumn[Math.floor(Math.random() * PALETTE.autumn.length)], []);
  const height = useMemo(() => 1 + Math.random() * 1.5, []);

  return (
    <group position={position}>
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.15, 0.6, 6]} />
        <meshPhongMaterial color="#4e342e" flatShading />
      </mesh>
      
      {type === 'cone' ? (
        <mesh position={[0, 0.6 + height / 2, 0]} castShadow>
          <coneGeometry args={[0.6, height, 6]} />
          <meshPhongMaterial color={color} flatShading />
        </mesh>
      ) : (
        <mesh position={[0, 1, 0]} scale={[1, 1.2, 1]} castShadow>
          <sphereGeometry args={[0.5, 6, 6]} />
          <meshPhongMaterial color={color} flatShading />
        </mesh>
      )}
    </group>
  );
}
