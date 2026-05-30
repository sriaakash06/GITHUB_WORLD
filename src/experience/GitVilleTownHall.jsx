import React, { useMemo, useState, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { PALETTE } from './Constants';

// ── Helpers ────────────────────────────────────────────────────────────────

const StoneMat = ({ color = '#7a7280', roughness = 0.95 }) => (
  <meshStandardMaterial color={color} roughness={roughness} flatShading />
);

// Triangular prism — used for conical-style pointed roofs
const PrismRoof = ({ width, depth, height, color, position, rotation = [0, 0, 0] }) => {
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
    <mesh position={position} rotation={rotation} castShadow receiveShadow geometry={geometry}>
      <meshStandardMaterial color={color} roughness={0.75} flatShading />
    </mesh>
  );
};

// Cone roof for round towers
const ConeRoof = ({ radius, height, color, position }) => (
  <mesh position={position} castShadow>
    <coneGeometry args={[radius, height, 8]} />
    <meshStandardMaterial color={color} roughness={0.7} flatShading />
  </mesh>
);

// Single merlon (upright block on a battlement)
const Merlon = ({ position }) => (
  <mesh position={position} castShadow receiveShadow>
    <boxGeometry args={[0.55, 0.9, 0.55]} />
    <StoneMat color="#6a6070" />
  </mesh>
);

// Row of merlons along one wall edge
const BattlementRow = ({ count, startX, y, z, spacingX = 1.2, depth = 0.55 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <Merlon key={i} position={[startX + i * spacingX, y, z]} />
    ))}
  </>
);

// Arched window (box + half-cylinder arch)
const CastleWindow = ({ position, rotation = [0, 0, 0], lit = true }) => {
  const glowColor = lit ? '#ffcc66' : '#1a1020';
  return (
    <group position={position} rotation={rotation}>
      {/* Frame */}
      <mesh castShadow>
        <boxGeometry args={[0.7, 1.1, 0.15]} />
        <meshStandardMaterial color="#3a2e28" flatShading />
      </mesh>
      {/* Glass pane */}
      <mesh position={[0, 0, 0.05]}>
        <boxGeometry args={[0.5, 0.85, 0.06]} />
        <meshStandardMaterial color={glowColor} emissive={lit ? '#aa7700' : '#000'} emissiveIntensity={lit ? 0.6 : 0} roughness={0.1} metalness={0.2} flatShading />
      </mesh>
      {/* Arch cap */}
      <mesh position={[0, 0.55, 0.05]}>
        <cylinderGeometry args={[0.25, 0.25, 0.06, 8, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color={glowColor} emissive={lit ? '#aa7700' : '#000'} emissiveIntensity={lit ? 0.5 : 0} roughness={0.1} flatShading />
      </mesh>
      {/* Cross mullion */}
      <mesh position={[0, 0.1, 0.09]}>
        <boxGeometry args={[0.06, 0.8, 0.04]} />
        <meshStandardMaterial color="#2a1a10" flatShading />
      </mesh>
      <mesh position={[0, 0.1, 0.09]}>
        <boxGeometry args={[0.5, 0.06, 0.04]} />
        <meshStandardMaterial color="#2a1a10" flatShading />
      </mesh>
    </group>
  );
};

// Animated flag on a pole
const CastleFlag = ({ position, color = '#cc3333', waveOffset = 0 }) => {
  const flagRef = useRef();
  useFrame(({ clock }) => {
    if (!flagRef.current) return;
    flagRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 1.8 + waveOffset) * 0.25;
    flagRef.current.position.x = Math.sin(clock.getElapsedTime() * 1.8 + waveOffset) * 0.1;
  });
  return (
    <group position={position}>
      {/* Pole */}
      <mesh castShadow>
        <cylinderGeometry args={[0.06, 0.06, 3.5, 6]} />
        <meshStandardMaterial color="#5a4030" flatShading />
      </mesh>
      {/* Banner */}
      <group ref={flagRef} position={[0.55, 1.2, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.1, 0.65, 0.06]} />
          <meshStandardMaterial color={color} flatShading />
        </mesh>
        {/* Emblem stripe */}
        <mesh position={[0, 0, 0.04]}>
          <boxGeometry args={[0.18, 0.65, 0.02]} />
          <meshStandardMaterial color="#f0d080" flatShading />
        </mesh>
      </group>
    </group>
  );
};

// Round tower with cone roof, battlements, windows
const RoundTower = ({ position, radius = 1.6, height = 7, roofColor = '#2a1810', lit = true }) => {
  const battleCount = 8;
  const battleR = radius + 0.1;
  return (
    <group position={position}>
      {/* Shaft */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius * 1.1, height, 10]} />
        <StoneMat color="#6e6878" />
      </mesh>
      {/* Battlement ring */}
      <mesh position={[0, height / 2 + 0.3, 0]} castShadow>
        <cylinderGeometry args={[battleR, battleR, 0.5, 10]} />
        <StoneMat color="#625c6c" />
      </mesh>
      {Array.from({ length: battleCount }).map((_, i) => {
        const angle = (i / battleCount) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * battleR, height / 2 + 0.8, Math.sin(angle) * battleR]} castShadow>
            <boxGeometry args={[0.5, 0.9, 0.5]} />
            <StoneMat color="#6a6070" />
          </mesh>
        );
      })}
      {/* Windows (3 at different heights & angles) */}
      {[0, 1, 2].map((row) =>
        [0, Math.PI * 0.6, Math.PI * 1.2].map((angle, j) => (
          <CastleWindow
            key={`${row}-${j}`}
            position={[Math.cos(angle + row * 0.8) * (radius + 0.05), -height * 0.1 + row * 2.0, Math.sin(angle + row * 0.8) * (radius + 0.05)]}
            rotation={[0, angle + row * 0.8 + Math.PI, 0]}
            lit={lit && (row + j) % 2 === 0}
          />
        ))
      )}
      {/* Cone roof */}
      <ConeRoof radius={radius + 0.5} height={3.2} color={roofColor} position={[0, height / 2 + 0.8, 0]} />
    </group>
  );
};

