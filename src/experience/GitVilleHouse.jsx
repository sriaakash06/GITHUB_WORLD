import React, { useMemo } from 'react';
import * as THREE from 'three';
import { PALETTE } from './Constants';

// Triangular prism roof using ExtrudeGeometry
const PrismRoof = ({ width, depth, height, color }) => {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-width / 2, 0);
    shape.lineTo(width / 2, 0);
    shape.lineTo(0, height);
    shape.lineTo(-width / 2, 0);
    const geo = new THREE.ExtrudeGeometry(shape, { steps: 1, depth, bevelEnabled: false });
    geo.translate(0, 0, -depth / 2);
    return geo;
  }, [width, depth, height]);

  return (
    <mesh castShadow receiveShadow geometry={geometry}>
      <meshStandardMaterial color={color} roughness={0.7} flatShading />
    </mesh>
  );
};

// Simple box
const Box = ({ x = 0, y = 0, z = 0, w, h, d, color, metalness = 0 }) => (
  <mesh position={[x + w / 2, y + h / 2, z + d / 2]} castShadow receiveShadow>
    <boxGeometry args={[w, h, d]} />
    <meshStandardMaterial color={color} roughness={0.8} metalness={metalness} flatShading />
  </mesh>
);

// Small window
const SmallWindow = ({ position, rotation = [0, 0, 0] }) => (
  <mesh position={position} rotation={rotation}>
    <boxGeometry args={[0.4, 0.4, 0.06]} />
    <meshStandardMaterial color={PALETTE.window} roughness={0.1} metalness={0.3} flatShading />
  </mesh>
);

export default function GitVilleHouse({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  roofColor = '#e8832a',
  scale = 1,
  style = 0,  // 0–3 for slight shape variations
}) {
  // Slight variation per style for more interesting village
  const wallW   = 2.2 + (style % 2) * 0.3;
  const wallD   = 2.0 + ((style + 1) % 2) * 0.3;
  const wallH   = 1.8 + (style % 3) * 0.2;
  const roofH   = 0.9 + (style % 2) * 0.15;

  // Wall color slight variation
  const wallColors = ['#f5e6d0', '#eedad8', '#dde8f0', '#e8f0de'];
  const wallColor = wallColors[style % wallColors.length];

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* FOUNDATION */}
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[wallW + 0.4, 0.3, wallD + 0.4]} />
        <meshStandardMaterial color={PALETTE.stoneDark} flatShading roughness={0.95} />
      </mesh>

      {/* WALLS */}
      <mesh position={[0, wallH / 2 + 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[wallW, wallH, wallD]} />
        <meshStandardMaterial color={wallColor} flatShading roughness={0.85} />
      </mesh>

      {/* WALL TRIM / LEDGE at top of walls */}
      <mesh position={[0, wallH + 0.35, 0]}>
        <boxGeometry args={[wallW + 0.15, 0.12, wallD + 0.15]} />
        <meshStandardMaterial color={PALETTE.stoneDark} flatShading />
      </mesh>

      {/* ROOF */}
      <group position={[0, wallH + 0.42, 0]}>
        <PrismRoof width={wallW + 0.4} depth={wallD + 0.4} height={roofH} color={roofColor} />
      </group>

      {/* CHIMNEY */}
      <mesh position={[wallW * 0.2, wallH + roofH * 0.55 + 0.3, wallD * 0.15]} castShadow>
        <boxGeometry args={[0.28, 0.55, 0.28]} />
        <meshStandardMaterial color={PALETTE.chimney} flatShading />
      </mesh>
      <mesh position={[wallW * 0.2, wallH + roofH * 0.55 + 0.6, wallD * 0.15]}>
        <boxGeometry args={[0.36, 0.12, 0.36]} />
        <meshStandardMaterial color="#8a7860" flatShading />
      </mesh>

      {/* DOOR – front face (z = wallD/2) */}
      <mesh position={[0, 0.65 + 0.3, wallD / 2 + 0.02]} castShadow>
        <boxGeometry args={[0.55, 0.95, 0.08]} />
        <meshStandardMaterial color={PALETTE.door} flatShading />
      </mesh>
      {/* Door handle */}
      <mesh position={[0.19, 0.72 + 0.3, wallD / 2 + 0.07]}>
        <sphereGeometry args={[0.055, 6, 6]} />
        <meshStandardMaterial color="#d4a060" flatShading />
      </mesh>

      {/* FRONT STEP */}
      <mesh position={[0, 0.24, wallD / 2 + 0.16]} castShadow>
        <boxGeometry args={[0.75, 0.12, 0.22]} />
        <meshStandardMaterial color={PALETTE.stone} flatShading />
      </mesh>

      {/* WINDOWS – front */}
      {wallW > 2.3 && (
        <>
          <SmallWindow position={[-wallW * 0.27, wallH * 0.55 + 0.3, wallD / 2 + 0.02]} />
          <SmallWindow position={[wallW * 0.27, wallH * 0.55 + 0.3, wallD / 2 + 0.02]} />
        </>
      )}
      {wallW <= 2.3 && (
        <SmallWindow position={[wallW * 0.22, wallH * 0.55 + 0.3, wallD / 2 + 0.02]} />
      )}

      {/* WINDOW – side */}
      <SmallWindow
        position={[wallW / 2 + 0.02, wallH * 0.5 + 0.3, 0]}
        rotation={[0, Math.PI / 2, 0]}
      />
    </group>
  );
}
