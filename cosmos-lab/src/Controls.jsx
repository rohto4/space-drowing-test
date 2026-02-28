import { useEffect, useRef } from 'react';
import { buttonGroup, folder, useControls } from 'leva';

export const DEFAULT_PARAMS = {
  timeScale: 1.2,
  planetScale: 1.15,
  orbitScale: 28,
  renderStyle: 'clean',
  showOrbits: true,
  showLabels: true,
  showAsteroidBelt: true,
  showMoons: true,
  focusTarget: 'free',
  cameraControl: true,
  autoRotateSpeed: 0.12,
  cameraDistance: 160,
  bloomIntensity: 1.18,
  saturation: 0.3,
  exposure: 1.3,
  starField: 0.52,
  nebulaIntensity: 0.6,
  nebulaSpeed: 0.22,
  nebulaHueShift: 0.08,
  milkyOpacity: 0.1,
  twinkleIntensity: 0.35,
  twinkleSpeed: 0.8,
  deepStarMultiplier: 1.0,
  auroraEnabled: true,
  auroraIntensity: 0.45,
  dustEnabled: true,
  dustDensity: 0.6,
  cometCount: 10,
  cometSpeed: 1.0,
  meteorCount: 44,
  meteorSpeed: 1.0,
  lensFlareEnabled: true,
  blackHoleEnabled: false,
  blackHoleStrength: 0.4,
  shockwaveEnabled: false,
  shockwaveSpeed: 0.55,
  solarWindEnabled: true,
  solarWindSpeed: 0.75,
  solarWindDensity: 0.5,
  orbitPulseEnabled: true,
  orbitPulseSpeed: 0.8,
  orbitPulseStrength: 0.4,
  ringGlowEnabled: true,
  ringGlowIntensity: 0.42,
  planetAtmosphereBoost: 0.4,
  backgroundRotationSpeed: 0.55,
  parallaxDepth: 0.45,
  lensDustEnabled: true,
  lensDustIntensity: 0.35,
  warpStreaksEnabled: true,
  warpStreaksSpeed: 0.9,
  warpStreaksDensity: 0.55,
  colorTempShift: 0.04,
  contrastBoost: 0.18,
  vignetteDarkness: 0.72,
  bloomThreshold: 0.08,
  orbitThickness: 0.07,
  orbitOpacity: 0.2,
  asteroidSize: 0.7,
  asteroidSpeed: 0.012,
  moonOrbitBoost: 1.0,
  labelScale: 1.0,
  labelOpacity: 1.0,
  ambientGlow: 0.22,
  sunPulseStrength: 0.1,
  sunCoronaSpeed: 1.0,
  noiseOpacity: 0.014,
  chromaticIntensity: 1.0,
  pixelGranularity: 6,
  bloomSmoothing: 0.63,
  cameraFollowLerp: 0.028,
  focusOffsetX: 0.45,
  focusOffsetY: 0.2,
  focusOffsetZ: 0.56,
  autoRotateFocused: false,
  focusTargetBoost: 1.0,
};

