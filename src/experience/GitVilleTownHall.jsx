import React, { useMemo, useState, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { PALETTE } from './Constants';

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

// Conical tower roof
const ConeRoof = ({ position, radius = 1.2, height = 2, color = '#c0392b' }) => (
  <mesh position={position} castShadow>
    <coneGeometry args={[radius, height, 8]} />
    <meshStandardMaterial color={color} roughness={0.6} flatShading />
  </mesh>
);

// Cylindrical tower with stone bands and cone roof
const Tower = ({ position, radius = 1.1, height = 8, roofColor = '#c0392b' }) => (
  <group position={position}>
    {/* Main cylinder */}
    <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[radius, radius * 1.05, height, 10]} />
      <meshStandardMaterial color={PALETTE.stone} roughness={0.85} flatShading />
    </mesh>
    {/* Stone band — bottom */}
    <mesh position={[0, 0.4, 0]} castShadow>
      <cylinderGeometry args={[radius * 1.08, radius * 1.12, 0.5, 10]} />
      <meshStandardMaterial color={PALETTE.stoneDark} roughness={0.9} flatShading />
    </mesh>
    {/* Stone band — mid */}
    <mesh position={[0, height * 0.5, 0]} castShadow>
      <cylinderGeometry args={[radius * 1.06, radius * 1.06, 0.3, 10]} />
      <meshStandardMaterial color={PALETTE.stoneDark} roughness={0.9} flatShading />
    </mesh>
    {/* Battlement ring at top */}
    <mesh position={[0, height + 0.15, 0]} castShadow>
      <cylinderGeometry args={[radius * 1.15, radius * 1.1, 0.35, 10]} />
      <meshStandardMaterial color={PALETTE.stoneDark} roughness={0.9} flatShading />
    </mesh>
    {/* Crenellations (merlons around top) */}
    {Array.from({ length: 8 }).map((_, i) => {
      const angle = (i / 8) * Math.PI * 2;
      const r = radius * 1.12;
      return (
        <mesh
          key={i}
          position={[Math.cos(angle) * r, height + 0.5, Math.sin(angle) * r]}
          castShadow
        >
          <boxGeometry args={[0.35, 0.45, 0.25]} />
          <meshStandardMaterial color={PALETTE.stone} roughness={0.85} flatShading />
        </mesh>
      );
    })}
    {/* Conical roof */}
    <ConeRoof
      position={[0, height + 1.3, 0]}
      radius={radius * 1.35}
      height={2.5}
      color={roofColor}
    />
    {/* Roof finial */}
    <mesh position={[0, height + 2.7, 0]} castShadow>
      <sphereGeometry args={[0.15, 6, 6]} />
      <meshStandardMaterial color="#f0c030" metalness={0.6} roughness={0.3} flatShading />
    </mesh>
    {/* Arrow slits */}
    {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((angle, i) => {
      const r2 = radius + 0.02;
      return (
        <mesh
          key={`slit-${i}`}
          position={[
            Math.cos(angle) * r2,
            height * 0.4,
            Math.sin(angle) * r2,
          ]}
          rotation={[0, -angle + Math.PI / 2, 0]}
          castShadow
        >
          <boxGeometry args={[0.12, 0.7, 0.08]} />
          <meshStandardMaterial color="#1a1a2e" flatShading />
        </mesh>
      );
    })}
    {/* Upper arrow slits */}
    {[Math.PI / 4, (3 * Math.PI) / 4, -(Math.PI / 4), -(3 * Math.PI) / 4].map(
      (angle, i) => {
        const r2 = radius + 0.02;
        return (
          <mesh
            key={`slit-up-${i}`}
            position={[
              Math.cos(angle) * r2,
              height * 0.72,
              Math.sin(angle) * r2,
            ]}
            rotation={[0, -angle + Math.PI / 2, 0]}
            castShadow
          >
            <boxGeometry args={[0.12, 0.55, 0.08]} />
            <meshStandardMaterial color="#1a1a2e" flatShading />
          </mesh>
        );
      }
    )}
  </group>
);

