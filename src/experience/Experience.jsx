import React, { useMemo, useRef, useEffect } from 'react';
import { OrbitControls, ContactShadows, Float, SoftShadows } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';

import { Building } from './Building';
import { Tree } from './Tree';
import GitVilleTownHall from './GitVilleTownHall';
import { PALETTE, ROOF_COLORS } from './Constants';
import { Vehicle } from './Vehicle';

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
// CITY TERRAIN
// ─────────────────────────────────────────────
const CityTerrain = () => (
  <group>
    {/* Base concrete/grass */}
    <mesh position={[0, -0.5, 0]} receiveShadow>
      <boxGeometry args={[120, 1, 120]} />
      <meshStandardMaterial color={PALETTE.grassLight} roughness={0.9} flatShading />
    </mesh>
    {/* Foundation edge */}
    <mesh position={[0, -1.5, 0]} receiveShadow>
      <boxGeometry args={[122, 1, 122]} />
      <meshStandardMaterial color={PALETTE.hexBase} roughness={0.9} flatShading />
    </mesh>
    {/* Floating base */}
    <mesh position={[0, -6.5, 0]} receiveShadow>
      <cylinderGeometry args={[86, 15, 10, 4]} />
      <meshStandardMaterial color={PALETTE.hexEdge} roughness={0.9} flatShading />
    </mesh>
  </group>
);

