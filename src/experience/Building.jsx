import React, { useMemo, useState } from 'react';
import { GET_STYLIZED_COLOR_FOR_LANG } from './Constants';
import IslandHouse from './IslandHouse';

export const Building = ({ repo, position, rotation, onHover, onUnhover }) => {
  const [hovered, setHovered] = useState(false);
  
  const roofColor = useMemo(() => GET_STYLIZED_COLOR_FOR_LANG(repo.language), [repo.language]);
  // Use a smaller scale mapping since IslandHouse geometry bounding is larger than the previous Building
  // Use a slightly larger scale as requested
  const scale = useMemo(() => 0.7 + (Math.log10(repo.stargazers_count + 1) * 0.15), [repo.stargazers_count]);

  return (
    <group 
      position={position} 
      rotation={rotation}
      // scale based on size + slight hover pop effect
      scale={hovered ? scale * 1.15 : scale}
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
      <IslandHouse roofColor={roofColor} />
    </group>
  );
};