// Square keep / main body with battlements on all 4 sides
const SquareKeep = ({ position, width, depth, height, wallColor = '#78707e', trimColor = '#5c5566', roofColor = '#2a1810' }) => {
  const hw = width / 2, hd = depth / 2;
  const mCount = Math.floor(width / 1.4);
  const dCount = Math.floor(depth / 1.4);
  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <StoneMat color={wallColor} />
      </mesh>
      {/* Top trim ledge */}
      <mesh position={[0, height / 2 + 0.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[width + 0.4, 0.3, depth + 0.4]} />
        <StoneMat color={trimColor} />
      </mesh>
      {/* Battlements – all 4 sides */}
      <BattlementRow count={mCount} startX={-hw + 0.3} y={height / 2 + 0.75} z={hd + 0.15} spacingX={width / mCount} />
      <BattlementRow count={mCount} startX={-hw + 0.3} y={height / 2 + 0.75} z={-hd - 0.15} spacingX={width / mCount} />
      <BattlementRow count={dCount} startX={hw + 0.15} y={height / 2 + 0.75} z={-hd + 0.3} spacingX={0} depth={depth / dCount} />
      {Array.from({ length: dCount }).map((_, i) => (
        <Merlon key={i} position={[-hw - 0.15, height / 2 + 0.75, -hd + 0.3 + i * (depth / dCount)]} />
      ))}
    </group>
  );
};

// Portcullis gate
const Portcullis = ({ position }) => (
  <group position={position}>
    {/* Arch surround */}
    <mesh castShadow>
      <boxGeometry args={[2.8, 3.8, 0.5]} />
      <StoneMat color="#5a5464" />
    </mesh>
    {/* Opening */}
    <mesh position={[0, -0.3, 0.1]}>
      <boxGeometry args={[1.8, 3.0, 0.6]} />
      <meshStandardMaterial color="#0d0a0e" flatShading />
    </mesh>
    {/* Arch cap */}
    <mesh position={[0, 1.2, 0.1]}>
      <cylinderGeometry args={[0.9, 0.9, 0.6, 12, 1, false, 0, Math.PI]} />
      <meshStandardMaterial color="#0d0a0e" flatShading />
    </mesh>
    {/* Portcullis bars */}
    {[-0.55, 0, 0.55].map((bx, i) => (
      <mesh key={i} position={[bx, -0.3, 0.22]}>
        <boxGeometry args={[0.1, 2.8, 0.08]} />
        <meshStandardMaterial color="#3a2820" flatShading metalness={0.4} roughness={0.6} />
      </mesh>
    ))}
    {[-0.4, 0.4, 1.1].map((by, i) => (
      <mesh key={i} position={[0, by - 0.8, 0.22]}>
        <boxGeometry args={[1.6, 0.1, 0.08]} />
        <meshStandardMaterial color="#3a2820" flatShading metalness={0.4} roughness={0.6} />
      </mesh>
    ))}
    {/* Keystone */}
    <mesh position={[0, 1.2, -0.05]}>
      <boxGeometry args={[0.5, 0.4, 0.6]} />
      <StoneMat color="#6e6070" />
    </mesh>
  </group>
);

