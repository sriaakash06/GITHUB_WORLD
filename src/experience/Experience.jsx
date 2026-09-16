import React, { useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import { OrbitControls, ContactShadows, SoftShadows } from '@react-three/drei';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';

import GitVilleTownHall from './GitVilleTownHall';
import { IslandBase } from './IslandBase';
import { IslandRoadSystem } from './IslandRoadSystem';
import { VillageQuadrants } from './VillageQuadrants';
import {
  placeHouses,
  computeProps,
  verifyProps,
  RING_ROAD_OUTER_R,
} from './VillageLayout';
import { VillageProps } from './VillageProps';
import { SKY_DAY, SKY_NIGHT } from './Constants';
import { UNIT_BOX, MAT_MATTE } from './InstancedBatch';
import { QUALITY } from './quality';

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

// ── Focus-camera framing ──
const DEG = Math.PI / 180;
/** Bounding radius of a cottage plus its garden plot, with a little margin. */
const HOUSE_FRAME_RADIUS = 1.75;
const HOUSE_FOCUS_ELEV = 20 * DEG;
/** Slight sideways swing so the shot is 3/4 rather than dead-on. */
const HOUSE_FOCUS_SIDE = 14 * DEG;
/** Mid-wall, not the ridge — aiming at the roof peak is what tipped the camera
 *  down onto the roof. */
const HOUSE_TARGET_Y = 0.42;

/** Castle + moat: radius 5.85 out, ~3.5 tall. */
const CASTLE_FRAME_RADIUS = 6.9;
const CASTLE_FOCUS_ELEV = 26 * DEG;
const CASTLE_TARGET_Y = 1.6;

/**
 * Distance at which a sphere of `radius` fits inside BOTH the vertical and the
 * horizontal field of view.
 *
 * The old framing used a fixed 3.95-unit pull-back. On a 16:9 desktop that is
 * roughly right, but a portrait phone (aspect ~0.46) has a horizontal half-FOV
 * of only ~9°, so the same distance showed barely 1.25 world units across —
 * narrower than the 2.1-wide house. Hence "the roof fills the screen".
 */
const framingDistance = (camera, radius) => {
  const halfV = (camera.fov * DEG) / 2;
  const halfH = Math.atan(Math.tan(halfV) * camera.aspect);
  return Math.max(radius / Math.tan(halfV), radius / Math.tan(halfH));
};

/**
 * Clouds and balloon envelopes get their own, rounder sphere.
 *
 * They share one instanced draw call each, so segment count costs almost
 * nothing here — whereas the shared UNIT_SPHERE (6×4, or 5×3 on mobile) is
 * tuned for ~1000 tiny ground-level instances. At 4 height segments a white
 * cloud puff reads as a floating cube, which is exactly the "stray white box"
 * that appeared next to the balloons.
 */
const SKY_SPHERE = new THREE.SphereGeometry(
  0.5,
  QUALITY.tier === 'low' ? 9 : 14,
  QUALITY.tier === 'low' ? 6 : 9
);

const _sm = new THREE.Matrix4();
const _sp = new THREE.Vector3();
const _sq = new THREE.Quaternion();
const _ss = new THREE.Vector3();

const SkyDecor = React.memo(function SkyDecor({ islandRadius, showBalloons = true }) {
  const spread = Math.max(150, islandRadius * 5);

  const bodies = useMemo(() => {
    const seed = (n) => Math.abs(Math.sin(n * 9301 + 49297) * 233280) % 1;
    const list = [];

    for (let i = 0; i < QUALITY.cloudCount; i++) {
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

    for (let i = 0; showBalloons && i < QUALITY.balloonCount; i++) {
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
  }, [spread, showBalloons]);

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
      // Balloons also drift gently side to side; clouds just track straight.
      b.dx = b.kind === 'balloon' ? Math.sin(t * 0.21 + b.bob) * 2.6 : 0;
      b.dz = b.kind === 'balloon' ? Math.cos(t * 0.17 + b.bob * 1.3) * 1.8 : 0;
    }

    _sq.identity();
    for (let i = 0; i < plan.spheres.length; i++) {
      const p = plan.spheres[i];
      const b = bodies[p.bi];
      _sp.set(b.x + b.dx + p.o[0] * b.scale, b.y + b.dy + p.o[1] * b.scale, b.z + b.dz + p.o[2] * b.scale);
      _ss.set(p.sc[0] * b.scale, p.sc[1] * b.scale, p.sc[2] * b.scale);
      sMesh.setMatrixAt(i, _sm.compose(_sp, _sq, _ss));
    }
    for (let i = 0; i < plan.boxes.length; i++) {
      const p = plan.boxes[i];
      const b = bodies[p.bi];
      _sp.set(b.x + b.dx + p.o[0] * b.scale, b.y + b.dy + p.o[1] * b.scale, b.z + b.dz + p.o[2] * b.scale);
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
        args={[SKY_SPHERE, MAT_MATTE, plan.spheres.length]}
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
// BIRD FLOCK — instanced chevrons on a looping path
// ─────────────────────────────────────────────
const BIRD_COLOR = '#2b3038';
const BIRD_WING = [0.2, 0.03, 0.5]; // short along the body, long across the span
const BIRD_SPAN = 0.28;

const _bm = new THREE.Matrix4();
const _bw = new THREE.Matrix4();
const _bp = new THREE.Vector3();
const _bq = new THREE.Quaternion();
const _bs = new THREE.Vector3();
const _be = new THREE.Euler();
const _wingP = new THREE.Vector3();

/**
 * Each bird is two thin planks hinged at its centre, so it reads as a flattened
 * chevron from any angle. All of them share ONE InstancedMesh and one useFrame:
 * 9 birds × 2 wings = 18 instances, 1 draw call.
 */
const Birds = React.memo(function Birds({ islandRadius }) {
  const meshRef = useRef();

  const flock = useMemo(() => {
    const n = QUALITY.birdCount;
    const seed = (v) => Math.abs(Math.sin(v * 9301 + 49297) * 233280) % 1;
    // Loose V: a leader with pairs trailing behind and out to each side.
    return Array.from({ length: n }, (_, i) => {
      const row = Math.ceil(i / 2);
      const side = i % 2 === 0 ? -1 : 1;
      return {
        back: row * 1.15 + seed(i) * 0.3,
        side: side * row * 0.95 + (seed(i + 7) - 0.5) * 0.3,
        bob: seed(i + 13) * Math.PI * 2,
        flapRate: 7 + seed(i + 21) * 3,
      };
    });
  }, []);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const col = new THREE.Color(BIRD_COLOR);
    for (let i = 0; i < flock.length * 2; i++) mesh.setColorAt(i, col);
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [flock]);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const t = state.clock.elapsedTime;
    const pathR = islandRadius * 0.8;
    const alt = islandRadius * 0.85 + 6;
    const a = t * 0.055; // one slow lap

    const ca = Math.cos(a);
    const sa = Math.sin(a);
    // Flock frame: forward is the circle's tangent, right points outward.
    const fx = -sa;
    const fz = ca;
    const heading = Math.atan2(-fx, -fz) + Math.PI;

    let i = 0;
    for (const bird of flock) {
      const cx = ca * pathR - fx * bird.back + ca * bird.side;
      const cz = sa * pathR - fz * bird.back + sa * bird.side;
      const cy = alt + Math.sin(t * 0.5 + bird.bob) * 1.4;

      _bp.set(cx, cy, cz);
      _be.set(0, heading, 0);
      _bq.setFromEuler(_be);
      _bs.set(1, 1, 1);
      _bm.compose(_bp, _bq, _bs);

      const flap = Math.sin(t * bird.flapRate + bird.bob) * 0.7;
      for (const s of [-1, 1]) {
        _be.set(s * flap, 0, 0);
        _bq.setFromEuler(_be);
        // Hinge at the body centre: rotate the offset, don't translate first.
        _wingP.set(0, 0, s * BIRD_SPAN).applyQuaternion(_bq);
        _bs.set(BIRD_WING[0], BIRD_WING[1], BIRD_WING[2]);
        _bw.compose(_wingP, _bq, _bs);
        mesh.setMatrixAt(i++, _bw.premultiply(_bm));
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  if (!flock.length) return null;

  return (
    <instancedMesh
      ref={meshRef}
      key={`birds-${flock.length}`}
      args={[UNIT_BOX, MAT_MATTE, flock.length * 2]}
      frustumCulled={false}
    />
  );
});

// ─────────────────────────────────────────────
// NIGHT SKY — moon + starfield
// ─────────────────────────────────────────────
/**
 * The camera can only ever see a thin strip of sky. The default view looks
 * DOWN 29.8° with a 19° half-FOV, so the top of the frame sits 10.8° BELOW the
 * horizon — no sky at all — and even orbiting to `maxPolarAngle` only lifts the
 * top edge to about +14.7° of elevation.
 *
 * The moon and stars therefore have to live in a low band just above the
 * horizon. The previous moon sat at 38° elevation, permanently off-screen.
 */
/**
 * The default camera looks DOWN 29.8° with a 19° half-FOV, so the frame spans
 * elevations −48.8°..−10.8° — the horizon itself is 10.8° ABOVE the top edge.
 * Anything placed at a positive elevation is off-screen, which is why the moon
 * at +9° (and +38° before that) was never visible.
 *
 * But the island's far rim only reaches −23.4° in that frame, so the band from
 * −23.4° up to −10.8° is empty background — about a third of the frame height.
 * That strip reads as sky, and on a floating island it genuinely is: put the
 * moon there and it clears the terrain silhouette while sitting in open sky.
 */
const MOON_ELEVATION_DEG = -17;
const MOON_AZIMUTH_DEG = 225; // toward −X/−Z, the half the default camera faces
/** Stars span the default frame's empty band and keep going up, so they still
 *  read once the camera is orbited toward the horizon. */
const STAR_ELEVATION_MIN = -30;
const STAR_ELEVATION_MAX = 18;

const NightSky = React.memo(function NightSky({ islandRadius }) {
  const stars = useMemo(() => {
    const n = QUALITY.starCount;
    const pos = new Float32Array(n * 3);
    const seed = (v) => Math.abs(Math.sin(v * 12.9898 + 78.233) * 43758.5453) % 1;

    for (let i = 0; i < n; i++) {
      const theta = seed(i * 3 + 1) * Math.PI * 2;
      const elev =
        (STAR_ELEVATION_MIN +
          seed(i * 3 + 2) * (STAR_ELEVATION_MAX - STAR_ELEVATION_MIN)) *
        (Math.PI / 180);
      // Far enough out that the island never intersects them; depth testing
      // still lets the terrain occlude the ones behind it, which looks right.
      const d = islandRadius * (6 + seed(i * 3 + 3) * 3);
      pos[i * 3] = Math.cos(elev) * Math.cos(theta) * d;
      pos[i * 3 + 1] = Math.sin(elev) * d;
      pos[i * 3 + 2] = Math.cos(elev) * Math.sin(theta) * d;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return geo;
  }, [islandRadius]);

  const moonPos = useMemo(() => {
    const elev = MOON_ELEVATION_DEG * (Math.PI / 180);
    const az = MOON_AZIMUTH_DEG * (Math.PI / 180);
    const d = islandRadius * 7;
    return [
      Math.cos(elev) * Math.cos(az) * d,
      Math.sin(elev) * d,
      Math.cos(elev) * Math.sin(az) * d,
    ];
  }, [islandRadius]);

  return (
    <group>
      {/* Moon — emissive so it stays bright under the dimmed night lighting,
          and unlit/unfogged so distance doesn't wash it out. */}
      <mesh position={moonPos} frustumCulled={false}>
        <sphereGeometry args={[islandRadius * 0.22, 16, 12]} />
        <meshBasicMaterial color="#fdf6d8" fog={false} toneMapped={false} />
      </mesh>
      {/* Soft halo so it doesn't read as a flat disc. */}
      <mesh position={moonPos} frustumCulled={false}>
        <sphereGeometry args={[islandRadius * 0.34, 14, 10]} />
        <meshBasicMaterial
          color="#f2e6b4"
          transparent
          opacity={0.16}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </mesh>

      {/* Starfield — one draw call, no lighting work.
          sizeAttenuation is OFF: with it on, `size` is in world units and a
          star 150 units away shrank to ~2px. Off, `size` is a pixel count. */}
      <points geometry={stars} frustumCulled={false}>
        <pointsMaterial
          size={2.6}
          sizeAttenuation={false}
          color="#ffffff"
          transparent
          opacity={0.9}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </points>
    </group>
  );
});

// ─────────────────────────────────────────────
// MAIN EXPERIENCE
// ─────────────────────────────────────────────
export const Experience = ({
  repos,
  user,
  isCinematic,
  setHoveredRepo,
  isNightMode,
  selectedRepo,
  onSelectRepo,
  visibleProps = {},
}) => {
  const show = {
    waterTower: true,
    windmill: true,
    wagon: true,
    stall: true,
    characters: true,
    balloons: true,
    ...visibleProps,
  };
  const controlsRef = useRef();
  const { camera } = useThree();
  const keys = useRef({ w: false, a: false, s: false, d: false });
  const setSelectedRepo = onSelectRepo;

  // One house per repo — the layout is solved once and shared by the island,
  // the roads and the village so every radius agrees.
  const layout = useMemo(
    () => placeHouses(repos && repos.length ? repos : DEMO_REPOS),
    [repos]
  );
  const islandRadius = layout.islandRadius;

  // Decorative scenery — no repo data involved.
  const props = useMemo(() => computeProps(layout), [layout]);
  const visibleScenery = useMemo(
    () => props.filter((p) => show[p.kind] !== false),
    [props, show.waterTower, show.windmill, show.wagon, show.stall]
  );
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const problems = verifyProps(props, layout);
    if (problems.length) console.warn('[GitVille] prop placement:', problems);
    else console.log(`[GitVille] ${props.length} decorative props placed, all clear of houses/roads.`);
  }, [props, layout]);

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

  /** Tween the camera and the orbit target together. */
  const flyTo = (camPos, lookAt, duration = 0.85) => {
    gsap.killTweensOf(camera.position);
    gsap.to(camera.position, { ...camPos, duration, ease: 'power3.inOut', overwrite: true });
    if (controlsRef.current) {
      gsap.killTweensOf(controlsRef.current.target);
      gsap.to(controlsRef.current.target, {
        ...lookAt,
        duration,
        ease: 'power3.inOut',
        overwrite: true,
      });
    }
  };

  const goHome = (duration = 1.1) =>
    flyTo({ x: home.x, y: home.y, z: home.z }, { x: 0, y: 2, z: 0 }, duration);

  /**
   * Frame a house from the front. Every cottage's door faces the castle, so
   * "in front of the door" means standing between the castle and the house —
   * the old handler multiplied the position by 1.18, which parked the camera
   * further out and showed the back wall. A small tangential offset keeps it
   * from being a flat head-on shot.
   *
   * The ring step is 4.95, so `radius − 3.6` always lands in the clear grass
   * band between two rings rather than inside the ring below.
   */
  const handleBuildingClick = (repo, buildingPosition) => {
    setSelectedRepo({ kind: 'repo', repo });

    const [hx, , hz] = buildingPosition;
    const r = Math.hypot(hx, hz) || 1;
    // The door faces the castle, so "in front" is the inward side.
    const inX = -hx / r;
    const inZ = -hz / r;
    const tanX = -inZ;
    const tanZ = inX;

    const dist = framingDistance(camera, HOUSE_FRAME_RADIUS);

    // Cap how far inward the camera may travel so a narrow viewport can't push
    // it through the ring road and into the castle; the leftover distance goes
    // into height instead, which just makes the shot more top-down.
    const maxHoriz = Math.max(1.6, r - (RING_ROAD_OUTER_R + 1.2));
    const horiz = Math.min(dist * Math.cos(HOUSE_FOCUS_ELEV), maxHoriz);
    const vert = Math.sqrt(Math.max(0.6, dist * dist - horiz * horiz));

    const c = Math.cos(HOUSE_FOCUS_SIDE);
    const s = Math.sin(HOUSE_FOCUS_SIDE);
    const dirX = inX * c + tanX * s;
    const dirZ = inZ * c + tanZ * s;

    flyTo(
      { x: hx + dirX * horiz, y: HOUSE_TARGET_Y + vert, z: hz + dirZ * horiz },
      { x: hx, y: HOUSE_TARGET_Y, z: hz }
    );
  };

  /** Castle click — frame the whole keep plus its moat. */
  const handleCastleClick = () => {
    setSelectedRepo({ kind: 'castle' });

    const dist = framingDistance(camera, CASTLE_FRAME_RADIUS);
    const horiz = dist * Math.cos(CASTLE_FOCUS_ELEV);
    const vert = dist * Math.sin(CASTLE_FOCUS_ELEV);
    const d = Math.SQRT1_2; // approach on the same diagonal as the home view

    flyTo(
      { x: d * horiz, y: CASTLE_TARGET_Y + vert, z: d * horiz },
      { x: 0, y: CASTLE_TARGET_Y, z: 0 }
    );
  };

  // Returning to the overview is driven by `selectedRepo` clearing, so the
  // "Back to Village" button, a ground click and Escape all share one path.
  const wasSelected = useRef(false);
  useEffect(() => {
    if (selectedRepo) {
      wasSelected.current = true;
      return;
    }
    if (wasSelected.current) {
      wasSelected.current = false;
      goHome();
    }
  }, [selectedRepo]);

  // ── Camera framing follows the island so a 60-repo world still fits ──
  const home = useMemo(() => {
    const dir = new THREE.Vector3(1, 0.85, 1).normalize();
    return dir.multiplyScalar(islandRadius * 3.0);
  }, [islandRadius]);

  // Re-frame when the island resizes (repos finish loading) — unless the
  // visitor is currently focused on a house.
  useEffect(() => {
    if (selectedRepo) return;
    goHome(1.2);
  }, [camera, home]);

  useEffect(() => {
    const onReset = () => {
      // Clearing the selection triggers the fly-home effect above.
      if (selectedRepo) setSelectedRepo(null);
      else goHome(1.4);
    };

    window.addEventListener('reset-camera', onReset);
    return () => window.removeEventListener('reset-camera', onReset);
  }, [camera, home, selectedRepo]);

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
        // Low enough that the house-focus shot (~3.95 away) isn't pushed back.
        minDistance={3}
        maxDistance={islandRadius * 6}
        enableDamping
        dampingFactor={0.05}
      />

      {QUALITY.softShadows && <SoftShadows size={18} samples={8} focus={0} />}
      {/* Night lighting — clear, vibrant moonlight atmosphere so the entire village is well lit. */}
      <ambientLight
        intensity={isNightMode ? 0.48 : 1.4}
        color={isNightMode ? '#7088d4' : '#ffd4a3'}
      />
      <directionalLight
        position={[islandRadius * 1.4, islandRadius * 2.2, islandRadius]}
        intensity={isNightMode ? 0.75 : 2.2}
        color={isNightMode ? '#8aa6f7' : '#ffedcc'}
        castShadow={QUALITY.shadows}
        shadow-mapSize={[QUALITY.shadowMapSize, QUALITY.shadowMapSize]}
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
        intensity={isNightMode ? 0.35 : 0.4}
        color={isNightMode ? '#48639e' : '#87CEEB'}
      />
      <hemisphereLight
        skyColor={isNightMode ? SKY_NIGHT : '#87CEEB'}
        groundColor={isNightMode ? '#1e2b3c' : '#74cf4a'}
        intensity={isNightMode ? 0.5 : 0.6}
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
        <IslandRoadSystem
          isNightMode={isNightMode}
          islandRadius={islandRadius}
          layout={layout}
          props={props}
        />

        {/* ── CENTRAL CASTLE, MOAT & BRIDGES ── */}
        <GitVilleTownHall
          position={[0, 0, 0]}
          username={user?.username}
          isNightMode={isNightMode}
          onCastleClick={handleCastleClick}
        />

        {/* ── ONE COTTAGE PER REPO, IN CONCENTRIC QUADRANT RINGS ── */}
        <VillageQuadrants
          layout={layout}
          props={props}
          showCharacters={show.characters}
          handleBuildingClick={handleBuildingClick}
          setHoveredRepo={setHoveredRepo}
        />

        {/* ── DECORATIVE SCENERY ──
            Hidden props are filtered out of what gets *rendered*, but the full
            list still drives tree/lamp avoidance, so toggling one off doesn't
            make the surrounding scenery jump around. */}
        <VillageProps props={visibleScenery} />

        <SkyDecor islandRadius={islandRadius} showBalloons={show.balloons} />
        <Birds islandRadius={islandRadius} />
        {isNightMode && <NightSky islandRadius={islandRadius} />}
      </group>

      {QUALITY.contactShadows && (
        <ContactShadows
          position={[0, 0.005, 0]}
          opacity={0.28}
          scale={islandRadius * 2.5}
          blur={2}
          far={5}
          resolution={1024}
          frames={1}
        />
      )}
    </>
  );
};