// Straight wall segment with crenellations
const CastleWall = ({ position, rotation = [0, 0, 0], width = 6, height = 5, depth = 0.7 }) => (
  <group position={position} rotation={rotation}>
    {/* Main wall body */}
    <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
      <boxGeometry args={[width, height, depth]} />
      <meshStandardMaterial color={PALETTE.stone} roughness={0.85} flatShading />
    </mesh>
    {/* Wall-walk ledge */}
    <mesh position={[0, height + 0.1, -depth * 0.3]} castShadow>
      <boxGeometry args={[width, 0.2, depth * 1.4]} />
      <meshStandardMaterial color={PALETTE.stoneDark} roughness={0.9} flatShading />
    </mesh>
    {/* Merlons */}
    {Array.from({ length: Math.floor(width / 0.8) }).map((_, i) => {
      const count = Math.floor(width / 0.8);
      const x = -width / 2 + (i + 0.5) * (width / count);
      if (i % 2 === 0) return null;
      return (
        <mesh key={i} position={[x, height + 0.45, 0]} castShadow>
          <boxGeometry args={[0.4, 0.5, depth * 1.05]} />
          <meshStandardMaterial color={PALETTE.stone} roughness={0.85} flatShading />
        </mesh>
      );
    })}
  </group>
);

// Flag on a pole
const Flag = ({ position, color, poleHeight = 2.5 }) => (
  <group position={position}>
    <mesh castShadow>
      <cylinderGeometry args={[0.06, 0.06, poleHeight, 6]} />
      <meshStandardMaterial color="#5a4030" flatShading />
    </mesh>
    <mesh position={[0.55, poleHeight * 0.35, 0]} castShadow>
      <boxGeometry args={[1, 0.6, 0.05]} />
      <meshStandardMaterial color={color} flatShading />
    </mesh>
    {/* Pole tip */}
    <mesh position={[0, poleHeight * 0.52, 0]} castShadow>
      <sphereGeometry args={[0.1, 6, 6]} />
      <meshStandardMaterial color="#f0c030" metalness={0.5} roughness={0.3} flatShading />
    </mesh>
  </group>
);

// Torch bracket on wall
const Torch = ({ position, rotation = [0, 0, 0] }) => (
  <group position={position} rotation={rotation}>
    {/* Bracket */}
    <mesh castShadow>
      <boxGeometry args={[0.08, 0.5, 0.08]} />
      <meshStandardMaterial color="#5a4030" flatShading />
    </mesh>
    {/* Flame glow */}
    <mesh position={[0, 0.35, 0]}>
      <sphereGeometry args={[0.12, 6, 6]} />
      <meshStandardMaterial
        color="#ff8800"
        emissive="#ff6600"
        emissiveIntensity={2.5}
        flatShading
      />
    </mesh>
    <pointLight position={[0, 0.4, 0]} intensity={0.6} distance={5} color="#ff9933" />
  </group>
);

// Arch shape for gatehouse
const Arch = ({ position, width = 1.8, height = 2.8, depth = 1.2 }) => {
  const geo = useMemo(() => {
    const shape = new THREE.Shape();
    const hw = width / 2;
    const straightH = height - hw; // height of straight part
    // Start bottom-left
    shape.moveTo(-hw, 0);
    shape.lineTo(-hw, straightH);
    // Semicircular arch
    shape.absarc(0, straightH, hw, Math.PI, 0, true);
    shape.lineTo(hw, 0);
    shape.lineTo(-hw, 0);

    const extSettings = { steps: 1, depth, bevelEnabled: false };
    const g = new THREE.ExtrudeGeometry(shape, extSettings);
    g.translate(0, 0, -depth / 2);
    return g;
  }, [width, height, depth]);

  return (
    <mesh position={position} geometry={geo} castShadow receiveShadow>
      <meshStandardMaterial color="#1a1a2e" flatShading />
    </mesh>
  );
};

