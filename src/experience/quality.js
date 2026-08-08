/**
 * ═══════════════════════════════════════════════════════════════════
 * DEVICE QUALITY TIER
 * ═══════════════════════════════════════════════════════════════════
 * Detected once at module load — the tier can't change mid-session, so
 * geometry and materials can be built against it up front.
 */

const read = (fn, fallback) => {
  try {
    return fn();
  } catch {
    return fallback;
  }
};

const coarsePointer = read(() => window.matchMedia('(pointer: coarse)').matches, false);
const smallScreen = read(() => window.innerWidth < 900, false);
/** Both are undefined on Safari/Firefox, so `<=` is false there — never a false positive. */
const fewCores = read(() => navigator.hardwareConcurrency <= 4, false);
const lowMemory = read(() => navigator.deviceMemory <= 4, false);

/** Touch + small screen is the clear phone signal; weak CPU/RAM catches the rest. */
export const IS_LOW_POWER = (coarsePointer && smallScreen) || fewCores || lowMemory;

export const QUALITY = IS_LOW_POWER
  ? {
      tier: 'low',
      /** Cap the render resolution — the single biggest mobile win. */
      dpr: [1, 1.5],
      shadows: false,
      shadowMapSize: 1024,
      softShadows: false,
      contactShadows: false,
      /** No real-time point lights: bulbs keep their emissive glow + halo. */
      maxPointLights: 0,
      castleTorchLights: false,
      sphereSegments: [5, 3],
      radialSegments: 5,
      villagers: false,
      cloudCount: 5,
      balloonCount: 3,
      birdCount: 5,
      dogCount: 2,
      roadVillagers: 0, // villagers are off entirely on this tier
      starCount: 220,
      ringSegments: 48,
    }
  : {
      tier: 'high',
      dpr: [1, 2],
      shadows: true,
      shadowMapSize: 2048,
      softShadows: true,
      contactShadows: true,
      maxPointLights: 6,
      castleTorchLights: true,
      sphereSegments: [6, 4],
      radialSegments: 6,
      villagers: true,
      cloudCount: 12,
      balloonCount: 7,
      birdCount: 9,
      dogCount: 4,
      roadVillagers: 4,
      starCount: 500,
      ringSegments: 96,
    };

if (typeof console !== 'undefined') {
  console.log(
    `[GitVille] quality tier: ${QUALITY.tier} ` +
      `(coarsePointer=${coarsePointer} smallScreen=${smallScreen} ` +
      `cores=${read(() => navigator.hardwareConcurrency, '?')} ` +
      `memGB=${read(() => navigator.deviceMemory, '?')})`
  );
}
