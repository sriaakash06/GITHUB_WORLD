import * as THREE from 'three';
import { PLOT_W, PLOT_D, PLOT_H } from './VillageLayout';

/**
 * ═══════════════════════════════════════════════════════════════════
 * GITVILLE COTTAGE  (Fix 5)
 * ═══════════════════════════════════════════════════════════════════
 * A low single-storey stone-and-wood cottage, NOT a tower. This module
 * emits plain part descriptors instead of JSX so every repeated element
 * (roof tiles, stone blocks, fence posts, planks) can be merged into
 * shared InstancedMeshes across the whole village — see InstancedBatch.
 *
 * Local space: origin at the centre of the garden plot, y = 0 on the grass,
 * and the front door on the +Z face (which the placement code rotates to
 * face the castle).
 */

// ── Proportions ──────────────────────────────────────────────────
// The old house stacked 1–3 floors of 0.85 on a 1.05 base, so walls ran
// 1.05–2.75 tall on a ~2.6 wide box: a narrow tower. It is now a single
// storey at 1.05, on a slightly wider footprint.
const WALL_H = 1.05;
const ROOF_H = 0.55; // 32% of wall + fascia + roof — prominent, not oversized
const FASCIA_H = 0.12;
const EAVE = 0.24;
/** The cottage sits toward the back of its plot, leaving a front garden.
 *  Tuned so even the widest style's rear eave stays inside the plot box that
 *  the placement solver spaces houses by. */
const SHIFT_Z = -0.3;

export const COTTAGE_HEIGHT = PLOT_H + WALL_H + FASCIA_H + ROOF_H; // 1.94
/** Ridge height plus the chimney — used for the hover/click proxy volume. */
export const COTTAGE_PICK_HEIGHT = COTTAGE_HEIGHT + 0.22;

// ── Palettes ─────────────────────────────────────────────────────
const WALL_COLORS = ['#efe6d8', '#e7dccd', '#e3e1d9', '#eadfcd'];
const STONE_COLORS = ['#8d867a', '#a89c88', '#7a736a', '#9b8f7e', '#6f6a62'];
const PLANK_COLORS = ['#7a4a1c', '#8a5622', '#6d4018'];
const FLOWER_COLORS = ['#e4574c', '#f2b134', '#e26aa8'];
const TIMBER = '#5a3f29';
const TIMBER_DARK = '#43301d';

const _c = new THREE.Color();
const shade = (hex, mul) => '#' + _c.set(hex).multiplyScalar(mul).getHexString();

/**
 * Builds one cottage.
 * @returns part lists keyed by the instanced batch they belong to.
 */