// Central Keep
const Keep = ({ position }) => (
  <group position={position}>
    {/* Keep base */}
    <mesh position={[0, 3, 0]} castShadow receiveShadow>
      <boxGeometry args={[4, 6, 4]} />
      <meshStandardMaterial color={PALETTE.wallAlt} roughness={0.8} flatShading />
    </mesh>
    {/* Keep stone trim bottom */}
    <mesh position={[0, 0.15, 0]} castShadow>
      <boxGeometry args={[4.3, 0.3, 4.3]} />
      <meshStandardMaterial color={PALETTE.stoneDark} roughness={0.9} flatShading />
    </mesh>
    {/* Keep stone trim mid */}
    <mesh position={[0, 3, 0]} castShadow>
      <boxGeometry args={[4.2, 0.2, 4.2]} />
      <meshStandardMaterial color={PALETTE.stoneDark} roughness={0.9} flatShading />
    </mesh>
    {/* Keep stone trim top */}
    <mesh position={[0, 6.05, 0]} castShadow>
      <boxGeometry args={[4.4, 0.2, 4.4]} />
      <meshStandardMaterial color={PALETTE.stoneDark} roughness={0.9} flatShading />
    </mesh>
    {/* Battlements on keep */}
    {[-1.5, -0.5, 0.5, 1.5].map((x) =>
      [-1.5, -0.5, 0.5, 1.5].map((z) => {
        // Only place merlons on edges
        const isEdge =
          Math.abs(x) === 1.5 || Math.abs(z) === 1.5;
        if (!isEdge) return null;
        // skip alternating for crenel effect
        if ((Math.round(x * 2) + Math.round(z * 2)) % 2 === 0)
          return null;
        return (
          <mesh
            key={`m-${x}-${z}`}
            position={[x, 6.4, z]}
            castShadow
          >
            <boxGeometry args={[0.45, 0.5, 0.45]} />
            <meshStandardMaterial color={PALETTE.stone} roughness={0.85} flatShading />
          </mesh>
        );
      })
    )}
    {/* Keep upper tower */}
    <mesh position={[0, 7.5, 0]} castShadow receiveShadow>
      <boxGeometry args={[2.4, 2.8, 2.4]} />
      <meshStandardMaterial color={PALETTE.wallAlt} roughness={0.8} flatShading />
    </mesh>
    <mesh position={[0, 8.95, 0]} castShadow>
      <boxGeometry args={[2.7, 0.15, 2.7]} />
      <meshStandardMaterial color={PALETTE.stoneDark} roughness={0.9} flatShading />
    </mesh>
    {/* Keep spire */}
    <ConeRoof position={[0, 10.1, 0]} radius={2} height={3} color={PALETTE.townHallRoof} />
    {/* Spire finial */}
    <mesh position={[0, 11.8, 0]} castShadow>
      <sphereGeometry args={[0.22, 6, 6]} />
      <meshStandardMaterial color="#f0c030" metalness={0.7} roughness={0.2} flatShading />
    </mesh>

    {/* Keep windows */}
    {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((ry, i) => (
      <group key={`kw-${i}`} rotation={[0, ry, 0]}>
        {/* Lower window */}
        <mesh position={[0, 2.2, 2.02]} castShadow>
          <boxGeometry args={[0.5, 0.8, 0.08]} />
          <meshStandardMaterial color={PALETTE.window} roughness={0.1} metalness={0.2} flatShading />
        </mesh>
        {/* Upper window */}
        <mesh position={[0, 4.8, 2.02]} castShadow>
          <boxGeometry args={[0.5, 0.8, 0.08]} />
          <meshStandardMaterial color={PALETTE.window} roughness={0.1} metalness={0.2} flatShading />
        </mesh>
        {/* Top tower window */}
        <mesh position={[0, 7.8, 1.22]} castShadow>
          <boxGeometry args={[0.4, 0.6, 0.08]} />
          <meshStandardMaterial color={PALETTE.window} roughness={0.1} metalness={0.2} flatShading />
        </mesh>
      </group>
    ))}
  </group>
);

