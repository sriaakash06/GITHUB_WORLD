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
  ROAD_WIDTH,
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

// ── Villager proportions (world units) ──
const V_LEG = [0.035, 0.11, 0.035];
const V_BODY = [0.13, 0.18, 0.13];
const V_HEAD = [0.16, 0.16, 0.16];
const V_HAT = [0.24, 0.08, 0.24];
const V_LEG_Y = 0.055;
const V_BODY_Y = 0.2;
const V_HEAD_Y = 0.37;
const V_HAT_Y = 0.465;
const V_SKIN = '#f0c68a';
const V_LEG_COLOR = '#2a3040';
const VILLAGER_COLORS = ['#c8443c', '#3a5fb0', '#2f8b4a', '#b8478a'];
const HAT_COLORS = ['#b56b28', '#8a5a2b', '#a06030', '#7d5230'];

// Reused across frames so the villager animation allocates nothing.
const _m = new THREE.Matrix4();
const _p = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _e = new THREE.Euler();

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
  handleBuildingClick,
  setHoveredRepo,
}) {
  const { placements, ringRadii, islandRadius } = layout;

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
          if (nearSpoke(a, rr)) continue;
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
        if (nearSpoke(a, r)) continue;
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
      if (nearSpoke(a, rr)) continue;
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
  }, [placements, ringRadii, islandRadius]);

  // ── Layout self-check: proves every repo got a legal, non-overlapping plot ──
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const problems = verifyLayout(layout, placements.length);
    const instances =
      village.box.count + village.glass.count + village.metal.count +
      village.cyl.count + village.cone.count + village.sphere.count;
    console.log(
      `[GitVille] ${placements.length} repos → ${placements.length} houses across ` +
        `${ringRadii.length} ring(s) [${ringRadii.map((r) => r.toFixed(1)).join(', ')}], ` +
        `island r=${islandRadius.toFixed(1)}, ${instances} instances in 6 draw calls.`
    );
    if (problems.length) console.warn('[GitVille] layout violations:', problems);
    else console.log('[GitVille] layout check passed — no overlaps, everything on the island.');
  }, [layout, placements, village, ringRadii, islandRadius]);

  // ── Villagers: one shared useFrame drives every instance ────────
  const villagers = useMemo(
    () =>
      placements.map((h) => {
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
          body: VILLAGER_COLORS[h.index % VILLAGER_COLORS.length],
          hat: HAT_COLORS[h.index % HAT_COLORS.length],
        };
      }),
    [placements]
  );

  const legRef = useRef();
  const bodyRef = useRef();
  const headRef = useRef();
  const hatRef = useRef();

  useLayoutEffect(() => {
    const col = new THREE.Color();
    villagers.forEach((v, i) => {
      if (legRef.current) {
        col.set(V_LEG_COLOR);
        legRef.current.setColorAt(i * 2, col);
        legRef.current.setColorAt(i * 2 + 1, col);
      }
      if (bodyRef.current) bodyRef.current.setColorAt(i, col.set(v.body));
      if (headRef.current) headRef.current.setColorAt(i, col.set(V_SKIN));
      if (hatRef.current) hatRef.current.setColorAt(i, col.set(v.hat));
    });
    [legRef, bodyRef, headRef, hatRef].forEach((r) => {
      if (r.current?.instanceColor) r.current.instanceColor.needsUpdate = true;
    });
  }, [villagers]);

  useFrame((state) => {
    const legs = legRef.current;
    const body = bodyRef.current;
    const head = headRef.current;
    const hat = hatRef.current;
    if (!legs || !body || !head || !hat || !villagers.length) return;

    const time = state.clock.elapsedTime;

    for (let i = 0; i < villagers.length; i++) {
      const v = villagers[i];
      const phase = time * v.speed + v.phase;
      const offset = Math.sin(phase) * v.sweep;
      const facing = v.rotY + (Math.cos(phase) >= 0 ? Math.PI / 2 : -Math.PI / 2);
      const bob = Math.abs(Math.sin(phase * 4)) * 0.025;

      const x = v.baseX + v.tanX * offset;
      const z = v.baseZ + v.tanZ * offset;

      _e.set(0, facing, 0);
      _q.setFromEuler(_e);

      _p.set(x, V_BODY_Y + bob, z);
      _s.set(V_BODY[0], V_BODY[1], V_BODY[2]);
      body.setMatrixAt(i, _m.compose(_p, _q, _s));

      _p.set(x, V_HEAD_Y + bob, z);
      _s.set(V_HEAD[0], V_HEAD[1], V_HEAD[2]);
      head.setMatrixAt(i, _m.compose(_p, _q, _s));

      _p.set(x, V_HAT_Y + bob, z);
      _s.set(V_HAT[0], V_HAT[1], V_HAT[2]);
      hat.setMatrixAt(i, _m.compose(_p, _q, _s));

      // Legs sit ±0.045 along the villager's own lateral axis and swing in step.
      const latX = Math.cos(facing);
      const latZ = -Math.sin(facing);
      const swing = Math.sin(phase * 8) * 0.35;
      _s.set(V_LEG[0], V_LEG[1], V_LEG[2]);
      for (let l = 0; l < 2; l++) {
        const side = l === 0 ? -0.045 : 0.045;
        _e.set(l === 0 ? swing : -swing, facing, 0);
        _q.setFromEuler(_e);
        _p.set(x + latX * side, V_LEG_Y + bob, z + latZ * side);
        legs.setMatrixAt(i * 2 + l, _m.compose(_p, _q, _s));
      }
    }

    legs.instanceMatrix.needsUpdate = true;
    body.instanceMatrix.needsUpdate = true;
    head.instanceMatrix.needsUpdate = true;
    hat.instanceMatrix.needsUpdate = true;
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
      {villagers.length > 0 && (
        <>
      <instancedMesh
        ref={legRef}
        key={`legs-${villagers.length}`}
        args={[UNIT_BOX, MAT_MATTE, Math.max(1, villagers.length * 2)]}
        castShadow
        frustumCulled={false}
      />
      <instancedMesh
        ref={bodyRef}
        key={`body-${villagers.length}`}
        args={[UNIT_CYL, MAT_MATTE, Math.max(1, villagers.length)]}
        castShadow
        frustumCulled={false}
      />
      <instancedMesh
        ref={headRef}
        key={`head-${villagers.length}`}
        args={[UNIT_SPHERE, MAT_MATTE, Math.max(1, villagers.length)]}
        castShadow
        frustumCulled={false}
      />
      <instancedMesh
        ref={hatRef}
        key={`hat-${villagers.length}`}
        args={[UNIT_CONE, MAT_MATTE, Math.max(1, villagers.length)]}
        castShadow
        frustumCulled={false}
      />
        </>
      )}

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