export default function Controls({
  leftStore,
  rightStore,
  onApply,
  onUndo,
  onRedo,
  onReset,
  onRandomize,
  onApplyPreset,
  onApplyRecommended,
  onValuesChange,
  externalValues,
}) {
  const paramsEqual = (a, b) => {
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch {
      return false;
    }
  };

  const valuesRef = useRef(DEFAULT_PARAMS);
  const syncRef = useRef(false);
  const setLeftRef = useRef(() => {});
  const setRightRef = useRef(() => {});
  const currentValues = externalValues ?? valuesRef.current;

  const pickLeftValues = (v) => ({
    timeScale: v.timeScale,
    planetScale: v.planetScale,
    orbitScale: v.orbitScale,
    renderStyle: v.renderStyle,
    showOrbits: v.showOrbits,
    showLabels: v.showLabels,
    showAsteroidBelt: v.showAsteroidBelt,
    showMoons: v.showMoons,
  });

  const pickRightValues = (v) => ({
    focusTarget: v.focusTarget,
    cameraControl: v.cameraControl,
    autoRotateSpeed: v.autoRotateSpeed,
    cameraDistance: v.cameraDistance,
    bloomIntensity: v.bloomIntensity,
    saturation: v.saturation,
    exposure: v.exposure,
    starField: v.starField,
  });

  const normalizeParams = (left, right) => {
    const base = externalValues ?? valuesRef.current ?? DEFAULT_PARAMS;
    return {
      ...base,
    timeScale: left?.timeScale ?? valuesRef.current.timeScale ?? DEFAULT_PARAMS.timeScale,
    planetScale: left?.planetScale ?? valuesRef.current.planetScale ?? DEFAULT_PARAMS.planetScale,
    orbitScale: left?.orbitScale ?? valuesRef.current.orbitScale ?? DEFAULT_PARAMS.orbitScale,
    renderStyle: left?.renderStyle ?? valuesRef.current.renderStyle ?? DEFAULT_PARAMS.renderStyle,
    showOrbits: left?.showOrbits ?? valuesRef.current.showOrbits ?? DEFAULT_PARAMS.showOrbits,
    showLabels: left?.showLabels ?? valuesRef.current.showLabels ?? DEFAULT_PARAMS.showLabels,
    showAsteroidBelt: left?.showAsteroidBelt ?? valuesRef.current.showAsteroidBelt ?? DEFAULT_PARAMS.showAsteroidBelt,
    showMoons: left?.showMoons ?? valuesRef.current.showMoons ?? DEFAULT_PARAMS.showMoons,
    focusTarget: right?.focusTarget ?? valuesRef.current.focusTarget ?? DEFAULT_PARAMS.focusTarget,
    cameraControl: right?.cameraControl ?? valuesRef.current.cameraControl ?? DEFAULT_PARAMS.cameraControl,
    autoRotateSpeed: right?.autoRotateSpeed ?? valuesRef.current.autoRotateSpeed ?? DEFAULT_PARAMS.autoRotateSpeed,
    cameraDistance: right?.cameraDistance ?? valuesRef.current.cameraDistance ?? DEFAULT_PARAMS.cameraDistance,
    bloomIntensity: right?.bloomIntensity ?? valuesRef.current.bloomIntensity ?? DEFAULT_PARAMS.bloomIntensity,
    saturation: right?.saturation ?? valuesRef.current.saturation ?? DEFAULT_PARAMS.saturation,
    exposure: right?.exposure ?? valuesRef.current.exposure ?? DEFAULT_PARAMS.exposure,
    starField: right?.starField ?? valuesRef.current.starField ?? DEFAULT_PARAMS.starField,
    };
  };

  const commitAndApply = (leftPatch = {}, rightPatch = {}) => {
    const leftBase = pickLeftValues(currentValues);
    const rightBase = pickRightValues(currentValues);
    const nextLeft = { ...leftBase, ...leftPatch };
    const nextRight = { ...rightBase, ...rightPatch };
    const next = normalizeParams(nextLeft, nextRight);

    setLeftRef.current(leftPatch);
    setRightRef.current(rightPatch);

    valuesRef.current = next;
    if (onValuesChange) onValuesChange(next);
    if (onApply) onApply(next);
  };

  const setFlag = (key, value) => {
    commitAndApply({ [key]: value });
  };

  const stateLabel = (key) => (currentValues?.[key] ? '現在: ON' : '現在: OFF');
  const onLabel = (key) => (currentValues?.[key] ? '🟨 ON' : 'ON');
  const offLabel = (key) => (currentValues?.[key] ? 'OFF' : '🟨 OFF');
  const focusLabel = (target, label) => (currentValues?.focusTarget === target ? `🟨 ${label}` : label);

  const [leftValues, setLeft] = useControls(
    () => ({
      シミュレーション: folder(
        {
          timeScale: { label: '時間倍率', value: DEFAULT_PARAMS.timeScale, min: 0, max: 8, step: 0.01 },
          planetScale: { label: '惑星サイズ', value: DEFAULT_PARAMS.planetScale, min: 0.2, max: 2.5, step: 0.01 },
          orbitScale: { label: '軌道スケール', value: DEFAULT_PARAMS.orbitScale, min: 8, max: 50, step: 1 },
          renderStyle: { label: '表示品質', value: DEFAULT_PARAMS.renderStyle, render: () => false },
          renderStyleRow: buttonGroup({
            label: '品質',
            opts: {
              クリーン: () => commitAndApply({ renderStyle: 'clean' }),
              ピクセル: () => commitAndApply({ renderStyle: 'pixel' }),
            },
          }),
          timeScaleQuick: buttonGroup({
            label: '時間プリセット',
            opts: {
              'x0.5': () => commitAndApply({ timeScale: 0.5 }),
              'x1.0': () => commitAndApply({ timeScale: 1 }),
              'x2.0': () => commitAndApply({ timeScale: 2 }),
            },
          }),
        },
        { collapsed: false }
      ),
      表示項目: folder(
        {
          showOrbits: { label: '軌道を表示', value: DEFAULT_PARAMS.showOrbits, render: () => false },
          showLabels: { label: 'ラベル表示', value: DEFAULT_PARAMS.showLabels, render: () => false },
          showAsteroidBelt: { label: '小惑星帯', value: DEFAULT_PARAMS.showAsteroidBelt, render: () => false },
          showMoons: { label: '衛星表示', value: DEFAULT_PARAMS.showMoons, render: () => false },
          orbitToggle: buttonGroup({
            label: `軌道（${stateLabel('showOrbits')}）`,
            opts: {
              [onLabel('showOrbits')]: () => setFlag('showOrbits', true),
              [offLabel('showOrbits')]: () => setFlag('showOrbits', false),
            },
          }),
          labelToggle: buttonGroup({
            label: `ラベル（${stateLabel('showLabels')}）`,
            opts: {
              [onLabel('showLabels')]: () => setFlag('showLabels', true),
              [offLabel('showLabels')]: () => setFlag('showLabels', false),
            },
          }),
          beltToggle: buttonGroup({
            label: `小惑星帯（${stateLabel('showAsteroidBelt')}）`,
            opts: {
              [onLabel('showAsteroidBelt')]: () => setFlag('showAsteroidBelt', true),
              [offLabel('showAsteroidBelt')]: () => setFlag('showAsteroidBelt', false),
            },
          }),
          moonToggle: buttonGroup({
            label: `衛星（${stateLabel('showMoons')}）`,
            opts: {
              [onLabel('showMoons')]: () => setFlag('showMoons', true),
              [offLabel('showMoons')]: () => setFlag('showMoons', false),
            },
          }),
        },
        { collapsed: false }
      ),
      操作: folder(
        {
          actionRow1: buttonGroup({
            label: '操作 1',
            opts: {
              変更を適用: () => onApply(valuesRef.current),
              ランダム化: () => onRandomize && onRandomize(),
            },
          }),
          actionRow2: buttonGroup({
            label: '操作 2',
            opts: {
              元に戻す: () => onUndo && onUndo(),
              やり直す: () => onRedo && onRedo(),
            },
          }),
          actionRow3: buttonGroup({
            label: '操作 3',
            opts: {
              初期化: () => onReset && onReset(),
              おすすめ: () => onApplyRecommended && onApplyRecommended(),
            },
          }),
        },
        { collapsed: false }
      ),
    }),
    { store: leftStore }
  );

  const [rightValues, setRight] = useControls(
    () => ({
      注視・カメラ: folder(
        {
          focusTarget: { label: '注視対象', value: DEFAULT_PARAMS.focusTarget, render: () => false },
          focusRow1: buttonGroup({
            label: '',
            opts: {
              [focusLabel('free', '自由')]: () => commitAndApply({}, { focusTarget: 'free' }),
              [focusLabel('sun', '太陽')]: () => commitAndApply({}, { focusTarget: 'sun' }),
            },
          }),
          focusRow2: buttonGroup({
            label: '',
            opts: {
              [focusLabel('earth', '地球')]: () => commitAndApply({}, { focusTarget: 'earth' }),
              [focusLabel('jupiter', '木星')]: () => commitAndApply({}, { focusTarget: 'jupiter' }),
            },
          }),
          cameraControl: { label: '視点操作', value: DEFAULT_PARAMS.cameraControl, render: () => false },
          cameraToggle: buttonGroup({
            label: `視点操作（${stateLabel('cameraControl')}）`,
            opts: {
              [onLabel('cameraControl')]: () => commitAndApply({}, { cameraControl: true }),
              [offLabel('cameraControl')]: () => commitAndApply({}, { cameraControl: false }),
            },
          }),
          autoRotateSpeed: { label: '自動回転', value: DEFAULT_PARAMS.autoRotateSpeed, min: 0, max: 1, step: 0.01 },
          cameraDistance: { label: 'カメラ距離', value: DEFAULT_PARAMS.cameraDistance, min: 40, max: 260, step: 1 },
        },
        { collapsed: false }
      ),
      演出: folder(
        {
          bloomIntensity: { label: 'ブルーム', value: DEFAULT_PARAMS.bloomIntensity, min: 0, max: 2, step: 0.01 },
          saturation: { label: '彩度', value: DEFAULT_PARAMS.saturation, min: -1, max: 1.5, step: 0.01 },
          exposure: { label: '露光', value: DEFAULT_PARAMS.exposure, min: 0.6, max: 1.8, step: 0.01 },
          starField: { label: '背景星量', value: DEFAULT_PARAMS.starField, min: 0, max: 1, step: 0.01 },
          lookRow: buttonGroup({
            label: '露光プリセット',
            opts: {
              鮮やか: () => commitAndApply({}, { exposure: 1.35, bloomIntensity: 1.2, saturation: 0.32 }),
              深宇宙: () => commitAndApply({}, { exposure: 0.9, bloomIntensity: 0.68, saturation: 0.08 }),
              標準: () => commitAndApply({}, { exposure: 1.05, bloomIntensity: 0.82, saturation: 0.15 }),
            },
          }),
          exposureFine: buttonGroup({
            label: '露光微調整',
            opts: {
              '-0.02': () => commitAndApply({}, { exposure: Math.max(0.6, valuesRef.current.exposure - 0.02) }),
              '+0.02': () => commitAndApply({}, { exposure: Math.min(1.8, valuesRef.current.exposure + 0.02) }),
            },
          }),
        },
        { collapsed: false }
      ),
      プリセット: folder(
        {
          presetRow1: buttonGroup({
            label: 'プリセット 1',
            opts: {
              現実寄り: () => onApplyPreset && onApplyPreset('real'),
              シネマ風: () => onApplyPreset && onApplyPreset('cinematic'),
            },
          }),
          presetRow2: buttonGroup({
            label: 'プリセット 2',
            opts: {
              検証高速: () => onApplyPreset && onApplyPreset('fast'),
              標準復帰: () => onReset && onReset(),
            },
          }),
        },
        { collapsed: false }
      ),
    }),
    { store: rightStore }
  );

  setLeftRef.current = setLeft;
  setRightRef.current = setRight;

  useEffect(() => {
    if (syncRef.current) return;

    const merged = normalizeParams(leftValues, rightValues);
    if (paramsEqual(merged, valuesRef.current)) return;
    valuesRef.current = merged;
    if (onValuesChange) onValuesChange(merged);
  }, [leftValues, rightValues, onValuesChange]);

  useEffect(() => {
    if (!externalValues) return;
    if (paramsEqual(externalValues, valuesRef.current)) return;
    syncRef.current = true;
    setLeft(pickLeftValues(externalValues));
    setRight(pickRightValues(externalValues));
    valuesRef.current = normalizeParams(externalValues, externalValues);
    queueMicrotask(() => {
      syncRef.current = false;
    });
  }, [externalValues, setLeft, setRight]);

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => {
      const panelButtons = document.querySelectorAll('.leva-shell button');
      panelButtons.forEach((node) => {
        if (!(node instanceof HTMLButtonElement)) return;
        const text = (node.textContent || '').trim();
        const shouldStyle =
          text.includes('🟨') ||
          text.includes('ON') ||
          text.includes('OFF') ||
          text.includes('自由') ||
          text.includes('太陽') ||
          text.includes('地球') ||
          text.includes('木星');
        if (!shouldStyle) return;

        if (text.includes('🟨')) {
          node.style.setProperty('background', 'rgba(255, 223, 115, 0.9)', 'important');
          node.style.setProperty('border-color', 'rgba(255, 236, 170, 0.95)', 'important');
          node.style.setProperty('color', '#2e1848', 'important');
          node.style.setProperty('box-shadow', '0 0 0 1px rgba(255,247,210,0.45) inset', 'important');
        } else {
          node.style.setProperty('background', 'rgba(188, 145, 255, 0.28)', 'important');
          node.style.setProperty('border-color', 'rgba(203, 167, 255, 0.42)', 'important');
          node.style.setProperty('color', '#f2eaff', 'important');
          node.style.setProperty('box-shadow', '', 'important');
        }
      });
    });

    return () => window.cancelAnimationFrame(raf);
  }, [leftValues, rightValues, externalValues]);

  return null;
}