// Moat (water ring)
const Moat = ({ innerRadius = 9, outerRadius = 10.5 }) => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]} receiveShadow>
      <ringGeometry args={[innerRadius, outerRadius, 32]} />
      <meshStandardMaterial
        color={PALETTE.water}
        roughness={0.15}
        metalness={0.3}
        transparent
        opacity={0.85}
        flatShading
      />
    </mesh>
    {/* Moat bed */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]} receiveShadow>
      <ringGeometry args={[innerRadius - 0.3, outerRadius + 0.3, 32]} />
      <meshStandardMaterial color="#1a6b8a" roughness={0.9} flatShading />
    </mesh>
  </group>
);

// Drawbridge
const Drawbridge = ({ position }) => (
  <group position={position}>
    {/* Bridge deck */}
    <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
      <boxGeometry args={[2.4, 0.15, 3]} />
      <meshStandardMaterial color="#8B6914" roughness={0.9} flatShading />
    </mesh>
    {/* Planks */}
    {[-0.9, -0.45, 0, 0.45, 0.9].map((z, i) => (
      <mesh key={i} position={[0, 0.17, z]}>
        <boxGeometry args={[2.2, 0.03, 0.08]} />
        <meshStandardMaterial color="#6B4F1A" roughness={0.9} flatShading />
      </mesh>
    ))}
    {/* Side rails */}
    <mesh position={[-1.1, 0.35, 0]} castShadow>
      <boxGeometry args={[0.1, 0.5, 3]} />
      <meshStandardMaterial color="#5a4030" roughness={0.9} flatShading />
    </mesh>
    <mesh position={[1.1, 0.35, 0]} castShadow>
      <boxGeometry args={[0.1, 0.5, 3]} />
      <meshStandardMaterial color="#5a4030" roughness={0.9} flatShading />
    </mesh>
  </group>
);

// Hexagonal raised platform
const CastlePlatform = () => (
  <group>
    {/* Grass top */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.55, 0]} receiveShadow>
      <circleGeometry args={[12, 6]} />
      <meshStandardMaterial color={PALETTE.grassLight} flatShading roughness={0.9} />
    </mesh>
    {/* Stone base layers */}
    <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[11.8, 12.5, 0.6, 6]} />
      <meshStandardMaterial color={PALETTE.stone} flatShading roughness={0.95} />
    </mesh>
    <mesh position={[0, -0.1, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[12.5, 13.5, 0.6, 6]} />
      <meshStandardMaterial color={PALETTE.stoneDark} flatShading roughness={0.95} />
    </mesh>
  </group>
);

