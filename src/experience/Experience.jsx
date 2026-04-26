import React, { useMemo, useRef, useEffect } from 'react';
import { OrbitControls, ContactShadows, Float, SoftShadows } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';

import { Building } from './Building';
import { Tree } from './Tree';
import GitVilleTownHall from './GitVilleTownHall';
import { PALETTE, ROOF_COLORS } from './Constants';

// ─────────────────────────────────────────────
// CLOUD  – puffy low-poly overlapping spheres
// ─────────────────────────────────────────────
const Cloud = ({ position, scale = 1 }) => (
  <Float speed={1.2} rotationIntensity={0.1} floatIntensity={0.6}>
    <group position={position} scale={scale}>
      <mesh castShadow>
        <sphereGeometry args={[1.3, 7, 7]} />
        <meshStandardMaterial color="#ffffff" roughness={1} flatShading />
      </mesh>
      <mesh position={[-1.1, -0.25, 0.1]} castShadow>
        <sphereGeometry args={[0.95, 7, 7]} />
        <meshStandardMaterial color="#f8f8f8" roughness={1} flatShading />
      </mesh>
      <mesh position={[1.1, -0.2, -0.15]} castShadow>
        <sphereGeometry args={[0.95, 7, 7]} />
        <meshStandardMaterial color="#f8f8f8" roughness={1} flatShading />
      </mesh>
      <mesh position={[0.45, 0.55, 0.4]} castShadow>
        <sphereGeometry args={[0.78, 6, 6]} />
        <meshStandardMaterial color="#ffffff" roughness={1} flatShading />
      </mesh>
      <mesh position={[-0.5, 0.45, -0.35]} castShadow>
        <sphereGeometry args={[0.72, 6, 6]} />
        <meshStandardMaterial color="#efefef" roughness={1} flatShading />
      </mesh>
    </group>
  </Float>
);

// ─────────────────────────────────────────────
// HOT AIR BALLOON
// ─────────────────────────────────────────────
const HotAirBalloon = ({ position, color, scale = 1 }) => (
  <Float speed={1.5} rotationIntensity={0.2} floatIntensity={1.5}>
    <group position={position} scale={scale}>
      <mesh castShadow>
        <sphereGeometry args={[2, 16, 16]} />
        <meshStandardMaterial color={color} roughness={0.6} flatShading />
      </mesh>
      <mesh position={[0, -2.5, 0]} castShadow>
        <boxGeometry args={[0.8, 0.6, 0.8]} />
        <meshStandardMaterial color="#8b4513" roughness={0.9} flatShading />
      </mesh>
      {[[-0.35, -0.35], [0.35, -0.35], [-0.35, 0.35], [0.35, 0.35]].map(([x, z], i) => (
        <mesh key={i} position={[x, -1.5, z]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 1.6]} />
          <meshStandardMaterial color="#2d3436" flatShading />
        </mesh>
      ))}
    </group>
  </Float>
);

// ─────────────────────────────────────────────
// HEXAGONAL TERRAIN
// ─────────────────────────────────────────────
const HexTerrain = () => {
  return (
    <group>
      {/* Main hex grass layer */}
      <mesh rotation={[0, Math.PI / 6, 0]} position={[0, -0.05, 0]} receiveShadow>
        <cylinderGeometry args={[62, 62, 0.6, 6]} />
        <meshStandardMaterial color={PALETTE.grass[0]} roughness={0.95} flatShading />
      </mesh>

      {/* Edge bevel layer */}
      <mesh rotation={[0, Math.PI / 6, 0]} position={[0, -0.5, 0]} receiveShadow>
        <cylinderGeometry args={[62, 58, 0.7, 6]} />
        <meshStandardMaterial color={PALETTE.hexBase} roughness={0.95} flatShading />
      </mesh>

      {/* Floating Island Base (Inverted Cone) */}
      <mesh rotation={[0, Math.PI / 6, 0]} position={[0, -10.85, 0]} receiveShadow>
        <cylinderGeometry args={[58, 5, 20, 6]} />
        <meshStandardMaterial color={PALETTE.hexEdge} roughness={0.95} flatShading />
      </mesh>

      {/* Grass surface plane on top */}
      <mesh rotation={[0, Math.PI / 6, 0]} position={[0, 0.25, 0]} receiveShadow>
        <cylinderGeometry args={[61, 62, 0.05, 6]} />
        <meshStandardMaterial color={PALETTE.grassLight} roughness={0.9} flatShading />
      </mesh>

      {/* Sparkling River */}
      <mesh rotation={[-Math.PI / 2, 0, Math.PI / 8]} position={[0, 0.28, 0]} receiveShadow>
        <planeGeometry args={[140, 8]} />
        <meshStandardMaterial color={PALETTE.water} roughness={0.1} metalness={0.4} flatShading transparent opacity={0.85} />
      </mesh>
    </group>
  );
};

