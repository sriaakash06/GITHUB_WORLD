import React, { useMemo, useState, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { PALETTE } from './Constants';

// Triangular prism roof
const PrismRoof = ({ width, depth, height, color, position }) => {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-width / 2, 0);
    shape.lineTo(width / 2, 0);
    shape.lineTo(0, height);
    shape.lineTo(-width / 2, 0);
    const extSettings = { steps: 1, depth, bevelEnabled: false };
    const geo = new THREE.ExtrudeGeometry(shape, extSettings);
    geo.translate(0, 0, -depth / 2);
    return geo;
  }, [width, depth, height]);

  return (
    <mesh position={position} castShadow receiveShadow geometry={geometry}>
      <meshStandardMaterial color={color} roughness={0.7} flatShading />
    </mesh>
  );
};

// Raised hexagonal green platform
const CenterPlatform = () => {
  // Hexagonal shape via CircleGeometry with 6 segments
  return (
    <group>
      {/* Grass top */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.55, 0]} receiveShadow>
        <circleGeometry args={[12, 6]} />
        <meshStandardMaterial color={PALETTE.grassLight} flatShading roughness={0.9} />
      </mesh>
      {/* Stone base side walls - stacked layers for gentle elevation */}
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
};

// Flag on a pole
const Flag = ({ position, color }) => (
  <group position={position}>
    <mesh castShadow>
      <cylinderGeometry args={[0.08, 0.08, 2.5, 6]} />
      <meshStandardMaterial color="#5a4030" flatShading />
    </mesh>
    <mesh position={[0.5, 0.8, 0]} castShadow>
      <boxGeometry args={[0.9, 0.5, 0.05]} />
      <meshStandardMaterial color={color} flatShading />
    </mesh>
  </group>
);

// Window detail
const Window = ({ position, rotation = [0, 0, 0] }) => (
  <mesh position={position} rotation={rotation} castShadow>
    <boxGeometry args={[0.55, 0.65, 0.08]} />
    <meshStandardMaterial color={PALETTE.window} roughness={0.1} metalness={0.2} flatShading />
  </mesh>
);

