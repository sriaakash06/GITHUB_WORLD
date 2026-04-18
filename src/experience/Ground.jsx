import React, { useMemo } from 'react';
import { PALETTE } from './Constants';
import * as THREE from 'three';

export function Ground() {
  const size = 10;
  const spacing = 4;
  const roadWidth = 2;

  const tiles = useMemo(() => {
    const arr = [];
    for (let x = -size / 2; x < size / 2; x++) {
      for (let z = -size / 2; z < size / 2; z++) {
        const color = PALETTE.grass[Math.floor(Math.random() * PALETTE.grass.length)];
        arr.push({ x: x * spacing, z: z * spacing, color });
      }
    }
    return arr;
  }, []);

  return (
    <group>
      {tiles.map((tile, i) => (
        <mesh key={i} position={[tile.x, -0.25, tile.z]} receiveShadow>
          <boxGeometry args={[spacing - 0.2, 0.5, spacing - 0.2]} />
          <meshPhongMaterial color={tile.color} flatShading />
        </mesh>
      ))}

      {/* Roads */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} receiveShadow>
        <planeGeometry args={[size * spacing, roadWidth]} />
        <meshPhongMaterial color={PALETTE.road} flatShading />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[0, 0.06, 0]} receiveShadow>
        <planeGeometry args={[size * spacing, roadWidth]} />
        <meshPhongMaterial color={PALETTE.road} flatShading />
      </mesh>

      {/* Road Markings */}
      {Array.from({ length: size * 2 }).map((_, i) => (
        <React.Fragment key={i}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[i * 2 - (size * spacing / 2) + 0.5, 0.07, 0]}>
                <planeGeometry args={[0.8, 0.1]} />
                <meshBasicMaterial color={PALETTE.roadMark} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[0, 0.08, i * 2 - (size * spacing / 2) + 0.5]}>
                <planeGeometry args={[0.8, 0.1]} />
                <meshBasicMaterial color={PALETTE.roadMark} />
            </mesh>
        </React.Fragment>
      ))}
    </group>
  );
}