// ─────────────────────────────────────────────
// VILLAGE PATHS  – circular rings + cross paths
// ─────────────────────────────────────────────
const VillagePaths = ({ rings }) => {
  const ringCount = Math.max(rings, 2);

  return (
    <group>
      {/* Central cobblestone plaza */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.26, 0]} receiveShadow>
        <circleGeometry args={[8.5, 32]} />
        <meshStandardMaterial color={PALETTE.road} roughness={0.95} flatShading />
      </mesh>
      {/* Plaza inner detail ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.261, 0]} receiveShadow>
        <ringGeometry args={[5.5, 6, 32]} />
        <meshStandardMaterial color={PALETTE.roadDark} roughness={0.95} flatShading />
      </mesh>

      {/* Circular ring roads */}
      {Array.from({ length: ringCount }).map((_, r) => {
        const radius = (r + 1) * 14;
        return (
          <mesh key={`ring-${r}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.262, 0]} receiveShadow>
            <ringGeometry args={[radius - 1.2, radius + 1.2, 72]} />
            <meshStandardMaterial color={PALETTE.road} roughness={0.95} flatShading />
          </mesh>
        );
      })}

      {/* Cross straight paths – X axis */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.263, 0]} receiveShadow>
        <planeGeometry args={[ringCount * 14 * 2 + 4, 2.5]} />
        <meshStandardMaterial color={PALETTE.road} roughness={0.95} flatShading />
      </mesh>
      {/* Cross straight paths – Z axis */}
      <mesh rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[0, 0.263, 0]} receiveShadow>
        <planeGeometry args={[ringCount * 14 * 2 + 4, 2.5]} />
        <meshStandardMaterial color={PALETTE.road} roughness={0.95} flatShading />
      </mesh>

      {/* Diagonal paths for charm */}
      {[Math.PI / 4, -Math.PI / 4].map((angle, i) => (
        <mesh key={`diag-${i}`} rotation={[-Math.PI / 2, 0, angle]} position={[0, 0.262, 0]} receiveShadow>
          <planeGeometry args={[ringCount * 14 * 2 + 4, 1.6]} />
          <meshStandardMaterial color={PALETTE.roadDark} roughness={0.95} flatShading transparent opacity={0.7} />
        </mesh>
      ))}
    </group>
  );
};

// ─────────────────────────────────────────────
// DECORATIVE WELL  (village charm)
// ─────────────────────────────────────────────
const Well = ({ position }) => (
  <group position={position}>
    <mesh castShadow receiveShadow>
      <cylinderGeometry args={[0.5, 0.55, 0.7, 8]} />
      <meshStandardMaterial color={PALETTE.stoneDark} roughness={0.9} flatShading />
    </mesh>
    <mesh position={[0, 0.45, 0]} castShadow>
      <cylinderGeometry args={[0.52, 0.52, 0.1, 8]} />
      <meshStandardMaterial color={PALETTE.stone} roughness={0.9} flatShading />
    </mesh>
    {/* Crossbeam */}
    <mesh position={[0, 1.0, 0]} castShadow>
      <boxGeometry args={[1.2, 0.12, 0.12]} />
      <meshStandardMaterial color={PALETTE.wood} roughness={0.9} flatShading />
    </mesh>
    {/* Posts */}
    {[[-0.5, 0, 0], [0.5, 0, 0]].map(([x, y, z], i) => (
      <mesh key={i} position={[x, 0.6, z]} castShadow>
        <boxGeometry args={[0.1, 1.2, 0.1]} />
        <meshStandardMaterial color={PALETTE.wood} roughness={0.9} flatShading />
      </mesh>
    ))}
    {/* Bucket */}
    <mesh position={[0.1, 0.75, 0]} castShadow>
      <cylinderGeometry args={[0.1, 0.12, 0.22, 6]} />
      <meshStandardMaterial color="#8b4513" roughness={0.85} flatShading />
    </mesh>
  </group>
);

// ─────────────────────────────────────────────
// LAMP POST
// ─────────────────────────────────────────────
const LampPost = ({ position }) => (
  <group position={position}>
    <mesh castShadow>
      <cylinderGeometry args={[0.06, 0.08, 2.8, 6]} />
      <meshStandardMaterial color="#4a4a5a" roughness={0.5} metalness={0.4} flatShading />
    </mesh>
    <mesh position={[0.35, 1.2, 0]} castShadow>
      <boxGeometry args={[0.7, 0.06, 0.06]} />
      <meshStandardMaterial color="#4a4a5a" roughness={0.5} metalness={0.4} flatShading />
    </mesh>
    <mesh position={[0.7, 1.15, 0]} castShadow>
      <sphereGeometry args={[0.18, 7, 7]} />
      <meshStandardMaterial color="#fff8d0" emissive="#ffe890" emissiveIntensity={0.6} flatShading />
    </mesh>
  </group>
);

// ─────────────────────────────────────────────
// FENCE SEGMENT
// ─────────────────────────────────────────────
const FenceSegment = ({ position, rotation = [0, 0, 0] }) => (
  <group position={position} rotation={rotation}>
    {/* Rails */}
    <mesh position={[0, 0.65, 0]} castShadow>
      <boxGeometry args={[2.0, 0.08, 0.06]} />
      <meshStandardMaterial color="#d4b896" roughness={0.9} flatShading />
    </mesh>
    <mesh position={[0, 0.4, 0]} castShadow>
      <boxGeometry args={[2.0, 0.08, 0.06]} />
      <meshStandardMaterial color="#d4b896" roughness={0.9} flatShading />
    </mesh>
    {/* Posts */}
    {[-0.85, 0, 0.85].map((x, i) => (
      <mesh key={i} position={[x, 0.4, 0]} castShadow>
        <boxGeometry args={[0.08, 0.85, 0.08]} />
        <meshStandardMaterial color="#c4a880" roughness={0.9} flatShading />
      </mesh>
    ))}
  </group>
);

// ─────────────────────────────────────────────
// MAIN EXPERIENCE
// ─────────────────────────────────────────────
export const Experience = ({ repos, isCinematic, setHoveredRepo }) => {
  const controlsRef = useRef();
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(55, 55, 55);
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 3, 0);
      controlsRef.current.update();
    }

    const onReset = () => {
      gsap.to(camera.position, { x: 55, y: 55, z: 55, duration: 1.5, ease: 'power3.out' });
      if (controlsRef.current) {
        gsap.to(controlsRef.current.target, { x: 0, y: 3, z: 0, duration: 1.5 });
      }
    };

    window.addEventListener('reset-camera', onReset);
    return () => window.removeEventListener('reset-camera', onReset);
  }, [camera]);

  // ── House placements in two concentric rings ──
  const buildingPlacements = useMemo(() => {
    return repos.slice(0, 50).map((repo, i) => {
      const ring   = Math.floor(i / 10) + 1;    // ring 1 or 2 (up to 5 rings)
      const count  = Math.min(repos.length - (ring - 1) * 10, 10);
      const angle  = (i % 10) / 10 * Math.PI * 2;
      const radius = ring * 14;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      return {
        ...repo,
        position:  [x, 0.28, z],
        rotation:  [0, -angle + Math.PI / 2, 0],
        index: i,
      };
    });
  }, [repos]);

  // ── Static GitVille assets (trees, wells, lamps, fence) ──
  const staticAssets = useMemo(() => {
    const seed = (n) => Math.abs(Math.sin(n * 9301 + 49297) * 233280) % 1;

    // Trees – scattered around outside rings and between houses
    const trees = [];
    for (let i = 0; i < 55; i++) {
      const angle  = seed(i) * Math.PI * 2;
      const minR   = 28 + (i % 3) * 8;
      const radius = minR + seed(i + 100) * 18;
      trees.push({
        position: [Math.cos(angle) * radius, 0.28, Math.sin(angle) * radius],
        scale:    0.55 + seed(i + 200) * 0.7,
      });
    }

    // Also scatter some trees between ring 1 and ring 2
    for (let i = 0; i < 14; i++) {
      const angle  = (i / 14) * Math.PI * 2 + 0.3;
      const radius = 9 + seed(i + 300) * 2.5;
      trees.push({
        position: [Math.cos(angle) * radius, 0.28, Math.sin(angle) * radius],
        scale:    0.4 + seed(i + 400) * 0.35,
      });
    }

    // Wells – a few scattered near paths
    const wells = [
      [7, 0.28, 0],
      [-7, 0.28, 0],
      [0, 0.28, 7],
    ];

    // Lamp posts – placed along the cross paths
    const lamps = [];
    for (let d = 10; d <= 30; d += 6) {
      lamps.push([d, 0.3, 0], [-d, 0.3, 0], [0, 0.3, d], [0, 0.3, -d]);
    }

    // Fence ring around center platform
    const fences = [];
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2;
      const r = 13.2;
      fences.push({
        position: [Math.cos(a) * r, 0.28, Math.sin(a) * r],
        rotation: [0, a + Math.PI / 2, 0],
      });
    }

    // Clouds
    const clouds = [];
    const cloudSeeds = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    cloudSeeds.forEach((n) => {
      const angle  = seed(n + 50) * Math.PI * 2;
      const radius = 25 + seed(n + 60) * 45;
      clouds.push({
        position: [Math.cos(angle) * radius, 18 + seed(n + 70) * 8, Math.sin(angle) * radius],
        scale:    0.9 + seed(n + 80) * 1.2,
      });
    });

    // Balloons
    const balloons = [];
    const balloonColors = ['#ff4444', '#ffcc00', '#44aaff', '#ff77bb'];
    for (let i = 0; i < 7; i++) {
      const angle = seed(i + 900) * Math.PI * 2;
      const radius = 15 + seed(i + 1000) * 45;
      balloons.push({
        position: [Math.cos(angle) * radius, 12 + seed(i + 1100) * 12, Math.sin(angle) * radius],
        scale: 0.7 + seed(i + 1200) * 0.6,
        color: balloonColors[i % balloonColors.length],
      });
    }

    return { trees, wells, lamps, fences, clouds, balloons };
  }, []);

  const rings = Math.max(Math.ceil(repos.length / 10), 2);

  return (
    <>
      {/* ── CAMERA CONTROLS ── */}
      <OrbitControls
        ref={controlsRef}
        makeDefault
        target={[0, 3, 0]}
        maxPolarAngle={Math.PI / 2.1}
        minDistance={12}
        maxDistance={150}
        enableDamping
        dampingFactor={0.05}
      />

      {/* ── LIGHTING ── */}
      <SoftShadows size={22} samples={12} focus={0} />
      <ambientLight intensity={1.4} color="#ffd4a3" />
      <directionalLight
        position={[40, 60, 30]}
        intensity={2.2}
        color="#ffedcc"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={200}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
        shadow-bias={-0.0005}
      />
      {/* Fill light from opposite side for soft shadows */}
      <directionalLight position={[-20, 30, -20]} intensity={0.4} color="#87CEEB" />
      {/* Warm ground bounce */}
      <hemisphereLight skyColor="#87CEEB" groundColor="#74cf4a" intensity={0.6} />

      <group>
        {/* ── HEXAGONAL TERRAIN ── */}
        <HexTerrain />

        {/* ── VILLAGE PATHS ── */}
        <VillagePaths rings={rings} />

        {/* ── TOWN HALL (center) ── */}
        <GitVilleTownHall position={[0, 0, 0]} />

        {/* ── FENCE RING around platform ── */}
        {staticAssets.fences.map((f, i) => (
          <FenceSegment key={`fence-${i}`} position={f.position} rotation={f.rotation} />
        ))}

        {/* ── REPOSITORY HOUSES ── */}
        {buildingPlacements.map((repo, i) => (
          <Building
            key={repo.name}
            repo={repo}
            index={i}
            position={repo.position}
            rotation={repo.rotation}
            onHover={() => setHoveredRepo(repo)}
            onUnhover={() => setHoveredRepo(null)}
          />
        ))}

        {/* ── TREES ── */}
        {staticAssets.trees.map((t, i) => (
          <Tree key={`tree-${i}`} position={t.position} scale={t.scale} />
        ))}

        {/* ── WELLS ── */}
        {staticAssets.wells.map((pos, i) => (
          <Well key={`well-${i}`} position={pos} />
        ))}

        {/* ── LAMP POSTS ── */}
        {staticAssets.lamps.map((pos, i) => (
          <LampPost key={`lamp-${i}`} position={pos} />
        ))}

        {/* ── CLOUDS ── */}
        {staticAssets.clouds.map((c, i) => (
          <Cloud key={`cloud-${i}`} position={c.position} scale={c.scale} />
        ))}

        {/* ── BALLOONS ── */}
        {staticAssets.balloons.map((b, i) => (
          <HotAirBalloon key={`balloon-${i}`} position={b.position} color={b.color} scale={b.scale} />
        ))}
      </group>

      {/* ── CONTACT SHADOWS ── */}
      <ContactShadows
        position={[0, 0.25, 0]}
        opacity={0.28}
        scale={180}
        blur={2.5}
        far={20}
        resolution={1024}
      />
    </>
  );
};