export default function GitVilleTownHall({ position = [0, 0, 0], username }) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef();

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const target = hovered ? 1.05 : 1; // Slight scale up on hover
    const cur = groupRef.current.scale.x;
    const next = cur + (target - cur) * Math.min(delta * 10, 1);
    groupRef.current.scale.set(next, next, next);
  });

  return (
    <group 
      ref={groupRef}
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'default';
      }}
      onClick={(e) => {
        e.stopPropagation();
        const url = username 
          ? `https://github.com/${username}` 
          : `https://github.com/sriaakash06`; // Fallback
        window.open(url, '_blank', 'noopener,noreferrer');
      }}
    >
      {/* RAISED PLATFORM */}
      <CenterPlatform />

      {/* FOUNDATION SLAB */}
      <mesh position={[0, 0.85, 0]} castShadow receiveShadow>
        <boxGeometry args={[7, 0.6, 7]} />
        <meshStandardMaterial color={PALETTE.stoneDark} flatShading roughness={0.95} />
      </mesh>

      {/* GROUND FLOOR */}
      <mesh position={[0, 2.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[6.5, 2.0, 6.5]} />
        <meshStandardMaterial color={PALETTE.townHallWall} flatShading roughness={0.8} />
      </mesh>
      {/* Ground floor trim */}
      <mesh position={[0, 3.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[6.8, 0.2, 6.8]} />
        <meshStandardMaterial color={PALETTE.townHallBase} flatShading />
      </mesh>

      {/* WINDOWS – ground floor, all 4 sides */}
      {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((ry, i) => (
        <group key={i} rotation={[0, ry, 0]}>
          <Window position={[-1.0, 1.8, 3.28]} />
          <Window position={[1.0, 1.8, 3.28]} />
        </group>
      ))}

      {/* DOOR */}
      <mesh position={[0, 1.45, 3.28]} castShadow>
        <boxGeometry args={[1.0, 1.6, 0.1]} />
        <meshStandardMaterial color={PALETTE.door} flatShading />
      </mesh>
      {/* Door arch */}
      <mesh position={[0, 2.3, 3.28]} castShadow>
        <cylinderGeometry args={[0.5, 0.5, 0.1, 16, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color={PALETTE.door} flatShading />
      </mesh>

      {/* SECOND FLOOR */}
      <mesh position={[0, 4.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[5.8, 2.0, 5.8]} />
        <meshStandardMaterial color={PALETTE.townHallWall} flatShading roughness={0.8} />
      </mesh>
      {/* Second floor trim */}
      <mesh position={[0, 5.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[6.1, 0.2, 6.1]} />
        <meshStandardMaterial color={PALETTE.townHallBase} flatShading />
      </mesh>

      {/* WINDOWS – second floor */}
      {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((ry, i) => (
        <group key={i} rotation={[0, ry, 0]}>
          <Window position={[-1.0, 4.2, 2.95]} />
          <Window position={[1.0, 4.2, 2.95]} />
        </group>
      ))}

      {/* THIRD FLOOR (tower) */}
      <mesh position={[0, 6.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.5, 2.0, 4.5]} />
        <meshStandardMaterial color={PALETTE.wallAlt} flatShading roughness={0.8} />
      </mesh>
      {/* Tower trim */}
      <mesh position={[0, 7.65, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.8, 0.2, 4.8]} />
        <meshStandardMaterial color={PALETTE.townHallBase} flatShading />
      </mesh>
      {/* Tower windows */}
      {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((ry, i) => (
        <group key={i} rotation={[0, ry, 0]}>
          <Window position={[0, 6.5, 2.28]} />
        </group>
      ))}

      {/* MAIN ROOF – orange prism */}
      <PrismRoof
        width={6.0} depth={6.0} height={2.8}
        color={PALETTE.townHallRoof}
        position={[0, 7.75, 0]}
      />
      {/* Roof ridge cap */}
      <mesh position={[0, 10.4, 0]} castShadow>
        <boxGeometry args={[0.4, 0.25, 6.2]} />
        <meshStandardMaterial color="#c0692a" flatShading />
      </mesh>

      {/* CHIMNEYS */}
      {[[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]].map(([cx, cz], i) => (
        <group key={i} position={[cx, 9.4, cz]}>
          <mesh castShadow>
            <boxGeometry args={[0.35, 1.0, 0.35]} />
            <meshStandardMaterial color={PALETTE.chimney} flatShading />
          </mesh>
          <mesh position={[0, 0.6, 0]}>
            <boxGeometry args={[0.45, 0.15, 0.45]} />
            <meshStandardMaterial color="#7a6860" flatShading />
          </mesh>
        </group>
      ))}

      {/* CORNER FLAGS */}
      <Flag position={[-3.4, 7.8, -3.4]} color="#e8832a" />
      <Flag position={[3.4, 7.8, -3.4]} color="#f0c030" />
      <Flag position={[-3.4, 7.8, 3.4]} color="#4a90d9" />
      <Flag position={[3.4, 7.8, 3.4]} color="#d94a4a" />

      {/* PORCH STEPS */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0.65 + i * 0.2, 3.3 + i * 0.3]} castShadow receiveShadow>
          <boxGeometry args={[2.5 - i * 0.3, 0.2, 0.5]} />
          <meshStandardMaterial color={PALETTE.stoneDark} flatShading />
        </mesh>
      ))}

      {/* BALCONY RAILING (second floor front) */}
      <mesh position={[0, 3.3, 3.45]} castShadow>
        <boxGeometry args={[3.0, 0.08, 0.5]} />
        <meshStandardMaterial color={PALETTE.townHallBase} flatShading />
      </mesh>
      <mesh position={[0, 3.55, 3.7]} castShadow>
        <boxGeometry args={[3.0, 0.5, 0.06]} />
        <meshStandardMaterial color={PALETTE.townHallBase} flatShading />
      </mesh>
    </group>
  );
}
