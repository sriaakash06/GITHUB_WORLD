/**
 * ═══════════════════════════════════════════════════════════════════
 * GITVILLE WORLD LAYOUT — SINGLE SOURCE OF TRUTH
 * ═══════════════════════════════════════════════════════════════════
 * Every radius in the scene (castle plinth, moat, bridges, ring road,
 * spoke roads, house rings, island edge) is derived from the constants
 * in this file. Nothing else in the 3D world may hard-code a radius —
 * that is what let the moat drift off the castle and let two house
 * rings collapse onto the same radius.
 */

// ─────────────────────────────────────────────────────────────────
// CASTLE  (Fix 6 — dominant landmark, 1.36× the previous 0.22 scale)
// ─────────────────────────────────────────────────────────────────
export const CASTLE_SCALE = 0.3;
/** Radius of the castle model's outermost stone plinth, in model units. */
export const CASTLE_MODEL_RADIUS = 13.5;
/** World-space radius the castle actually occupies on the ground. */
export const CASTLE_OUTER_R = CASTLE_MODEL_RADIUS * CASTLE_SCALE; // 4.05

// ─────────────────────────────────────────────────────────────────
// MOAT  (Fix 7 — derived from the castle so it is always concentric)
// ─────────────────────────────────────────────────────────────────
export const MOAT_INNER_R = CASTLE_OUTER_R + 0.2; // 4.25 — hugs the plinth
export const MOAT_WIDTH = 1.6;
export const MOAT_OUTER_R = MOAT_INNER_R + MOAT_WIDTH; // 5.85
/** Bridges span the moat: same centre, 4 of them at 0° / 90° / 180° / 270°. */
export const BRIDGE_MID_R = (MOAT_INNER_R + MOAT_OUTER_R) / 2; // 5.05
export const BRIDGE_LENGTH = MOAT_WIDTH + 0.3;
export const BRIDGE_WIDTH = 0.62;

// ─────────────────────────────────────────────────────────────────
// ROADS — one ring road just outside the moat + 4 radial spokes
// ─────────────────────────────────────────────────────────────────
export const ROAD_WIDTH = 1.2;
export const RING_ROAD_INNER_R = MOAT_OUTER_R + 0.2; // 6.05
export const RING_ROAD_OUTER_R = RING_ROAD_INNER_R + ROAD_WIDTH; // 7.25
export const RING_ROAD_CENTER_R = (RING_ROAD_INNER_R + RING_ROAD_OUTER_R) / 2;

// ─────────────────────────────────────────────────────────────────
// HOUSES — footprint & spacing rules (Fix 3)
// ─────────────────────────────────────────────────────────────────
/** Cottage plot in local model units — the garden-fence-to-garden-fence box. */
export const PLOT_W = 4.2; // tangential (house width; the door faces the castle)
export const PLOT_D = 3.9; // radial     (house depth, incl. the roof's rear eave)
export const PLOT_H = 0.22; // raised plot slab
export const HOUSE_SCALE = 0.5;

/** …and the same footprint in world units, which is what spacing uses. */
export const HOUSE_W = PLOT_W * HOUSE_SCALE; // 2.10
export const HOUSE_D = PLOT_D * HOUSE_SCALE; // 1.90

/** Minimum clear grass between any two house footprints. */
export const MIN_HOUSE_GAP = 3.0;
export const MAX_PER_QUAD_RING = 3;

/** Radial distance between consecutive rings — at least 4, and always
 *  enough that two radially-aligned houses still clear MIN_HOUSE_GAP. */
export const RING_STEP = Math.max(4.0, HOUSE_D + MIN_HOUSE_GAP); // 4.90

/** Grass margin between the outermost house and the island cliff edge. */
export const ISLAND_EDGE_MARGIN = 2.6;

const QUAD_ARC = Math.PI / 2;
/** n houses split a quadrant's 90° arc into n+1 equal gaps, so the padding
 *  from each spoke road equals the spacing between neighbours. */
const angularStep = (n) => QUAD_ARC / (n + 1);

// ─────────────────────────────────────────────────────────────────
// ORIENTED-FOOTPRINT GEOMETRY (used by both the solver and the checks)
// ─────────────────────────────────────────────────────────────────

/** Rotating local X/Z by θ about Y: +X → (cosθ, −sinθ), +Z → (sinθ, cosθ). */
const boxAxes = (rot) => [
  [Math.cos(rot), -Math.sin(rot)],
  [Math.sin(rot), Math.cos(rot)],
];

/** Half-extent of an oriented footprint projected onto unit axis n. */
const extentOn = (axes, hw, hd, n) =>
  Math.abs(axes[0][0] * n[0] + axes[0][1] * n[1]) * hw +
  Math.abs(axes[1][0] * n[0] + axes[1][1] * n[1]) * hd;

