import React, { useMemo, useState } from 'react';
import { PALETTE, GET_STYLIZED_COLOR_FOR_LANG } from './Constants';

export const Building = ({ repo, position, rotation, onHover, onUnhover }) => {
  const [hovered, setHovered] = useState(false);
  
  const roofColor = useMemo(() => GET_STYLIZED_COLOR_FOR_LANG(repo.language), [repo.language]);
  const scale = useMemo(() => 0.5 + (Math.log10(repo.stargazers_count + 1) * 0.1), [repo.stargazers_count]);

  return (
    <group 
      position={position} 
      rotation={rotation}
      scale={hovered ? scale * 1.2 : scale}
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
      {/* MAIN BODY */}
      <mesh position={[0, 1.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[2, 2.5, 2.5]} />
        <meshStandardMaterial color={PALETTE.building} />
      </mesh>

      {/* ROOF */}
      <group position={[0, 2.5, 0]}>
         <mesh rotation={[0, 0, Math.PI / 4]} position={[-0.8, 0.6, 0]} castShadow>
            <boxGeometry args={[0.1, 2.5, 2.8]} />
            <meshStandardMaterial color={roofColor} />
         </mesh>
         <mesh rotation={[0, 0, -Math.PI / 4]} position={[0.7, 0.6, 0]} castShadow>
            <boxGeometry args={[0.1, 2.5, 2.8]} />
            <meshStandardMaterial color={roofColor} />
         </mesh>
      </group>

      {/* WINDOW */}
      <mesh position={[0, 1.5, 1.26]}>
        <boxGeometry args={[0.8, 0.8, 0.1]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* Flower Box */}
      <mesh position={[0, 0.8, 1.3]}>
        <boxGeometry args={[1, 0.2, 0.2]} />
        <meshStandardMaterial color="#556b2f" />
      </mesh>
    </group>
  );
};



