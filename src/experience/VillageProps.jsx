import React, { useMemo, useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

import {
  InstancedBatch,
  UNIT_BOX,
  UNIT_CYL,
  UNIT_CONE,
  MAT_MATTE,
  createBatch,
  addParts,
  finalizeBatch,
  objectMatrix,
} from './InstancedBatch';

/**
 * ═══════════════════════════════════════════════════════════════════
 * DECORATIVE VILLAGE PROPS
 * ═══════════════════════════════════════════════════════════════════
 * Pure scenery — nothing here is tied to repo data. One water tower, one
 * windmill (blades animated), two wagons. Every static part is merged into
 * the same three instanced batches, so the whole set costs 3 draw calls plus
 * 2 for the turning blades.
 */

// Muted low-poly palette, matching the cottages' timber and the lamps' metal.
const WOOD = '#6b4f32';
const WOOD_LIGHT = '#7d5c3b';
const WOOD_DARK = '#4a3423';
const METAL = '#6e7276';
const METAL_DARK = '#565a5e';

// ── Water tower ──────────────────────────────────────────────────
const WT_LEG_H = 1.5;
const WT_SPREAD_BOT = 0.62;
const WT_SPREAD_TOP = 0.34;

function waterTowerParts() {
  const box = [];
  const cyl = [];
  const cone = [];

  const lean = WT_SPREAD_BOT - WT_SPREAD_TOP; // horizontal run over the leg height
  const legLen = Math.hypot(WT_LEG_H, lean);
  const tilt = Math.asin(lean / legLen);

  // 4 splayed legs. Rotating a box about Z by θ leans its +Y axis toward −X,
  // and about X by φ leans it toward −Z, so each corner leans inward.
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      box.push({
        p: [sx * ((WT_SPREAD_BOT + WT_SPREAD_TOP) / 2), WT_LEG_H / 2, sz * ((WT_SPREAD_BOT + WT_SPREAD_TOP) / 2)],
        r: [sz * tilt, 0, sx * tilt],
        s: [0.1, legLen, 0.1],
        c: WOOD,
      });
    }
  }

  // Cross braces at mid height, where the legs have drawn in a little.
  const braceY = 0.8;
  const braceSpread = WT_SPREAD_BOT - lean * (braceY / WT_LEG_H);
  for (const s of [-1, 1]) {
    box.push({ p: [0, braceY, s * braceSpread], s: [braceSpread * 2, 0.07, 0.07], c: WOOD_DARK });
    box.push({ p: [s * braceSpread, braceY, 0], s: [0.07, 0.07, braceSpread * 2], c: WOOD_DARK });
  }

  // Tank: wooden staves with two metal hoops, flat deck, conical cap.
  const tankY = WT_LEG_H + 0.4;
  box.push({ p: [0, WT_LEG_H + 0.03, 0], s: [0.86, 0.08, 0.86], c: WOOD_DARK });
  cyl.push({ p: [0, tankY, 0], s: [1.04, 0.8, 1.04], c: WOOD_LIGHT });
  cyl.push({ p: [0, tankY - 0.26, 0], s: [1.1, 0.08, 1.1], c: METAL });
  cyl.push({ p: [0, tankY + 0.26, 0], s: [1.1, 0.08, 1.1], c: METAL });
  cone.push({ p: [0, tankY + 0.63, 0], s: [1.3, 0.48, 1.3], c: METAL_DARK });
  box.push({ p: [0, tankY + 0.9, 0], s: [0.09, 0.14, 0.09], c: METAL_DARK });

  // Down pipe
  cyl.push({ p: [0.34, WT_LEG_H * 0.5 + 0.2, 0.34], s: [0.09, WT_LEG_H + 0.4, 0.09], c: METAL });

  // Ladder up one side: two rails plus rungs.
  const ladderX = WT_SPREAD_BOT + 0.14;
  for (const s of [-1, 1]) {
    box.push({ p: [ladderX, (WT_LEG_H + 0.5) / 2, s * 0.16], s: [0.05, WT_LEG_H + 0.5, 0.05], c: WOOD_DARK });
  }
  for (let i = 0; i < 6; i++) {
    box.push({
      p: [ladderX, 0.22 + i * 0.28, 0],
      s: [0.04, 0.04, 0.34],
      c: WOOD_DARK,
    });
  }

  return { box, cyl, cone };
}

