import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { PALETTE, LANG_COLORS } from './Constants';
import * as THREE from 'three';
import gsap from 'gsap';

export function Building({ repo, position, onHover }) {
  const groupRef = useRef();
  const starRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  const height = useMemo(() => Math.log2((repo.commits || 10) + 1) * 2, [repo]);
  const width = useMemo(() => 1.5 + Math.random() * 0.5, []);
  const roofColor = LANG_COLORS[repo.language] || LANG_COLORS['Default'];

  // Animation on mount
  React.useEffect(() => {
    if (groupRef.current) {
      groupRef.current.scale.y = 0.01;
      gsap.to(groupRef.current.scale, {
        y: 1,
        duration: 1.5,
        delay: Math.random() * 2,
        ease: "elastic.out(1, 0.5)"
      });
    }
  }, []);

  useFrame((state) => {
    if (starRef.current) {
        starRef.current.rotation.y += 0.02;
        starRef.current.position.y = height + 1.6 + Math.sin(state.clock.getElapsedTime() * 2) * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Body */}
      <mesh 
        castShadow 
        receiveShadow 
        position={[0, height / 2, 0]}
        onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
            onHover(repo);
            document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
            setHovered(false);
            onHover(null);
            document.body.style.cursor = 'default';
        }}
        onClick={() => window.open(repo.html_url, '_blank')}
      >
        <boxGeometry args={[width, height, width]} />
        <meshPhongMaterial 
            color={PALETTE.building} 
            flatShading 
            emissive={hovered ? '#333333' : '#000000'}
        />
      </mesh>

      {/* Roof */}
      <mesh position={[0, height + 0.1, 0]}>
        <boxGeometry args={[width + 0.1, 0.2, width + 0.1]} />
        <meshPhongMaterial color={roofColor} flatShading />
      </mesh>

      {/* Spire/Star if high stars */}
      {repo.stargazers_count > 50 && (
        <group>
          <mesh position={[0, height + 0.6, 0]}>
            <coneGeometry args={[0.1, 1, 4]} />
            <meshPhongMaterial color={PALETTE.gold} flatShading />
          </mesh>
          <mesh position={[0, height + 1.1, 0]}>
            <sphereGeometry args={[0.15, 6, 6]} />
            <meshPhongMaterial color={PALETTE.gold} flatShading />
          </mesh>
          <mesh ref={starRef} position={[0, height + 1.6, 0]}>
            <octahedronGeometry args={[0.2, 0]} />
            <meshPhongMaterial color={PALETTE.gold} flatShading />
          </mesh>
        </group>
      )}

      {/* Windows could be added here as well, omitting for brevity in first pass but can add if requested */}
    </group>
  );
}
