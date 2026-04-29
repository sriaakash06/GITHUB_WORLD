import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { PALETTE } from './Constants';

export function Vehicle({ isVertical, offset, dir = 1 }) {
  const meshRef = useRef();
  const colors = [0xff5252, 0x448aff, 0xffeb3b, 0x4caf50, 0xff8f00];
  const color = useMemo(() => colors[Math.floor(Math.random() * colors.length)], []);
  const speed = useMemo(() => (0.04 + Math.random() * 0.06) * dir, [dir]);
  const startPos = useMemo(() => (Math.random() - 0.5) * 120, []);

  useFrame(() => {
    if (meshRef.current) {
        const moveDir = isVertical ? 'z' : 'x';
        meshRef.current.position[moveDir] += speed;
        if (meshRef.current.position[moveDir] > 60) meshRef.current.position[moveDir] = -60;
        if (meshRef.current.position[moveDir] < -60) meshRef.current.position[moveDir] = 60;
        
        // Add a slight bounce
        meshRef.current.position.y = 0.15 + Math.sin(Date.now() * 0.01) * 0.02;
    }
  });

  return (
    <group 
        ref={meshRef} 
        rotation-y={isVertical ? (dir > 0 ? 0 : Math.PI) : (dir > 0 ? -Math.PI / 2 : Math.PI / 2)}
        position={[
            isVertical ? offset : startPos,
            0.15,
            isVertical ? startPos : offset
        ]}
    >
      {/* Chassis */}
      <mesh castShadow>
        <boxGeometry args={[0.7, 0.4, 0.5]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.2} />
      </mesh>
      
      {/* Top / Cabin */}
      <mesh position={[-0.1, 0.35, 0]} castShadow>
        <boxGeometry args={[0.4, 0.3, 0.4]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>

      {/* Headlights */}
      <mesh position={[0.36, 0, 0.15]}>
        <boxGeometry args={[0.02, 0.1, 0.1]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2} />
      </mesh>
      <mesh position={[0.36, 0, -0.15]}>
        <boxGeometry args={[0.02, 0.1, 0.1]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2} />
      </mesh>

      {/* Wheels */}
      {[-0.2, 0.2].map((x) => 
        [-0.2, 0.2].map((z) => (
          <mesh 
            key={`${x}-${z}`} 
            position={[x, -0.2, z]} 
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.12, 0.12, 0.12, 8]} />
            <meshStandardMaterial color="#222222" roughness={0.9} />
          </mesh>
        ))
      )}
    </group>
  );
}
