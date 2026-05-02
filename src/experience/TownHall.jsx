import React from 'react';
import { PALETTE } from './Constants';

export const TownHall = ({ position = [0, 0, 0], scale = 1 }) => {
  return (
    <group position={position} scale={scale}>
      {/* FOUNDATION */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[6, 0.5, 6]} />
        <meshStandardMaterial color="#b1a7a7ff" />
      </mesh>

      {/* LOWER WALLS (Stone/Wood) */}
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[5.5, 2, 5.5]} />
        <meshStandardMaterial color="#97bbccff" />
      </mesh>

      {/* UPPER WALLS/TRIM */}
      <mesh position={[0, 3, 0]} castShadow receiveShadow>
        <boxGeometry args={[5.8, 1, 5.8]} />
        <meshStandardMaterial color="#b1a7a7ff" />
      </mesh>

      {/* ROOF (The Iconic Red CoC Roof) */}
      <group position={[0, 3.5, 0]}>
         {/* Main flat-ish roof part */}
         <mesh castShadow receiveShadow>
            <boxGeometry args={[6.2, 0.5, 6.2]} />
            <meshStandardMaterial color="#c0392b" />
         </mesh>
         {/* Sloped part */}
         <mesh position={[0, 0.5, 0]} rotation={[-Math.PI / 10, 0, 0]}>
            <boxGeometry args={[6.2, 0.2, 4]} />
            <meshStandardMaterial color="#e74c3c" />
         </mesh>
      </group>

      {/* DOORWAY */}
      <group position={[0, 1, 2.76]}>
         <mesh castShadow>
            <boxGeometry args={[1.5, 2, 0.2]} />
            <meshStandardMaterial color="#34495e" />
         </mesh>
         <mesh position={[0, 0, 0.11]}>
            <boxGeometry args={[1, 1.6, 0.05]} />
            <meshStandardMaterial color="#d35400" />
         </mesh>
      </group>

      {/* FLAGS / DECO */}
      <mesh position={[-2.5, 4, -2.5]} castShadow>
         <boxGeometry args={[0.2, 2, 0.2]} />
         <meshStandardMaterial color="#2d3436" />
      </mesh>
      <mesh position={[-2.2, 4.8, -2.5]} rotation={[0, 0.5, 0]}>
         <boxGeometry args={[0.8, 0.4, 0.05]} />
         <meshStandardMaterial color="#f1c40f" />
      </mesh>

      <mesh position={[2.5, 4, -2.5]} castShadow>
         <boxGeometry args={[0.2, 2, 0.2]} />
         <meshStandardMaterial color="#2d3436" />
      </mesh>
      <mesh position={[2.2, 4.8, -2.5]} rotation={[0, -0.5, 0]}>
         <boxGeometry args={[0.8, 0.4, 0.05]} />
         <meshStandardMaterial color="#f1c40f" />
      </mesh>

    </group>
  );
};
