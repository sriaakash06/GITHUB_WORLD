import React, { useMemo, useRef, useEffect, useState } from 'react';
import { OrbitControls, ContactShadows, SoftShadows } from '@react-three/drei';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';

import GitVilleTownHall from './GitVilleTownHall';
import { IslandBase } from './IslandBase';
import { IslandRoadSystem } from './IslandRoadSystem';
import { VillageQuadrants } from './VillageQuadrants';
import { placeHouses } from './VillageLayout';
import { SKY_DAY, SKY_NIGHT } from './Constants';
import { UNIT_BOX, UNIT_SPHERE, MAT_MATTE } from './InstancedBatch';

/** Village shown before anyone logs in. */
const DEMO_REPOS = Array.from({ length: 25 }, (_, i) => ({
  name: `repo-${i + 1}`,
  language: ['JavaScript', 'Python', 'TypeScript', 'Go', 'Rust'][i % 5],
  stargazers_count: (i * 7) % 40,
  description: '',
}));

// ─────────────────────────────────────────────
// SKY DECOR — clouds + balloons, instanced (Fix 9)
// ─────────────────────────────────────────────
const CLOUD_PUFFS = [
  { o: [0, 0, 0], s: 1.3, c: '#ffffff' },
  { o: [-1.1, -0.25, 0.1], s: 0.95, c: '#f8f8f8' },
  { o: [1.1, -0.2, -0.15], s: 0.95, c: '#f8f8f8' },
  { o: [0.45, 0.55, 0.4], s: 0.78, c: '#ffffff' },
  { o: [-0.5, 0.45, -0.35], s: 0.72, c: '#efefef' },
];
const BALLOON_COLORS = ['#e05545', '#e8b93a', '#4a9fe0', '#e07bb0'];

const _sm = new THREE.Matrix4();
const _sp = new THREE.Vector3();
const _sq = new THREE.Quaternion();
const _ss = new THREE.Vector3();