// Drawbridge
const Drawbridge = ({ position }) => (
  <group position={position} rotation={[-0.08, 0, 0]}>
    <mesh castShadow receiveShadow>
      <boxGeometry args={[1.6, 0.18, 3.0]} />
      <meshStandardMaterial color="#4a3520" flatShading roughness={0.95} />
    </mesh>
    {/* Planks */}
    {[-0.5, 0, 0.5].map((px, i) => (
      <mesh key={i} position={[px, 0.1, 0]} castShadow>
        <boxGeometry args={[0.45, 0.06, 2.8]} />
        <meshStandardMaterial color="#3a2810" flatShading roughness={0.98} />
      </mesh>
    ))}
    {/* Chains */}
    {[-0.7, 0.7].map((cx, i) => (
      <mesh key={i} position={[cx, 0.2, -1.0]}>
        <cylinderGeometry args={[0.04, 0.04, 2.8, 4]} />
        <meshStandardMaterial color="#5a5050" flatShading metalness={0.5} />
      </mesh>
    ))}
  </group>
);

// Torch bracket with emissive glow
const Torch = ({ position }) => (
  <group position={position}>
    <mesh castShadow>
      <cylinderGeometry args={[0.07, 0.07, 0.6, 5]} />
      <meshStandardMaterial color="#5a3a20" flatShading />
    </mesh>
    <mesh position={[0, 0.4, 0]}>
      <sphereGeometry args={[0.15, 6, 6]} />
      <meshStandardMaterial color="#ff9920" emissive="#ff6600" emissiveIntensity={1.8} flatShading />
    </mesh>
  </group>
);

// Raised hexagonal stone platform
const CastlePlatform = () => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.62, 0]} receiveShadow>
      <circleGeometry args={[14, 6]} />
      <meshStandardMaterial color="#4a4050" flatShading roughness={0.95} />
    </mesh>
    <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[13.5, 14.5, 0.5, 6]} />
      <StoneMat color="#3e3848" />
    </mesh>
    <mesh position={[0, -0.05, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[14.5, 15.5, 0.6, 6]} />
      <StoneMat color="#34303c" />
    </mesh>
  </group>
);

// ── Main Component ─────────────────────────────────────────────────────────