// ═══════════════════════════════════════════════════════════════
// MAIN CASTLE COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function GitVilleTownHall({ position = [0, 0, 0], username }) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef();

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const target = hovered ? 0.46 : 0.44;
    const cur = groupRef.current.scale.x;
    const next = cur + (target - cur) * Math.min(delta * 10, 1);
    groupRef.current.scale.set(next, next, next);
  });

  // Tower positions (corners of the castle courtyard)
  const towerR = 5.5;
  const cornerPositions = [
    [-towerR, 0.5, -towerR],
    [towerR, 0.5, -towerR],
    [-towerR, 0.5, towerR],
    [towerR, 0.5, towerR],
  ];
  const towerRoofColors = ['#c0392b', '#c0392b', '#2c3e80', '#2c3e80'];

  return (
    <group
      ref={groupRef}
      position={position}
      scale={[0.44, 0.44, 0.44]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'default';
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
        const url = username
          ? `https://github.com/${username}`
          : `https://github.com/sriaakash06`;
        window.open(url, '_blank', 'noopener,noreferrer');
      }}
    >
      {/* ── PLATFORM ── */}
      <CastlePlatform />

      {/* ── MOAT ── */}
      <Moat innerRadius={8.5} outerRadius={10} />

      {/* ── CASTLE FOUNDATION ── */}
      <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[12.5, 0.6, 12.5]} />
        <meshStandardMaterial color={PALETTE.stoneDark} roughness={0.95} flatShading />
      </mesh>

      {/* ── COURTYARD FLOOR ── */}
      <mesh position={[0, 1.12, 0]} receiveShadow>
        <boxGeometry args={[10.5, 0.05, 10.5]} />
        <meshStandardMaterial color="#c2b280" roughness={0.95} flatShading />
      </mesh>

      {/* ── CORNER TOWERS ── */}
      {cornerPositions.map((pos, i) => (
        <Tower
          key={`tower-${i}`}
          position={pos}
          radius={1.2}
          height={8}
          roofColor={towerRoofColors[i]}
        />
      ))}

      {/* ── CURTAIN WALLS (connecting towers) ── */}
      {/* Front wall (Z+) — split for gatehouse */}
      <CastleWall position={[-3.5, 0.5, towerR]} width={3} height={5} depth={0.6} />
      <CastleWall position={[3.5, 0.5, towerR]} width={3} height={5} depth={0.6} />

      {/* Back wall (Z-) */}
      <CastleWall position={[0, 0.5, -towerR]} width={9.5} height={5} depth={0.6} />

      {/* Left wall (X-) */}
      <CastleWall
        position={[-towerR, 0.5, 0]}
        rotation={[0, Math.PI / 2, 0]}
        width={9.5}
        height={5}
        depth={0.6}
      />

      {/* Right wall (X+) */}
      <CastleWall
        position={[towerR, 0.5, 0]}
        rotation={[0, Math.PI / 2, 0]}
        width={9.5}
        height={5}
        depth={0.6}
      />

      {/* ── GATEHOUSE ── */}
      <group position={[0, 0.5, towerR]}>
        {/* Gatehouse towers (smaller) */}
        <mesh position={[-1.5, 3.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.2, 7, 1.4]} />
          <meshStandardMaterial color={PALETTE.stone} roughness={0.85} flatShading />
        </mesh>
        <mesh position={[1.5, 3.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.2, 7, 1.4]} />
          <meshStandardMaterial color={PALETTE.stone} roughness={0.85} flatShading />
        </mesh>
        {/* Gatehouse roof peaks */}
        <ConeRoof position={[-1.5, 7.8, 0]} radius={1} height={1.8} color={PALETTE.townHallRoof} />
        <ConeRoof position={[1.5, 7.8, 0]} radius={1} height={1.8} color={PALETTE.townHallRoof} />
        {/* Connecting top beam */}
        <mesh position={[0, 6.5, 0]} castShadow>
          <boxGeometry args={[4.2, 0.8, 1.2]} />
          <meshStandardMaterial color={PALETTE.stoneDark} roughness={0.9} flatShading />
        </mesh>
        {/* Arch opening */}
        <Arch position={[0, 0, 0.35]} width={1.6} height={3.2} depth={1.6} />
        {/* Portcullis (iron gate) */}
        <group position={[0, 0, 0.6]}>
          {/* Vertical bars */}
          {[-0.55, -0.25, 0, 0.25, 0.55].map((x, i) => (
            <mesh key={`vbar-${i}`} position={[x, 1.5, 0]}>
              <boxGeometry args={[0.06, 3, 0.06]} />
              <meshStandardMaterial color="#4a4a5a" metalness={0.7} roughness={0.3} flatShading />
            </mesh>
          ))}
          {/* Horizontal bars */}
          {[0.5, 1.2, 1.9, 2.6].map((y, i) => (
            <mesh key={`hbar-${i}`} position={[0, y, 0]}>
              <boxGeometry args={[1.2, 0.06, 0.06]} />
              <meshStandardMaterial color="#4a4a5a" metalness={0.7} roughness={0.3} flatShading />
            </mesh>
          ))}
        </group>
        {/* Gatehouse battlements */}
        {[-1, 0, 1].map((x) => (
          <mesh key={`gb-${x}`} position={[x * 0.7, 7.1, 0.5]} castShadow>
            <boxGeometry args={[0.35, 0.5, 0.35]} />
            <meshStandardMaterial color={PALETTE.stone} roughness={0.85} flatShading />
          </mesh>
        ))}
      </group>

      {/* ── DRAWBRIDGE ── */}
      <Drawbridge position={[0, 0.55, towerR + 2]} />

      {/* ── CENTRAL KEEP ── */}
      <Keep position={[0, 1.1, 0]} />

      {/* ── WALL TORCHES ── */}
      {/* Front wall torches */}
      <Torch position={[-3.5, 3.5, towerR + 0.35]} />
      <Torch position={[3.5, 3.5, towerR + 0.35]} />
      {/* Back wall torches */}
      <Torch position={[-2.5, 3.5, -towerR - 0.35]} rotation={[0, Math.PI, 0]} />
      <Torch position={[2.5, 3.5, -towerR - 0.35]} rotation={[0, Math.PI, 0]} />
      {/* Side wall torches */}
      <Torch position={[-towerR - 0.35, 3.5, -2]} rotation={[0, -Math.PI / 2, 0]} />
      <Torch position={[-towerR - 0.35, 3.5, 2]} rotation={[0, -Math.PI / 2, 0]} />
      <Torch position={[towerR + 0.35, 3.5, -2]} rotation={[0, Math.PI / 2, 0]} />
      <Torch position={[towerR + 0.35, 3.5, 2]} rotation={[0, Math.PI / 2, 0]} />

      {/* ── FLAGS ── */}
      <Flag position={[cornerPositions[0][0], 11.5, cornerPositions[0][2]]} color="#e8832a" poleHeight={2.5} />
      <Flag position={[cornerPositions[1][0], 11.5, cornerPositions[1][2]]} color="#f0c030" poleHeight={2.5} />
      <Flag position={[cornerPositions[2][0], 11.5, cornerPositions[2][2]]} color="#4a90d9" poleHeight={2.5} />
      <Flag position={[cornerPositions[3][0], 11.5, cornerPositions[3][2]]} color="#d94a4a" poleHeight={2.5} />

      {/* ── PORCH STEPS (leading to drawbridge) ── */}
      {[0, 1, 2].map((i) => (
        <mesh key={`step-${i}`} position={[0, 0.6 + i * 0.15, towerR + 3.6 + i * 0.4]} castShadow receiveShadow>
          <boxGeometry args={[2.8 - i * 0.3, 0.15, 0.5]} />
          <meshStandardMaterial color={PALETTE.stoneDark} flatShading />
        </mesh>
      ))}

      {/* ── COURTYARD DECORATION ── */}
      {/* Small well in courtyard */}
      <group position={[2.5, 1.1, -2]}>
        <mesh position={[0, 0.3, 0]} castShadow>
          <cylinderGeometry args={[0.5, 0.55, 0.6, 8]} />
          <meshStandardMaterial color={PALETTE.stoneDark} roughness={0.9} flatShading />
        </mesh>
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.4, 0.4, 0.15, 8]} />
          <meshStandardMaterial color={PALETTE.water} roughness={0.2} metalness={0.3} flatShading />
        </mesh>
      </group>

      {/* Courtyard banner pole */}
      <group position={[-2.5, 1.1, 2]}>
        <mesh position={[0, 1.2, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 2.4, 6]} />
          <meshStandardMaterial color="#5a4030" flatShading />
        </mesh>
        <mesh position={[0.45, 2.2, 0]} castShadow>
          <boxGeometry args={[0.8, 0.5, 0.05]} />
          <meshStandardMaterial color={PALETTE.townHallAccent} flatShading />
        </mesh>
      </group>
    </group>
  );
}