// ── Windmill tower (blades are animated separately) ──────────────
const WM_TOWER_H = 2.2;
const WM_SPREAD_BOT = 0.42;
const WM_SPREAD_TOP = 0.2;
/** Hub sits just above and in front of the tower top. */
export const WM_HUB = [0, WM_TOWER_H + 0.24, 0.3];

function windmillParts() {
  const box = [];
  const cyl = [];

  const lean = WM_SPREAD_BOT - WM_SPREAD_TOP;
  const legLen = Math.hypot(WM_TOWER_H, lean);
  const tilt = Math.asin(lean / legLen);

  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      box.push({
        p: [sx * ((WM_SPREAD_BOT + WM_SPREAD_TOP) / 2), WM_TOWER_H / 2, sz * ((WM_SPREAD_BOT + WM_SPREAD_TOP) / 2)],
        r: [sz * tilt, 0, sx * tilt],
        s: [0.1, legLen, 0.1],
        c: WOOD,
      });
    }
  }

  // Lattice: three horizontal rings plus a diagonal on each face.
  [0.45, 1.1, 1.75].forEach((y, ring) => {
    const spread = WM_SPREAD_BOT - lean * (y / WM_TOWER_H);
    for (const s of [-1, 1]) {
      box.push({ p: [0, y, s * spread], s: [spread * 2, 0.06, 0.06], c: WOOD_DARK });
      box.push({ p: [s * spread, y, 0], s: [0.06, 0.06, spread * 2], c: WOOD_DARK });
    }
    if (ring < 2) {
      const midY = y + 0.325;
      const spreadMid = WM_SPREAD_BOT - lean * (midY / WM_TOWER_H);
      for (const s of [-1, 1]) {
        box.push({
          p: [0, midY, s * spreadMid],
          r: [0, 0, ring % 2 === 0 ? 0.62 : -0.62],
          s: [spreadMid * 2.3, 0.05, 0.05],
          c: WOOD_DARK,
        });
      }
    }
  });

  // Cap and the axle housing the blades turn on.
  box.push({ p: [0, WM_TOWER_H + 0.06, 0], s: [0.62, 0.14, 0.62], c: WOOD_LIGHT });
  box.push({ p: [0, WM_TOWER_H + 0.24, 0.02], s: [0.46, 0.34, 0.5], c: WOOD });
  cyl.push({ p: [WM_HUB[0], WM_HUB[1], WM_HUB[2] - 0.12], r: [Math.PI / 2, 0, 0], s: [0.14, 0.3, 0.14], c: METAL_DARK });

  return { box, cyl };
}

/** 4 blades in a cross, built in the hub's own XY plane. */
function bladeParts() {
  const parts = [];
  for (let k = 0; k < 4; k++) {
    const a = (k * Math.PI) / 2;
    // A box's local +Y rotated about Z by (a − π/2) points along (cos a, sin a).
    parts.push({
      p: [Math.cos(a) * 0.48, Math.sin(a) * 0.48, 0],
      r: [0, 0, a - Math.PI / 2],
      s: [0.13, 0.95, 0.04],
      c: k % 2 === 0 ? WOOD_LIGHT : WOOD,
    });
    // Sail slat across the outer half of each blade.
    parts.push({
      p: [Math.cos(a) * 0.72, Math.sin(a) * 0.72, 0.03],
      r: [0, 0, a - Math.PI / 2],
      s: [0.26, 0.5, 0.02],
      c: '#cbbda2',
    });
  }
  return parts;
}

