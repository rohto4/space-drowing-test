import { describe, expect, it } from 'vitest';
import { computeSpaceFxState } from './spaceFxState';

describe('computeSpaceFxState', () => {
  it('maps 20 expansion parameters correctly', () => {
    const fx = computeSpaceFxState({
      nebulaIntensity: 0.91,
      nebulaSpeed: 0.44,
      nebulaHueShift: -0.15,
      milkyOpacity: 0.19,
      twinkleIntensity: 0.72,
      twinkleSpeed: 1.7,
      deepStarMultiplier: 1.6,
      auroraEnabled: false,
      auroraIntensity: 0.88,
      dustEnabled: false,
      dustDensity: 0.93,
      cometCount: 18,
      cometSpeed: 2.2,
      meteorCount: 84,
      meteorSpeed: 2.8,
      lensFlareEnabled: false,
      blackHoleEnabled: true,
      blackHoleStrength: 0.75,
      shockwaveEnabled: true,
      shockwaveSpeed: 1.35,
      solarWindEnabled: false,
      solarWindSpeed: 1.7,
      solarWindDensity: 0.66,
      orbitPulseEnabled: false,
      orbitPulseSpeed: 1.45,
      orbitPulseStrength: 0.62,
      ringGlowEnabled: false,
      ringGlowIntensity: 0.74,
      planetAtmosphereBoost: 0.58,
      backgroundRotationSpeed: 1.2,
      parallaxDepth: 0.77,
      lensDustEnabled: false,
      lensDustIntensity: 0.48,
      warpStreaksEnabled: false,
      warpStreaksSpeed: 1.55,
      warpStreaksDensity: 0.64,
      colorTempShift: -0.12,
      contrastBoost: 0.33,
      vignetteDarkness: 0.84,
      bloomThreshold: 0.21,
      orbitThickness: 0.12,
      orbitOpacity: 0.38,
      asteroidSize: 1.2,
      asteroidSpeed: 0.022,
      moonOrbitBoost: 1.4,
      labelScale: 1.25,
      labelOpacity: 0.66,
      ambientGlow: 0.4,
      sunPulseStrength: 0.21,
      sunCoronaSpeed: 1.8,
      noiseOpacity: 0.03,
      chromaticIntensity: 1.6,
      pixelGranularity: 10,
      bloomSmoothing: 0.78,
      cameraFollowLerp: 0.09,
      focusOffsetX: 0.72,
      focusOffsetY: 0.31,
      focusOffsetZ: 0.84,
      autoRotateFocused: true,
      focusTargetBoost: 1.3,
    });

    expect(fx.nebulaIntensity).toBe(0.91);
    expect(fx.nebulaSpeed).toBe(0.44);
    expect(fx.nebulaHueShift).toBe(-0.15);
    expect(fx.milkyOpacity).toBe(0.19);
    expect(fx.twinkleIntensity).toBe(0.72);
    expect(fx.twinkleSpeed).toBe(1.7);
    expect(fx.deepStarMultiplier).toBe(1.6);
    expect(fx.auroraEnabled).toBe(false);
    expect(fx.auroraIntensity).toBe(0.88);
    expect(fx.dustEnabled).toBe(false);
    expect(fx.dustDensity).toBe(0.93);
    expect(fx.cometCount).toBe(18);
    expect(fx.cometSpeed).toBe(2.2);
    expect(fx.meteorCount).toBe(84);
    expect(fx.meteorSpeed).toBe(2.8);
    expect(fx.lensFlareEnabled).toBe(false);
    expect(fx.blackHoleEnabled).toBe(true);
    expect(fx.blackHoleStrength).toBe(0.75);
    expect(fx.shockwaveEnabled).toBe(true);
    expect(fx.shockwaveSpeed).toBe(1.35);
    expect(fx.solarWindEnabled).toBe(false);
    expect(fx.solarWindSpeed).toBe(1.7);
    expect(fx.solarWindDensity).toBe(0.66);
    expect(fx.orbitPulseEnabled).toBe(false);
    expect(fx.orbitPulseSpeed).toBe(1.45);
    expect(fx.orbitPulseStrength).toBe(0.62);
    expect(fx.ringGlowEnabled).toBe(false);
    expect(fx.ringGlowIntensity).toBe(0.74);
    expect(fx.planetAtmosphereBoost).toBe(0.58);
    expect(fx.backgroundRotationSpeed).toBe(1.2);
    expect(fx.parallaxDepth).toBe(0.77);
    expect(fx.lensDustEnabled).toBe(false);
    expect(fx.lensDustIntensity).toBe(0.48);
    expect(fx.warpStreaksEnabled).toBe(false);
    expect(fx.warpStreaksSpeed).toBe(1.55);
    expect(fx.warpStreaksDensity).toBe(0.64);
    expect(fx.colorTempShift).toBe(-0.12);
    expect(fx.contrastBoost).toBe(0.33);
    expect(fx.vignetteDarkness).toBe(0.84);
    expect(fx.bloomThreshold).toBe(0.21);
    expect(fx.orbitThickness).toBe(0.12);
    expect(fx.orbitOpacity).toBe(0.38);
    expect(fx.asteroidSize).toBe(1.2);
    expect(fx.asteroidSpeed).toBe(0.022);
    expect(fx.moonOrbitBoost).toBe(1.4);
    expect(fx.labelScale).toBe(1.25);
    expect(fx.labelOpacity).toBe(0.66);
    expect(fx.ambientGlow).toBe(0.4);
    expect(fx.sunPulseStrength).toBe(0.21);
    expect(fx.sunCoronaSpeed).toBe(1.8);
    expect(fx.noiseOpacity).toBe(0.03);
    expect(fx.chromaticIntensity).toBe(1.6);
    expect(fx.pixelGranularity).toBe(10);
    expect(fx.bloomSmoothing).toBe(0.78);
    expect(fx.cameraFollowLerp).toBe(0.09);
    expect(fx.focusOffsetX).toBe(0.72);
    expect(fx.focusOffsetY).toBe(0.31);
    expect(fx.focusOffsetZ).toBe(0.84);
    expect(fx.autoRotateFocused).toBe(true);
    expect(fx.focusTargetBoost).toBe(1.3);
  });

  it('clamps out-of-range values', () => {
    const fx = computeSpaceFxState({
      nebulaIntensity: 99,
      twinkleSpeed: -10,
      cometCount: 1000,
      meteorCount: -5,
      blackHoleStrength: 9,
      shockwaveSpeed: -1,
      solarWindSpeed: 99,
      solarWindDensity: -1,
      orbitPulseSpeed: -4,
      orbitPulseStrength: 99,
      ringGlowIntensity: -1,
      planetAtmosphereBoost: 5,
      backgroundRotationSpeed: 99,
      parallaxDepth: -2,
      lensDustIntensity: 99,
      warpStreaksSpeed: 99,
      warpStreaksDensity: -2,
      colorTempShift: 99,
      contrastBoost: 99,
      vignetteDarkness: -4,
      bloomThreshold: 99,
      orbitThickness: 9,
      orbitOpacity: -1,
      asteroidSize: -1,
      asteroidSpeed: 99,
      moonOrbitBoost: -2,
      labelScale: 99,
      labelOpacity: -9,
      ambientGlow: 99,
      sunPulseStrength: 99,
      sunCoronaSpeed: -1,
      noiseOpacity: 99,
      chromaticIntensity: 99,
      pixelGranularity: 99,
      bloomSmoothing: 99,
      cameraFollowLerp: -1,
      focusOffsetX: -1,
      focusOffsetY: 99,
      focusOffsetZ: -1,
      focusTargetBoost: 99,
    });

    expect(fx.nebulaIntensity).toBe(1.2);
    expect(fx.twinkleSpeed).toBe(0.1);
    expect(fx.cometCount).toBe(22);
    expect(fx.meteorCount).toBe(0);
    expect(fx.blackHoleStrength).toBe(1);
    expect(fx.shockwaveSpeed).toBe(0.1);
    expect(fx.solarWindSpeed).toBe(2.5);
    expect(fx.solarWindDensity).toBe(0);
    expect(fx.orbitPulseSpeed).toBe(0.1);
    expect(fx.orbitPulseStrength).toBe(1);
    expect(fx.ringGlowIntensity).toBe(0);
    expect(fx.planetAtmosphereBoost).toBe(1);
    expect(fx.backgroundRotationSpeed).toBe(2);
    expect(fx.parallaxDepth).toBe(0);
    expect(fx.lensDustIntensity).toBe(1);
    expect(fx.warpStreaksSpeed).toBe(3.5);
    expect(fx.warpStreaksDensity).toBe(0);
    expect(fx.colorTempShift).toBe(0.4);
    expect(fx.contrastBoost).toBe(0.8);
    expect(fx.vignetteDarkness).toBe(0.2);
    expect(fx.bloomThreshold).toBe(0.5);
    expect(fx.orbitThickness).toBe(0.25);
    expect(fx.orbitOpacity).toBe(0.03);
    expect(fx.asteroidSize).toBe(0.2);
    expect(fx.asteroidSpeed).toBe(0.06);
    expect(fx.moonOrbitBoost).toBe(0.5);
    expect(fx.labelScale).toBe(1.8);
    expect(fx.labelOpacity).toBe(0.1);
    expect(fx.ambientGlow).toBe(0.9);
    expect(fx.sunPulseStrength).toBe(0.6);
    expect(fx.sunCoronaSpeed).toBe(0.2);
    expect(fx.noiseOpacity).toBe(0.08);
    expect(fx.chromaticIntensity).toBe(2.5);
    expect(fx.pixelGranularity).toBe(12);
    expect(fx.bloomSmoothing).toBe(0.95);
    expect(fx.cameraFollowLerp).toBe(0.01);
    expect(fx.focusOffsetX).toBe(0.2);
    expect(fx.focusOffsetY).toBe(0.8);
    expect(fx.focusOffsetZ).toBe(0.2);
    expect(fx.focusTargetBoost).toBe(1.8);
  });

  it('provides stable defaults when fields are missing', () => {
    const fx = computeSpaceFxState({});
    expect(fx.nebulaIntensity).toBe(0.6);
    expect(fx.twinkleIntensity).toBe(0.35);
    expect(fx.cometCount).toBe(10);
    expect(fx.meteorCount).toBe(44);
    expect(fx.lensFlareEnabled).toBe(true);
    expect(fx.solarWindEnabled).toBe(true);
    expect(fx.orbitPulseEnabled).toBe(true);
    expect(fx.autoRotateFocused).toBe(false);
    expect(fx.blackHoleEnabled).toBe(false);
    expect(fx.shockwaveEnabled).toBe(false);
  });

  it('derives chromatic aberration offsets from black hole strength', () => {
    const weak = computeSpaceFxState({ blackHoleStrength: 0.1 });
    const strong = computeSpaceFxState({ blackHoleStrength: 0.9 });
    expect(strong.chromaticBoostX).toBeGreaterThan(weak.chromaticBoostX);
    expect(strong.chromaticBoostY).toBeGreaterThan(weak.chromaticBoostY);
  });
});
