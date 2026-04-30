import React, { useMemo, useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { GET_STYLIZED_COLOR_FOR_LANG, ROOF_COLORS } from './Constants';
import GitVilleHouse from './GitVilleHouse';

export const Building = ({ repo, position, rotation, onHover, onUnhover, index = 0 }) => {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef();

  const roofColor = useMemo(
    () => GET_STYLIZED_COLOR_FOR_LANG(repo.language) || ROOF_COLORS[index % ROOF_COLORS.length],
    [repo.language, index]
  );

  const scale = useMemo(
    () => 0.75 + Math.log10(repo.stargazers_count + 2) * 0.12,
    [repo.stargazers_count]
  );

  // Smooth hover pop animation
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const target = hovered ? scale * 1.18 : scale;
    const cur = groupRef.current.scale.x;
    const next = cur + (target - cur) * Math.min(delta * 10, 1);
    groupRef.current.scale.set(next, next, next);
  });

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      scale={scale}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
        onHover && onHover();
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'default';
        onUnhover && onUnhover();
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
        console.log('Clicked on repo:', repo.name, repo.html_url);
        if (repo.html_url) {
          window.open(repo.html_url, '_blank', 'noopener,noreferrer');
        }
      }}
    >
      <GitVilleHouse
        roofColor={roofColor}
        style={index % 4}
      />
    </group>
  );
};