/**
 * Separating-axis gap between two oriented footprints.
 * Positive = clear grass between the boxes, negative = overlap.
 */
export function footprintGap(a, b) {
  const axA = boxAxes(a.rot);
  const axB = boxAxes(b.rot);
  const dx = b.x - a.x;
  const dz = b.z - a.z;

  let best = -Infinity;
  for (const n of [axA[0], axA[1], axB[0], axB[1]]) {
    const sep =
      Math.abs(dx * n[0] + dz * n[1]) -
      extentOn(axA, a.hw, a.hd, n) -
      extentOn(axB, b.hw, b.hd, n);
    if (sep > best) best = sep;
  }
  return best;
}

/** A house footprint placed on the ring at `r`, angle `ang`, facing the castle. */
const houseBox = (r, ang) => {
  const x = Math.cos(ang) * r;
  const z = Math.sin(ang) * r;
  return { x, z, rot: Math.atan2(-x, -z), hw: HOUSE_W / 2, hd: HOUSE_D / 2 };
};

/** Every angle a house can occupy when all four quadrants are full. */
const FULL_RING_ANGLES = (() => {
  const out = [];
  for (let q = 0; q < 4; q++) {
    for (let i = 0; i < MAX_PER_QUAD_RING; i++) {
      out.push(q * QUAD_ARC + (i + 1) * angularStep(MAX_PER_QUAD_RING));
    }
  }
  return out;
})();

const minGapWithinRing = (r) => {
  let m = Infinity;
  for (let i = 0; i < FULL_RING_ANGLES.length; i++) {
    for (let j = i + 1; j < FULL_RING_ANGLES.length; j++) {
      const g = footprintGap(
        houseBox(r, FULL_RING_ANGLES[i]),
        houseBox(r, FULL_RING_ANGLES[j])
      );
      if (g < m) m = g;
    }
  }
  return m;
};

const minGapBetweenRings = (rA, rB) => {
  let m = Infinity;
  for (const a of FULL_RING_ANGLES) {
    for (const b of FULL_RING_ANGLES) {
      const g = footprintGap(houseBox(rA, a), houseBox(rB, b));
      if (g < m) m = g;
    }
  }
  return m;
};

// ─────────────────────────────────────────────────────────────────
// RING RADIUS SOLVER
// ─────────────────────────────────────────────────────────────────

/** Nominal ring-1 start: outside the moat, outside the ring road, +3. */
const RING1_NOMINAL_R = MOAT_OUTER_R + ROAD_WIDTH + 3.0; // 10.05
/** …and never let a house footprint touch the ring road. */
const RING1_ROAD_SAFE_R = RING_ROAD_OUTER_R + HOUSE_D / 2 + 1.0; // 9.20

const SOLVE_STEP = 0.02;
const _radiiCache = [];

/**
 * Radii of the first `count` concentric rings.
 *
 * Each ring starts at `previous + RING_STEP` (ring 1 starts at the nominal
 * radius) and is then pushed outward in small increments until *every*
 * footprint pair — inside the ring and against the ring below — clears
 * MIN_HOUSE_GAP. Radii are solved for a completely full ring, so they do
 * not depend on how many repos actually landed there: all four quadrants
 * always share the same set of ring radii and the village stays symmetric.
 */
function solveRingRadii(count) {
  while (_radiiCache.length < count) {
    const k = _radiiCache.length;
    let r =
      k === 0
        ? Math.max(RING1_NOMINAL_R, RING1_ROAD_SAFE_R)
        : _radiiCache[k - 1] + RING_STEP;

    let guard = 0;
    while (guard++ < 5000) {
      if (minGapWithinRing(r) < MIN_HOUSE_GAP - 1e-9) {
        r += SOLVE_STEP;
        continue;
      }
      if (
        k > 0 &&
        minGapBetweenRings(_radiiCache[k - 1], r) < MIN_HOUSE_GAP - 1e-9
      ) {
        r += SOLVE_STEP;
        continue;
      }
      break;
    }
    _radiiCache.push(r);
  }
  return _radiiCache.slice(0, count);
}

/** Radius of ring 1 — exported so other components can reason about the world. */
export const RING1_R = solveRingRadii(1)[0];

/**
 * How many houses land in each quadrant, and at what radii the rings sit.
 *
 * Fix 2: islandRadius = baseRadius + (rings beyond ring 1) × RING_STEP,
 * where baseRadius already includes the house half-depth and edge margin.
 */
export function computeVillageLayout(repoCount) {
  const count = Math.max(1, Math.floor(repoCount) || 1);

  // Even split across the 4 quadrants — remainder spread one per quadrant.
  const perQuadrant = [0, 1, 2, 3].map(
    (q) => Math.floor(count / 4) + (count % 4 > q ? 1 : 0)
  );

  const ringCount = Math.max(
    1,
    Math.ceil(Math.max(...perQuadrant) / MAX_PER_QUAD_RING)
  );

  const ringRadii = solveRingRadii(ringCount);
  const outerRingR = ringRadii[ringCount - 1];
  const islandRadius = outerRingR + HOUSE_D / 2 + ISLAND_EDGE_MARGIN;

  return { count, perQuadrant, ringCount, ringRadii, outerRingR, islandRadius };
}

