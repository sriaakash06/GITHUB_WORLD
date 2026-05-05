import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const Particles = ({ position, color, onComplete }) => {
  const groupRef = useRef();
  const [time, setTime] = useState(0);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < 25; i++) {
      temp.push({
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 15,
          Math.random() * 15 + 5,
          (Math.random() - 0.5) * 15
        ),
        scale: Math.random() * 0.4 + 0.2,
      });
    }
    return temp;
  }, []);

  useFrame((_, delta) => {
    setTime((t) => {
      const newTime = t + delta;
      if (newTime > 1.2 && onComplete) {
        onComplete();
      }
      return newTime;
    });
  });

  return (
    <group ref={groupRef} position={position}>
      {particles.map((p, i) => {
        const t = time;
        const currentPos = new THREE.Vector3(
          p.velocity.x * t,
          p.velocity.y * t - 0.5 * 35 * t * t, // gravity
          p.velocity.z * t
        );
        const currentScale = Math.max(0, p.scale * (1 - t / 1.2));

        return (
          <mesh key={i} position={currentPos} scale={currentScale} castShadow>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
          </mesh>
        );
      })}
    </group>
  );
};
