const LIMITS = {
  nebulaIntensity: [0, 1.2],
  nebulaSpeed: [0, 1.2],
  nebulaHueShift: [-0.4, 0.4],
  milkyOpacity: [0, 0.35],
  twinkleIntensity: [0, 1],
  twinkleSpeed: [0.1, 3],
  deepStarMultiplier: [0.4, 1.8],
  auroraIntensity: [0, 1],
  dustDensity: [0, 1.2],
  cometCount: [0, 22],
  cometSpeed: [0.2, 3],
  meteorCount: [0, 90],
  meteorSpeed: [0.2, 3.4],
  blackHoleStrength: [0, 1],
  shockwaveSpeed: [0.1, 2.2],
  solarWindSpeed: [0.1, 2.5],
  solarWindDensity: [0, 1],
  orbitPulseSpeed: [0.1, 2.5],
  orbitPulseStrength: [0, 1],
  ringGlowIntensity: [0, 1],
  planetAtmosphereBoost: [0, 1],
  backgroundRotationSpeed: [0, 2],
  parallaxDepth: [0, 1],
  lensDustIntensity: [0, 1],
  warpStreaksSpeed: [0.2, 3.5],
  warpStreaksDensity: [0, 0.85],
  colorTempShift: [-0.4, 0.4],
  contrastBoost: [-0.5, 0.8],
  vignetteDarkness: [0.2, 1],
  bloomThreshold: [0.01, 0.5],
  orbitThickness: [0.02, 0.25],
  orbitOpacity: [0.03, 0.8],
  asteroidSize: [0.2, 2.4],
  asteroidSpeed: [0.001, 0.06],
  moonOrbitBoost: [0.5, 2.2],
  labelScale: [0.5, 1.8],
  labelOpacity: [0.1, 1],
  ambientGlow: [0.05, 0.9],
  sunPulseStrength: [0, 0.6],
  sunCoronaSpeed: [0.2, 3],
  noiseOpacity: [0, 0.08],
  chromaticIntensity: [0, 2.5],
  pixelGranularity: [2, 12],
  bloomSmoothing: [0.2, 0.95],
  cameraFollowLerp: [0.01, 0.2],
  focusOffsetX: [0.2, 1.2],
  focusOffsetY: [0.05, 0.8],
  focusOffsetZ: [0.2, 1.4],
  focusTargetBoost: [0.6, 1.8],
};

function clamp(value, min, max) {
  const num = Number(value);
  if (!Number.isFinite(num)) return min;
  return Math.min(max, Math.max(min, num));
}

function read(params, key, fallback) {
  return params && params[key] !== undefined ? params[key] : fallback;
}

