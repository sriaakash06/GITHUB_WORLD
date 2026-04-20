import React, { useMemo, useState } from 'react';
import { PALETTE, GET_STYLIZED_COLOR_FOR_LANG } from './Constants';

export const Building = ({ repo, position, rotation, onHover, onUnhover }) => {
  const [hovered, setHovered] = useState(false);
  
  const roofColor = useMemo(() => GET_STYLIZED_COLOR_FOR_LANG(repo.language), [repo.language]);
  
  // Height variation
  const scale = useMemo(() => 0.8 + (Math.log10(repo.stargazers_count + 1) * 0.2), [repo.stargazers_count]);

  return (
    <group 
      position={position} 
      rotation={rotation}
      scale={hovered ? scale * 1.1 : scale}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        onHover();
      }}
      onPointerOut={() => {
        setHovered(false);
        onUnhover();
      }}
    >
      {/* Main Body (Walls) */}
      <mesh position={[0, 1, 0]} castShadow receiveShadow>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color={PALETTE.building} />
      </mesh>

      {/* Roof */}
      <mesh position={[0, 2.5, 0]} castShadow>
        <coneGeometry args={[1.8, 1.5, 4]} rotation={[0, Math.PI / 4, 0]} />
        <meshStandardMaterial color={roofColor} />
      </mesh>

      {/* Door */}
      <mesh position={[0, 0.5, 1.01]}>
        <boxGeometry args={[0.5, 0.8, 0.05]} />
        <meshStandardMaterial color={PALETTE.door} />
      </mesh>

      {/* Windows */}
      <mesh position={[-0.6, 1.2, 1.01]}>
        <boxGeometry args={[0.4, 0.4, 0.05]} />
        <meshStandardMaterial color={PALETTE.window} />
      </mesh>
      <mesh position={[0.6, 1.2, 1.01]}>
        <boxGeometry args={[0.4, 0.4, 0.05]} />
        <meshStandardMaterial color={PALETTE.window} />
      </mesh>

      {/* Chimney */}
      <mesh position={[0.6, 2.5, 0]} castShadow>
        <boxGeometry args={[0.3, 1, 0.3]} />
        <meshStandardMaterial color={PALETTE.roof} />
      </mesh>

      {/* Small detail on chimney */}
      <mesh position={[0.6, 3, 0]}>
        <boxGeometry args={[0.4, 0.1, 0.4]} />
        <meshStandardMaterial color={PALETTE.black} />
      </mesh>
    </group>
  );
};

