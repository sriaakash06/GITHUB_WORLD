import * as THREE from 'three';
import {
  UNIT_BOX,
  UNIT_CYL,
  UNIT_CONE,
  UNIT_SPHERE,
  UNIT_CAPSULE,
  UNIT_TAPER,
  MAT_CLOTH,
  MAT_SKIN,
  MAT_FUR,
  MAT_DETAIL,
} from './InstancedBatch';

/**
 * ═══════════════════════════════════════════════════════════════════
 * CHARACTER RIGS — villagers and dogs
 * ═══════════════════════════════════════════════════════════════════
 * Each character is a flat list of parts in its own local space, with
 * +X forward, +Y up and the origin on the ground. Parts are grouped by
 * (geometry, material) so every villager's torso shares one InstancedMesh,
 * every eye shares another, and so on — adding detail costs instances,
 * not draw calls.
 *
 * `swing` marks a limb that pivots at its top for the walk cycle.
 * `role` picks the colour from the character's own palette at build time.
 */

const GEO = {
  box: UNIT_BOX,
  cyl: UNIT_CYL,
  cone: UNIT_CONE,
  sphere: UNIT_SPHERE,
  capsule: UNIT_CAPSULE,
  taper: UNIT_TAPER,
};

const MAT = {
  cloth: MAT_CLOTH,
  skin: MAT_SKIN,
  fur: MAT_FUR,
  detail: MAT_DETAIL,
};

// ── Villager ─────────────────────────────────────────────────────
// Ground → 0.57 at the hat tip. Torso ends at 0.31, head starts at 0.333,
// so the neck leaves a real gap instead of a head welded to a cylinder.
export const VILLAGER_PARTS = [
  // Legs — rounded, and they swing from the hip.
  { geo: 'capsule', mat: 'cloth', role: 'pants', p: [0, 0.06, 0.042], s: [0.055, 0.12, 0.055], swing: 1 },
  { geo: 'capsule', mat: 'cloth', role: 'pants', p: [0, 0.06, -0.042], s: [0.055, 0.12, 0.055], swing: -1 },
  // Boots, swinging with their leg.
  { geo: 'box', mat: 'detail', role: 'boots', p: [0.012, 0.022, 0.042], s: [0.085, 0.045, 0.062], swing: 1, pivot: [0, 0.12, 0.042] },
  { geo: 'box', mat: 'detail', role: 'boots', p: [0.012, 0.022, -0.042], s: [0.085, 0.045, 0.062], swing: -1, pivot: [0, 0.12, -0.042] },

  // Torso tapers outward toward the shoulders.
  { geo: 'taper', mat: 'cloth', role: 'shirt', p: [0, 0.215, 0], s: [0.15, 0.19, 0.13] },
  // Belt across the waist.
  { geo: 'box', mat: 'detail', role: 'belt', p: [0, 0.14, 0], s: [0.158, 0.028, 0.138] },

  // Arms counter-swing against the legs.
  { geo: 'capsule', mat: 'cloth', role: 'shirt', p: [0, 0.235, 0.088], s: [0.048, 0.15, 0.048], swing: -0.7 },
  { geo: 'capsule', mat: 'cloth', role: 'shirt', p: [0, 0.235, -0.088], s: [0.048, 0.15, 0.048], swing: 0.7 },
  { geo: 'sphere', mat: 'skin', role: 'skin', p: [0, 0.163, 0.088], s: [0.05, 0.05, 0.05], swing: -0.7, pivot: [0, 0.31, 0.088] },
  { geo: 'sphere', mat: 'skin', role: 'skin', p: [0, 0.163, -0.088], s: [0.05, 0.05, 0.05], swing: 0.7, pivot: [0, 0.31, -0.088] },

  // Neck, then head — the gap between them is the point.
  { geo: 'cyl', mat: 'skin', role: 'skin', p: [0, 0.325, 0], s: [0.058, 0.045, 0.058] },
  { geo: 'sphere', mat: 'skin', role: 'skin', p: [0, 0.41, 0], s: [0.15, 0.155, 0.15] },
  // Eyes.
  { geo: 'sphere', mat: 'detail', role: 'eye', p: [0.066, 0.427, 0.036], s: [0.026, 0.03, 0.026] },
  { geo: 'sphere', mat: 'detail', role: 'eye', p: [0.066, 0.427, -0.036], s: [0.026, 0.03, 0.026] },

  // Brimmed hat.
  { geo: 'cyl', mat: 'cloth', role: 'hat', p: [0, 0.482, 0], s: [0.225, 0.022, 0.225] },
  { geo: 'cone', mat: 'cloth', role: 'hat', p: [0, 0.528, 0], s: [0.155, 0.085, 0.155] },
];

