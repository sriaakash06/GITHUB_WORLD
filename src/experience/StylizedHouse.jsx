import React from 'react';
import * as THREE from 'three';
import { PALETTE } from './Constants';

export const StylizedHouse = ({ position = [0, 0, 0], scale = 1 }) => {
  return (
    <group position={position} scale={scale}>
      {/* ROUNDED BASE (The lawn) */}
      <mesh position={[0, -0.2, 0]} receiveShadow>
        <cylinderGeometry args={[8, 8, 0.5, 32]} />
        <meshStandardMaterial color={PALETTE.grass[0]} roughness={1} />
      </mesh>

      {/* PATHWAY */}
      <mesh position={[2, 0.1, 4]} rotation={[0, -Math.PI / 6, 0]} receiveShadow>
        <boxGeometry args={[2, 0.1, 7]} />
        <meshStandardMaterial color={PALETTE.stone} />
      </mesh>

      {/* MAIN HOUSE BODY (Light Blue) */}
      <mesh position={[-1.5, 2.5, 1]} castShadow receiveShadow>
        <boxGeometry args={[4, 5, 5]} />
        <meshStandardMaterial color={PALETTE.building} roughness={0.8} />
      </mesh>

      {/* SIDE BODY (White) */}
      <mesh position={[1.5, 2, 2]} castShadow receiveShadow>
        <boxGeometry args={[3, 4, 3.5]} />
        <meshStandardMaterial color="#ffffff" roughness={0.8} />
      </mesh>

      {/* CHIMNEY */}
      <group position={[-2.5, 5.5, 1.5]}>
         <mesh castShadow>
            <boxGeometry args={[0.8, 2, 0.8]} />
            <meshStandardMaterial color="#ffffff" />
         </mesh>
         <mesh position={[0, 1.1, 0]}>
            <boxGeometry args={[1, 0.3, 1]} />
            <meshStandardMaterial color={PALETTE.roof} />
         </mesh>
      </group>

      {/* ROOFS */}
      {/* Main Roof */}
      <group position={[-1.5, 5, 1]}>
         <mesh rotation={[0, 0, Math.PI / 4]} position={[-1.8, 1.2, 0]} castShadow>
            <boxGeometry args={[0.2, 5, 5.5]} />
            <meshStandardMaterial color={PALETTE.roof} />
         </mesh>
         <mesh rotation={[0, 0, -Math.PI / 4]} position={[1.8, 1.2, 0]} castShadow>
            <boxGeometry args={[0.2, 5, 5.5]} />
            <meshStandardMaterial color={PALETTE.roof} />
         </mesh>
      </group>
      {/* Side Roof */}
      <group position={[1.5, 4, 2]}>
          <mesh rotation={[0, 0, Math.PI / 4]} position={[-1, 0.8, 0]} castShadow>
            <boxGeometry args={[0.2, 2.5, 4]} />
            <meshStandardMaterial color={PALETTE.roof} />
         </mesh>
         <mesh rotation={[0, 0, -Math.PI / 4]} position={[1, 0.8, 0]} castShadow>
            <boxGeometry args={[0.2, 2.5, 4]} />
            <meshStandardMaterial color={PALETTE.roof} />
         </mesh>
      </group>

      {/* WINDOWS */}
      {/* Window 1 (Main front) */}
      <Window position={[-1.5, 4, 3.51]} />
      <Window position={[-1.5, 1.5, 3.51]} />
      {/* Side Window */}
      <Window position={[1.5, 2.5, 3.76]} color="#ffffff" />

      {/* ENTRANCE / PORCH */}
      <group position={[1, 0, 4]}>
         {/* Steps */}
         <mesh position={[0, 0.25, 0]}>
            <boxGeometry args={[1.5, 0.5, 1.5]} />
            <meshStandardMaterial color="#ffffff" />
         </mesh>
         <mesh position={[0, 0.1, 0.5]}>
            <boxGeometry args={[2, 0.2, 2.5]} />
            <meshStandardMaterial color="#ffffff" />
         </mesh>
         {/* Door */}
         <mesh position={[0, 1.2, -0.6]} castShadow>
            <boxGeometry args={[1, 1.8, 0.1]} />
            <meshStandardMaterial color={PALETTE.door} />
         </mesh>
         {/* Porch Roof */}
         <mesh position={[0, 2.2, 0]} rotation={[Math.PI / 8, 0, 0]}>
            <boxGeometry args={[1.6, 0.2, 1.5]} />
            <meshStandardMaterial color={PALETTE.roof} />
         </mesh>
      </group>

      {/* TREES & BUSHES */}
      <BlossomTree position={[6, 0, 2]} scale={1.5} />
      <BlossomTree position={[-6, 0, -1]} scale={2} color={PALETTE.blossom} />
      <BlossomTree position={[-5, 0, 4]} scale={1} />
      
      <Bush position={[5, 0, 5]} scale={1.2} />
      <Bush position={[-4, 0, 6]} scale={0.8} />

    </group>
  );
};

const Window = ({ position, color = "#fff" }) => (
  <group position={position}>
    <mesh castShadow>
      <boxGeometry args={[1.2, 1.5, 0.1]} />
      <meshStandardMaterial color="#ffffff" />
    </mesh>
    <mesh position={[0, 0, 0.01]}>
      <boxGeometry args={[1, 1.3, 0.05]} />
      <meshStandardMaterial color="#87ceeb" transparent opacity={0.6} />
    </mesh>
    {/* Flower Box */}
    <mesh position={[0, -0.8, 0.2]}>
      <boxGeometry args={[1.4, 0.4, 0.4]} />
      <meshStandardMaterial color="#556b2f" />
    </mesh>
    {/* Flowers in box */}
    <mesh position={[0, -0.5, 0.3]}>
       <boxGeometry args={[1.2, 0.2, 0.2]} />
       <meshStandardMaterial color={PALETTE.blossom} />
    </mesh>
  </group>
);

const BlossomTree = ({ position, scale, color = PALETTE.pink }) => (
  <group position={position} scale={scale}>
    <mesh position={[0, 1, 0]} castShadow>
      <cylinderGeometry args={[0.1, 0.15, 2, 8]} />
      <meshStandardMaterial color="#4b3621" />
    </mesh>
    <mesh position={[0, 2.5, 0]} castShadow>
      <sphereGeometry args={[1, 12, 12]} />
      <meshStandardMaterial color={color} />
    </mesh>
    <mesh position={[0.5, 3.2, 0]} castShadow scale={0.7}>
      <sphereGeometry args={[1, 12, 12]} />
      <meshStandardMaterial color={color} />
    </mesh>
    <mesh position={[-0.5, 3, 0.3]} castShadow scale={0.5}>
      <sphereGeometry args={[1, 12, 12]} />
      <meshStandardMaterial color={color} />
    </mesh>
  </group>
);

const Bush = ({ position, scale }) => (
  <mesh position={position} scale={scale} castShadow>
    <sphereGeometry args={[1, 16, 16]} />
    <meshStandardMaterial color={PALETTE.grassDark} />
  </mesh>
);