// ─────────────────────────────────────────────
// CITY ROADS & SIDEWALKS
// ─────────────────────────────────────────────
const CityRoads = () => {
  const roadCoords = [-40, -24, -8, 8, 24, 40];
  const length = 120;
  return (
    <group position={[0, 0.01, 0]}>
      {/* City Center Plaza */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial color={PALETTE.stone} roughness={0.9} />
      </mesh>

      {roadCoords.map((coord, i) => (
        <group key={`h-${i}`}>
          {/* Sidewalk */}
          <mesh position={[0, 0, coord]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[length, 5.6]} />
            <meshStandardMaterial color={PALETTE.stone} roughness={0.9} />
          </mesh>
          {/* Horizontal road */}
          <mesh position={[0, 0.01, coord]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[length, 4]} />
            <meshStandardMaterial color={PALETTE.roadDark} roughness={0.9} />
          </mesh>
          {/* Dashed line */}
          <mesh position={[0, 0.02, coord]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[length, 0.15]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.6} />
          </mesh>
        </group>
      ))}
      
      {roadCoords.map((coord, i) => (
        <group key={`v-${i}`}>
          {/* Sidewalk */}
          <mesh position={[coord, 0, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} receiveShadow>
            <planeGeometry args={[length, 5.6]} />
            <meshStandardMaterial color={PALETTE.stone} roughness={0.9} />
          </mesh>
          {/* Vertical road */}
          <mesh position={[coord, 0.01, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} receiveShadow>
            <planeGeometry args={[length, 4]} />
            <meshStandardMaterial color={PALETTE.roadDark} roughness={0.9} />
          </mesh>
          {/* Dashed line */}
          <mesh position={[coord, 0.02, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
            <planeGeometry args={[length, 0.15]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.6} />
          </mesh>
        </group>
      ))}

      {/* Intersection fixes (slightly raised flat gray planes to cover overlapping dashed lines) */}
      {roadCoords.map(x => 
        roadCoords.map(z => (
          <mesh key={`int-${x}-${z}`} position={[x, 0.025, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[4.2, 4.2]} />
            <meshStandardMaterial color={PALETTE.roadDark} roughness={0.9} />
          </mesh>
        ))
      )}
    </group>
  );
};

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
// MAIN EXPERIENCE
// ─────────────────────────────────────────────
export const Experience = ({ repos, user, isCinematic, setHoveredRepo }) => {
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

  // ── House placements in a grid format ──
  const buildingPlacements = useMemo(() => {
    const placements = [];
    let repoIndex = 0;
    
    // 7x7 grid logic
    for (let x = -3; x <= 3; x++) {
      for (let z = -3; z <= 3; z++) {
        // Skip center where Town Hall is
        if (x === 0 && z === 0) continue; 
        
        if (repoIndex < repos.length && repoIndex < 48) {
          const repo = repos[repoIndex];
          const px = x * 16;
          const pz = z * 16;
          
          // Face the closest road
          const rotY = Math.abs(x) > Math.abs(z) ? Math.PI / 2 : 0;
          
          placements.push({
            ...repo,
            position: [px, 0.1, pz],
            rotation: [0, rotY, 0],
            index: repoIndex,
          });
          repoIndex++;
        }
      }
    }
    return placements;
  }, [repos]);

  // ── Static assets (trees, lamps, vehicles, clouds) ──
  const staticAssets = useMemo(() => {
    const seed = (n) => Math.abs(Math.sin(n * 9301 + 49297) * 233280) % 1;

    const trees = [];
    const lamps = [];
    const roadCoords = [-40, -24, -8, 8, 24, 40];
    
    // Plant trees neatly along the sidewalks
    roadCoords.forEach((coord) => {
      for (let i = -50; i <= 50; i += 8) {
        // Only plant if not directly at an intersection
        if (!roadCoords.includes(i)) {
          trees.push({ position: [i, 0.1, coord + 3.2], scale: 0.35 + seed(i + coord) * 0.25 });
          trees.push({ position: [i, 0.1, coord - 3.2], scale: 0.35 + seed(i - coord) * 0.25 });
          
          trees.push({ position: [coord + 3.2, 0.1, i], scale: 0.35 + seed(i * coord) * 0.25 });
          trees.push({ position: [coord - 3.2, 0.1, i], scale: 0.35 + seed(i + coord + 10) * 0.25 });
        }
      }
    });

    // Place Lamp Posts along roads
    roadCoords.forEach((coord) => {
      for (let i = -40; i <= 40; i += 16) {
        if (!roadCoords.includes(i)) {
          lamps.push([i, 0.1, coord + 2.5]);
          lamps.push([coord + 2.5, 0.1, i]);
        }
      }
    });

    const vehicles = [];
    roadCoords.forEach((coord, index) => {
      // Horizontal
      vehicles.push({ isVertical: false, offset: coord + 1, dir: index % 2 === 0 ? 1 : -1 });
      vehicles.push({ isVertical: false, offset: coord - 1, dir: index % 2 === 0 ? -1 : 1 });
      // Vertical
      vehicles.push({ isVertical: true, offset: coord + 1, dir: index % 2 === 0 ? 1 : -1 });
      vehicles.push({ isVertical: true, offset: coord - 1, dir: index % 2 === 0 ? -1 : 1 });
    });

    const clouds = [];
    const cloudSeeds = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    cloudSeeds.forEach((n) => {
      const angle = seed(n + 50) * Math.PI * 2;
      const radius = 25 + seed(n + 60) * 45;
      clouds.push({
        position: [Math.cos(angle) * radius, 18 + seed(n + 70) * 8, Math.sin(angle) * radius],
        scale: 0.9 + seed(n + 80) * 1.2,
      });
    });

    const balloons = [];
    const balloonColors = ['#ff4444', '#ffcc00', '#44aaff', '#ff77bb'];
    for (let i = 0; i < 4; i++) {
      const angle = seed(i + 900) * Math.PI * 2;
      const radius = 15 + seed(i + 1000) * 35;
      balloons.push({
        position: [Math.cos(angle) * radius, 12 + seed(i + 1100) * 12, Math.sin(angle) * radius],
        scale: 0.7 + seed(i + 1200) * 0.6,
        color: balloonColors[i % balloonColors.length],
      });
    }

    return { trees, lamps, vehicles, clouds, balloons };
  }, []);

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
        {/* ── CITY TERRAIN ── */}
        <CityTerrain />

        {/* ── CITY ROADS ── */}
        <CityRoads />

        {/* ── TOWN HALL (center) ── */}
        <GitVilleTownHall position={[0, 0, 0]} username={user?.username} />

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

        {/* ── LAMP POSTS ── */}
        {staticAssets.lamps.map((pos, i) => (
          <LampPost key={`lamp-${i}`} position={pos} />
        ))}

        {/* ── VEHICLES ── */}
        {staticAssets.vehicles.map((v, i) => (
          <Vehicle key={`veh-${i}`} isVertical={v.isVertical} offset={v.offset} dir={v.dir} />
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
