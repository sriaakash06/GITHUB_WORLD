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

/** Corner-tower ring and courtyard floor height, in castle-model units. */
export const CASTLE_TOWER_R = 5.5;
const CASTLE_COURTYARD_Y = 1.145;

/**
 * Where the castle guards stand — at the major entrances and gates on solid ground,
 * facing outward along the entrance bridges. World space coordinates.
 */
export const GUARD_POSTS = [
  // South Main Gate Guards (Left & Right of entrance bridge)
  {
    position: [-1.8 * CASTLE_SCALE, 0.55 * CASTLE_SCALE, 10.8 * CASTLE_SCALE],
    rotY: 0,
  },
  {
    position: [1.8 * CASTLE_SCALE, 0.55 * CASTLE_SCALE, 10.8 * CASTLE_SCALE],
    rotY: 0,
  },
  // North Back Gate Guard
  {
    position: [1.8 * CASTLE_SCALE, 0.55 * CASTLE_SCALE, -10.8 * CASTLE_SCALE],
    rotY: Math.PI,
  },
  // East Side Gate Guard
  {
    position: [10.8 * CASTLE_SCALE, 0.55 * CASTLE_SCALE, 1.8 * CASTLE_SCALE],
    rotY: Math.PI / 2,
  },
];

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
// DECORATIVE PROPS — scenery only, never tied to repo data
// ─────────────────────────────────────────────────────────────────

/**
 * Hand-picked spots, all in open grass:
 *  - angles sit between house angles (houses land on quadStart + 22.5/45/67.5)
 *    and well clear of the 4 spoke roads on the axes,
 *  - radii sit in the gaps the ring solver already guarantees.
 * `verifyProps` re-checks all of that against the real layout.
 */
/** How many of each prop to aim for, and its footprint. */
const PROP_KINDS = [
  { kind: 'waterTower', count: 4, w: 1.9, d: 1.9, faceCastle: true, prefer: 'outer' },
  { kind: 'windmill', count: 4, w: 1.5, d: 1.5, faceCastle: true, prefer: 'open' },
  { kind: 'wagon', count: 4, w: 1.7, d: 1.0, faceCastle: false, prefer: 'nearHouses' },
  // Market stalls face the castle so their open counter greets the road.
  { kind: 'stall', count: 2, w: 2.1, d: 1.3, faceCastle: true, prefer: 'nearHouses' },
];

/** Clearances a prop must keep. */
const PROP_HOUSE_GAP = 0.8;
const PROP_PROP_GAP = 1.8; // keeps them from bunching up
const ANGLE_STEPS = 12; // candidate angles per quadrant (7.5° apart)
const RADIUS_STEP = 0.4;

/** Deterministic 0..1 noise, so the scatter is identical on every reload. */
const hash01 = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * Radii a prop of this size may occupy: outside the ring road, inside the
 * cliff edge, and never straddling one of the ring footpaths.
 *
 * Note this deliberately does NOT exclude the house-ring radii — houses only
 * block their own angular slots, and the gaps between them are usable space.
 * The per-house bounding-box test in `propFits` sorts that out.
 */
function legalRadii(half, layout) {
  const { ringRadii, islandRadius } = layout;
  const footpaths = ringRadii.map((R) => [R - HOUSE_D / 2 - 0.5, R - HOUSE_D / 2]);

  const out = [];
  const min = RING_ROAD_OUTER_R + half + 0.3;
  const max = islandRadius - 0.8 - half;
  for (let r = min; r <= max; r += RADIUS_STEP) {
    const onPath = footpaths.some(([a, b]) => r + half > a && r - half < b);
    if (!onPath) out.push(r);
  }
  return out;
}

/** Does this candidate clear every house, every placed prop, the roads and the edge? */
function propFits(cand, houseBoxes, placed, islandRadius) {
  const box = { x: cand.x, z: cand.z, rot: cand.rotY, hw: cand.w / 2, hd: cand.d / 2 };

  for (const h of houseBoxes) {
    if (footprintGap(box, h) < PROP_HOUSE_GAP) return false;
  }
  for (const p of placed) {
    const other = {
      x: p.position[0], z: p.position[2], rot: p.rotY, hw: p.w / 2, hd: p.d / 2,
    };
    if (footprintGap(box, other) < PROP_PROP_GAP) return false;
  }

  const half = Math.hypot(cand.w, cand.d) / 2;
  const r = Math.hypot(cand.x, cand.z);
  if (r - half <= RING_ROAD_OUTER_R) return false;
  if (r + half > islandRadius - 0.8) return false;

  const spokeClearance = ROAD_WIDTH / 2 + 0.4;
  for (const pt of corners(box)) {
    if (Math.min(Math.abs(pt[0]), Math.abs(pt[1])) < spokeClearance) return false;
  }
  return true;
}

/**
 * Places the decorative props. Purely scenery — no repo data involved.
 *
 * Each kind walks the four quadrants in turn (offset per kind, so the kinds
 * interleave rather than stacking in the same corner) and takes the first
 * candidate spot that clears everything. Radial bands are tried in an order
 * that suits the prop: water towers out toward the edge, windmills in the most
 * open grass, wagons beside the house rings.
 */
