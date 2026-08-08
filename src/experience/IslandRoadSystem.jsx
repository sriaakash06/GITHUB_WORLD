import React, { useMemo } from 'react';
import * as THREE from 'three';

import {
  ROAD_WIDTH,
  RING_ROAD_INNER_R,
  RING_ROAD_OUTER_R,
  RING_ROAD_CENTER_R,
} from './VillageLayout';
import {
  InstancedBatch,
  UNIT_BOX,
  UNIT_CYL,
  UNIT_SPHERE,
  MAT_MATTE,
  createBatch,
  addParts,
  finalizeBatch,
  objectMatrix,
} from './InstancedBatch';

// ── Cobblestone palette: warm grey / tan / beige, matching the village stonework ──
const MORTAR = '#6d6357'; // packed earth showing between the stones
const COBBLE_COLORS = ['#a89b88', '#b6a992', '#9b9082', '#c2b59c', '#8e857a', '#b1a58f', '#a2937d'];
const KERB = '#c9bda6'; // lighter kerb stone along both edges
const LAMP_METAL = '#3a3d40';

/** Bulb offset in a lamp's own local space (end of the down-angled arm). */
const BULB_LOCAL = [0.29, 1.76, 0];
/**
 * Renderer runs with physically-correct lighting (three r157 defaults
 * `useLegacyLights` to false), so point-light intensity is candela and falls off
 * as 1/d². A lamp bulb 1.76 above the road needs ~6 here to read as a warm pool,
 * not the ~1 that a legacy-lit scene would want.
 */
const LAMP_LIGHT = { color: '#ffcc66', intensity: 6, distance: 8, decay: 2 };
/**
 * Hard ceiling on lamp point lights. There are 20 lamps; giving each one a real
 * light would compile every lit material in the scene against NUM_POINT_LIGHTS=20
 * and loop 20× per fragment, which undoes the instancing work. Six pools plus
 * the castle's two torch lights keeps the night budget at 8 dynamic lights,
 * while all 20 lamps still glow via emissive + additive halo.
 */
const MAX_NIGHT_LIGHTS = 6;

/** Cobble sizing. */
const KERB_W = 0.17;
const COBBLE_ROWS = 3;
const COBBLE_PITCH = 0.44;
/** Spoke stones sit a hair above ring stones so the two paving grids don't
 *  z-fight where the spokes cross the ring road. */
const RING_COBBLE_Y = 0.024;
const SPOKE_COBBLE_Y = 0.031;

/** Deterministic hash-noise so the paving is identical on every reload. */
const rand = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * Cobblestone ring road hugging the outside of the moat + 4 radial spoke roads
 * at 0° / 90° / 180° / 270°, which are also the boundaries between the four
 * village quadrants. Every radius comes from VillageLayout, so the roads stay
 * concentric with the castle and the moat no matter the repo count.
 */
