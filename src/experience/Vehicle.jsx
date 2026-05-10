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
        
        let visX = logicalX;
        let visZ = logicalZ;

        // Roundabout logic: smoothly curve around the center
        const r = Math.sqrt(logicalX * logicalX + logicalZ * logicalZ);
        if (r < 18 && r > 0.1) {
            // at r = 18, targetR = 18
            // at r = 8 (closest straight pass), targetR = 15.5 (roundabout radius)
            const t = (18 - r) / (18 - 8);
            const targetR = 18 - t * (18 - 15.5);
            const scale = targetR / r;
            visX = logicalX * scale;
            visZ = logicalZ * scale;
        }

        // Add a slight bounce
        const visY = 0.15 + Math.sin(Date.now() * 0.01) * 0.02;

        let rotY = isVertical ? (dir > 0 ? 0 : Math.PI) : (dir > 0 ? -Math.PI / 2 : Math.PI / 2);
        
        if (prevPosRef.current) {
            const dx = visX - prevPosRef.current.x;
            const dz = visZ - prevPosRef.current.z;
            if (Math.abs(dx) > 0.0001 || Math.abs(dz) > 0.0001) {
                rotY = Math.atan2(dz, dx) - Math.PI / 2;
            } else {
                rotY = prevPosRef.current.rotY; // keep previous rotation if stopped
            }
        }
        
        meshRef.current.position.set(visX, visY, visZ);
        meshRef.current.rotation.y = rotY;
        
        prevPosRef.current = { x: visX, z: visZ, rotY };
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
