import React, { useMemo, useState } from 'react';
import { PALETTE, GET_STYLIZED_COLOR_FOR_LANG } from './Constants';

export const Building = ({ repo, position, rotation, onHover, onUnhover }) => {
  const [hovered, setHovered] = useState(false);
  
  // Normalize color based on language
  const mainColor = useMemo(() => GET_STYLIZED_COLOR_FOR_LANG(repo.language), [repo.language]);
  
  // Height based on stars (logarithmic)
  const height = useMemo(() => Math.max(3, Math.log10(repo.stargazers_count + 1) * 4), [repo.stargazers_count]);
  
  // Number of windows based on height
  const windowsCount = Math.floor(height);

  return (
    <group 
      position={position} 
      rotation={rotation}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        onHover();
      }}
      onPointerOut={() => {
        setHovered(false);
        onUnhover();
      }}
      scale={hovered ? 1.05 : 1}
    >
      {/* Stone Foundation */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 1.2, 1.6]} />
        <meshStandardMaterial color={PALETTE.stone} />
      </mesh>

      {/* Main Building Body */}
      <mesh position={[0, height / 2 + 1, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.4, height, 1.4]} />
        <meshStandardMaterial color={PALETTE.building} roughness={0.6} />
      </mesh>

      {/* Windows Layer */}
      {[...Array(windowsCount)].map((_, i) => (
        <group key={i} position={[0, 2 + i * 1, 0]}>
          {/* Front Window */}
          <mesh position={[0, 0, 0.71]}>
            <planeGeometry args={[0.4, 0.5]} />
            <meshStandardMaterial color={PALETTE.window} emissive={PALETTE.window} emissiveIntensity={0.5} />
          </mesh>
          {/* Back Window */}
          <mesh position={[0, 0, -0.71]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[0.4, 0.5]} />
            <meshStandardMaterial color={PALETTE.window} emissive={PALETTE.window} emissiveIntensity={0.5} />
          </mesh>
        </group>
      ))}

      {/* Roof Base (Trim) */}
      <mesh position={[0, height + 1.1, 0]} castShadow>
        <boxGeometry args={[1.7, 0.3, 1.7]} />
        <meshStandardMaterial color={PALETTE.trim} />
      </mesh>

      {/* Sloped Roof */}
      <mesh position={[0, height + 1.8, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[1.5, 1.5, 4]} />
        <meshStandardMaterial color={mainColor} roughness={0.4} metalness={0.2} />
      </mesh>

      {/* Flag or Landmark for popular repos */}
      {repo.stargazers_count > 1000 && (
        <mesh position={[0, height + 2.8, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 1, 8]} />
          <meshStandardMaterial color={PALETTE.black} />
          <mesh position={[0.2, 0.4, 0]}>
            <boxGeometry args={[0.4, 0.3, 0.05]} />
            <meshStandardMaterial color={mainColor} />
          </mesh>
        </mesh>
      )}
    </group>
  );
};