export const IslandRoadSystem = React.memo(function IslandRoadSystem({
  isNightMode,
  islandRadius,
}) {
  const spokeStart = RING_ROAD_CENTER_R;
  const spokeEnd = islandRadius - 0.8;
  const spokeLength = Math.max(0.5, spokeEnd - spokeStart);
  const spokeMid = (spokeStart + spokeEnd) / 2;

  // ── Street lamps, merged into instanced meshes ──
  const lamps = useMemo(() => {
    const posts = [];

    // 8 evenly spaced around the outside of the ring road
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + Math.PI / 8;
      const r = RING_ROAD_OUTER_R + 0.45;
      posts.push({
        x: Math.cos(angle) * r,
        z: Math.sin(angle) * r,
        rotY: -angle + Math.PI,
        // Every other one carries a real light so the pools stay spread out.
        lit: i % 2 === 0,
      });
    }

    // 3 down each spoke, alternating sides
    const dirs = [
      [0, -1], [0, 1], [1, 0], [-1, 0],
    ];
    const step = spokeLength / 3.5;
    dirs.forEach(([dx, dz]) => {
      for (let i = 0; i < 3; i++) {
        const dist = spokeStart + 1.6 + i * step;
        if (dist > spokeEnd - 0.5) continue;
        const side = i % 2 === 0 ? 1 : -1;
        const offX = -dz * (ROAD_WIDTH / 2 + 0.35) * side;
        const offZ = dx * (ROAD_WIDTH / 2 + 0.35) * side;
        posts.push({
          x: dx * dist + offX,
          z: dz * dist + offZ,
          rotY: Math.atan2(-offX, -offZ),
          lit: i === 0,
        });
      }
    });

    const structure = createBatch();
    const poles = createBatch();
    const glow = createBatch();
    const halo = createBatch();
    const parent = new THREE.Matrix4();

    posts.forEach((p) => {
      objectMatrix(parent, [p.x, 0, p.z], p.rotY, 1);
      addParts(
        structure,
        [
          { p: [0, 0.06, 0], s: [0.24, 0.12, 0.24], c: LAMP_METAL },
          { p: [0.14, 1.86, 0], r: [0, 0, -Math.PI / 6], s: [0.34, 0.05, 0.05], c: LAMP_METAL },
          // Little cap over the bulb so the glow reads as a lantern
          { p: [BULB_LOCAL[0], BULB_LOCAL[1] + 0.14, 0], s: [0.24, 0.06, 0.24], c: LAMP_METAL },
        ],
        parent
      );
      addParts(poles, [{ p: [0, 0.95, 0], s: [0.08, 1.9, 0.08], c: LAMP_METAL }], parent);
      // White instance colour: InstancedMesh multiplies it into material.color,
      // so the bulb/halo tint must come from the material alone.
      addParts(glow, [{ p: BULB_LOCAL, s: [0.19, 0.19, 0.19], c: '#ffffff' }], parent);
      addParts(halo, [{ p: BULB_LOCAL, s: [0.62, 0.62, 0.62], c: '#ffffff' }], parent);

      // World-space bulb position for the point light: local +X maps to
      // (cos rotY, −sin rotY) in world X/Z.
      p.bulb = [
        p.x + Math.cos(p.rotY) * BULB_LOCAL[0],
        BULB_LOCAL[1],
        p.z - Math.sin(p.rotY) * BULB_LOCAL[0],
      ];
    });

    return {
      structure: finalizeBatch(structure),
      poles: finalizeBatch(poles),
      glow: finalizeBatch(glow),
      halo: finalizeBatch(halo),
      total: posts.length,
      lights: posts.filter((p) => p.lit).slice(0, MAX_NIGHT_LIGHTS),
    };
  }, [spokeStart, spokeEnd, spokeLength]);

  // ── Every cobble on every road, in one instanced draw call ──
  const paving = useMemo(() => {
    const batch = createBatch();
    const parent = new THREE.Matrix4();
    let k = 0;

    const stoneColor = () =>
      COBBLE_COLORS[Math.floor(rand(k * 1.7) * COBBLE_COLORS.length) % COBBLE_COLORS.length];

    /** One paving stone, slightly jittered in size and heading. */
    const cobble = (x, z, y, heading, len, wide) => {
      objectMatrix(parent, [x, y, z], heading + (rand(k * 7.7) - 0.5) * 0.16, 1);
      addParts(
        batch,
        [{
          p: [0, 0, 0],
          s: [len * (0.74 + rand(k * 5.3) * 0.16), 0.03, wide * (0.7 + rand(k * 2.9) * 0.18)],
          c: stoneColor(),
        }],
        parent
      );
      k++;
    };

    // ── Ring road: concentric rows of stones, staggered like real setts ──
    const bandInner = RING_ROAD_INNER_R + KERB_W;
    const bandOuter = RING_ROAD_OUTER_R - KERB_W;
    const ringRowW = (bandOuter - bandInner) / COBBLE_ROWS;

    for (let row = 0; row < COBBLE_ROWS; row++) {
      const r = bandInner + (row + 0.5) * ringRowW;
      const count = Math.max(12, Math.round((2 * Math.PI * r) / COBBLE_PITCH));
      const arcLen = (2 * Math.PI * r) / count;
      const stagger = (row % 2) * 0.5;

      for (let i = 0; i < count; i++) {
        const a = ((i + stagger) / count) * Math.PI * 2;
        const jitterR = (rand(k * 3.1) - 0.5) * ringRowW * 0.16;
        const rr = r + jitterR;
        // Local +X runs along the road: heading = π/2 − angle
        cobble(Math.cos(a) * rr, Math.sin(a) * rr, RING_COBBLE_Y, Math.PI / 2 - a, arcLen, ringRowW);
      }
    }

    // ── Spoke roads: same paving, laid along each axis ──
    const dirs = [
      [0, -1], [0, 1], [1, 0], [-1, 0],
    ];
    const halfBand = ROAD_WIDTH / 2 - KERB_W;
    const spokeRowW = (halfBand * 2) / COBBLE_ROWS;
    const along = Math.max(4, Math.round(spokeLength / COBBLE_PITCH));
    const tileLen = spokeLength / along;

    dirs.forEach(([dx, dz]) => {
      // Local +X must run along the spoke: (cos φ, −sin φ) = (dx, dz)
      const heading = Math.atan2(-dz, dx);
      const perpX = -dz;
      const perpZ = dx;

      for (let row = 0; row < COBBLE_ROWS; row++) {
        const off = -halfBand + (row + 0.5) * spokeRowW;
        const stagger = (row % 2) * 0.5;

        for (let i = 0; i < along; i++) {
          const dist = spokeStart + (i + 0.5 + stagger) * tileLen;
          if (dist > spokeEnd - tileLen * 0.3) continue;
          const jitterOff = off + (rand(k * 3.1) - 0.5) * spokeRowW * 0.16;
          cobble(
            dx * dist + perpX * jitterOff,
            dz * dist + perpZ * jitterOff,
            SPOKE_COBBLE_Y,
            heading,
            tileLen,
            spokeRowW
          );
        }
      }

      // Lighter kerb stone down both edges of the spoke
      const kerbOff = ROAD_WIDTH / 2 - KERB_W / 2;
      for (const side of [-1, 1]) {
        objectMatrix(
          parent,
          [
            dx * spokeMid + perpX * kerbOff * side,
            SPOKE_COBBLE_Y,
            dz * spokeMid + perpZ * kerbOff * side,
          ],
          heading,
          1
        );
        addParts(
          batch,
          [{ p: [0, 0, 0], s: [spokeLength, 0.034, KERB_W], c: KERB }],
          parent
        );
      }
    });

    return finalizeBatch(batch);
  }, [spokeStart, spokeEnd, spokeLength, spokeMid]);

  // Bright warm bulb at night, dull unlit glass by day.
  const glowMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: isNightMode ? '#fff3cc' : '#cfd4d8',
        emissive: new THREE.Color(isNightMode ? '#ffb43c' : '#000000'),
        emissiveIntensity: isNightMode ? 1.9 : 0,
        roughness: 0.35,
        flatShading: true,
      }),
    [isNightMode]
  );

  // Soft additive halo, night only — sells the glow without a bloom pass.
  const haloMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#ffc861',
        transparent: true,
        opacity: 0.18,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    []
  );

  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log(
      `[GitVille] ${lamps.total} street lamps, ${isNightMode ? lamps.lights.length : 0} point lights active ` +
        `(${isNightMode ? 'night' : 'day'}), ${paving.count} cobbles in 1 draw call.`
    );
  }

  return (
    <group position={[0, 0, 0]}>
      {/* ── 1. RING ROAD BED (mortar/earth showing between the stones) ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <ringGeometry args={[RING_ROAD_INNER_R, RING_ROAD_OUTER_R, 64]} />
        <meshStandardMaterial color={MORTAR} roughness={1} flatShading side={THREE.DoubleSide} />
      </mesh>

      {/* Lighter kerb stone along both edges of the ring road */}
      {[
        [RING_ROAD_INNER_R, RING_ROAD_INNER_R + KERB_W],
        [RING_ROAD_OUTER_R - KERB_W, RING_ROAD_OUTER_R],
      ].map(([a, b], i) => (
        <mesh
          key={`ring-kerb-${i}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.02, 0]}
          receiveShadow
        >
          <ringGeometry args={[a, b, 64]} />
          <meshStandardMaterial color={KERB} roughness={0.95} flatShading side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* ── 2. FOUR SPOKE ROAD BEDS ── */}
      {[
        { pos: [0, 0.012, -spokeMid], size: [ROAD_WIDTH, spokeLength] },
        { pos: [0, 0.012, spokeMid], size: [ROAD_WIDTH, spokeLength] },
        { pos: [spokeMid, 0.012, 0], size: [spokeLength, ROAD_WIDTH] },
        { pos: [-spokeMid, 0.012, 0], size: [spokeLength, ROAD_WIDTH] },
      ].map((s, i) => (
        <mesh key={`spoke-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={s.pos} receiveShadow>
          <planeGeometry args={s.size} />
          <meshStandardMaterial color={MORTAR} roughness={1} flatShading />
        </mesh>
      ))}

      {/* ── 3. ALL COBBLES + SPOKE KERBS — one instanced draw call ── */}
      <InstancedBatch
        geometry={UNIT_BOX}
        material={MAT_MATTE}
        data={paving}
        castShadow={false}
        receiveShadow
      />

      {/* ── 4. STREET LAMPS — every lamp in 3-4 instanced draw calls ── */}
      <InstancedBatch geometry={UNIT_BOX} material={MAT_MATTE} data={lamps.structure} />
      <InstancedBatch geometry={UNIT_CYL} material={MAT_MATTE} data={lamps.poles} />
      <InstancedBatch
        geometry={UNIT_SPHERE}
        material={glowMaterial}
        data={lamps.glow}
        castShadow={false}
        receiveShadow={false}
      />
      {isNightMode && (
        <InstancedBatch
          geometry={UNIT_SPHERE}
          material={haloMaterial}
          data={lamps.halo}
          castShadow={false}
          receiveShadow={false}
          renderOrder={2}
        />
      )}

      {/* Real point lights at the bulbs — night only, capped at MAX_NIGHT_LIGHTS.
          Every other lamp still glows via emissive + halo. */}
      {isNightMode &&
        lamps.lights.map((l, i) => (
          <pointLight
            key={`lamp-light-${i}`}
            position={l.bulb}
            color={LAMP_LIGHT.color}
            intensity={LAMP_LIGHT.intensity}
            distance={LAMP_LIGHT.distance}
            decay={LAMP_LIGHT.decay}
          />
        ))}
    </group>
  );
});
