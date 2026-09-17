import React, { useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

import { buildCottage, COTTAGE_PICK_HEIGHT } from './GitVilleHouse';
import {
  HOUSE_SCALE,
  HOUSE_W,
  HOUSE_D,
  PLOT_D,
  RING_ROAD_OUTER_R,
  RING_ROAD_CENTER_R,
  ROAD_WIDTH,
  GUARD_POSTS,
  verifyLayout,
} from './VillageLayout';
import {
  InstancedBatch,
  UNIT_BOX,
  UNIT_CYL,
  UNIT_CONE,
  UNIT_SPHERE,
  MAT_MATTE,
  MAT_GLASS,
  MAT_METAL,
  MAT_PICK,
  createBatch,
  addParts,
  finalizeBatch,
  objectMatrix,
} from './InstancedBatch';
import { QUALITY } from './quality';
import {
  buildRig,
  VILLAGER_PARTS,
  DOG_PARTS,
  VILLAGER_PALETTES,
  DOG_PALETTES,
  GUARD_PARTS,
  GUARD_PALETTES,
} from './Characters';

const ROOF_COLORS = [
  '#c0603f', '#b4522a', '#c97f2c', '#a4562b',
  '#b08a2c', '#3f6fb5', '#3f8f52', '#7b4ba8', '#b8477f',
];

/** Deterministic hash-noise so the scenery is identical on every reload. */
const rng = (n) => {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/** True when a point at (angle, radius) would sit on one of the 4 spoke roads. */
const nearSpoke = (angle, radius) => {
  const a = ((angle % (Math.PI / 2)) + Math.PI / 2) % (Math.PI / 2);
  const d = Math.min(a, Math.PI / 2 - a);
  return d * radius < ROAD_WIDTH / 2 + 1.1;
};

// ── Scenery templates, authored once and instanced everywhere ──
const pineParts = (variant) => {
  const dark = variant % 2 === 0 ? '#2c5f22' : '#24501d';
  const light = variant % 2 === 0 ? '#3f8130' : '#356e28';
  return {
    cyl: [{ p: [0, 0.55, 0], s: [0.3, 1.1, 0.3], c: '#5b3a1e' }],
    cone: [
      { p: [0, 1.42, 0], s: [1.9, 1.35, 1.9], c: dark },
      { p: [0, 2.06, 0], s: [1.45, 1.15, 1.45], c: light },
      { p: [0, 2.62, 0], s: [1.0, 0.95, 1.0], c: dark },
    ],
  };
};

const bushParts = (variant) => {
  const c = variant % 2 === 0 ? '#3b7a2b' : '#2e6322';
  return {
    sphere: [
      { p: [0, 0.3, 0], s: [0.62, 0.55, 0.62], c },
      { p: [0.24, 0.22, 0.13], s: [0.42, 0.38, 0.42], c },
    ],
  };
};

// Reused across frames so the character animation allocates nothing.
const _m = new THREE.Matrix4();
const _p = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _e = new THREE.Euler();
const _p2 = new THREE.Vector3();
const _q2 = new THREE.Quaternion();
const _s2 = new THREE.Vector3();
const _e2 = new THREE.Euler();
const _v2 = new THREE.Vector3();
const _localM = new THREE.Matrix4();
const _worldM = new THREE.Matrix4();
/** Grown on demand, reused every frame. */
const _charMats = [];
const _swings = [];

/**
 * ═══════════════════════════════════════════════════════════════════
 * VILLAGE QUADRANTS
 * ═══════════════════════════════════════════════════════════════════
 * Renders every repo as exactly one cottage, arranged in symmetric
 * concentric rings across the four quadrants, plus the ring footpaths,
 * scenery and villagers — all merged into a handful of InstancedMeshes.
 */
export const VillageQuadrants = React.memo(function VillageQuadrants({
  layout,
  props: propList = [],
  showCharacters = true,
  handleBuildingClick,
  setHoveredRepo,
}) {
  const { placements, ringRadii, islandRadius } = layout;

  /** Keeps trees and bushes from growing through the decorative props. */
  const clearsProps = useMemo(() => {
    if (!propList.length) return () => true;
    return (x, z) =>
      !propList.some(
        (p) => Math.hypot(x - p.position[0], z - p.position[2]) < p.clearRadius
      );
  }, [propList]);

  // ── Build every static instance once per repo list ──────────────
  const village = useMemo(() => {
    const box = createBatch();
    const glass = createBatch();
    const metal = createBatch();
    const cyl = createBatch();
    const cone = createBatch();
    const sphere = createBatch();
    const proxy = createBatch();

    const parent = new THREE.Matrix4();
    const proxyH = COTTAGE_PICK_HEIGHT * HOUSE_SCALE;

    placements.forEach((h) => {
      const parts = buildCottage({
        style: h.index % 4,
        roofColor: ROOF_COLORS[h.index % ROOF_COLORS.length],
      });

      objectMatrix(parent, h.position, h.rotationY, HOUSE_SCALE);
      addParts(box, parts.box, parent);
      addParts(glass, parts.glass, parent);
      addParts(metal, parts.metal, parent);
      addParts(cyl, parts.cyl, parent);
      addParts(cone, parts.cone, parent);
      addParts(sphere, parts.sphere, parent);

      // Invisible pick-box; e.instanceId maps a hit straight back to the repo.
      objectMatrix(parent, h.position, h.rotationY, 1);
      addParts(
        proxy,
        [{ p: [0, proxyH / 2, 0], s: [HOUSE_W, proxyH, HOUSE_D], c: '#ffffff' }],
        parent
      );
    });

    // ── Scenery ──
    const scenery = [];

    // 1. Castle park — fills the band between the ring road and ring 1.
    const parkInner = RING_ROAD_OUTER_R + 1.0;
    const parkOuter = ringRadii[0] - HOUSE_D / 2 - 2.0;
    if (parkOuter > parkInner + 0.8) {
      const bands = Math.max(1, Math.round((parkOuter - parkInner) / 2.2));
      for (let b = 0; b < bands; b++) {
        const r = parkInner + ((b + 0.5) / bands) * (parkOuter - parkInner);
        const n = Math.max(8, Math.round((2 * Math.PI * r) / 3.4));
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2 + rng(b * 31 + i) * 0.14;
          const rr = r + (rng(i * 7 + b * 3) - 0.5) * 0.8;
          if (nearSpoke(a, rr) || !clearsProps(Math.cos(a) * rr, Math.sin(a) * rr)) continue;
          const isPine = i % 3 === 0;
          scenery.push({
            kind: isPine ? 'pine' : 'bush',
            x: Math.cos(a) * rr,
            z: Math.sin(a) * rr,
            scale: isPine ? 0.5 + rng(i + b) * 0.22 : 0.7 + rng(i * 5) * 0.5,
            variant: i % 2,
            rot: rng(i * 13 + b) * Math.PI * 2,
          });
        }
      }
    }

    // 2. Bushes tucked into the grass gap between consecutive house rings.
    for (let k = 1; k < ringRadii.length; k++) {
      const r = (ringRadii[k - 1] + ringRadii[k]) / 2;
      const n = Math.round((2 * Math.PI * r) / 4.2);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + rng(k * 101 + i) * 0.2;
        if (nearSpoke(a, r) || !clearsProps(Math.cos(a) * r, Math.sin(a) * r)) continue;
        scenery.push({
          kind: 'bush',
          x: Math.cos(a) * r,
          z: Math.sin(a) * r,
          scale: 0.6 + rng(i * 3 + k) * 0.4,
          variant: (i + k) % 2,
          rot: rng(i * 17 + k) * Math.PI * 2,
        });
      }
    }

    // 3. A pine rim just inside the island's cliff edge.
    const rimR = islandRadius - 1.5;
    const rimN = Math.round((2 * Math.PI * rimR) / 3.0);
    for (let i = 0; i < rimN; i++) {
      const a = (i / rimN) * Math.PI * 2 + rng(i * 71) * 0.1;
      const rr = rimR + (rng(i * 5) - 0.5) * 0.7;
      if (nearSpoke(a, rr) || !clearsProps(Math.cos(a) * rr, Math.sin(a) * rr)) continue;
      scenery.push({
        kind: 'pine',
        x: Math.cos(a) * rr,
        z: Math.sin(a) * rr,
        scale: 0.55 + rng(i * 23) * 0.3,
        variant: i % 2,
        rot: rng(i * 29) * Math.PI * 2,
      });
    }

    scenery.forEach((o) => {
      objectMatrix(parent, [o.x, 0, o.z], o.rot, o.scale);
      if (o.kind === 'pine') {
        const parts = pineParts(o.variant);
        addParts(cyl, parts.cyl, parent);
        addParts(cone, parts.cone, parent);
      } else {
        addParts(sphere, bushParts(o.variant).sphere, parent);
      }
    });

    return {
      box: finalizeBatch(box),
      glass: finalizeBatch(glass),
      metal: finalizeBatch(metal),
      cyl: finalizeBatch(cyl),
      cone: finalizeBatch(cone),
      sphere: finalizeBatch(sphere),
      proxy: finalizeBatch(proxy),
    };
  }, [placements, ringRadii, islandRadius, clearsProps]);

  // ── Layout self-check: proves every repo got a legal, non-overlapping plot ──
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    // layout.count is the repo count that went IN; placements.length is what
    // came out. Comparing placements against itself (as this used to) could
    // never catch a mismatch.
    const reposIn = layout.count;
    const problems = verifyLayout(layout, reposIn);
    const instances =
      village.box.count + village.glass.count + village.metal.count +
      village.cyl.count + village.cone.count + village.sphere.count;
    console.log(
      `[GitVille] ${reposIn} repos → ${placements.length} houses` +
        `${reposIn === placements.length ? ' (1:1 ✓)' : ' ⚠ MISMATCH'} across ` +
        `${ringRadii.length} ring(s) [${ringRadii.map((r) => r.toFixed(1)).join(', ')}], ` +
        `island r=${islandRadius.toFixed(1)}, ${instances} instances in 6 draw calls.`
    );
    if (problems.length) console.warn('[GitVille] layout violations:', problems);
    else console.log('[GitVille] layout check passed — no overlaps, everything on the island.');
  }, [layout, placements, village, ringRadii, islandRadius]);

  // ── Villagers: one shared useFrame drives every instance ────────
  /**
   * On low-power devices only a share of the houses get a villager, sampled at
   * an even stride so they stay spread across the whole village rather than
   * clustering in one quadrant. (This used to be an all-or-nothing boolean,
   * which is why mobile had none at all.)
   */
  const villagerHouses = useMemo(() => {
    const frac = QUALITY.villagerFraction;
    if (frac >= 1 || !placements.length) return placements;
    const want = Math.max(1, Math.round(placements.length * frac));
    const stride = placements.length / want;
    return Array.from({ length: want }, (_, k) => placements[Math.floor(k * stride)]);
  }, [placements]);

  const villagers = useMemo(
    () =>
      villagerHouses.map((h) => {
        const [hx, , hz] = h.position;
        const t = h.rotationY;
        // The house's local +X is tangential, its local +Z points at the castle.
        const tanX = Math.cos(t);
        const tanZ = -Math.sin(t);
        const inX = Math.sin(t);
        const inZ = Math.cos(t);
        const front = (PLOT_D / 2 + 0.5) * HOUSE_SCALE; // out on the footpath
        return {
          baseX: hx + inX * front,
          baseZ: hz + inZ * front,
          tanX,
          tanZ,
          rotY: t,
          speed: 0.34 + (h.index % 4) * 0.06,
          phase: rng(h.index * 3.7 + 1) * Math.PI * 2,
          sweep: 0.55,
          palette: VILLAGER_PALETTES[h.index % VILLAGER_PALETTES.length],
        };
      }),
    [villagerHouses]
  );

  /**
   * Extra villagers walking the roads themselves rather than their own garden.
   * They plug into the same instanced meshes and the same frame loop — the
   * motion model (walk along a tangent, face the direction of travel) already
   * fits a road segment, so only the base point and tangent differ.
   *
   * A ±2.4 sweep along the ring road's tangent bows only
   * r − √(r²−2.4²) ≈ 0.44 off the arc, well inside the 1.2-wide road.
   */
  const roadVillagers = useMemo(() => {
    const want = QUALITY.roadVillagers;
    const out = [];
    if (!want) return out;

    // Along the ring road, on opposite sides of the castle.
    const ringR = RING_ROAD_CENTER_R + 0.26;
    for (let i = 0; i < Math.min(2, want); i++) {
      const a = Math.PI / 4 + i * Math.PI;
      const tanX = -Math.sin(a);
      const tanZ = Math.cos(a);
      out.push({
        baseX: Math.cos(a) * ringR,
        baseZ: Math.sin(a) * ringR,
        tanX,
        tanZ,
        // facing = rotY + ±π/2 must land on the tangent
        rotY: Math.atan2(-tanZ, tanX),
        speed: 0.24 + i * 0.05,
        phase: rng(500 + i * 11) * Math.PI * 2,
        sweep: 2.4,
        palette: VILLAGER_PALETTES[(i + 1) % VILLAGER_PALETTES.length],
      });
    }

    // Out along the spokes.
    const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    for (let i = 0; i < want - 2; i++) {
      const [dx, dz] = dirs[i % 4];
      const mid = (RING_ROAD_OUTER_R + islandRadius * 0.8) / 2;
      const offset = 0.26;
      out.push({
        baseX: dx * mid - dz * offset,
        baseZ: dz * mid + dx * offset,
        tanX: dx,
        tanZ: dz,
        rotY: Math.atan2(-dz, dx),
        speed: 0.2 + i * 0.04,
        phase: rng(700 + i * 13) * Math.PI * 2,
        sweep: 3.0,
        palette: VILLAGER_PALETTES[(i + 2) % VILLAGER_PALETTES.length],
      });
    }

    return out;
  }, [islandRadius]);

  const allVillagers = useMemo(
    () => [...villagers, ...roadVillagers],
    [villagers, roadVillagers]
  );

  /**
   * Dogs wandering a small loop on the grass in front of a few houses. The loop
   * radius stays well inside the 3-unit gap the placement solver guarantees
   * between neighbouring plots, so they never wander into a cottage.
   */
  const dogs = useMemo(() => {
    const want = Math.min(QUALITY.dogCount, placements.length);
    const out = [];
    for (let i = 0; i < want; i++) {
      // Spread across the repo list rather than picking the first few houses.
      const h = placements[Math.floor((i * placements.length) / want)];
      const t = h.rotationY;
      const inX = Math.sin(t);
      const inZ = Math.cos(t);
      const tanX = Math.cos(t);
      const tanZ = -Math.sin(t);
      const front = (PLOT_D / 2 + 0.75) * HOUSE_SCALE;
      const side = (i % 2 === 0 ? 1 : -1) * 0.55;
      out.push({
        cx: h.position[0] + inX * front + tanX * side,
        cz: h.position[2] + inZ * front + tanZ * side,
        loopR: 0.42 + rng(i * 5 + 3) * 0.22,
        speed: 0.5 + rng(i * 9 + 1) * 0.35,
        phase: rng(i * 17 + 5) * Math.PI * 2,
        palette: DOG_PALETTES[i % DOG_PALETTES.length],
      });
    }
    return out;
  }, [placements]);

  const dogRef = useRef();

  // ── Character rigs: one InstancedMesh per (geometry, material) pair ──
  const villagerRig = useMemo(() => buildRig(VILLAGER_PARTS), []);
  const dogRig = useMemo(() => buildRig(DOG_PARTS), []);
  const guardRig = useMemo(() => buildRig(GUARD_PARTS), []);
  const villagerMeshes = useRef([]);
  const dogMeshes = useRef([]);
  const guardMeshes = useRef([]);

  /** Four static sentries, one per corner tower. */
  const guards = useMemo(
    () =>
      GUARD_POSTS.map((g, i) => ({
        ...g,
        phase: i * 1.7,
        palette: GUARD_PALETTES[i % GUARD_PALETTES.length],
      })),
    []
  );

  useLayoutEffect(() => {
    const col = new THREE.Color();

    const paint = (rig, meshes, characters) => {
      rig.forEach((group, g) => {
        const mesh = meshes.current[g];
        if (!mesh) return;
        let i = 0;
        for (const ch of characters) {
          for (const part of group.parts) {
            col.set(ch.palette[part.role] || '#ffffff');
            mesh.setColorAt(i++, col);
          }
        }
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      });
    };

    paint(villagerRig, villagerMeshes, allVillagers);
    paint(dogRig, dogMeshes, dogs);
    paint(guardRig, guardMeshes, guards);
  }, [villagerRig, dogRig, guardRig, allVillagers, dogs, guards]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    /**
     * One matrix per character (position + facing + bob), then every part is
     * `characterMatrix × partLocal`. Swinging limbs pivot at their top rather
     * than spinning about their centre.
     */
    const drive = (rig, meshes, characters, poseOf) => {
      if (!characters.length || !meshes.current.length) return;

      for (let c = 0; c < characters.length; c++) {
        const pose = poseOf(characters[c], time);
        _e.set(0, pose.yaw, 0);
        _q.setFromEuler(_e);
        _p.set(pose.x, pose.bob, pose.z);
        const sc = pose.scale || 1;
        _s.set(sc, sc, sc);
        _charMats[c] = (_charMats[c] || new THREE.Matrix4()).compose(_p, _q, _s);
        _swings[c] = pose.swing;
      }

      rig.forEach((group, g) => {
        const mesh = meshes.current[g];
        if (!mesh) return;
        let i = 0;
        for (let c = 0; c < characters.length; c++) {
          const charMat = _charMats[c];
          for (const part of group.parts) {
            let local = part.local;
            if (part.swing) {
              // Rotate the part's offset from its pivot, so a boot swings on
              // the hip's arc rather than its own.
              const ang = part.swing * _swings[c];
              _e2.set(0, 0, ang);
              _q2.setFromEuler(_e2);
              _v2
                .set(
                  part.p[0] - part.pivot[0],
                  part.p[1] - part.pivot[1],
                  part.p[2] - part.pivot[2]
                )
                .applyQuaternion(_q2);
              _p2.set(
                part.pivot[0] + _v2.x,
                part.pivot[1] + _v2.y,
                part.pivot[2] + _v2.z
              );
              _s2.set(part.s[0], part.s[1], part.s[2]);
              local = _localM.compose(_p2, _q2, _s2);
            }
            mesh.setMatrixAt(i++, _worldM.multiplyMatrices(charMat, local));
          }
        }
        mesh.instanceMatrix.needsUpdate = true;
      });
    };

    // Guards belong to the castle, so the "Villagers & Animals" toggle
    // deliberately does not hide them.
    if (showCharacters) drive(villagerRig, villagerMeshes, allVillagers, (v, t) => {
      const phase = t * v.speed + v.phase;
      const offset = Math.sin(phase) * v.sweep;
      const dir = Math.cos(phase) >= 0 ? 1 : -1;
      return {
        x: v.baseX + v.tanX * offset,
        z: v.baseZ + v.tanZ * offset,
        // Local +X leads, so yaw = atan2(-forwardZ, forwardX).
        yaw: Math.atan2(-dir * v.tanZ, dir * v.tanX),
        bob: Math.abs(Math.sin(phase * 8)) * 0.022,
        swing: Math.sin(phase * 8) * 0.42,
      };
    });

    // Guards hold their post on tower platforms — standing static with slow breathing bob and 1.25x scale.
    drive(guardRig, guardMeshes, guards, (g, t) => ({
      x: g.position[0],
      z: g.position[2],
      yaw: g.rotY,
      scale: 1.25,
      bob: g.position[1] + Math.sin(t * 0.7 + g.phase) * 0.008,
      swing: 0,
    }));

    if (showCharacters) drive(dogRig, dogMeshes, dogs, (dog, t) => {
      const a = t * dog.speed + dog.phase;
      return {
        x: dog.cx + Math.cos(a) * dog.loopR,
        z: dog.cz + Math.sin(a) * dog.loopR,
        yaw: Math.atan2(-Math.cos(a), -Math.sin(a)),
        bob: Math.abs(Math.sin(a * 6)) * 0.018,
        swing: Math.sin(a * 6) * 0.5,
      };
    });
  });

  // ── Pointer handling off the invisible pick-boxes ───────────────
  const hoveredId = useRef(-1);

  const onMove = (e) => {
    e.stopPropagation();
    if (e.instanceId === hoveredId.current) return;
    hoveredId.current = e.instanceId;
    const h = placements[e.instanceId];
    setHoveredRepo(h ? h.repo : null);
    document.body.style.cursor = h ? 'pointer' : 'default';
  };
  const onOut = () => {
    hoveredId.current = -1;
    setHoveredRepo(null);
    document.body.style.cursor = 'default';
  };
  const onUp = (e) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const h = placements[e.instanceId];
    if (h) handleBuildingClick(h.repo, h.position);
  };

  return (
    <group>
      {/* ── Concentric cobble footpath serving each ring of houses ── */}
      {ringRadii.map((r, i) => (
        <mesh
          key={`footpath-${i}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.016, 0]}
          receiveShadow
        >
          <ringGeometry args={[r - HOUSE_D / 2 - 0.5, r - HOUSE_D / 2, 72]} />
          <meshStandardMaterial
            color="#9c9184"
            roughness={0.95}
            flatShading
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* ── The whole village in six instanced draw calls ── */}
      <InstancedBatch geometry={UNIT_BOX} material={MAT_MATTE} data={village.box} />
      <InstancedBatch geometry={UNIT_BOX} material={MAT_GLASS} data={village.glass} />
      <InstancedBatch geometry={UNIT_SPHERE} material={MAT_METAL} data={village.metal} />
      <InstancedBatch geometry={UNIT_CYL} material={MAT_MATTE} data={village.cyl} />
      <InstancedBatch geometry={UNIT_CONE} material={MAT_MATTE} data={village.cone} />
      <InstancedBatch geometry={UNIT_SPHERE} material={MAT_MATTE} data={village.sphere} />

      {/* ── Villagers (all animated from a single useFrame) ── */}
      {/* ── Villagers: torso / limbs / head / hat / belt / eyes, grouped by
             geometry+material so extra detail costs instances, not draw calls ── */}
      {showCharacters && allVillagers.length > 0 &&
        villagerRig.map((group, g) => (
          <instancedMesh
            key={`v-${group.key}-${allVillagers.length}`}
            ref={(el) => (villagerMeshes.current[g] = el)}
            args={[group.geometry, group.material, allVillagers.length * group.parts.length]}
            castShadow
            receiveShadow
            frustumCulled={false}
          />
        ))}

      {/* ── Dogs roaming near a few houses (same frame loop as the villagers) ── */}
      {showCharacters && dogs.length > 0 &&
        dogRig.map((group, g) => (
          <instancedMesh
            key={`d-${group.key}-${dogs.length}`}
            ref={(el) => (dogMeshes.current[g] = el)}
            args={[group.geometry, group.material, dogs.length * group.parts.length]}
            castShadow
            receiveShadow
            frustumCulled={false}
          />
        ))}

      {/* ── Castle guards ── */}
      {guards.length > 0 &&
        guardRig.map((group, g) => (
          <instancedMesh
            key={`g-${group.key}-${guards.length}`}
            ref={(el) => (guardMeshes.current[g] = el)}
            args={[group.geometry, group.material, guards.length * group.parts.length]}
            castShadow
            receiveShadow
            frustumCulled={false}
          />
        ))}

      {/* ── Invisible hover/click proxies, one per house ── */}
      <InstancedBatch
        geometry={UNIT_BOX}
        material={MAT_PICK}
        data={village.proxy}
        castShadow={false}
        receiveShadow={false}
        onPointerMove={onMove}
        onPointerOut={onOut}
        onPointerUp={onUp}
      />
    </group>
  );
});