/** Island ground radius for a given repo count (Fix 2). */
export const getIslandRadius = (repoCount) =>
  computeVillageLayout(repoCount).islandRadius;

/**
 * One house per repo. No slicing, no capping, no filtering — the number of
 * placements returned always equals repos.length (Bug 1).
 */
export function placeHouses(repos = []) {
  const layout = computeVillageLayout(repos.length);
  const cursor = [0, 0, 0, 0];

  const placements = repos.map((repo, index) => {
    const quadrant = index % 4; // even split, deterministic
    const slotInQuad = cursor[quadrant]++;

    const ring = Math.floor(slotInQuad / MAX_PER_QUAD_RING);
    const slot = slotInQuad % MAX_PER_QUAD_RING;

    // Houses in *this* quadrant's *this* ring, so the arc padding stays even.
    const inThisRing = Math.min(
      MAX_PER_QUAD_RING,
      layout.perQuadrant[quadrant] - ring * MAX_PER_QUAD_RING
    );

    const step = angularStep(inThisRing);
    const angle = quadrant * QUAD_ARC + (slot + 1) * step;

    const radius = layout.ringRadii[ring];
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    // Fix 4 — the cottage's door sits on its local +Z face. Rotating by
    // atan2(-x, -z) about Y maps local +Z onto the unit vector pointing
    // from the house back to the castle at [0, 0, 0].
    const rotationY = Math.atan2(-x, -z);

    return {
      repo,
      index,
      quadrant,
      ring,
      slot,
      angle,
      radius,
      position: [x, 0, z],
      rotationY,
    };
  });

  return { ...layout, placements };
}

// ─────────────────────────────────────────────────────────────────
// BOUNDING-BOX VERIFICATION  (Fix 3, final clause)
// ─────────────────────────────────────────────────────────────────

/** Every corner of a house footprint, in world X/Z. */
function corners(h) {
  const [ex, ez] = boxAxes(h.rot);
  const out = [];
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      out.push([
        h.x + ex[0] * sx * h.hw + ez[0] * sz * h.hd,
        h.z + ex[1] * sx * h.hw + ez[1] * sz * h.hd,
      ]);
    }
  }
  return out;
}

/**
 * Asserts the layout invariants. Returns a list of human-readable
 * violations — an empty array means every house passed.
 */
export function verifyLayout({ placements, islandRadius }, expectedCount) {
  const problems = [];

  if (typeof expectedCount === 'number' && placements.length !== expectedCount) {
    problems.push(
      `repo/house mismatch: ${expectedCount} repos in, ${placements.length} houses out`
    );
  }

  const boxes = placements.map((p) => ({
    id: p.index,
    x: p.position[0],
    z: p.position[2],
    rot: p.rotationY,
    hw: HOUSE_W / 2,
    hd: HOUSE_D / 2,
  }));

  // 1. House ↔ house
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const gap = footprintGap(boxes[i], boxes[j]);
      if (gap < MIN_HOUSE_GAP - 1e-6) {
        problems.push(
          `houses #${boxes[i].id} and #${boxes[j].id} are ${gap.toFixed(2)}u apart (need ${MIN_HOUSE_GAP})`
        );
      }
    }
  }

  const spokeClearance = ROAD_WIDTH / 2 + 0.4;

  for (const b of boxes) {
    const pts = corners(b);
    const dists = pts.map((p) => Math.hypot(p[0], p[1]));

    // 2. Never over the castle, moat or ring road
    const inner = Math.hypot(b.x, b.z) - b.hd;
    if (inner <= RING_ROAD_OUTER_R) {
      problems.push(
        `house #${b.id} reaches r=${inner.toFixed(2)}, inside the ring road (${RING_ROAD_OUTER_R.toFixed(2)})`
      );
    }

    // 3. Never past the island edge
    const outer = Math.max(...dists);
    if (outer > islandRadius - 0.8) {
      problems.push(
        `house #${b.id} reaches r=${outer.toFixed(2)}, past the island edge (${islandRadius.toFixed(2)})`
      );
    }

    // 4. Never over a spoke road (the 4 world axes)
    const nearestToAxis = Math.min(
      ...pts.map((p) => Math.min(Math.abs(p[0]), Math.abs(p[1])))
    );
    if (nearestToAxis < spokeClearance) {
      problems.push(
        `house #${b.id} is ${nearestToAxis.toFixed(2)}u from a spoke road (need ${spokeClearance.toFixed(2)})`
      );
    }
  }

  return problems;
}
