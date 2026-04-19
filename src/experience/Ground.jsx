import React, { useMemo } from 'react';
import { PALETTE } from './Constants';

function Arch({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 1, 0]}>
        <torusGeometry args={[0.8, 0.2, 8, 16, Math.PI]} />
        <meshStandardMaterial color={PALETTE.stone} />
      </mesh>
      <mesh position={[-0.8, 0.5, 0]}>
        <boxGeometry args={[0.2, 1, 0.4]} />
        <meshStandardMaterial color={PALETTE.stone} />
      </mesh>
      <mesh position={[0.8, 0.5, 0]}>
        <boxGeometry args={[0.2, 1, 0.4]} />
        <meshStandardMaterial color={PALETTE.stone} />
      </mesh>
    </group>
  );
}

export function Ground() {
  const size = 24; // Increased size to fit more buildings
  const spacing = 4;

  const islandData = useMemo(() => {
    const tiles = [];
    for (let x = -size / 2; x < size / 2; x++) {
      for (let z = -size / 2; z < size / 2; z++) {
        const dist = Math.sqrt(x * x + z * z);
        if (dist < size * 0.5) {
            // Mountainous profile
            const normDist = dist / (size * 0.5);
            let baseHeight = 1;
            if (normDist < 0.2) baseHeight = 4;
            else if (normDist < 0.4) baseHeight = 2.5;
            else if (normDist < 0.7) baseHeight = 1.5;
            
            const randomVar = Math.random() * 0.4;
            const height = baseHeight + randomVar;
            const color = PALETTE.grass[Math.floor(Math.random() * PALETTE.grass.length)];
            tiles.push({ x: x * spacing, z: z * spacing, height, color });
        }
      }
    }
    return tiles;
  }, []);

  return (
    <group>
      {islandData.map((tile, i) => (
        <group key={i} position={[tile.x, (tile.height * 0.5) - 1, tile.z]}>
          <mesh position={[0, tile.height * 0.5, 0]} receiveShadow>
            <boxGeometry args={[spacing - 0.1, 0.2, spacing - 0.1]} />
            <meshStandardMaterial color={tile.color} roughness={0.8} />
          </mesh>
          <mesh position={[0, 0, 0]} receiveShadow>
            <boxGeometry args={[spacing - 0.1, tile.height, spacing - 0.1]} />
            <meshStandardMaterial color={PALETTE.stone} roughness={0.7} />
          </mesh>
          {tile.height > 2 && Math.random() > 0.8 && (
            <Arch position={[0, -0.5, spacing / 2]} rotation={[0, 0, 0]} />
          )}
        </group>
      ))}

      {/* Underwater Base */}
      <mesh position={[0, -5, 0]} receiveShadow>
         <cylinderGeometry args={[size * 1.8, size * 1.5, 6, 12]} />
         <meshStandardMaterial color={PALETTE.stoneDark} roughness={1} />
      </mesh>

      {/* Water Plane */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -2.5, 0]} receiveShadow>
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial color="#0a0a1f" transparent opacity={0.6} metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );
}