// ── Dog ──────────────────────────────────────────────────────────
// Capsules everywhere the old version used hard boxes, plus a rounded snout,
// cone ears and dot eyes. Rotating a capsule by π/2 about Z lays it along +X,
// so scale stays [thickness, length, thickness].
export const DOG_PARTS = [
  { geo: 'capsule', mat: 'fur', role: 'fur', p: [0, 0.19, 0], r: [0, 0, Math.PI / 2], s: [0.17, 0.36, 0.17] },
  { geo: 'capsule', mat: 'fur', role: 'furDark', p: [0, 0.235, 0], r: [0, 0, Math.PI / 2], s: [0.14, 0.26, 0.14] }, // back marking

  { geo: 'sphere', mat: 'fur', role: 'fur', p: [0.21, 0.25, 0], s: [0.17, 0.165, 0.16] },
  { geo: 'capsule', mat: 'fur', role: 'furLight', p: [0.3, 0.215, 0], r: [0, 0, Math.PI / 2], s: [0.085, 0.14, 0.085] },
  { geo: 'sphere', mat: 'detail', role: 'nose', p: [0.372, 0.222, 0], s: [0.05, 0.045, 0.05] },
  { geo: 'sphere', mat: 'detail', role: 'eye', p: [0.255, 0.293, 0.055], s: [0.032, 0.034, 0.03] },
  { geo: 'sphere', mat: 'detail', role: 'eye', p: [0.255, 0.293, -0.055], s: [0.032, 0.034, 0.03] },
  { geo: 'cone', mat: 'fur', role: 'furDark', p: [0.165, 0.335, 0.062], r: [0.32, 0, 0], s: [0.075, 0.095, 0.05] },
  { geo: 'cone', mat: 'fur', role: 'furDark', p: [0.165, 0.335, -0.062], r: [-0.32, 0, 0], s: [0.075, 0.095, 0.05] },

  { geo: 'cyl', mat: 'detail', role: 'collar', p: [0.125, 0.235, 0], r: [0, 0, Math.PI / 2], s: [0.165, 0.028, 0.165] },
  { geo: 'capsule', mat: 'fur', role: 'fur', p: [-0.2, 0.28, 0], r: [0, 0, -1.0], s: [0.045, 0.17, 0.045] },

  // Four legs, trotting in diagonal pairs.
  { geo: 'capsule', mat: 'fur', role: 'fur', p: [0.115, 0.075, 0.062], s: [0.055, 0.15, 0.055], swing: 1 },
  { geo: 'capsule', mat: 'fur', role: 'fur', p: [0.115, 0.075, -0.062], s: [0.055, 0.15, 0.055], swing: -1 },
  { geo: 'capsule', mat: 'fur', role: 'fur', p: [-0.115, 0.075, 0.062], s: [0.055, 0.15, 0.055], swing: -1 },
  { geo: 'capsule', mat: 'fur', role: 'fur', p: [-0.115, 0.075, -0.062], s: [0.055, 0.15, 0.055], swing: 1 },
];

// ── Palettes ─────────────────────────────────────────────────────
// Muted rather than saturated, and each role clearly separated in value so the
// silhouette still reads when the whole figure is in shadow.
export const VILLAGER_PALETTES = [
  { shirt: '#b8564e', pants: '#3b4252', skin: '#e8c39a', hat: '#a86a30', belt: '#4a3423', boots: '#3a2c22', eye: '#2b2621' },
  { shirt: '#4a6ba8', pants: '#4a3c2e', skin: '#d4a373', hat: '#8a5a2b', belt: '#3a2c1e', boots: '#332822', eye: '#2b2621' },
  { shirt: '#4a8459', pants: '#2f3a44', skin: '#b98b5e', hat: '#9a6030', belt: '#453222', boots: '#3a2c22', eye: '#2b2621' },
  { shirt: '#a5567f', pants: '#443042', skin: '#f0d0ac', hat: '#7d5230', belt: '#4a3423', boots: '#332822', eye: '#2b2621' },
];

export const DOG_PALETTES = [
  { fur: '#8a6039', furLight: '#c2a077', furDark: '#5f4227', nose: '#2a2422', eye: '#241f1c', collar: '#a8443c' },
  { fur: '#3a332c', furLight: '#6b6055', furDark: '#241f1a', nose: '#1c1917', eye: '#15120f', collar: '#c08a2e' },
  { fur: '#d8cdbc', furLight: '#efe7d8', furDark: '#a89880', nose: '#3a3230', eye: '#2b2621', collar: '#3f74b8' },
  { fur: '#a06a3a', furLight: '#d0a878', furDark: '#6f4723', nose: '#2a2422', eye: '#241f1c', collar: '#4a8459' },
];

/**
 * Groups a part template by (geometry, material) and precomputes each part's
 * static local matrix. Returns one entry per InstancedMesh that needs drawing.
 */
export function buildRig(parts) {
  const groups = [];
  const byKey = new Map();

  const pos = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const scl = new THREE.Vector3();
  const eul = new THREE.Euler();

  for (const part of parts) {
    const key = `${part.geo}|${part.mat}`;
    let group = byKey.get(key);
    if (!group) {
      group = { key, geometry: GEO[part.geo], material: MAT[part.mat], parts: [] };
      byKey.set(key, group);
      groups.push(group);
    }

    pos.set(part.p[0], part.p[1], part.p[2]);
    eul.set(part.r ? part.r[0] : 0, part.r ? part.r[1] : 0, part.r ? part.r[2] : 0);
    quat.setFromEuler(eul);
    scl.set(part.s[0], part.s[1], part.s[2]);

    group.parts.push({
      ...part,
      local: new THREE.Matrix4().compose(pos, quat, scl),
      /** Pivot for swinging limbs. Defaults to the top of the part, but a
       *  boot must swing from the hip and a hand from the shoulder, or they
       *  travel on a shorter arc than the limb and visibly detach. */
      pivot: part.pivot || [part.p[0], part.p[1] + part.s[1] / 2, part.p[2]],
    });
  }

  return groups;
}