const SkyDecor = React.memo(function SkyDecor({ islandRadius }) {
  const spread = Math.max(150, islandRadius * 5);

  const bodies = useMemo(() => {
    const seed = (n) => Math.abs(Math.sin(n * 9301 + 49297) * 233280) % 1;
    const list = [];

    for (let i = 0; i < 12; i++) {
      list.push({
        kind: 'cloud',
        x: (seed(i) - 0.5) * spread * 1.4,
        y: 20 + seed(i + 10) * 16,
        z: (seed(i + 20) - 0.5) * spread * 1.4,
        scale: 1.1 + seed(i + 30) * 1.4,
        vx: -(2.5 + seed(i + 40) * 5),
        vz: 0,
        bob: seed(i + 50) * Math.PI * 2,
      });
    }

    for (let i = 0; i < 5; i++) {
      list.push({
        kind: 'balloon',
        x: (seed(i + 100) - 0.5) * spread,
        y: 14 + seed(i + 110) * 14,
        z: (seed(i + 120) - 0.5) * spread,
        scale: 0.75 + seed(i + 130) * 0.55,
        vx: 0,
        vz: -(1.8 + seed(i + 140) * 3.5),
        bob: seed(i + 150) * Math.PI * 2,
        color: BALLOON_COLORS[i % BALLOON_COLORS.length],
      });
    }

    return list;
  }, [spread]);

  /** Flat instance list so the frame loop is a plain walk over offsets. */
  const plan = useMemo(() => {
    const spheres = [];
    const boxes = [];
    bodies.forEach((b, bi) => {
      if (b.kind === 'cloud') {
        CLOUD_PUFFS.forEach((p) =>
          spheres.push({ bi, o: p.o, sc: [p.s * 2, p.s * 2, p.s * 2], c: p.c })
        );
      } else {
        spheres.push({ bi, o: [0, 0, 0], sc: [4, 4, 4], c: b.color });
        boxes.push({ bi, o: [0, -1.4, 0], sc: [0.08, 1.6, 0.08], c: '#3a3630' }); // rope
        boxes.push({ bi, o: [0, -2.45, 0], sc: [0.85, 0.62, 0.85], c: '#7a5230' }); // basket
      }
    });
    return { spheres, boxes };
  }, [bodies]);

  const sphereRef = useRef();
  const boxRef = useRef();
  const { camera } = useThree();

  useEffect(() => {
    const col = new THREE.Color();
    plan.spheres.forEach((p, i) => sphereRef.current?.setColorAt(i, col.set(p.c)));
    plan.boxes.forEach((p, i) => boxRef.current?.setColorAt(i, col.set(p.c)));
    if (sphereRef.current?.instanceColor) sphereRef.current.instanceColor.needsUpdate = true;
    if (boxRef.current?.instanceColor) boxRef.current.instanceColor.needsUpdate = true;
  }, [plan]);

  useFrame((state, delta) => {
    const sMesh = sphereRef.current;
    const bMesh = boxRef.current;
    if (!sMesh || !bMesh) return;

    const t = state.clock.elapsedTime;
    const limit = spread * 0.75;

    for (const b of bodies) {
      b.x += b.vx * delta;
      b.z += b.vz * delta;
      if (b.x < camera.position.x - limit) b.x = camera.position.x + limit;
      if (b.z < camera.position.z - limit) b.z = camera.position.z + limit;
      b.dy = Math.sin(t * 0.6 + b.bob) * 0.8;
    }

    _sq.identity();
    for (let i = 0; i < plan.spheres.length; i++) {
      const p = plan.spheres[i];
      const b = bodies[p.bi];
      _sp.set(b.x + p.o[0] * b.scale, b.y + b.dy + p.o[1] * b.scale, b.z + p.o[2] * b.scale);
      _ss.set(p.sc[0] * b.scale, p.sc[1] * b.scale, p.sc[2] * b.scale);
      sMesh.setMatrixAt(i, _sm.compose(_sp, _sq, _ss));
    }
    for (let i = 0; i < plan.boxes.length; i++) {
      const p = plan.boxes[i];
      const b = bodies[p.bi];
      _sp.set(b.x + p.o[0] * b.scale, b.y + b.dy + p.o[1] * b.scale, b.z + p.o[2] * b.scale);
      _ss.set(p.sc[0] * b.scale, p.sc[1] * b.scale, p.sc[2] * b.scale);
      bMesh.setMatrixAt(i, _sm.compose(_sp, _sq, _ss));
    }

    sMesh.instanceMatrix.needsUpdate = true;
    bMesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      <instancedMesh
        ref={sphereRef}
        key={`sky-s-${plan.spheres.length}`}
        args={[UNIT_SPHERE, MAT_MATTE, plan.spheres.length]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={boxRef}
        key={`sky-b-${plan.boxes.length}`}
        args={[UNIT_BOX, MAT_MATTE, plan.boxes.length]}
        frustumCulled={false}
      />
    </>
  );
});

// ─────────────────────────────────────────────
// MAIN EXPERIENCE
// ─────────────────────────────────────────────
export const Experience = ({ repos, user, isCinematic, setHoveredRepo, isNightMode }) => {
  const controlsRef = useRef();
  const { camera } = useThree();
  const [selectedRepo, setSelectedRepo] = useState(null);
  const keys = useRef({ w: false, a: false, s: false, d: false });

  // One house per repo — the layout is solved once and shared by the island,
  // the roads and the village so every radius agrees.
  const layout = useMemo(
    () => placeHouses(repos && repos.length ? repos : DEMO_REPOS),
    [repos]
  );
  const islandRadius = layout.islandRadius;

  // WASD controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd'].includes(key)) keys.current[key] = true;
      if (key === 'escape' && selectedRepo) setSelectedRepo(null);
    };
    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd'].includes(key)) keys.current[key] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedRepo]);

  useFrame((state, delta) => {
    if (selectedRepo || isCinematic || !controlsRef.current) return;
    if (!keys.current.w && !keys.current.s && !keys.current.a && !keys.current.d) return;

    const speed = 40 * delta;
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    right.y = 0;
    right.normalize();

    const moveVec = new THREE.Vector3(0, 0, 0);
    if (keys.current.w) moveVec.addScaledVector(forward, speed);
    if (keys.current.s) moveVec.addScaledVector(forward, -speed);
    if (keys.current.a) moveVec.addScaledVector(right, -speed);
    if (keys.current.d) moveVec.addScaledVector(right, speed);

    controlsRef.current.target.add(moveVec);
    camera.position.add(moveVec);
  });

  const handleBuildingClick = (repo, buildingPosition) => {
    setSelectedRepo(repo);

    const targetCameraPos = new THREE.Vector3(
      buildingPosition[0] * 1.18 - 4,
      buildingPosition[1] + 9,
      buildingPosition[2] * 1.18 + 4
    );
    const lookAtPos = new THREE.Vector3(
      buildingPosition[0],
      buildingPosition[1] + 1,
      buildingPosition[2]
    );

    gsap.killTweensOf(camera.position);
    gsap.killTweensOf(controlsRef.current.target);

    gsap.to(camera.position, {
      x: targetCameraPos.x,
      y: targetCameraPos.y,
      z: targetCameraPos.z,
      duration: 1.5,
      ease: 'power3.inOut',
    });

    gsap.to(controlsRef.current.target, {
      x: lookAtPos.x,
      y: lookAtPos.y,
      z: lookAtPos.z,
      duration: 1.5,
      ease: 'power3.inOut',
    });
  };

  // ── Camera framing follows the island so a 60-repo world still fits ──
  const home = useMemo(() => {
    const dir = new THREE.Vector3(1, 0.85, 1).normalize();
    return dir.multiplyScalar(islandRadius * 3.0);
  }, [islandRadius]);

  useEffect(() => {
    gsap.killTweensOf(camera.position);
    gsap.to(camera.position, {
      x: home.x,
      y: home.y,
      z: home.z,
      duration: 1.2,
      ease: 'power3.out',
    });
    if (controlsRef.current) {
      gsap.killTweensOf(controlsRef.current.target);
      gsap.to(controlsRef.current.target, { x: 0, y: 2, z: 0, duration: 1.2, ease: 'power3.out' });
    }
  }, [camera, home]);

  useEffect(() => {
    const onReset = () => {
      setSelectedRepo(null);
      gsap.killTweensOf(camera.position);
      if (controlsRef.current) gsap.killTweensOf(controlsRef.current.target);

      gsap.to(camera.position, {
        x: home.x,
        y: home.y,
        z: home.z,
        duration: 1.5,
        ease: 'power3.out',
      });
      if (controlsRef.current) {
        gsap.to(controlsRef.current.target, { x: 0, y: 2, z: 0, duration: 1.5, ease: 'power3.out' });
      }
    };

    window.addEventListener('reset-camera', onReset);
    return () => window.removeEventListener('reset-camera', onReset);
  }, [camera, home]);

  const skyColor = isNightMode ? SKY_NIGHT : SKY_DAY;

  return (
    <>
      {/* Fog scales with the island so a 25-repo world isn't swallowed by haze. */}
      <fog attach="fog" args={[skyColor, islandRadius * 2.6, islandRadius * 7]} />

      <OrbitControls
        ref={controlsRef}
        makeDefault
        target={[0, 2, 0]}
        maxPolarAngle={Math.PI / 2.1}
        minDistance={6}
        maxDistance={islandRadius * 6}
        enableDamping
        dampingFactor={0.05}
      />

      <SoftShadows size={18} samples={8} focus={0} />
      {/* Night is deliberately dim: the street lamps are the light source now. */}
      <ambientLight
        intensity={isNightMode ? 0.1 : 1.4}
        color={isNightMode ? '#5d74ab' : '#ffd4a3'}
      />
      <directionalLight
        position={[islandRadius * 1.4, islandRadius * 2.2, islandRadius]}
        intensity={isNightMode ? 0.16 : 2.2}
        color={isNightMode ? '#4a5c8f' : '#ffedcc'}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={islandRadius * 8}
        shadow-camera-left={-islandRadius - 5}
        shadow-camera-right={islandRadius + 5}
        shadow-camera-top={islandRadius + 5}
        shadow-camera-bottom={-islandRadius - 5}
        shadow-bias={-0.0005}
      />
      <directionalLight
        position={[-20, 30, -20]}
        intensity={isNightMode ? 0.08 : 0.4}
        color={isNightMode ? '#243052' : '#87CEEB'}
      />
      <hemisphereLight
        skyColor={isNightMode ? SKY_NIGHT : '#87CEEB'}
        groundColor={isNightMode ? '#050a12' : '#74cf4a'}
        intensity={isNightMode ? 0.18 : 0.6}
      />

      <group
        onPointerUp={(e) => {
          if (e.button !== 0) return;
          e.stopPropagation();
          setSelectedRepo(null);
        }}
      >
        {/* ── FLOATING LOW-POLY ISLAND BASE ── */}
        <IslandBase radius={islandRadius} depth={3.8} />

        {/* ── RING ROAD + 4 SPOKE ROADS + STREET LAMPS ── */}
        <IslandRoadSystem isNightMode={isNightMode} islandRadius={islandRadius} />

        {/* ── CENTRAL CASTLE, MOAT & BRIDGES ── */}
        <GitVilleTownHall position={[0, 0, 0]} username={user?.username} isNightMode={isNightMode} />

        {/* ── ONE COTTAGE PER REPO, IN CONCENTRIC QUADRANT RINGS ── */}
        <VillageQuadrants
          layout={layout}
          handleBuildingClick={handleBuildingClick}
          setHoveredRepo={setHoveredRepo}
        />

        <SkyDecor islandRadius={islandRadius} />
      </group>

      <ContactShadows
        position={[0, 0.005, 0]}
        opacity={0.28}
        scale={islandRadius * 2.5}
        blur={2}
        far={5}
        resolution={1024}
        frames={1}
      />
    </>
  );
};