// ── Wagon ────────────────────────────────────────────────────────
function wagonParts() {
  const box = [];
  const cyl = [];

  box.push({ p: [0, 0.42, 0], s: [1.25, 0.14, 0.62], c: WOOD_LIGHT });
  for (const s of [-1, 1]) {
    box.push({ p: [0, 0.56, s * 0.28], s: [1.25, 0.18, 0.06], c: WOOD });
  }
  box.push({ p: [-0.6, 0.56, 0], s: [0.06, 0.18, 0.62], c: WOOD });

  // Two wheels — the cart points along +X, so the axle runs along Z.
  for (const s of [-1, 1]) {
    cyl.push({ p: [-0.18, 0.27, s * 0.35], r: [Math.PI / 2, 0, 0], s: [0.54, 0.09, 0.54], c: WOOD_DARK });
    cyl.push({ p: [-0.18, 0.27, s * 0.35], r: [Math.PI / 2, 0, 0], s: [0.18, 0.11, 0.18], c: METAL });
  }

  // Barrel lying across the bed.
  cyl.push({ p: [0.1, 0.68, 0], r: [0, 0, Math.PI / 2], s: [0.4, 0.62, 0.4], c: WOOD });
  cyl.push({ p: [-0.06, 0.68, 0], r: [0, 0, Math.PI / 2], s: [0.43, 0.06, 0.43], c: METAL });
  cyl.push({ p: [0.26, 0.68, 0], r: [0, 0, Math.PI / 2], s: [0.43, 0.06, 0.43], c: METAL });

  // Shafts angling down toward where a horse would stand.
  for (const s of [-1, 1]) {
    box.push({ p: [0.92, 0.36, s * 0.2], r: [0, 0, 0.16], s: [0.72, 0.05, 0.05], c: WOOD_DARK });
  }

  return { box, cyl };
}

// ── Market stall ─────────────────────────────────────────────────
/** Awning canvas colours — one per stall, cycled by instance index. */
const CANVAS = ['#c4483f', '#d8a23a', '#3f74b8'];

function stallParts(variant = 0) {
  const box = [];
  const cyl = [];
  const canvas = CANVAS[variant % CANVAS.length];

  // Counter: a plank top on four short legs.
  box.push({ p: [0, 0.62, 0], s: [1.5, 0.1, 0.66], c: WOOD_LIGHT });
  box.push({ p: [0, 0.44, -0.28], s: [1.5, 0.28, 0.06], c: WOOD }); // front board
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      box.push({ p: [sx * 0.66, 0.31, sz * 0.26], s: [0.08, 0.62, 0.08], c: WOOD_DARK });
    }
  }

  // Four corner posts holding the awning.
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      box.push({ p: [sx * 0.72, 0.78, sz * 0.34], s: [0.07, 1.56, 0.07], c: WOOD });
    }
  }

  // Peaked cloth roof: two angled panels meeting at a ridge.
  const roofH = 0.34;
  const halfW = 0.92;
  const slope = Math.hypot(halfW, roofH);
  const ridgeY = 1.56 + roofH / 2;
  for (const side of [-1, 1]) {
    const ang = Math.atan2(roofH, -side * halfW);
    box.push({
      p: [(side * halfW) / 2, ridgeY, 0],
      r: [0, 0, ang],
      s: [slope, 0.05, 0.92],
      c: canvas,
    });
  }
  box.push({ p: [0, 1.56 + roofH, 0], s: [0.09, 0.08, 0.94], c: WOOD_DARK });
  // Scalloped valance along the front edge.
  for (let i = -2; i <= 2; i++) {
    box.push({ p: [i * 0.34, 1.5, 0.46], s: [0.26, 0.14, 0.04], c: canvas });
  }

  // Crates and a barrel stacked beside the counter.
  box.push({ p: [0.95, 0.17, 0.3], s: [0.34, 0.34, 0.34], c: WOOD });
  box.push({ p: [0.95, 0.48, 0.3], s: [0.28, 0.28, 0.28], c: WOOD_LIGHT });
  box.push({ p: [-0.98, 0.19, 0.32], s: [0.36, 0.38, 0.36], c: WOOD_DARK });
  cyl.push({ p: [-0.98, 0.24, -0.24], s: [0.36, 0.48, 0.36], c: WOOD });
  cyl.push({ p: [-0.98, 0.36, -0.24], s: [0.39, 0.05, 0.39], c: METAL });
  cyl.push({ p: [-0.98, 0.12, -0.24], s: [0.39, 0.05, 0.39], c: METAL });

  return { box, cyl };
}

const BUILDERS = {
  waterTower: waterTowerParts,
  windmill: windmillParts,
  wagon: wagonParts,
  stall: stallParts,
};

// ── Turning blade assemblies ─────────────────────────────────────
const BLADE_SPEED = 0.45; // radians/sec — a slow, idle turn