export function buildCottage({ style = 0, roofColor = '#c0603f' } = {}) {
  const s = Math.abs(style | 0);

  const box = [];
  const glass = [];
  const metal = [];
  const cyl = [];
  const cone = [];
  const sphere = [];

  const wallW = 3.05 + (s % 2) * 0.18;
  const wallD = 2.6 + ((s + 1) % 2) * 0.18;
  const wallColor = WALL_COLORS[s % WALL_COLORS.length];

  const wallY0 = PLOT_H;
  const wallCY = wallY0 + WALL_H / 2;
  const frontZ = SHIFT_Z + wallD / 2;
  const backZ = SHIFT_Z - wallD / 2;

  // ── Garden plot & lawn ──────────────────────────────────────────
  box.push({ p: [0, PLOT_H / 2, 0], s: [PLOT_W, PLOT_H, PLOT_D], c: '#8b7f6d' });
  box.push({
    p: [0, PLOT_H + 0.02, 0],
    s: [PLOT_W - 0.14, 0.04, PLOT_D - 0.14],
    c: '#5aa347',
  });

  // ── Cottage box ─────────────────────────────────────────────────
  box.push({ p: [0, wallCY, SHIFT_Z], s: [wallW, WALL_H, wallD], c: wallColor });

  // ── Stone-block course around the base of every wall ────────────
  const bandH = WALL_H * 0.36;
  const rows = 2;
  const rowH = bandH / rows;
  const blockH = rowH * 0.86;
  const blockT = 0.055;
  const stoneAt = (i, r, extra = 0) =>
    STONE_COLORS[Math.abs(i * 3 + r * 5 + s + extra) % STONE_COLORS.length];

  for (let r = 0; r < rows; r++) {
    const y = wallY0 + (r + 0.5) * rowH;
    const stagger = (r % 2) * 0.09;

    const nX = Math.max(3, Math.floor((wallW - 0.1) / 0.42));
    const stepX = (wallW - 0.12) / nX;
    for (let i = 0; i < nX; i++) {
      const x = -wallW / 2 + 0.06 + (i + 0.5) * stepX + stagger;
      if (Math.abs(x) > wallW / 2 - 0.1) continue;
      const bw = stepX * 0.84;
      box.push({ p: [x, y, frontZ + blockT / 2], s: [bw, blockH, blockT], c: stoneAt(i, r) });
      box.push({ p: [x, y, backZ - blockT / 2], s: [bw, blockH, blockT], c: stoneAt(i, r, 2) });
    }

    const nZ = Math.max(3, Math.floor((wallD - 0.1) / 0.42));
    const stepZ = (wallD - 0.12) / nZ;
    for (let i = 0; i < nZ; i++) {
      const z = backZ + 0.06 + (i + 0.5) * stepZ + stagger;
      if (Math.abs(z - SHIFT_Z) > wallD / 2 - 0.1) continue;
      const bd = stepZ * 0.84;
      box.push({ p: [-wallW / 2 - blockT / 2, y, z], s: [blockT, blockH, bd], c: stoneAt(i, r, 1) });
      box.push({ p: [wallW / 2 + blockT / 2, y, z], s: [blockT, blockH, bd], c: stoneAt(i, r, 3) });
    }
  }

  // ── Stone quoins up the two front corners ───────────────────────
  const quoinStep = 0.19;
  for (let q = 0; q < 8; q++) {
    const y = wallY0 + (q + 0.5) * quoinStep;
    if (y > wallY0 + WALL_H - 0.09) break;
    const long = q % 2 === 0;
    const qw = long ? 0.26 : 0.16;
    const qd = long ? 0.16 : 0.26;
    const color = STONE_COLORS[Math.abs(q * 7 + s + 1) % STONE_COLORS.length];
    for (const sx of [-1, 1]) {
      box.push({
        p: [sx * (wallW / 2 - qw / 2 + 0.02), y, frontZ - qd / 2 + 0.03],
        s: [qw + 0.05, quoinStep * 0.86, qd + 0.05],
        c: color,
      });
    }
  }

  // ── Timber trim: rear corner posts + a band over the stone course ─
  for (const sx of [-1, 1]) {
    box.push({
      p: [sx * (wallW / 2 - 0.05), wallCY, backZ + 0.05],
      s: [0.1, WALL_H, 0.1],
      c: TIMBER,
    });
  }
  const bandY = wallY0 + bandH + 0.035;
  box.push({ p: [0, bandY, frontZ + 0.025], s: [wallW + 0.04, 0.07, 0.05], c: TIMBER });
  box.push({ p: [0, bandY, backZ - 0.025], s: [wallW + 0.04, 0.07, 0.05], c: TIMBER });
  box.push({ p: [-wallW / 2 - 0.025, bandY, SHIFT_Z], s: [0.05, 0.07, wallD + 0.04], c: TIMBER });
  box.push({ p: [wallW / 2 + 0.025, bandY, SHIFT_Z], s: [0.05, 0.07, wallD + 0.04], c: TIMBER });

  // ── Peaked shingled roof ────────────────────────────────────────
  box.push({
    p: [0, wallY0 + WALL_H + FASCIA_H / 2, SHIFT_Z],
    s: [wallW + 0.18, FASCIA_H, wallD + 0.18],
    c: TIMBER,
  });

  const roofBaseY = wallY0 + WALL_H + FASCIA_H;
  const roofW = wallW + EAVE * 2;
  const roofD = wallD + EAVE * 2;
  const halfW = roofW / 2;
  const slope = Math.hypot(halfW, ROOF_H);
  const panelT = 0.085;

  const tileColors = [
    roofColor,
    shade(roofColor, 0.87),
    shade(roofColor, 1.12),
    shade(roofColor, 0.96),
  ];
  const ridgeColor = shade(roofColor, 0.78);

  for (const side of [-1, 1]) {
    // Panel runs from the ridge at [0, ROOF_H] down to the eave at [side*halfW, 0].
    const ang = Math.atan2(ROOF_H, -side * halfW);
    const ca = Math.cos(ang);
    const sa = Math.sin(ang);
    const cx = (side * halfW) / 2;
    const cy = roofBaseY + ROOF_H / 2;

    box.push({
      p: [cx, cy, SHIFT_Z],
      r: [0, 0, ang],
      s: [slope, panelT, roofD],
      c: ridgeColor,
    });

    // Overlapping tiles, laid in horizontal rows down the slope.
    const tileRows = 4;
    const tileCols = Math.max(6, Math.round(roofD / 0.42));
    const rowLen = slope / tileRows;
    const colLen = roofD / tileCols;

    for (let r = 0; r < tileRows; r++) {
      const lx = -slope / 2 + (r + 0.5) * rowLen;
      const ly = panelT / 2 + 0.014;
      for (let t = 0; t < tileCols; t++) {
        const lz = -roofD / 2 + (t + 0.5 + (r % 2) * 0.22) * colLen;
        if (Math.abs(lz) > roofD / 2 - colLen * 0.12) continue;
        box.push({
          // rotate the tile's (x, y) offset into the panel's slope
          p: [cx + lx * ca - ly * sa, cy + lx * sa + ly * ca, SHIFT_Z + lz],
          r: [0, 0, ang],
          s: [rowLen * 1.26, 0.03, colLen * 0.9],
          c: tileColors[Math.abs(r * 3 + t * 5) % tileColors.length],
        });
      }
    }
  }

  // Ridge cap is flush with the eaves — any overhang would poke out of the
  // plot box that the placement solver spaces houses by.
  box.push({
    p: [0, roofBaseY + ROOF_H + 0.02, SHIFT_Z],
    s: [0.16, 0.13, roofD],
    c: ridgeColor,
  });

  // ── Chimney ─────────────────────────────────────────────────────
  const chX = wallW * 0.26;
  const chZ = SHIFT_Z - wallD * 0.16;
  const roofSurfaceY = roofBaseY + ROOF_H * (1 - chX / halfW);
  box.push({ p: [chX, roofSurfaceY - 0.1, chZ], s: [0.3, 0.86, 0.3], c: '#9aa0a6' });
  box.push({ p: [chX, roofSurfaceY + 0.37, chZ], s: [0.38, 0.09, 0.38], c: '#7d838a' });

  // ── Plank door + single round knob ──────────────────────────────
  const doorH = 0.86;
  const doorW = 0.6;
  box.push({
    p: [0, wallY0 + doorH / 2, frontZ + 0.03],
    s: [doorW + 0.09, doorH + 0.07, 0.05],
    c: TIMBER_DARK,
  });
  [-0.19, 0, 0.19].forEach((px, i) => {
    box.push({
      p: [px, wallY0 + doorH / 2, frontZ + 0.07],
      s: [0.175, doorH - 0.04, 0.04],
      c: PLANK_COLORS[i % PLANK_COLORS.length],
    });
  });
  metal.push({
    p: [0.2, wallY0 + doorH * 0.47, frontZ + 0.11],
    s: [0.075, 0.075, 0.075],
    c: '#e0a635',
  });
  box.push({
    p: [0, PLOT_H + 0.045, frontZ + 0.2],
    s: [0.86, 0.09, 0.34],
    c: '#9e968a',
  });

  // ── Windows: two flanking the door, one on each side wall ───────
  const addWindow = (x, y, z, rotY) => {
    const cr = Math.cos(rotY);
    const sr = Math.sin(rotY);
    const at = (d) => [x + sr * d, y, z + cr * d];
    box.push({ p: at(0.02), r: [0, rotY, 0], s: [0.52, 0.52, 0.05], c: TIMBER });
    glass.push({ p: at(0.05), r: [0, rotY, 0], s: [0.4, 0.4, 0.04], c: '#9fe4f2' });
    const sill = at(0.06);
    box.push({
      p: [sill[0], y - 0.3, sill[2]],
      r: [0, rotY, 0],
      s: [0.56, 0.07, 0.14],
      c: TIMBER,
    });
  };
  const winY = wallY0 + 0.62;
  addWindow(-wallW * 0.31, winY, frontZ, 0);
  addWindow(wallW * 0.31, winY, frontZ, 0);
  addWindow(wallW / 2, winY, SHIFT_Z, Math.PI / 2);
  addWindow(-wallW / 2, winY, SHIFT_Z, -Math.PI / 2);

  // ── Garden: front path, 3 short fence runs, 1 tree, 1 flower cluster ──
  box.push({
    p: [0, PLOT_H + 0.025, (frontZ + PLOT_D / 2) / 2],
    s: [0.62, 0.04, PLOT_D / 2 - frontZ],
    c: '#9c9184',
  });

  const addFence = (fx, fz, rotY, len) => {
    const cr = Math.cos(rotY);
    const sr = Math.sin(rotY);
    box.push({ p: [fx, PLOT_H + 0.17, fz], r: [0, rotY, 0], s: [len, 0.055, 0.04], c: TIMBER });
    box.push({ p: [fx, PLOT_H + 0.34, fz], r: [0, rotY, 0], s: [len, 0.055, 0.04], c: TIMBER });
    for (let i = 0; i < 3; i++) {
      const t = -len / 2 + (i * len) / 2;
      box.push({
        p: [fx + cr * t, PLOT_H + 0.23, fz - sr * t],
        s: [0.075, 0.46, 0.075],
        c: TIMBER,
      });
    }
  };
  // Two runs along the front with a gate gap in the middle, one down the side.
  addFence(-1.32, PLOT_D / 2 - 0.22, 0, 1.15);
  addFence(1.32, PLOT_D / 2 - 0.22, 0, 1.15);
  addFence(-PLOT_W / 2 + 0.22, PLOT_D * 0.2, Math.PI / 2, 1.1);

  const tx = PLOT_W / 2 - 0.55;
  const tz = PLOT_D / 2 - 0.62;
  cyl.push({ p: [tx, PLOT_H + 0.28, tz], s: [0.18, 0.56, 0.18], c: '#5b3a1e' });
  cone.push({ p: [tx, PLOT_H + 0.76, tz], s: [0.9, 0.76, 0.9], c: '#2f6b2a' });
  cone.push({ p: [tx, PLOT_H + 1.08, tz], s: [0.66, 0.6, 0.66], c: '#3d8434' });

  const fx = -0.66;
  const fz = PLOT_D / 2 - 0.72;
  [[0, 0], [0.14, 0.09], [-0.09, 0.13]].forEach(([dx, dz], i) => {
    cyl.push({ p: [fx + dx, PLOT_H + 0.1, fz + dz], s: [0.035, 0.2, 0.035], c: '#3f8f35' });
    sphere.push({
      p: [fx + dx, PLOT_H + 0.22, fz + dz],
      s: [0.12, 0.12, 0.12],
      c: FLOWER_COLORS[i % FLOWER_COLORS.length],
    });
  });

  return { box, glass, metal, cyl, cone, sphere };
}
