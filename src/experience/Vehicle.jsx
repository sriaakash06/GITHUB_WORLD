import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function Vehicle({ isVertical }) {
  const meshRef = useRef();
  const colors = [0xff5252, 0x448aff, 0xffeb3b, 0x4caf50];
  const color = useMemo(() => colors[Math.floor(Math.random() * colors.length)], []);
  const speed = useMemo(() => (0.05 + Math.random() * 0.1) * (Math.random() > 0.5 ? 1 : -1), []);

  useFrame(() => {
    if (meshRef.current) {
        const dir = isVertical ? 'z' : 'x';
        meshRef.current.position[dir] += speed;
        if (meshRef.current.position[dir] > 25) meshRef.current.position[dir] = -25;
        if (meshRef.current.position[dir] < -25) meshRef.current.position[dir] = 25;
    }
  });

  return (
    <group 
        ref={meshRef} 
        rotation-y={isVertical ? Math.PI / 2 : 0}
        position={[
            isVertical ? 0 : (Math.random() - 0.5) * 40,
            0.1,
            isVertical ? (Math.random() - 0.5) * 40 : 0
        ]}
    >
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[0.8, 0.4, 0.4]} />
        <meshPhongMaterial color={color} flatShading />
      </mesh>
      <mesh position={[-0.1, 0.5, 0]} castShadow>
        <boxGeometry args={[0.4, 0.3, 0.35]} />
        <meshPhongMaterial color={color} flatShading />
      </mesh>

      {/* Wheels */}
      {[0, 1, 2, 3].map((i) => (
        <mesh 
            key={i} 
            rotation-x={Math.PI / 2} 
            position={[
                i < 2 ? 0.25 : -0.25,
                0.1,
                i % 2 === 0 ? 0.2 : -0.2
            ]}
        >
          <cylinderGeometry args={[0.1, 0.1, 0.1, 8]} />
          <meshBasicMaterial color="#222222" />
        </mesh>
      ))}
    </group>
  );
}
