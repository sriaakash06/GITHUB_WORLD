import React from 'react';
import * as THREE from 'three';

export const RealisticHouse = ({ position = [0, 0, 0], scale = 1 }) => {
  return (
    <group position={position} scale={scale}>
      {/* GROUND PLATEAU (ISOMETRIC BASE) */}
      <mesh position={[0, -0.15, 0]} receiveShadow>
        <boxGeometry args={[16, 0.3, 16]} />
        <meshStandardMaterial color="#111" roughness={1} />
      </mesh>

      {/* LANDSCAPING / GRASS AREA */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[14, 0.4, 14]} />
        <meshStandardMaterial color="#1a251a" roughness={1} />
      </mesh>

      {/* PATHWAY */}
      <mesh position={[1, -0.04, 6]} receiveShadow>
        <boxGeometry args={[2, 0.41, 4]} />
        <meshStandardMaterial color="#333" roughness={0.9} />
      </mesh>

      {/* MAIN HOUSE STRUCTURE - LOWER FLOOR (Charcoal) */}
      <mesh position={[-1, 1, 0]} castShadow receiveShadow>
        <boxGeometry args={[7, 2.1, 9]} />
        <meshStandardMaterial color="#1a1c22" roughness={0.8} />
      </mesh>

      {/* UPPER FLOOR (Light Grey/White) */}
      <mesh position={[-0.5, 3.1, 1]} castShadow receiveShadow>
        <boxGeometry args={[6, 2.1, 7]} />
        <meshStandardMaterial color="#d1d5db" roughness={0.4} />
      </mesh>

      {/* CHIMNEY */}
      <mesh position={[-2.5, 4.5, -2]} castShadow receiveShadow>
        <boxGeometry args={[1, 3, 1]} />
        <meshStandardMaterial color="#2d3436" />
      </mesh>

      {/* ROOF - Gabled style */}
      <group position={[-0.5, 4.2, 1]}>
        {/* Left Slope */}
        <mesh position={[-1.7, 0.6, 0]} rotation={[0, 0, Math.PI / 3.5]} castShadow>
          <boxGeometry args={[5, 0.3, 7.5]} />
          <meshStandardMaterial color="#2c3e50" roughness={0.5} />
        </mesh>
        {/* Right Slope */}
        <mesh position={[1.7, 0.6, 0]} rotation={[0, 0, -Math.PI / 3.5]} castShadow>
          <boxGeometry args={[5, 0.3, 7.5]} />
          <meshStandardMaterial color="#2c3e50" roughness={0.5} />
        </mesh>
      </group>

      {/* GARAGE / FRONT PORCH AREA */}
      <mesh position={[3.5, 1, 3]} castShadow receiveShadow>
        <boxGeometry args={[4, 2, 5]} />
        <meshStandardMaterial color="#34495e" roughness={0.8} />
      </mesh>
      {/* Porch Roof */}
      <mesh position={[3.5, 2.1, 3]}>
        <boxGeometry args={[4.2, 0.2, 5.2]} />
        <meshStandardMaterial color="#2c3e50" />
      </mesh>

      {/* WINDOWS WITH GLOW */}
      {/* Front Windows Lower */}
      <mesh position={[-1.5, 1.2, 4.51]}>
        <boxGeometry args={[2, 1, 0.1]} />
        <meshStandardMaterial color="#fff" emissive="#ffc300" emissiveIntensity={3} />
      </mesh>
      {/* Front Windows Upper */}
      <mesh position={[-0.5, 3.2, 4.51]}>
        <boxGeometry args={[3, 1, 0.1]} />
        <meshStandardMaterial color="#fff" emissive="#ffc300" emissiveIntensity={2} />
      </mesh>

      {/* SIDE LIGHTS */}
      <mesh position={[5.52, 1.2, 3]}>
        <boxGeometry args={[0.05, 1, 3]} />
        <meshStandardMaterial color="#fff" emissive="#ffaa00" emissiveIntensity={4} />
      </mesh>

      {/* BALCONY */}
      <group position={[3.5, 2.2, 1]}>
         <mesh position={[0, 0, 0]} receiveShadow>
            <boxGeometry args={[3, 0.1, 6]} />
            <meshStandardMaterial color="#111" />
         </mesh>
         <mesh position={[1.4, 0.4, 0]}>
            <boxGeometry args={[0.1, 0.8, 6]} />
            <meshStandardMaterial color="#444" />
         </mesh>
         <mesh position={[-1.4, 0.4, 0]}>
            <boxGeometry args={[0.1, 0.8, 6]} />
            <meshStandardMaterial color="#444" />
         </mesh>
      </group>

      {/* LIGHT POOLS ON GROUND */}
      {/* Near main windows */}
      <mesh position={[-1.5, -0.04, 5.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6, 4]} />
        <meshStandardMaterial color="#ffaa00" transparent opacity={0.15} />
      </mesh>
      {/* Near car */}
      <mesh position={[5.5, -0.04, 7]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4, 4]} />
        <meshStandardMaterial color="#fff" transparent opacity={0.1} />
      </mesh>

      {/* LIGHTS (WARM GLOW ON WALLS) */}
      <pointLight position={[1, 1, 5]} intensity={3} distance={10} color="#ffaa00" />
      <pointLight position={[-1, 3, 5]} intensity={2} distance={8} color="#ffaa00" />
      <pointLight position={[5, 1, 5]} intensity={2} distance={10} color="#ffaa00" />

      
      {/* CAR */}
      <group position={[5.5, 0.25, 6]} rotation={[0, -Math.PI / 12, 0]}>
         <mesh castShadow>
            <boxGeometry args={[1.5, 0.5, 3]} />
            <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
         </mesh>
         <mesh position={[0, 0.5, -0.2]} castShadow>
            <boxGeometry args={[1.2, 0.4, 1.5]} />
            <meshStandardMaterial color="#111" roughness={0.2} />
         </mesh>
         {/* Headlights */}
         <mesh position={[0.5, 0, 1.51]}>
            <boxGeometry args={[0.3, 0.15, 0.05]} />
            <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={10} />
         </mesh>
         <mesh position={[-0.5, 0, 1.51]}>
            <boxGeometry args={[0.3, 0.15, 0.05]} />
            <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={10} />
         </mesh>
      </group>

      {/* CYPRESS TREES */}
      <Cypress position={[10, 0, 0]} scale={2.5} />
      <Cypress position={[10, 0, 3]} scale={3} />
      <Cypress position={[10, 0, -3]} scale={2} />
      <Cypress position={[-10, 0, 2]} scale={2.2} />
      <Cypress position={[-10, 0, -2]} scale={2.8} />

    </group>
  );
};

const Cypress = ({ position, scale }) => (
  <group position={position} scale={scale}>
    <mesh position={[0, 0.5, 0]} castShadow>
      <cylinderGeometry args={[0.05, 0.05, 1, 8]} />
      <meshStandardMaterial color="#2d1e1e" />
    </mesh>
    <mesh position={[0, 2, 0]} castShadow>
      <cylinderGeometry args={[0.1, 0.5, 3, 6]} />
      <meshStandardMaterial color="#1b2e1b" roughness={0.9} />
    </mesh>
  </group>
);

