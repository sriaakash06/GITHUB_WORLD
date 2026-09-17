import React, { useMemo, useState, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { PALETTE } from './Constants';
import { QUALITY } from './quality';
import {
  CASTLE_SCALE,
  MOAT_INNER_R,
  MOAT_OUTER_R,
  BRIDGE_MID_R,
  BRIDGE_LENGTH,
  BRIDGE_WIDTH,
} from './VillageLayout';

// Bridge stonework — same warm greys as the ring road's cobbles so the
// crossings read as an extension of the paving rather than timber.
const BRIDGE_DECK = '#b6a992';
const BRIDGE_SLAB_A = '#a89b88';
const BRIDGE_SLAB_B = '#9b9082';
const BRIDGE_RAIL = '#7d746a';

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

// 3D Medieval Cannon component
const Cannon = ({ position, rotation = [0, 0, 0], scale = 1 }) => (
  <group position={position} rotation={rotation} scale={[scale, scale, scale]}>
    {/* Wooden Carriage Base */}
    <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
      <boxGeometry args={[0.45, 0.22, 0.9]} />
      <meshStandardMaterial color="#5a3f29" roughness={0.8} flatShading />
    </mesh>
    {/* Carriage Side Frames */}
    {[-0.26, 0.26].map((x, i) => (
      <mesh key={`frame-${i}`} position={[x, 0.35, 0]} castShadow>
        <boxGeometry args={[0.08, 0.3, 0.85]} />
        <meshStandardMaterial color="#422d1d" roughness={0.85} flatShading />
      </mesh>
    ))}
    {/* Wheels (4) */}
    {[-0.28, 0.28].map((x) =>
      [-0.28, 0.28].map((z) => (
        <group key={`wheel-${x}-${z}`} position={[x, 0.18, z]} rotation={[0, 0, Math.PI / 2]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.2, 0.2, 0.08, 12]} />
            <meshStandardMaterial color="#3a271a" roughness={0.9} flatShading />
          </mesh>
          <mesh castShadow>
            <cylinderGeometry args={[0.07, 0.07, 0.1, 8]} />
            <meshStandardMaterial color="#2f3238" metalness={0.7} roughness={0.4} flatShading />
          </mesh>
        </group>
      ))
    )}
    {/* Metal Cannon Barrel (pointed in +X direction, slightly tilted up) */}
    <group position={[0, 0.4, 0]} rotation={[0, 0, -0.08]}>
      {/* Main Barrel Tapered Tube */}
      <mesh position={[0.1, 0, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow receiveShadow>
        <cylinderGeometry args={[0.14, 0.2, 0.9, 12]} />
        <meshStandardMaterial color="#2b2d31" metalness={0.8} roughness={0.3} flatShading />
      </mesh>
      {/* Cannon Muzzle Ring */}
      <mesh position={[0.55, 0, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.18, 0.18, 0.1, 12]} />
        <meshStandardMaterial color="#1f2023" metalness={0.85} roughness={0.25} flatShading />
      </mesh>
      {/* Cannon Breech Knob (back end) */}
      <mesh position={[-0.38, 0, 0]} castShadow>
        <sphereGeometry args={[0.18, 8, 8]} />
        <meshStandardMaterial color="#2b2d31" metalness={0.8} roughness={0.3} flatShading />
      </mesh>
      {/* Reinforcing Rings */}
      {[-0.1, 0.15, 0.35].map((rx, idx) => (
        <mesh key={`ring-${idx}`} position={[rx, 0, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
          <torusGeometry args={[0.16, 0.025, 8, 12]} />
          <meshStandardMaterial color="#3f4247" metalness={0.85} roughness={0.3} flatShading />
        </mesh>
      ))}
    </group>
    {/* Cannonballs Stack (Pyramid of 3 black iron balls nearby) */}
    <group position={[-0.35, 0.08, -0.4]}>
      <mesh position={[0, 0, 0]} castShadow>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#1a1a1e" metalness={0.9} roughness={0.2} flatShading />
      </mesh>
      <mesh position={[0.14, 0, 0]} castShadow>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#1a1a1e" metalness={0.9} roughness={0.2} flatShading />
      </mesh>
      <mesh position={[0.07, 0.11, 0]} castShadow>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#1a1a1e" metalness={0.9} roughness={0.2} flatShading />
      </mesh>
    </group>
  </group>
);

// Cylindrical tower with stone bands and optional cone roof
const Tower = ({ position, radius = 1.1, height = 8, roofColor = '#c0392b', doorAngle = null, hasRoof = true }) => (
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
    {/* Flat stone deck inside battlement when open top */}
    {!hasRoof && (
      <mesh position={[0, height + 0.3, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[radius * 1.08, radius * 1.08, 0.08, 10]} />
        <meshStandardMaterial color={PALETTE.stoneDark} roughness={0.9} flatShading />
      </mesh>
    )}
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
    {hasRoof && (
      <>
        <ConeRoof
          position={[0, height + 1.3, 0]}
          radius={radius * 1.35}
          height={2.5}
          color={roofColor}
        />
        {/* Roof finial */}
        <mesh position={[0, height + 2.7, 0]} castShadow>
          <sphereGeometry args={[0.15, 5, 4]} />
          <meshStandardMaterial color="#f0c030" metalness={0.6} roughness={0.3} flatShading />
        </mesh>
      </>
    )}
    {/* Tower Door if facing a bridge */}
    {doorAngle !== null && (
      <group rotation={[0, -doorAngle + Math.PI / 2, 0]}>
        <group position={[0, 0, radius + 0.02]}>
          <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.7, 1.9, 0.12]} />
            <meshStandardMaterial color={PALETTE.stoneDark} roughness={0.9} flatShading />
          </mesh>
          <mesh position={[0, 0.95, 0.04]} castShadow receiveShadow>
            <boxGeometry args={[0.54, 1.75, 0.1]} />
            <meshStandardMaterial color="#422d1d" roughness={0.85} flatShading />
          </mesh>
          {[-0.15, 0.15].map((px) => (
            <mesh key={`tplank-${px}`} position={[px, 0.95, 0.08]} castShadow>
              <boxGeometry args={[0.18, 1.7, 0.04]} />
              <meshStandardMaterial color="#543a26" roughness={0.85} flatShading />
            </mesh>
          ))}
          <mesh position={[-0.15, 0.95, 0.11]} castShadow>
            <sphereGeometry args={[0.06, 6, 5]} />
            <meshStandardMaterial color="#2d2f33" roughness={0.4} metalness={0.7} flatShading />
          </mesh>
        </group>
      </group>
    )}
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

// Flag on a pole, physically attached to a castle socket
const Flag = ({ position, color, poleHeight = 2.2 }) => (
  <group position={position}>
    {/* Base socket on stone */}
    <mesh position={[0, 0.08, 0]} castShadow>
      <cylinderGeometry args={[0.09, 0.11, 0.16, 6]} />
      <meshStandardMaterial color="#3a3d42" metalness={0.6} roughness={0.4} flatShading />
    </mesh>
    {/* Pole extending UP from socket */}
    <mesh position={[0, poleHeight / 2, 0]} castShadow>
      <cylinderGeometry args={[0.05, 0.05, poleHeight, 6]} />
      <meshStandardMaterial color="#5a4030" flatShading />
    </mesh>
    {/* Flag banner near top */}
    <mesh position={[0.48, poleHeight * 0.82, 0]} castShadow>
      <boxGeometry args={[0.85, 0.52, 0.04]} />
      <meshStandardMaterial color={color} flatShading />
    </mesh>
    {/* Golden finial tip */}
    <mesh position={[0, poleHeight + 0.05, 0]} castShadow>
      <sphereGeometry args={[0.09, 5, 4]} />
      <meshStandardMaterial color="#f0c030" metalness={0.7} roughness={0.2} flatShading />
    </mesh>
  </group>
);

// Torch bracket on wall.
// `light` is opt-in: every torch glows via emissive, but only a few carry a
// real point light, and only at night — 15 dynamic lights tanked the frame rate.
const Torch = ({ position, rotation = [0, 0, 0], light = false, lit = true }) => (
  <group position={position} rotation={rotation}>
    {/* Bracket */}
    <mesh castShadow>
      <boxGeometry args={[0.08, 0.5, 0.08]} />
      <meshStandardMaterial color="#5a4030" flatShading />
    </mesh>
    {/* Flame glow */}
    <mesh position={[0, 0.35, 0]}>
      <sphereGeometry args={[0.12, 5, 4]} />
      <meshStandardMaterial
        color={lit ? '#ff8800' : '#6b6560'}
        emissive={lit ? '#ff6600' : '#000000'}
        emissiveIntensity={lit ? 2.5 : 0}
        toneMapped={!lit}
        flatShading
      />
    </mesh>
    {light && <pointLight position={[0, 0.4, 0]} intensity={0.7} distance={5} color="#ff9933" />}
  </group>
);

/**
 * Side entrance for the curtain wall — stone jambs, arch vault, lintel and crenellation
 * over a pair of open banded timber leaves.
 * Smooth stone apron platform connects the incoming bridge to the castle interior.
 */
const SideGate = () => (
  <group>
    {/* Entrance platform apron connecting bridge to gate threshold */}
    <mesh position={[0, 0.04, 0.4]} castShadow receiveShadow>
      <boxGeometry args={[2.4, 0.08, 1.2]} />
      <meshStandardMaterial color={PALETTE.stoneDark} roughness={0.9} flatShading />
    </mesh>

    {/* Side Jamb Pillars */}
    {[-1, 1].map((s) => (
      <mesh key={`jamb-${s}`} position={[s * 1.4, 2.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 4.2, 0.9]} />
        <meshStandardMaterial color={PALETTE.stone} roughness={0.85} flatShading />
      </mesh>
    ))}

    {/* Lintel + merlons */}
    <mesh position={[0, 4.45, 0]} castShadow receiveShadow>
      <boxGeometry args={[3.6, 0.5, 1.0]} />
      <meshStandardMaterial color={PALETTE.stoneDark} roughness={0.9} flatShading />
    </mesh>
    {[-1.1, 0, 1.1].map((x) => (
      <mesh key={`sg-merlon-${x}`} position={[x, 4.95, 0]} castShadow>
        <boxGeometry args={[0.6, 0.5, 0.85]} />
        <meshStandardMaterial color={PALETTE.stone} roughness={0.85} flatShading />
      </mesh>
    ))}

    {/* Arched recess tunnel with genuine 3D physical depth */}
    <Arch position={[0, 0, -0.05]} width={2.2} height={3.5} depth={1.1} />

    {/* Two timber leaves hinged OPEN against the inner jambs for clear walkability */}
    {[-1, 1].map((side) => (
      <group
        key={`sg-leaf-${side}`}
        position={[side * 0.95, 0, -0.1]}
        rotation={[0, -side * 1.1, 0]}
      >
        <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.9, 3.0, 0.14]} />
          <meshStandardMaterial color="#5a3f29" roughness={0.9} flatShading />
        </mesh>
        {[-0.26, 0.26].map((px) => (
          <mesh key={`sg-plank-${px}`} position={[px, 1.5, 0.08]} castShadow>
            <boxGeometry args={[0.22, 2.9, 0.05]} />
            <meshStandardMaterial color="#6b4a2f" roughness={0.9} flatShading />
          </mesh>
        ))}
        {[0.6, 2.3].map((by) => (
          <mesh key={`sg-band-${by}`} position={[0, by, 0.09]} castShadow>
            <boxGeometry args={[0.88, 0.16, 0.06]} />
            <meshStandardMaterial color="#3f4247" roughness={0.5} metalness={0.6} flatShading />
          </mesh>
        ))}
      </group>
    ))}
  </group>
);

// Arch shape for gatehouse
const Arch = ({ position, width = 1.8, height = 2.8, depth = 1.2 }) => {
  const geo = useMemo(() => {
    const shape = new THREE.Shape();
    const hw = width / 2;
    const straightH = height - hw; // height of straight part
    shape.moveTo(-hw, 0);
    shape.lineTo(-hw, straightH);
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
        const isEdge = Math.abs(x) === 1.5 || Math.abs(z) === 1.5;
        if (!isEdge) return null;
        if ((Math.round(x * 2) + Math.round(z * 2)) % 2 === 0) return null;
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
      <sphereGeometry args={[0.22, 5, 4]} />
      <meshStandardMaterial color="#f0c030" metalness={0.7} roughness={0.2} flatShading />
    </mesh>

    {/* Keep windows */}
    {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((ry, i) => (
      <group key={`kw-${i}`} rotation={[0, ry, 0]}>
        {/* Ground Floor Medieval Entrance Archway (South, East, North, West) */}
        <group position={[0, 0, 2.0]}>
          {/* Stone Entrance Threshold Step */}
          <mesh position={[0, 0.05, 0.25]} castShadow receiveShadow>
            <boxGeometry args={[1.7, 0.1, 0.5]} />
            <meshStandardMaterial color={PALETTE.stoneDark} roughness={0.9} flatShading />
          </mesh>

          {/* Heavy Stone Jamb Pillars */}
          {[-1, 1].map((s) => (
            <mesh key={`kjamb-${s}`} position={[s * 0.75, 1.15, 0.1]} castShadow receiveShadow>
              <boxGeometry args={[0.3, 2.3, 0.45]} />
              <meshStandardMaterial color={PALETTE.stoneDark} roughness={0.9} flatShading />
            </mesh>
          ))}

          {/* Top Stone Keystone Lintel */}
          <mesh position={[0, 2.4, 0.1]} castShadow>
            <boxGeometry args={[1.8, 0.3, 0.5]} />
            <meshStandardMaterial color={PALETTE.stone} roughness={0.8} flatShading />
          </mesh>

          {/* Arched Recess Vault into Keep */}
          <Arch position={[0, 0, -0.1]} width={1.35} height={2.35} depth={0.65} />

          {/* Double Medieval Wooden Doors hinged OPEN against jambs */}
          {[-1, 1].map((side) => (
            <group
              key={`keep-door-leaf-${side}`}
              position={[side * 0.55, 0, -0.05]}
              rotation={[0, -side * 1.0, 0]}
            >
              <mesh position={[0, 1.05, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.55, 2.1, 0.1]} />
                <meshStandardMaterial color="#422d1d" roughness={0.85} flatShading />
              </mesh>
              {/* Vertical Wood Planks */}
              {[-0.14, 0.14].map((px) => (
                <mesh key={`kplank-${px}`} position={[px, 1.05, 0.04]} castShadow>
                  <boxGeometry args={[0.18, 2.05, 0.05]} />
                  <meshStandardMaterial color="#543a26" roughness={0.85} flatShading />
                </mesh>
              ))}
              {/* Iron Banding */}
              {[0.4, 1.6].map((by) => (
                <mesh key={`kband-${by}`} position={[0, by, 0.06]} castShadow>
                  <boxGeometry args={[0.54, 0.12, 0.05]} />
                  <meshStandardMaterial color="#2d2f33" roughness={0.5} metalness={0.7} flatShading />
                </mesh>
              ))}
            </group>
          ))}
        </group>

        {/* Upper Level Windows */}
        <mesh position={[0, 4.8, 2.02]} castShadow>
          <boxGeometry args={[0.5, 0.8, 0.08]} />
          <meshStandardMaterial color={PALETTE.window} roughness={0.1} metalness={0.2} flatShading />
        </mesh>
        <mesh position={[0, 7.8, 1.22]} castShadow>
          <boxGeometry args={[0.4, 0.6, 0.08]} />
          <meshStandardMaterial color={PALETTE.window} roughness={0.1} metalness={0.2} flatShading />
        </mesh>
      </group>
    ))}
  </group>
);

// ─────────────────────────────────────────────
// MOAT WATER RING (Centered exactly at world origin [0,0,0])
// ─────────────────────────────────────────────
export const MoatWaterRing = ({ innerRadius = 1.95, outerRadius = 3.45 }) => (
  <group position={[0, 0, 0]}>
    {/* Water Ring surface.
        thetaStart/thetaLength are spelled out rather than left to RingGeometry's
        defaults so the full 360° sweep is obvious and can't drift. */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.026, 0]} receiveShadow>
      <ringGeometry args={[innerRadius, outerRadius, 96, 1, 0, Math.PI * 2]} />
      <meshStandardMaterial
        color="#4db8ff"
        emissive="#1a8cff"
        emissiveIntensity={0.2}
        roughness={0.1}
        metalness={0.4}
        transparent
        opacity={0.85}
        side={THREE.DoubleSide}
        flatShading
      />
    </mesh>
    {/* Moat bed, just under the water so the ring reads as depth rather than
        a painted-on disc. */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]} receiveShadow>
      <ringGeometry args={[innerRadius - 0.1, outerRadius + 0.1, 96, 1, 0, Math.PI * 2]} />
      <meshStandardMaterial color="#194866" roughness={0.9} flatShading side={THREE.DoubleSide} />
    </mesh>
  </group>
);

// ─────────────────────────────────────────────
// PLANK-STYLE WOODEN BRIDGES (North, South, East, West)
// ─────────────────────────────────────────────
export const PlankBridge = ({ position, rotation = [0, 0, 0], length = 1.6, width = 0.5 }) => (
  <group position={position} rotation={rotation}>
    {/* Bridge deck — stone, matching the ring road's cobble palette */}
    <mesh position={[0, 0.04, 0]} castShadow receiveShadow>
      <boxGeometry args={[width, 0.06, length]} />
      <meshStandardMaterial color={BRIDGE_DECK} roughness={0.9} flatShading />
    </mesh>

    {/* Individual paving slabs across the span */}
    {Array.from({ length: 6 }).map((_, i) => {
      const zPos = -length / 2 + (i + 0.5) * (length / 6);
      return (
        <mesh key={`slab-${i}`} position={[0, 0.075, zPos]} castShadow receiveShadow>
          <boxGeometry args={[width * 0.95, 0.02, length / 7]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? BRIDGE_SLAB_A : BRIDGE_SLAB_B}
            roughness={0.9}
            flatShading
          />
        </mesh>
      );
    })}

    {/* Rail posts & side rails — darker stone */}
    {[-width / 2 + 0.03, width / 2 - 0.03].map((xSide, sideIdx) => (
      <group key={`side-rail-${sideIdx}`}>
        {/* Posts */}
        {[-length / 2.2, 0, length / 2.2].map((zPos, postIdx) => (
          <mesh key={`post-${postIdx}`} position={[xSide, 0.18, zPos]} castShadow>
            <boxGeometry args={[0.05, 0.3, 0.05]} />
            <meshStandardMaterial color={BRIDGE_RAIL} roughness={0.9} flatShading />
          </mesh>
        ))}
        {/* Top handrail */}
        <mesh position={[xSide, 0.3, 0]} castShadow>
          <boxGeometry args={[0.045, 0.035, length]} />
          <meshStandardMaterial color={BRIDGE_RAIL} roughness={0.9} flatShading />
        </mesh>
      </group>
    ))}
  </group>
);

// ═══════════════════════════════════════════════════════════════
// MAIN CASTLE COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function GitVilleTownHall({
  position = [0, 0, 0],
  username,
  isNightMode,
  onCastleClick,
}) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef();

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const target = hovered ? CASTLE_SCALE * 1.07 : CASTLE_SCALE;
    const cur = groupRef.current.scale.x;
    // Settled: skip the write entirely rather than churning the matrix every frame.
    if (Math.abs(target - cur) < 1e-4) return;
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

  // Outer wall layout calculations
  const outerR = 11.7;
  const outerRm = outerR * Math.cos(Math.PI / 6);
  const vertexAngles = useMemo(() => [0, Math.PI / 3, 2 * Math.PI / 3, Math.PI, 4 * Math.PI / 3, 5 * Math.PI / 3], []);
  const midAngles = useMemo(() => [Math.PI / 6, Math.PI / 2, 5 * Math.PI / 6, 7 * Math.PI / 6, 3 * Math.PI / 2, 11 * Math.PI / 6], []);
  const outerRoofColors = useMemo(() => ['#c0392b', '#2c3e80', '#c0392b', '#2c3e80', '#c0392b', '#2c3e80'], []);

  // Fix 7 — the moat, the bridges and the castle group all sit on [0, y, 0] and
  // every radius is derived from CASTLE_SCALE in VillageLayout, so the water ring
  // is always a perfect concentric circle hugging the castle plinth. The old
  // values were computed for scale 0.15 while the castle actually rendered at
  // 0.22, which is why the plinth overhung most of the water.
  return (
    <group position={[position[0], position[1], position[2]]}>
      {/* ── CIRCULAR WATER MOAT ── */}
      <MoatWaterRing innerRadius={MOAT_INNER_R} outerRadius={MOAT_OUTER_R} />

      {/* ── 4 WOODEN BRIDGES, evenly spaced at 0° / 90° / 180° / 270° ── */}
      {/* North Bridge (Z-) */}
      <PlankBridge position={[0, 0, -BRIDGE_MID_R]} rotation={[0, 0, 0]} length={BRIDGE_LENGTH} width={BRIDGE_WIDTH} />
      {/* South Bridge (Z+) */}
      <PlankBridge position={[0, 0, BRIDGE_MID_R]} rotation={[0, Math.PI, 0]} length={BRIDGE_LENGTH} width={BRIDGE_WIDTH} />
      {/* East Bridge (X+) */}
      <PlankBridge position={[BRIDGE_MID_R, 0, 0]} rotation={[0, Math.PI / 2, 0]} length={BRIDGE_LENGTH} width={BRIDGE_WIDTH} />
      {/* West Bridge (X-) */}
      <PlankBridge position={[-BRIDGE_MID_R, 0, 0]} rotation={[0, -Math.PI / 2, 0]} length={BRIDGE_LENGTH} width={BRIDGE_WIDTH} />

      {/* ── CASTLE MODEL (Fix 6 — 1.36× its old scale, the tallest thing here) ── */}
      <group
        ref={groupRef}
        position={[0, 0, 0]}
        scale={[CASTLE_SCALE, CASTLE_SCALE, CASTLE_SCALE]}
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
          if (e.button !== 0) return;
          e.stopPropagation();
          // Focus the castle and open the profile panel; the panel carries the
          // link out to GitHub rather than opening a tab on every stray click.
          onCastleClick?.();
        }}
      >
        {/* ── CASTLE PLATFORM ──
            These discs were 6-sided. Against a perfectly circular moat that made
            the visible water gap swing between 0.20 and 0.74 world units (3.7×)
            around the ring — the water read as lopsided even though it wasn't.
            24 segments keeps the flat-shaded low-poly look while letting the
            moat sit as an even band. The castle's own hexagonal architecture
            (6 outer towers and walls) is untouched. */}
        <group>
          {/* Grass top */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.55, 0]} receiveShadow>
            <circleGeometry args={[12, 24]} />
            <meshStandardMaterial color={PALETTE.grassLight} flatShading roughness={0.9} />
          </mesh>
          {/* Stone base layers */}
          <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[11.8, 12.5, 0.6, 24]} />
            <meshStandardMaterial color={PALETTE.stone} flatShading roughness={0.95} />
          </mesh>
          <mesh position={[0, -0.1, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[12.5, 13.5, 0.6, 24]} />
            <meshStandardMaterial color={PALETTE.stoneDark} flatShading roughness={0.95} />
          </mesh>
        </group>

        {/* ── OUTER WATCHTOWERS ── */}
        {vertexAngles.map((angle, i) => (
          <Tower
            key={`outer-tower-${i}`}
            position={[outerR * Math.cos(angle), 0.5, outerR * Math.sin(angle)]}
            radius={0.75}
            height={4.5}
            roofColor={outerRoofColors[i]}
            doorAngle={i === 0 ? 0 : i === 3 ? Math.PI : null}
          />
        ))}

        {/* ── OUTER PERIMETER WALLS ── */}
        {midAngles.map((angle, i) => {
          if (i === 1 || i === 4) return null;
          return (
            <CastleWall
              key={`outer-wall-${i}`}
              position={[outerRm * Math.cos(angle), 0.5, outerRm * Math.sin(angle)]}
              rotation={[0, Math.PI / 2 - angle, 0]}
              width={11.7}
              height={3.2}
              depth={0.5}
            />
          );
        })}

        {/* Front outer walls (Z+) — split for South gate access */}
        <CastleWall
          position={[-3.65, 0.5, outerRm]}
          rotation={[0, 0, 0]}
          width={4.4}
          height={3.2}
          depth={0.5}
        />
        <CastleWall
          position={[3.65, 0.5, outerRm]}
          rotation={[0, 0, 0]}
          width={4.4}
          height={3.2}
          depth={0.5}
        />

        {/* Back outer walls (Z-) — split for North gate access */}
        <CastleWall
          position={[-3.65, 0.5, -outerRm]}
          rotation={[0, 0, 0]}
          width={4.4}
          height={3.2}
          depth={0.5}
        />
        <CastleWall
          position={[3.65, 0.5, -outerRm]}
          rotation={[0, 0, 0]}
          width={4.4}
          height={3.2}
          depth={0.5}
        />

        {/* ── SOUTH & NORTH OUTER GATEHOUSES ── */}
        {[
          { pos: [0, 0.5, outerRm], rot: [0, 0, 0], key: 'south' },
          { pos: [0, 0.5, -outerRm], rot: [0, Math.PI, 0], key: 'north' },
        ].map((gate) => (
          <group key={`outer-gate-${gate.key}`} position={gate.pos} rotation={gate.rot}>
            {/* Entrance stone apron platform connecting bridge deck smoothly into gate threshold */}
            <mesh position={[0, 0.04, 0.55]} castShadow receiveShadow>
              <boxGeometry args={[2.8, 0.08, 1.4]} />
              <meshStandardMaterial color={PALETTE.stoneDark} roughness={0.9} flatShading />
            </mesh>

            {/* Lintel spanning the pillars, with a crenellated cap */}
            <mesh position={[0, 3.35, 0]} castShadow receiveShadow>
              <boxGeometry args={[3.4, 0.45, 0.75]} />
              <meshStandardMaterial color={PALETTE.stone} roughness={0.85} flatShading />
            </mesh>
            {[-0.7, 0, 0.7].map((x) => (
              <mesh key={`gate-merlon-${x}`} position={[x, 3.8, 0]} castShadow>
                <boxGeometry args={[0.5, 0.45, 0.6]} />
                <meshStandardMaterial color={PALETTE.stoneDark} roughness={0.9} flatShading />
              </mesh>
            ))}

            {/* Arched head tunnel with genuine 3D physical depth */}
            <Arch position={[0, 0, -0.05]} width={2.4} height={3.15} depth={1.2} />

            {/* Raised Iron Portcullis Grate near arch head */}
            <group position={[0, 1.1, 0]}>
              {[-0.8, -0.4, 0, 0.4, 0.8].map((x, i) => (
                <mesh key={`vbar-${i}`} position={[x, 1.4, 0]}>
                  <boxGeometry args={[0.06, 1.6, 0.06]} />
                  <meshStandardMaterial color="#3f4247" metalness={0.7} roughness={0.3} flatShading />
                </mesh>
              ))}
              {[1.5, 2.1].map((y, i) => (
                <mesh key={`hbar-${i}`} position={[0, y, 0]}>
                  <boxGeometry args={[1.7, 0.06, 0.06]} />
                  <meshStandardMaterial color="#3f4247" metalness={0.7} roughness={0.3} flatShading />
                </mesh>
              ))}
            </group>

            {/* Two timber leaves hinged OPEN against the inner jambs */}
            {[-1, 1].map((side) => (
              <group
                key={`gate-leaf-${side}`}
                position={[side * 1.05, 0, -0.05]}
                rotation={[0, -side * 1.1, 0]}
              >
                <mesh position={[0, 1.4, 0]} castShadow receiveShadow>
                  <boxGeometry args={[0.95, 2.8, 0.16]} />
                  <meshStandardMaterial color="#5a3f29" roughness={0.9} flatShading />
                </mesh>
                {/* Vertical planking */}
                {[-0.28, 0.28].map((px) => (
                  <mesh key={`plank-${px}`} position={[px, 1.4, 0.09]} castShadow>
                    <boxGeometry args={[0.22, 2.7, 0.05]} />
                    <meshStandardMaterial color="#6b4a2f" roughness={0.9} flatShading />
                  </mesh>
                ))}
                {/* Iron bands */}
                {[0.6, 2.2].map((by) => (
                  <mesh key={`band-${by}`} position={[0, by, 0.1]} castShadow>
                    <boxGeometry args={[0.92, 0.16, 0.06]} />
                    <meshStandardMaterial color="#3f4247" roughness={0.5} metalness={0.6} flatShading />
                  </mesh>
                ))}
              </group>
            ))}

            {/* Gateway pillars at entrance */}
            {[-1.45, 1.45].map((x, idx) => (
              <group key={`gate-pillar-${idx}`} position={[x, 0, 0]}>
                <mesh position={[0, 1.8, 0]} castShadow receiveShadow>
                  <boxGeometry args={[0.6, 3.6, 0.6]} />
                  <meshStandardMaterial color={PALETTE.stoneDark} roughness={0.9} flatShading />
                </mesh>
                <mesh position={[0, 3.7, 0]} castShadow>
                  <boxGeometry args={[0.8, 0.2, 0.8]} />
                  <meshStandardMaterial color={PALETTE.stone} roughness={0.8} flatShading />
                </mesh>
                <mesh position={[0, 3.95, 0]} castShadow>
                  <sphereGeometry args={[0.2, 5, 4]} />
                  <meshStandardMaterial color="#f0c030" metalness={0.6} roughness={0.3} flatShading />
                </mesh>
              </group>
            ))}
          </group>
        ))}

        {/* Torches on outer perimeter walls */}
        {midAngles.map((angle, i) => {
          if (i === 1) return null;
          const torchR = outerRm + 0.3;
          return (
            <Torch
              key={`outer-torch-${i}`}
              position={[torchR * Math.cos(angle), 2.2, torchR * Math.sin(angle)]}
              rotation={[0, Math.PI / 2 - angle, 0]}
              lit={isNightMode}
            />
          );
        })}

        <Torch position={[-1.45, 2.2, outerRm + 0.35]} light={isNightMode && QUALITY.castleTorchLights} lit={isNightMode} />
        <Torch position={[1.45, 2.2, outerRm + 0.35]} light={isNightMode && QUALITY.castleTorchLights} lit={isNightMode} />

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
            hasRoof={true}
          />
        ))}

        {/* ── DEFENSIVE CANNONS (Mounted on wall embrasures flanking main gates, pointing outward over moat) ── */}
        {[
          { pos: [-3.65, 3.25, outerRm], rotY: 0, key: 'south-left' },
          { pos: [3.65, 3.25, outerRm], rotY: 0, key: 'south-right' },
          { pos: [-3.65, 3.25, -outerRm], rotY: Math.PI, key: 'north-left' },
          { pos: [3.65, 3.25, -outerRm], rotY: Math.PI, key: 'north-right' },
        ].map((c) => (
          <Cannon
            key={`cannon-${c.key}`}
            position={c.pos}
            rotation={[0, c.rotY, 0]}
            scale={0.8}
          />
        ))}

        {/* ── CURTAIN WALLS ──
            All four sides are now split the same way — two 3-wide segments
            leaving a 4-wide break in the middle. The +Z break holds the grand
            gatehouse; the other three hold a SideGate, so the keep has an
            entrance on every side instead of one. */}
        {[
          { rotY: 0, sign: 1, axis: 'z' }, // front (+Z) — gatehouse fills this
          { rotY: Math.PI, sign: -1, axis: 'z' }, // back
          { rotY: Math.PI / 2, sign: 1, axis: 'x' }, // right
          { rotY: -Math.PI / 2, sign: -1, axis: 'x' }, // left
        ].map(({ rotY, sign, axis }, i) => {
          const along = axis === 'z' ? 'x' : 'z';
          const seg = (offset) =>
            axis === 'z'
              ? [offset, 0.5, sign * towerR]
              : [sign * towerR, 0.5, offset];
          return (
            <group key={`curtain-${i}`}>
              <CastleWall
                position={seg(-3.5)}
                rotation={[0, axis === 'z' ? 0 : Math.PI / 2, 0]}
                width={3}
                height={5}
                depth={0.6}
              />
              <CastleWall
                position={seg(3.5)}
                rotation={[0, axis === 'z' ? 0 : Math.PI / 2, 0]}
                width={3}
                height={5}
                depth={0.6}
              />
              {/* The front break is filled by the gatehouse below instead. */}
              {i > 0 && (
                <group position={seg(0)} rotation={[0, rotY, 0]}>
                  <SideGate />
                </group>
              )}
            </group>
          );
        })}

        {/* ── GATEHOUSE ── */}
        <group position={[0, 0.5, towerR]}>
          <mesh position={[-1.5, 3.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.2, 7, 1.4]} />
            <meshStandardMaterial color={PALETTE.stone} roughness={0.85} flatShading />
          </mesh>
          <mesh position={[1.5, 3.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.2, 7, 1.4]} />
            <meshStandardMaterial color={PALETTE.stone} roughness={0.85} flatShading />
          </mesh>
          <ConeRoof position={[-1.5, 7.8, 0]} radius={1} height={1.8} color={PALETTE.townHallRoof} />
          <ConeRoof position={[1.5, 7.8, 0]} radius={1} height={1.8} color={PALETTE.townHallRoof} />
          <mesh position={[0, 6.5, 0]} castShadow>
            <boxGeometry args={[4.2, 0.8, 1.2]} />
            <meshStandardMaterial color={PALETTE.stoneDark} roughness={0.9} flatShading />
          </mesh>
          <Arch position={[0, 0, 0.35]} width={1.6} height={3.2} depth={1.6} />
          <group position={[0, 0, 0.6]}>
            {[-0.55, -0.25, 0, 0.25, 0.55].map((x, i) => (
              <mesh key={`vbar-${i}`} position={[x, 1.5, 0]}>
                <boxGeometry args={[0.06, 3, 0.06]} />
                <meshStandardMaterial color="#4a4a5a" metalness={0.7} roughness={0.3} flatShading />
              </mesh>
            ))}
            {[0.5, 1.2, 1.9, 2.6].map((y, i) => (
              <mesh key={`hbar-${i}`} position={[0, y, 0]}>
                <boxGeometry args={[1.2, 0.06, 0.06]} />
                <meshStandardMaterial color="#4a4a5a" metalness={0.7} roughness={0.3} flatShading />
              </mesh>
            ))}
          </group>
          {[-1, 0, 1].map((x) => (
            <mesh key={`gb-${x}`} position={[x * 0.7, 7.1, 0.5]} castShadow>
              <boxGeometry args={[0.35, 0.5, 0.35]} />
              <meshStandardMaterial color={PALETTE.stone} roughness={0.85} flatShading />
            </mesh>
          ))}
        </group>

        {/* ── CENTRAL KEEP ── */}
        <Keep position={[0, 1.1, 0]} />

        {/* ── WALL TORCHES ── */}
        {/* Wall torches glow via emissive only — the night light budget is spent
            on the gate torches above and the street lamps. */}
        <Torch position={[-3.5, 3.5, towerR + 0.35]} lit={isNightMode} />
        <Torch position={[3.5, 3.5, towerR + 0.35]} lit={isNightMode} />
        <Torch position={[-2.5, 3.5, -towerR - 0.35]} rotation={[0, Math.PI, 0]} lit={isNightMode} />
        <Torch position={[2.5, 3.5, -towerR - 0.35]} rotation={[0, Math.PI, 0]} lit={isNightMode} />
        <Torch position={[-towerR - 0.35, 3.5, -2]} rotation={[0, -Math.PI / 2, 0]} lit={isNightMode} />
        <Torch position={[-towerR - 0.35, 3.5, 2]} rotation={[0, -Math.PI / 2, 0]} lit={isNightMode} />
        <Torch position={[towerR + 0.35, 3.5, -2]} rotation={[0, Math.PI / 2, 0]} lit={isNightMode} />
        <Torch position={[towerR + 0.35, 3.5, 2]} rotation={[0, Math.PI / 2, 0]} lit={isNightMode} />

        {/* ── FLAGS (Physically socketed on real castle towers, keep apex and gatehouse pillars) ── */}
        {/* Central Keep Royal Flag */}
        <Flag position={[0, 11.8, 0]} color="#e8832a" poleHeight={2.6} />
        {/* Corner Tower Banners */}
        <Flag position={[cornerPositions[0][0], 10.7, cornerPositions[0][2]]} color="#e8832a" poleHeight={2.2} />
        <Flag position={[cornerPositions[1][0], 10.7, cornerPositions[1][2]]} color="#f0c030" poleHeight={2.2} />
        <Flag position={[cornerPositions[2][0], 10.7, cornerPositions[2][2]]} color="#4a90d9" poleHeight={2.2} />
        <Flag position={[cornerPositions[3][0], 10.7, cornerPositions[3][2]]} color="#d94a4a" poleHeight={2.2} />

        {/* ── COURTYARD DECORATION ── */}
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
    </group>
  );
}