export function computeSpaceFxState(params) {
  const nebulaIntensity = clamp(read(params, 'nebulaIntensity', 0.6), ...LIMITS.nebulaIntensity);
  const nebulaSpeed = clamp(read(params, 'nebulaSpeed', 0.22), ...LIMITS.nebulaSpeed);
  const nebulaHueShift = clamp(read(params, 'nebulaHueShift', 0.08), ...LIMITS.nebulaHueShift);
  const milkyOpacity = clamp(read(params, 'milkyOpacity', 0.1), ...LIMITS.milkyOpacity);
  const twinkleIntensity = clamp(read(params, 'twinkleIntensity', 0.35), ...LIMITS.twinkleIntensity);
  const twinkleSpeed = clamp(read(params, 'twinkleSpeed', 0.8), ...LIMITS.twinkleSpeed);
  const deepStarMultiplier = clamp(read(params, 'deepStarMultiplier', 1), ...LIMITS.deepStarMultiplier);
  const auroraEnabled = Boolean(read(params, 'auroraEnabled', true));
  const auroraIntensity = clamp(read(params, 'auroraIntensity', 0.45), ...LIMITS.auroraIntensity);
  const dustEnabled = Boolean(read(params, 'dustEnabled', true));
  const dustDensity = clamp(read(params, 'dustDensity', 0.6), ...LIMITS.dustDensity);
  const cometCount = Math.round(clamp(read(params, 'cometCount', 10), ...LIMITS.cometCount));
  const cometSpeed = clamp(read(params, 'cometSpeed', 1), ...LIMITS.cometSpeed);
  const meteorCount = Math.round(clamp(read(params, 'meteorCount', 44), ...LIMITS.meteorCount));
  const meteorSpeed = clamp(read(params, 'meteorSpeed', 1), ...LIMITS.meteorSpeed);
  const lensFlareEnabled = Boolean(read(params, 'lensFlareEnabled', true));
  const blackHoleEnabled = Boolean(read(params, 'blackHoleEnabled', false));
  const blackHoleStrength = clamp(read(params, 'blackHoleStrength', 0.4), ...LIMITS.blackHoleStrength);
  const shockwaveEnabled = Boolean(read(params, 'shockwaveEnabled', false));
  const shockwaveSpeed = clamp(read(params, 'shockwaveSpeed', 0.55), ...LIMITS.shockwaveSpeed);
  const solarWindEnabled = Boolean(read(params, 'solarWindEnabled', true));
  const solarWindSpeed = clamp(read(params, 'solarWindSpeed', 0.75), ...LIMITS.solarWindSpeed);
  const solarWindDensity = clamp(read(params, 'solarWindDensity', 0.5), ...LIMITS.solarWindDensity);
  const orbitPulseEnabled = Boolean(read(params, 'orbitPulseEnabled', true));
  const orbitPulseSpeed = clamp(read(params, 'orbitPulseSpeed', 0.8), ...LIMITS.orbitPulseSpeed);
  const orbitPulseStrength = clamp(read(params, 'orbitPulseStrength', 0.4), ...LIMITS.orbitPulseStrength);
  const ringGlowEnabled = Boolean(read(params, 'ringGlowEnabled', true));
  const ringGlowIntensity = clamp(read(params, 'ringGlowIntensity', 0.42), ...LIMITS.ringGlowIntensity);
  const planetAtmosphereBoost = clamp(read(params, 'planetAtmosphereBoost', 0.4), ...LIMITS.planetAtmosphereBoost);
  const backgroundRotationSpeed = clamp(read(params, 'backgroundRotationSpeed', 0.55), ...LIMITS.backgroundRotationSpeed);
  const parallaxDepth = clamp(read(params, 'parallaxDepth', 0.45), ...LIMITS.parallaxDepth);
  const lensDustEnabled = Boolean(read(params, 'lensDustEnabled', true));
  const lensDustIntensity = clamp(read(params, 'lensDustIntensity', 0.35), ...LIMITS.lensDustIntensity);
  const warpStreaksEnabled = Boolean(read(params, 'warpStreaksEnabled', true));
  const warpStreaksSpeed = clamp(read(params, 'warpStreaksSpeed', 0.9), ...LIMITS.warpStreaksSpeed);
  const warpStreaksDensity = clamp(read(params, 'warpStreaksDensity', 0.55), ...LIMITS.warpStreaksDensity);
  const colorTempShift = clamp(read(params, 'colorTempShift', 0.04), ...LIMITS.colorTempShift);
  const contrastBoost = clamp(read(params, 'contrastBoost', 0.18), ...LIMITS.contrastBoost);
  const vignetteDarkness = clamp(read(params, 'vignetteDarkness', 0.72), ...LIMITS.vignetteDarkness);
  const bloomThreshold = clamp(read(params, 'bloomThreshold', 0.08), ...LIMITS.bloomThreshold);
  const orbitThickness = clamp(read(params, 'orbitThickness', 0.07), ...LIMITS.orbitThickness);
  const orbitOpacity = clamp(read(params, 'orbitOpacity', 0.2), ...LIMITS.orbitOpacity);
  const asteroidSize = clamp(read(params, 'asteroidSize', 0.7), ...LIMITS.asteroidSize);
  const asteroidSpeed = clamp(read(params, 'asteroidSpeed', 0.012), ...LIMITS.asteroidSpeed);
  const moonOrbitBoost = clamp(read(params, 'moonOrbitBoost', 1), ...LIMITS.moonOrbitBoost);
  const labelScale = clamp(read(params, 'labelScale', 1), ...LIMITS.labelScale);
  const labelOpacity = clamp(read(params, 'labelOpacity', 1), ...LIMITS.labelOpacity);
  const ambientGlow = clamp(read(params, 'ambientGlow', 0.22), ...LIMITS.ambientGlow);
  const sunPulseStrength = clamp(read(params, 'sunPulseStrength', 0.1), ...LIMITS.sunPulseStrength);
  const sunCoronaSpeed = clamp(read(params, 'sunCoronaSpeed', 1), ...LIMITS.sunCoronaSpeed);
  const noiseOpacity = clamp(read(params, 'noiseOpacity', 0.014), ...LIMITS.noiseOpacity);
  const chromaticIntensity = clamp(read(params, 'chromaticIntensity', 1), ...LIMITS.chromaticIntensity);
  const pixelGranularity = Math.round(clamp(read(params, 'pixelGranularity', 6), ...LIMITS.pixelGranularity));
  const bloomSmoothing = clamp(read(params, 'bloomSmoothing', 0.63), ...LIMITS.bloomSmoothing);
  const cameraFollowLerp = clamp(read(params, 'cameraFollowLerp', 0.028), ...LIMITS.cameraFollowLerp);
  const focusOffsetX = clamp(read(params, 'focusOffsetX', 0.45), ...LIMITS.focusOffsetX);
  const focusOffsetY = clamp(read(params, 'focusOffsetY', 0.2), ...LIMITS.focusOffsetY);
  const focusOffsetZ = clamp(read(params, 'focusOffsetZ', 0.56), ...LIMITS.focusOffsetZ);
  const autoRotateFocused = Boolean(read(params, 'autoRotateFocused', false));
  const focusTargetBoost = clamp(read(params, 'focusTargetBoost', 1), ...LIMITS.focusTargetBoost);

  return {
    nebulaIntensity,
    nebulaSpeed,
    nebulaHueShift,
    milkyOpacity,
    twinkleIntensity,
    twinkleSpeed,
    deepStarMultiplier,
    auroraEnabled,
    auroraIntensity,
    dustEnabled,
    dustDensity,
    cometCount,
    cometSpeed,
    meteorCount,
    meteorSpeed,
    lensFlareEnabled,
    blackHoleEnabled,
    blackHoleStrength,
    chromaticBoostX: 0.0007 + blackHoleStrength * 0.0016,
    chromaticBoostY: 0.0005 + blackHoleStrength * 0.0008,
    shockwaveEnabled,
    shockwaveSpeed,
    solarWindEnabled,
    solarWindSpeed,
    solarWindDensity,
    orbitPulseEnabled,
    orbitPulseSpeed,
    orbitPulseStrength,
    ringGlowEnabled,
    ringGlowIntensity,
    planetAtmosphereBoost,
    backgroundRotationSpeed,
    parallaxDepth,
    lensDustEnabled,
    lensDustIntensity,
    warpStreaksEnabled,
    warpStreaksSpeed,
    warpStreaksDensity,
    colorTempShift,
    contrastBoost,
    vignetteDarkness,
    bloomThreshold,
    orbitThickness,
    orbitOpacity,
    asteroidSize,
    asteroidSpeed,
    moonOrbitBoost,
    labelScale,
    labelOpacity,
    ambientGlow,
    sunPulseStrength,
    sunCoronaSpeed,
    noiseOpacity,
    chromaticIntensity,
    pixelGranularity,
    bloomSmoothing,
    cameraFollowLerp,
    focusOffsetX,
    focusOffsetY,
    focusOffsetZ,
    autoRotateFocused,
    focusTargetBoost,
  };
}

export const SPACE_FX_LIMITS = LIMITS;