export default function GitVilleTownHall({ position = [0, 0, 0], username }) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef();

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const target = hovered ? 0.47 : 0.44;
    const cur = groupRef.current.scale.x;
    const next = cur + (target - cur) * Math.min(delta * 10, 1);
    groupRef.current.scale.set(next, next, next);
  });

  const handlers = {
    onPointerOver: (e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; },
    onPointerOut: () => { setHovered(false); document.body.style.cursor = 'default'; },
    onPointerUp: (e) => {
      e.stopPropagation();
      const url = username ? `https://github.com/${username}` : 'https://github.com';
      window.open(url, '_blank', 'noopener,noreferrer');
    },
  };

  const DARK_STONE = '#5c5466';
  const MID_STONE = '#78707e';
  const LIGHT_STONE = '#8a8292';
  const ROOF_COLOR = '#2a1810';
  const ROOF_DARK = '#1e1008';

  return (
    <group ref={groupRef} position={position} scale={[0.44, 0.44, 0.44]} {...handlers}>

      {/* ── PLATFORM ── */}
      <CastlePlatform />

      {/* ── OUTER CURTAIN WALL (ring) ── */}
      {/* Front wall (south) */}
      <mesh position={[0, 2.0, 8.5]} castShadow receiveShadow>
        <boxGeometry args={[18, 4.0, 0.8]} />
        <StoneMat color={DARK_STONE} />
      </mesh>
      <BattlementRow count={12} startX={-8.2} y={4.3} z={8.5} spacingX={1.4} />

      {/* Back wall (north) */}
      <mesh position={[0, 2.0, -8.5]} castShadow receiveShadow>
        <boxGeometry args={[18, 4.0, 0.8]} />
        <StoneMat color={DARK_STONE} />
      </mesh>
      <BattlementRow count={12} startX={-8.2} y={4.3} z={-8.5} spacingX={1.4} />

      {/* Left wall (west) */}
      <mesh position={[-8.5, 2.0, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 4.0, 18]} />
        <StoneMat color={DARK_STONE} />
      </mesh>
      {Array.from({ length: 10 }).map((_, i) => (
        <Merlon key={i} position={[-8.5, 4.3, -6.3 + i * 1.4]} />
      ))}

      {/* Right wall (east) */}
      <mesh position={[8.5, 2.0, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 4.0, 18]} />
        <StoneMat color={DARK_STONE} />
      </mesh>
      {Array.from({ length: 10 }).map((_, i) => (
        <Merlon key={i} position={[8.5, 4.3, -6.3 + i * 1.4]} />
      ))}

      {/* ── GATEHOUSE (south centre) ── */}
      {/* Left gatehouse tower stub */}
      <mesh position={[-1.8, 3.2, 9.2]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 6.4, 2.2]} />
        <StoneMat color={MID_STONE} />
      </mesh>
      {/* Right gatehouse tower stub */}
      <mesh position={[1.8, 3.2, 9.2]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 6.4, 2.2]} />
        <StoneMat color={MID_STONE} />
      </mesh>
      {/* Gatehouse lintel */}
      <mesh position={[0, 5.5, 9.2]} castShadow receiveShadow>
        <boxGeometry args={[5.5, 1.0, 2.2]} />
        <StoneMat color={MID_STONE} />
      </mesh>

      {/* Portcullis */}
      <Portcullis position={[0, 2.5, 9.0]} />

      {/* Drawbridge */}
      <Drawbridge position={[0, 0.75, 11.2]} />

      {/* Gatehouse battlements */}
      {[-2.4, -1.2, 0, 1.2, 2.4].map((bx, i) => <Merlon key={i} position={[bx, 6.3, 9.2]} />)}

      {/* ── CORNER ROUND TOWERS ── */}
      <RoundTower position={[-8.5, 0.65, -8.5]} radius={2.0} height={9} roofColor={ROOF_COLOR} lit />
      <RoundTower position={[8.5, 0.65, -8.5]} radius={2.0} height={9} roofColor={ROOF_COLOR} lit={false} />
      <RoundTower position={[-8.5, 0.65, 8.5]} radius={2.0} height={9} roofColor={ROOF_COLOR} lit={false} />
      <RoundTower position={[8.5, 0.65, 8.5]} radius={2.0} height={9} roofColor={ROOF_COLOR} lit />

      {/* ── INNER COURTYARD (ground) ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.68, 0]} receiveShadow>
        <planeGeometry args={[15, 15]} />
        <meshStandardMaterial color="#2e2830" flatShading roughness={0.98} />
      </mesh>

      {/* ── MAIN KEEP ── */}
      {/* Base plinth */}
      <mesh position={[0, 1.5, -1.0]} castShadow receiveShadow>
        <boxGeometry args={[9, 3.0, 9]} />
        <StoneMat color={DARK_STONE} />
      </mesh>
      {/* Keep body */}
      <SquareKeep
        position={[0, 6.5, -1.0]}
        width={8} depth={8} height={8}
        wallColor={LIGHT_STONE}
        trimColor={MID_STONE}
        roofColor={ROOF_COLOR}
      />
      {/* Keep windows – all 4 faces */}
      {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((ry, fi) =>
        [0, 1].map((row) => (
          <CastleWindow
            key={`kw-${fi}-${row}`}
            position={[
              Math.sin(ry) * 4.05,
              4.5 + row * 2.8,
              Math.cos(ry) * 4.05 - 1.0,
            ]}
            rotation={[0, ry + Math.PI, 0]}
            lit={fi % 2 === row % 2}
          />
        ))
      )}

      {/* ── KEEP ROOF (hip / pyramid) ── */}
      {/* Four prism sections forming a hip roof */}
      <PrismRoof width={8.2} depth={8.2} height={3.5} color={ROOF_COLOR} position={[0, 10.5, -1.0]} />
      <PrismRoof width={8.2} depth={8.2} height={3.5} color={ROOF_COLOR} position={[0, 10.5, -1.0]} rotation={[0, Math.PI, 0]} />
      {/* Ridge */}
      <mesh position={[0, 13.8, -1.0]} castShadow>
        <boxGeometry args={[0.5, 0.4, 8.4]} />
        <meshStandardMaterial color={ROOF_DARK} flatShading />
      </mesh>
      {/* Roof finial */}
      <mesh position={[0, 14.3, -1.0]} castShadow>
        <coneGeometry args={[0.3, 1.2, 6]} />
        <meshStandardMaterial color="#e0c060" flatShading metalness={0.6} />
      </mesh>

      {/* ── KEEP CORNER TURRETS ── */}
      {[[-3.8, -4.8], [3.8, -4.8], [-3.8, 2.8], [3.8, 2.8]].map(([tx, tz], i) => (
        <group key={i} position={[tx, 10.5, tz]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.75, 0.85, 2.2, 8]} />
            <StoneMat color={MID_STONE} />
          </mesh>
          {/* Turret battlements */}
          {[0, 1, 2, 3, 4, 5, 6, 7].map((m) => (
            <mesh key={m} position={[Math.cos(m / 8 * Math.PI * 2) * 0.85, 1.35, Math.sin(m / 8 * Math.PI * 2) * 0.85]} castShadow>
              <boxGeometry args={[0.28, 0.7, 0.28]} />
              <StoneMat color="#6a6070" />
            </mesh>
          ))}
          <ConeRoof radius={1.0} height={2.0} color={ROOF_COLOR} position={[0, 1.9, 0]} />
        </group>
      ))}

      {/* ── FLAGS on corner towers & keep ── */}
      <CastleFlag position={[-8.5, 10.3, -8.5]} color="#cc3333" waveOffset={0.0} />
      <CastleFlag position={[8.5, 10.3, -8.5]} color="#2266aa" waveOffset={1.1} />
      <CastleFlag position={[-8.5, 10.3, 8.5]} color="#ddaa22" waveOffset={2.2} />
      <CastleFlag position={[8.5, 10.3, 8.5]} color="#44aa44" waveOffset={3.3} />
      <CastleFlag position={[0, 15.8, -1.0]} color="#cc3333" waveOffset={0.5} />

      {/* ── TORCHES ── */}
      {[[-4, 9.2], [4, 9.2], [-4, -7.2], [4, -7.2]].map(([tx, tz], i) => (
        <Torch key={i} position={[tx, 3.6, tz]} />
      ))}
      {/* Gatehouse torches */}
      <Torch position={[-2.8, 4.2, 9.6]} />
      <Torch position={[2.8, 4.2, 9.6]} />

      {/* ── TORCH POINT LIGHTS ── */}
      <pointLight position={[0, 4.5, 9.5]} color="#ff9920" intensity={1.2} distance={8} decay={2} />
      <pointLight position={[-4, 4.0, -8]} color="#ff8810" intensity={0.8} distance={7} decay={2} />
      <pointLight position={[4, 4.0, -8]} color="#ff8810" intensity={0.8} distance={7} decay={2} />

      {/* ── PORCH STEPS ── */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0, 0.72 + i * 0.22, 10.5 - i * 0.5]} castShadow receiveShadow>
          <boxGeometry args={[3.2 - i * 0.2, 0.22, 0.55]} />
          <StoneMat color={DARK_STONE} />
        </mesh>
      ))}

      {/* ── WALL WALK TORCHES ── */}
      {[-6, -3, 3, 6].map((wx, i) => (
        <Torch key={i} position={[wx, 4.6, 8.6]} />
      ))}

    </group>
  );
}