const _hubFrame = new THREE.Matrix4();
const _spin = new THREE.Matrix4();
const _bladeWorld = new THREE.Matrix4();
const _pos = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _scl = new THREE.Vector3();
const _eul = new THREE.Euler();

/**
 * Every windmill's blades share ONE InstancedMesh driven by a single useFrame,
 * so adding windmills costs 8 more instances rather than another draw call and
 * another frame callback. Each mill gets its own phase and a slight speed
 * variation so they don't turn in lockstep.
 */
function WindmillBlades({ windmills }) {
  const meshRef = useRef();
  const spinRef = useRef(0);

  const rig = useMemo(() => {
    const parts = bladeParts();

    // Blade transforms in the hub's own space.
    const locals = parts.map((p) => {
      _pos.set(p.p[0], p.p[1], p.p[2]);
      _eul.set(p.r[0], p.r[1], p.r[2]);
      _quat.setFromEuler(_eul);
      _scl.set(p.s[0], p.s[1], p.s[2]);
      return new THREE.Matrix4().compose(_pos, _quat, _scl);
    });

    // Each mill's hub frame: its world placement, then the hub offset.
    const mills = windmills.map((w, i) => {
      _pos.set(w.position[0], w.position[1], w.position[2]);
      _eul.set(0, w.rotY, 0);
      _quat.setFromEuler(_eul);
      _scl.set(1, 1, 1);
      const base = new THREE.Matrix4().compose(_pos, _quat, _scl);
      base.multiply(new THREE.Matrix4().makeTranslation(WM_HUB[0], WM_HUB[1], WM_HUB[2]));
      return { base, phase: (i * Math.PI) / 3, speed: BLADE_SPEED * (0.82 + 0.12 * i) };
    });

    return { locals, mills, colors: parts.map((p) => p.c) };
  }, [windmills]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const col = new THREE.Color();
    let i = 0;
    for (let m = 0; m < rig.mills.length; m++) {
      for (let b = 0; b < rig.colors.length; b++) mesh.setColorAt(i++, col.set(rig.colors[b]));
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [rig]);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh || !rig.mills.length) return;

    spinRef.current += delta;
    let i = 0;
    for (const mill of rig.mills) {
      _spin.makeRotationZ(mill.phase + spinRef.current * mill.speed);
      _hubFrame.multiplyMatrices(mill.base, _spin);
      for (const local of rig.locals) {
        _bladeWorld.multiplyMatrices(_hubFrame, local);
        mesh.setMatrixAt(i++, _bladeWorld);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  const count = rig.mills.length * rig.locals.length;
  if (!count) return null;

  return (
    <instancedMesh
      ref={meshRef}
      key={`blades-${count}`}
      args={[UNIT_BOX, MAT_MATTE, count]}
      castShadow
      frustumCulled={false}
    />
  );
}

/**
 * Renders every decorative prop. Placement and the collision checks live in
 * VillageLayout so the scenery generator can steer trees and bushes around them.
 */
export const VillageProps = React.memo(function VillageProps({ props: propList }) {
  const batches = useMemo(() => {
    const box = createBatch();
    const cyl = createBatch();
    const cone = createBatch();
    const parent = new THREE.Matrix4();

    propList.forEach((prop, i) => {
      const build = BUILDERS[prop.kind];
      if (!build) return;
      const parts = build(i);
      objectMatrix(parent, prop.position, prop.rotY, 1);
      if (parts.box) addParts(box, parts.box, parent);
      if (parts.cyl) addParts(cyl, parts.cyl, parent);
      if (parts.cone) addParts(cone, parts.cone, parent);
    });

    return {
      box: finalizeBatch(box),
      cyl: finalizeBatch(cyl),
      cone: finalizeBatch(cone),
    };
  }, [propList]);

  const windmills = propList.filter((p) => p.kind === 'windmill');

  return (
    <group>
      <InstancedBatch geometry={UNIT_BOX} material={MAT_MATTE} data={batches.box} />
      <InstancedBatch geometry={UNIT_CYL} material={MAT_MATTE} data={batches.cyl} />
      <InstancedBatch geometry={UNIT_CONE} material={MAT_MATTE} data={batches.cone} />

      <WindmillBlades windmills={windmills} />
    </group>
  );
});
