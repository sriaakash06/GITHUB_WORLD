import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PALETTE } from './Constants';

export function Vehicle({ isVertical, dir = 1 }) {
  const meshRef = useRef();
  const { camera } = useThree();
  const colors = [0xff5252, 0x448aff, 0xffeb3b, 0x4caf50, 0xff8f00];
  const color = useMemo(() => colors[Math.floor(Math.random() * colors.length)], []);
  const speed = useMemo(() => (0.04 + Math.random() * 0.06) * dir, [dir]);
  
  const initialOffset = useMemo(() => {
    const cx = Math.floor((Math.random() - 0.5) * 10);
    return cx * 16 + 8 + (dir > 0 ? 1 : -1); 
  }, [dir]);
  
  const initialPos = useMemo(() => (Math.random() - 0.5) * 120, []);

  const progressRef = useRef(initialPos);
  const laneRef = useRef(initialOffset);
  const prevPosRef = useRef(null);

  useFrame(() => {
    if (meshRef.current && camera) {
        const moveDir = isVertical ? 'z' : 'x';
        const otherDir = isVertical ? 'x' : 'z';

        progressRef.current += speed;
        
        const limit = 100;
        if (progressRef.current > camera.position[moveDir] + limit) {
          progressRef.current = camera.position[moveDir] - limit;
          const chunk = Math.round(camera.position[otherDir] / 16);
          const randomLane = chunk + Math.floor((Math.random() - 0.5) * 10);
          laneRef.current = randomLane * 16 + 8 + (dir > 0 ? 1 : -1);
        }
        if (progressRef.current < camera.position[moveDir] - limit) {
          progressRef.current = camera.position[moveDir] + limit;
          const chunk = Math.round(camera.position[otherDir] / 16);
          const randomLane = chunk + Math.floor((Math.random() - 0.5) * 10);
          laneRef.current = randomLane * 16 + 8 + (dir > 0 ? 1 : -1);
        }
        
        let logicalX = isVertical ? laneRef.current : progressRef.current;
        let logicalZ = isVertical ? progressRef.current : laneRef.current;
        
        // Add a slight bounce
        meshRef.current.position.y = 0.15 + Math.sin(Date.now() * 0.01) * 0.02;

        let rotY = isVertical ? (dir > 0 ? 0 : Math.PI) : (dir > 0 ? -Math.PI / 2 : Math.PI / 2);
        
        meshRef.current.position.set(logicalX, meshRef.current.position.y, logicalZ);
        meshRef.current.rotation.y = rotY;
    }
  });

  return (
    <group ref={meshRef}>
      <mesh castShadow>
        <boxGeometry args={[0.7, 0.4, 0.5]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.2} />
      </mesh>
      
      <mesh position={[-0.1, 0.35, 0]} castShadow>
        <boxGeometry args={[0.4, 0.3, 0.4]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>

      <mesh position={[0.36, 0, 0.15]}>
        <boxGeometry args={[0.02, 0.1, 0.1]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2} />
      </mesh>
      <mesh position={[0.36, 0, -0.15]}>
        <boxGeometry args={[0.02, 0.1, 0.1]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2} />
      </mesh>

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
