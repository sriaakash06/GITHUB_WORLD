import React from 'react';
import { PALETTE } from './Constants';

export function OctocatPlaceholder({ position = [0, 5, 0], scale = 1.5 }) {
  return (
    <group position={position} scale={scale}>
      {/* Body */}
      <mesh position={[0, 1, 0]} castShadow>
        <boxGeometry args={[1.5, 1.8, 1.2]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>

      {/* Head */}
      <mesh position={[0, 2.5, 0]} castShadow>
        <boxGeometry args={[2, 1.6, 1.5]} />
        <meshStandardMaterial color="#222" />
      </mesh>

      {/* Face Plate */}
      <mesh position={[0, 2.5, 0.76]} castShadow>
        <boxGeometry args={[1.6, 1.2, 0.1]} />
        <meshStandardMaterial color="#f8d7b0" />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.4, 2.6, 0.82]}>
        <boxGeometry args={[0.2, 0.2, 0.1]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[0.4, 2.6, 0.82]}>
        <boxGeometry args={[0.2, 0.2, 0.1]} />
        <meshStandardMaterial color="#111" />
      </mesh>

      {/* Tentacles (Simplified as blocky limbs) */}
      {[0, 1, 2, 3, 4].map((i) => {
        const angle = (i / 5) * Math.PI * 2;
        return (
          <group key={i} rotation={[0, angle, 0]}>
            <mesh position={[0.8, -0.2, 0]} rotation={[0, 0, 0.5]} castShadow>
                <boxGeometry args={[0.4, 1.2, 0.4]} />
                <meshStandardMaterial color="#333" />
            </mesh>
          </group>
        );
      })}

      {/* Sparkles/Floating Stars */}
      {[...Array(5)].map((_, i) => (
        <mesh key={i} position={[
            Math.sin(i) * 2, 
            3 + Math.cos(i) * 1.5, 
            Math.cos(i) * 2
        ]}>
          <octahedronGeometry args={[0.1]} />
          <meshBasicMaterial color="#ffd700" />
        </mesh>
      ))}
    </group>
  );
}