export function computeProps(layout) {
  const placements = layout.placements || [];
  const houseBoxes = placements.map((p) => ({
    id: p.index,
    x: p.position[0],
    z: p.position[2],
    rot: p.rotationY,
    hw: HOUSE_W / 2,
    hd: HOUSE_D / 2,
  }));

  const { ringRadii, islandRadius } = layout;
  const placed = [];
  const missing = [];
  let serial = 0;

  PROP_KINDS.forEach((def, kindIndex) => {
    const half = Math.hypot(def.w, def.d) / 2;
    const radii = legalRadii(half, layout);

    const rMin = radii.length ? radii[0] : 0;
    const rMax = radii.length ? radii[radii.length - 1] : 1;
    const span = Math.max(0.001, rMax - rMin);

    /**
     * Each instance aims at a different slice of the island so four of the same
     * prop don't end up ringed at one radius — plus a kind-level bias: towers
     * out toward the edge, windmills in open grass, wagons hugging a house ring.
     */
    const TARGETS = {
      outer: [0.96, 0.52, 0.78, 0.3],
      open: [0.08, 0.38, 0.2, 0.58],
      nearHouses: [0.22, 0.48, 0.72, 0.94],
    };

    for (let i = 0; i < def.count; i++) {
      const target = TARGETS[def.prefer][i % 4];
      const score = (r) => {
        const rNorm = (r - rMin) / span;
        let s = 1 - Math.abs(rNorm - target);
        const nearestRing = Math.min(...ringRadii.map((R) => Math.abs(r - R)));
        if (def.prefer === 'nearHouses') s += 0.5 * (1 - Math.min(1, nearestRing / 4));
        if (def.prefer === 'open') s += 0.4 * Math.min(1, nearestRing / 4);
        return s;
      };

      // Interleave quadrants so the island fills evenly in all four directions.
      const q = (i + kindIndex) % 4;

      // Rank every (radius, angle) slot in this quadrant, then take the best fit.
      // The seeded jitter is what keeps same-kind instances from lining up.
      const cands = [];
      radii.forEach((r, ri) => {
        for (let ai = 0; ai < ANGLE_STEPS; ai++) {
          const angle = q * QUAD_ARC + ((ai + 0.5) / ANGLE_STEPS) * QUAD_ARC;
          cands.push({
            r,
            angle,
            rank: score(r) + 0.25 * hash01(kindIndex * 991 + i * 97 + ri * 13 + ai * 7),
          });
        }
      });
      cands.sort((a, b) => b.rank - a.rank);

      let done = false;
      for (const c of cands) {
        const x = Math.cos(c.angle) * c.r;
        const z = Math.sin(c.angle) * c.r;
        const inward = Math.atan2(-x, -z);
        const cand = {
          x, z, w: def.w, d: def.d,
          // Face the castle like the cottages; wagons sit side-on, as if parked.
          rotY: def.faceCastle ? inward : inward + Math.PI / 2,
        };

        if (!propFits(cand, houseBoxes, placed, islandRadius)) continue;

        placed.push({
          id: `${def.kind}-${serial++}`,
          kind: def.kind,
          position: [x, 0, z],
          rotY: cand.rotY,
          w: def.w,
          d: def.d,
          radius: c.r,
          angle: c.angle,
          quadrant: q,
          /** Radius within which trees and bushes should stand aside. */
          clearRadius: half + 0.9,
        });
        done = true;
        break;
      }

      // Never fail silently — a small island genuinely may not have room.
      if (!done) missing.push(`${def.kind} #${i + 1} (quadrant ${q})`);
    }
  });

  if (missing.length && typeof console !== 'undefined') {
    console.warn(
      `[GitVille] ${placed.length} props placed; no room for: ${missing.join(', ')}`
    );
  }

  return placed;
}

/** Same checks the houses get: no overlapping houses, roads, moat or the edge. */
export function verifyProps(props, { placements, islandRadius }) {
  const problems = [];
  const spokeClearance = ROAD_WIDTH / 2 + 0.4;

  const houseBoxes = placements.map((p) => ({
    id: p.index,
    x: p.position[0],
    z: p.position[2],
    rot: p.rotationY,
    hw: HOUSE_W / 2,
    hd: HOUSE_D / 2,
  }));

  for (const prop of props) {
    const box = {
      x: prop.position[0],
      z: prop.position[2],
      rot: prop.rotY,
      hw: prop.w / 2,
      hd: prop.d / 2,
    };

    for (const h of houseBoxes) {
      const gap = footprintGap(box, h);
      if (gap < 0.6) {
        problems.push(`${prop.id} is only ${gap.toFixed(2)}u from house #${h.id}`);
      }
    }

    for (const other of props) {
      if (other === prop) continue;
      const gap = footprintGap(box, {
        x: other.position[0], z: other.position[2], rot: other.rotY,
        hw: other.w / 2, hd: other.d / 2,
      });
      if (gap < 1.0) problems.push(`${prop.id} is only ${gap.toFixed(2)}u from ${other.id}`);
    }

    const half = Math.hypot(prop.w, prop.d) / 2;
    if (prop.radius - half <= RING_ROAD_OUTER_R) {
      problems.push(`${prop.id} reaches r=${(prop.radius - half).toFixed(2)}, inside the ring road`);
    }
    if (prop.radius + half > islandRadius - 0.8) {
      problems.push(`${prop.id} reaches r=${(prop.radius + half).toFixed(2)}, past the island edge`);
    }

    for (const pt of corners(box)) {
      const toAxis = Math.min(Math.abs(pt[0]), Math.abs(pt[1]));
      if (toAxis < spokeClearance) {
        problems.push(`${prop.id} is ${toAxis.toFixed(2)}u from a spoke road`);
        break;
      }
    }
  }

  return problems;
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
