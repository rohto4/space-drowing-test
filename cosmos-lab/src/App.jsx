import { useEffect, useMemo, useRef, useState } from 'react';
import { Leva, useCreateStore } from 'leva';
import Controls, { DEFAULT_PARAMS } from './Controls';
import CosmosScene from './CosmosScene';

const HISTORY_LIMIT = 50;

function paramsEqual(a, b) {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

function randomBetween(min, max, step = 0.01) {
  const raw = min + Math.random() * (max - min);
  return Math.round(raw / step) * step;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export default function App() {
  const isHistoryReplayRef = useRef(false);
  const historyRef = useRef([DEFAULT_PARAMS]);
  const historyIndexRef = useRef(0);
  const toastTimerRef = useRef(null);

  const leftLevaStore = useCreateStore();
  const rightLevaStore = useCreateStore();

  const [draftParams, setDraftParams] = useState(DEFAULT_PARAMS);
  const [appliedParams, setAppliedParams] = useState(DEFAULT_PARAMS);
  const [buildVersion, setBuildVersion] = useState(0);
  const [applyCount, setApplyCount] = useState(0);
  const [applyToast, setApplyToast] = useState(false);
  const [lastPreset, setLastPreset] = useState('なし');
  const [stats, setStats] = useState({ fps: 0, renderer: '読み込み中', checks: '未実行' });
  const [leftPanelMin, setLeftPanelMin] = useState(false);
  const [rightPanelMin, setRightPanelMin] = useState(false);
  const [bottomBarMin, setBottomBarMin] = useState(false);

  const pushHistory = (next) => {
    if (isHistoryReplayRef.current) {
      isHistoryReplayRef.current = false;
      return;
    }

    const stack = historyRef.current;
    const idx = historyIndexRef.current;
    if (paramsEqual(stack[idx], next)) return;

    const truncated = stack.slice(0, idx + 1);
    truncated.push(next);
    if (truncated.length > HISTORY_LIMIT) truncated.shift();
    historyRef.current = truncated;
    historyIndexRef.current = truncated.length - 1;
  };

  const setFromHistory = (nextIndex) => {
    const stack = historyRef.current;
    if (nextIndex < 0 || nextIndex >= stack.length) return;
    historyIndexRef.current = nextIndex;
    isHistoryReplayRef.current = true;
    setDraftParams(stack[nextIndex]);
  };

  const applyInstant = (params) => {
    setDraftParams(params);
    setAppliedParams(params);
    setBuildVersion((prev) => prev + 1);
    setApplyCount((prev) => prev + 1);
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      const isUndo = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && !event.shiftKey;
      const isRedo =
        (event.ctrlKey || event.metaKey) &&
        (event.key.toLowerCase() === 'y' || (event.key.toLowerCase() === 'z' && event.shiftKey));

      if (!isUndo && !isRedo) return;

      const target = event.target;
      if (target instanceof HTMLElement) {
        const tag = target.tagName.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || target.isContentEditable) return;
      }

      event.preventDefault();
      if (isUndo && historyIndexRef.current > 0) setFromHistory(historyIndexRef.current - 1);
      if (isRedo && historyIndexRef.current < historyRef.current.length - 1) setFromHistory(historyIndexRef.current + 1);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  const handleDraftChange = (params) => {
    setDraftParams(params);
    pushHistory(params);
  };

  const patchDraft = (patch) => {
    setDraftParams((prev) => {
      const next = { ...prev, ...patch };
      pushHistory(next);
      return next;
    });
  };

  const randomizeDraft = () => {
    const focusTargets = ['free', 'sun', 'earth', 'jupiter'];
    const current = draftParams;
    const randomized = {
      timeScale: randomBetween(0.7, 2.8, 0.01),
      planetScale: randomBetween(0.95, 1.55, 0.01),
      orbitScale: Math.round(randomBetween(20, 38, 1)),
      renderStyle: Math.random() > 0.7 ? 'pixel' : 'clean',
      showOrbits: Math.random() > 0.2,
      showLabels: Math.random() > 0.35,
      showAsteroidBelt: Math.random() > 0.25,
      showMoons: Math.random() > 0.22,
      focusTarget: focusTargets[Math.floor(Math.random() * focusTargets.length)],
      cameraControl: true,
      autoRotateSpeed: randomBetween(0.02, 0.26, 0.01),
      cameraDistance: Math.round(randomBetween(95, 185, 1)),
      bloomIntensity: randomBetween(0.55, 1.25, 0.01),
      saturation: randomBetween(0.02, 0.35, 0.01),
      exposure: randomBetween(0.9, 1.24, 0.01),
      starField: randomBetween(0.22, 0.78, 0.01),
      nebulaIntensity: randomBetween(0.28, 0.95, 0.01),
      nebulaSpeed: randomBetween(0.04, 0.62, 0.01),
      nebulaHueShift: randomBetween(-0.2, 0.25, 0.01),
      milkyOpacity: randomBetween(0.03, 0.24, 0.01),
      twinkleIntensity: randomBetween(0.08, 0.85, 0.01),
      twinkleSpeed: randomBetween(0.2, 2.4, 0.01),
      deepStarMultiplier: randomBetween(0.55, 1.8, 0.01),
      auroraEnabled: Math.random() > 0.35,
      auroraIntensity: randomBetween(0.1, 0.95, 0.01),
      dustEnabled: Math.random() > 0.25,
      dustDensity: randomBetween(0.2, 1, 0.01),
      cometCount: Math.round(randomBetween(4, 22, 1)),
      cometSpeed: randomBetween(0.45, 2.2, 0.01),
      meteorCount: Math.round(randomBetween(18, 84, 1)),
      meteorSpeed: randomBetween(0.4, 2.5, 0.01),
      lensFlareEnabled: Math.random() > 0.2,
      blackHoleEnabled: Math.random() > 0.7,
      blackHoleStrength: randomBetween(0.1, 0.95, 0.01),
      shockwaveEnabled: Math.random() > 0.7,
      shockwaveSpeed: randomBetween(0.2, 1.8, 0.01),
      solarWindEnabled: Math.random() > 0.2,
      solarWindSpeed: randomBetween(0.2, 1.9, 0.01),
      solarWindDensity: randomBetween(0.1, 0.95, 0.01),
      orbitPulseEnabled: Math.random() > 0.25,
      orbitPulseSpeed: randomBetween(0.2, 1.8, 0.01),
      orbitPulseStrength: randomBetween(0.1, 0.8, 0.01),
      ringGlowEnabled: Math.random() > 0.2,
      ringGlowIntensity: randomBetween(0.1, 0.85, 0.01),
      planetAtmosphereBoost: randomBetween(0.1, 0.9, 0.01),
      backgroundRotationSpeed: randomBetween(0.1, 1.5, 0.01),
      parallaxDepth: randomBetween(0.1, 0.9, 0.01),
      lensDustEnabled: Math.random() > 0.2,
      lensDustIntensity: randomBetween(0.05, 0.7, 0.01),
      warpStreaksEnabled: Math.random() > 0.2,
      warpStreaksSpeed: randomBetween(0.4, 2.3, 0.01),
      warpStreaksDensity: randomBetween(0.1, 0.9, 0.01),
      colorTempShift: randomBetween(-0.2, 0.2, 0.01),
      contrastBoost: randomBetween(-0.05, 0.45, 0.01),
      vignetteDarkness: randomBetween(0.45, 0.95, 0.01),
      bloomThreshold: randomBetween(0.02, 0.22, 0.01),
      orbitThickness: randomBetween(0.03, 0.16, 0.01),
      orbitOpacity: randomBetween(0.08, 0.55, 0.01),
      asteroidSize: randomBetween(0.4, 1.6, 0.01),
      asteroidSpeed: randomBetween(0.004, 0.03, 0.001),
      moonOrbitBoost: randomBetween(0.7, 1.8, 0.01),
      labelScale: randomBetween(0.8, 1.35, 0.01),
      labelOpacity: randomBetween(0.35, 1, 0.01),
      ambientGlow: randomBetween(0.12, 0.52, 0.01),
      sunPulseStrength: randomBetween(0.04, 0.32, 0.01),
      sunCoronaSpeed: randomBetween(0.5, 2, 0.01),
      noiseOpacity: randomBetween(0.002, 0.045, 0.001),
      chromaticIntensity: randomBetween(0.5, 1.9, 0.01),
      pixelGranularity: Math.round(randomBetween(3, 10, 1)),
      bloomSmoothing: randomBetween(0.35, 0.9, 0.01),
      cameraFollowLerp: randomBetween(0.02, 0.11, 0.001),
      focusOffsetX: randomBetween(0.3, 0.95, 0.01),
      focusOffsetY: randomBetween(0.08, 0.55, 0.01),
      focusOffsetZ: randomBetween(0.3, 1.05, 0.01),
      autoRotateFocused: Math.random() > 0.65,
      focusTargetBoost: randomBetween(0.8, 1.4, 0.01),
    };

    // Keep the scene readable: ensure at least one overlay remains visible.
    if (!randomized.showOrbits && !randomized.showLabels && !randomized.showAsteroidBelt && !randomized.showMoons) {
      randomized.showOrbits = true;
    }
    // Avoid jarring mode flips too often.
    if (Math.random() < 0.5) randomized.renderStyle = current.renderStyle;

    applyInstant(randomized);
    pushHistory(randomized);
  };

  const applyPreset = (name) => {
    const presets = {
      real: {
        ...DEFAULT_PARAMS,
        timeScale: 1,
        planetScale: 1,
        orbitScale: 30,
        renderStyle: 'clean',
        bloomIntensity: 0.72,
        saturation: 0.08,
        exposure: 1,
      },
      cinematic: {
        ...DEFAULT_PARAMS,
        timeScale: 1.6,
        planetScale: 1.25,
        orbitScale: 26,
        renderStyle: 'clean',
        bloomIntensity: 1.3,
        saturation: 0.32,
        exposure: 1.24,
        focusTarget: 'saturn',
      },
      vivid: {
        ...DEFAULT_PARAMS,
        timeScale: 1.2,
        planetScale: 1.18,
        orbitScale: 28,
        renderStyle: 'clean',
        bloomIntensity: 1.25,
        saturation: 0.34,
        exposure: 1.34,
        starField: 0.58,
        lensFlareEnabled: true,
      },
      fast: {
        ...DEFAULT_PARAMS,
        timeScale: 5.2,
        planetScale: 1.15,
        orbitScale: 22,
        renderStyle: 'pixel',
        bloomIntensity: 0.65,
        exposure: 1.05,
        showLabels: false,
      },
    };

    const next = presets[name];
    if (!next) return;
    applyInstant(next);
    setLastPreset(name);
    pushHistory(next);
  };

  const resetAll = () => {
    applyInstant(DEFAULT_PARAMS);
    historyRef.current = [DEFAULT_PARAMS];
    historyIndexRef.current = 0;
  };

  const applyChanges = (params) => {
    setAppliedParams(params);
    setBuildVersion((prev) => prev + 1);
    setApplyCount((prev) => prev + 1);
    setApplyToast(true);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setApplyToast(false), 900);
  };

  const handleUndo = () => {
    const nextIndex = historyIndexRef.current - 1;
    if (nextIndex < 0) return;
    historyIndexRef.current = nextIndex;
    isHistoryReplayRef.current = true;
    const next = historyRef.current[nextIndex];
    applyInstant(next);
  };

  const handleRedo = () => {
    const nextIndex = historyIndexRef.current + 1;
    if (nextIndex > historyRef.current.length - 1) return;
    historyIndexRef.current = nextIndex;
    isHistoryReplayRef.current = true;
    const next = historyRef.current[nextIndex];
    applyInstant(next);
  };

  const topStatus = useMemo(() => {
    return `検証: ${stats.checks}`;
  }, [stats.checks]);

  const isDirty = useMemo(() => !paramsEqual(draftParams, appliedParams), [draftParams, appliedParams]);
  const visibleCount = useMemo(() => {
    return [appliedParams.showOrbits, appliedParams.showLabels, appliedParams.showAsteroidBelt, appliedParams.showMoons].filter(Boolean).length;
  }, [appliedParams]);
  const rightPanelWidth = (leftPanelMin ? 164 : 220) + (rightPanelMin ? 164 : 220) + 8 + 12;
  const bottomPanelHeight = bottomBarMin ? 64 : 196;

  const levaTheme = useMemo(
    () => ({
      sizes: {
        rootWidth: '220px',
      },
      space: {
        sm: '5px',
        rowGap: '4px',
        md: '8px',
      },
      radii: {
        xs: '7px',
        sm: '9px',
        lg: '14px',
      },
      fonts: {
        mono: '"IBM Plex Sans", "Noto Sans JP", sans-serif',
      },
      colors: {
        elevation1: '#0a1122cc',
        elevation2: '#0f1a31dd',
        elevation3: '#152344ee',
        accent1: '#8a51ff',
        accent2: '#b88fff',
        accent3: '#ffe48c',
        highlight1: '#7f42ff',
        highlight2: '#a770ff',
        highlight3: '#ffd866',
        vivid1: '#ffd24a',
      },
    }),
    []
  );

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black text-zinc-100">
      <div className="absolute inset-0" style={{ right: `${rightPanelWidth}px`, bottom: `${bottomPanelHeight}px` }}>
        <CosmosScene params={appliedParams} buildVersion={buildVersion} onStats={setStats} />
      </div>

      <div className="pointer-events-none absolute left-4 top-4 z-10 rounded-xl border border-white/20 bg-black/35 px-4 py-3 backdrop-blur-md">
        <h1 className="text-sm font-semibold tracking-[0.2em] text-cyan-200">SOLAR SYSTEM LAB</h1>
        <p className="mt-1 text-xs text-zinc-300">{topStatus}</p>
        <p className="mt-1 text-xs text-zinc-300">状態: {isDirty ? '未適用の変更あり' : '適用済み'}</p>
        <p className="mt-1 text-[10px] text-zinc-400">適用回数: {applyCount}</p>
        <p className="mt-1 text-[10px] text-zinc-400">元に戻す: Ctrl/Cmd+Z | やり直し: Ctrl/Cmd+Y</p>
      </div>

      <div className="pointer-events-none absolute left-4 top-36 z-10 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-[11px] text-zinc-300 backdrop-blur-md">
        <div>描画方式: {stats.renderer}</div>
        <div>FPS: {stats.fps}</div>
        <div>注視: {appliedParams.focusTarget}</div>
        <div>表示ON: {visibleCount}/4</div>
        <div>最終プリセット: {lastPreset}</div>
      </div>

      {applyToast && (
        <div className="pointer-events-none absolute left-1/2 top-4 z-30 -translate-x-1/2 rounded-full border border-yellow-300/50 bg-purple-950/85 px-4 py-1 text-xs text-yellow-200 shadow-[0_0_20px_rgba(255,220,120,0.28)]">
          変更を適用しました
        </div>
      )}

      <div className="absolute right-3 top-3 z-20 flex items-start gap-2">
        <div
          className={`leva-shell ${leftPanelMin ? 'w-[164px]' : 'w-[220px]'}`}
          style={leftPanelMin ? { paddingTop: 8 } : undefined}
        >
          <div className="flex items-center justify-between px-2">
            <div className="leva-shell-title !static">シミュレーション</div>
            <button
              className="z-10 rounded-md border border-yellow-300/45 bg-purple-900/70 px-2 py-1 text-[10px] text-yellow-200"
              onClick={() => setLeftPanelMin((v) => !v)}
            >
              {leftPanelMin ? '最大化' : '最小化'}
            </button>
          </div>
          {!leftPanelMin && (
            <Leva
              theme={levaTheme}
              store={leftLevaStore}
              fill
              collapsed={false}
              oneLineLabels
              hideCopyButton
              titleBar={{ title: '操作' }}
            />
          )}
        </div>
        <div
          className={`leva-shell ${rightPanelMin ? 'w-[164px]' : 'w-[220px]'}`}
          style={rightPanelMin ? { paddingTop: 8 } : undefined}
        >
          <div className="flex items-center justify-between px-2">
            <div className="leva-shell-title !static">描画・検証</div>
            <button
              className="z-10 rounded-md border border-yellow-300/45 bg-purple-900/70 px-2 py-1 text-[10px] text-yellow-200"
              onClick={() => setRightPanelMin((v) => !v)}
            >
              {rightPanelMin ? '最大化' : '最小化'}
            </button>
          </div>
          {!rightPanelMin && (
            <Leva
              theme={levaTheme}
              store={rightLevaStore}
              fill
              collapsed={false}
              oneLineLabels
              hideCopyButton
              titleBar={{ title: '演出' }}
            />
          )}
        </div>
      </div>

      <div
        className={`absolute bottom-3 left-3 z-20 rounded-2xl border border-purple-300/30 bg-[#090d24d9] px-3 py-2 backdrop-blur-md ${
          bottomBarMin ? 'w-[280px]' : 'right-[470px] max-md:right-3'
        }`}
      >
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[11px] text-yellow-100">拡張パラメータ</span>
          <button
            className="rounded-md border border-yellow-300/45 bg-purple-900/70 px-2 py-1 text-[10px] text-yellow-200"
            onClick={() => setBottomBarMin((v) => !v)}
          >
            {bottomBarMin ? '最大化' : '最小化'}
          </button>
        </div>
        {!bottomBarMin && (
          <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="rounded-xl border border-purple-300/20 bg-black/20 p-2">
              <div className="mb-1 text-[10px] tracking-wider text-zinc-300">ゲージ</div>
              <div className="grid grid-cols-8 gap-2 text-[10px] text-zinc-200 max-[1700px]:grid-cols-7 max-[1450px]:grid-cols-6">
                <label className="flex min-w-0 flex-col gap-1"><span>星層倍率</span><input type="range" min="0.4" max="2.2" step="0.01" value={draftParams.deepStarMultiplier} onChange={(e) => patchDraft({ deepStarMultiplier: Number(e.target.value) })} /></label>
                <label className="flex min-w-0 flex-col gap-1"><span>瞬き</span><input type="range" min="0" max="1" step="0.01" value={draftParams.twinkleIntensity} onChange={(e) => patchDraft({ twinkleIntensity: Number(e.target.value) })} /></label>
                <label className="flex min-w-0 flex-col gap-1"><span>瞬き速度</span><input type="range" min="0.1" max="3" step="0.01" value={draftParams.twinkleSpeed} onChange={(e) => patchDraft({ twinkleSpeed: Number(e.target.value) })} /></label>
                <label className="flex min-w-0 flex-col gap-1"><span>星雲濃度</span><input type="range" min="0" max="1.2" step="0.01" value={draftParams.nebulaIntensity} onChange={(e) => patchDraft({ nebulaIntensity: Number(e.target.value) })} /></label>
                <label className="flex min-w-0 flex-col gap-1"><span>星雲速度</span><input type="range" min="0" max="1.2" step="0.01" value={draftParams.nebulaSpeed} onChange={(e) => patchDraft({ nebulaSpeed: Number(e.target.value) })} /></label>
                <label className="flex min-w-0 flex-col gap-1"><span>星雲色相</span><input type="range" min="-0.4" max="0.4" step="0.01" value={draftParams.nebulaHueShift} onChange={(e) => patchDraft({ nebulaHueShift: Number(e.target.value) })} /></label>
                <label className="flex min-w-0 flex-col gap-1"><span>銀河帯</span><input type="range" min="0" max="0.35" step="0.01" value={draftParams.milkyOpacity} onChange={(e) => patchDraft({ milkyOpacity: Number(e.target.value) })} /></label>
                <label className="flex min-w-0 flex-col gap-1"><span>太陽風速度</span><input type="range" min="0.1" max="2.5" step="0.01" value={draftParams.solarWindSpeed} onChange={(e) => patchDraft({ solarWindSpeed: Number(e.target.value) })} /></label>
                <label className="flex min-w-0 flex-col gap-1"><span>太陽風密度</span><input type="range" min="0" max="1" step="0.01" value={draftParams.solarWindDensity} onChange={(e) => patchDraft({ solarWindDensity: Number(e.target.value) })} /></label>
                <label className="flex min-w-0 flex-col gap-1"><span>背景回転</span><input type="range" min="0" max="2" step="0.01" value={draftParams.backgroundRotationSpeed} onChange={(e) => patchDraft({ backgroundRotationSpeed: Number(e.target.value) })} /></label>
                <label className="flex min-w-0 flex-col gap-1"><span>背景深度</span><input type="range" min="0" max="1" step="0.01" value={draftParams.parallaxDepth} onChange={(e) => patchDraft({ parallaxDepth: Number(e.target.value) })} /></label>
                <label className="flex min-w-0 flex-col gap-1"><span>塵密度</span><input type="range" min="0" max="1.2" step="0.01" value={draftParams.dustDensity} onChange={(e) => patchDraft({ dustDensity: Number(e.target.value) })} /></label>
                <label className="flex min-w-0 flex-col gap-1"><span>彗星数</span><input type="range" min="0" max="28" step="1" value={draftParams.cometCount} onChange={(e) => patchDraft({ cometCount: Number(e.target.value) })} /></label>
                <label className="flex min-w-0 flex-col gap-1"><span>彗星速度</span><input type="range" min="0.2" max="3" step="0.01" value={draftParams.cometSpeed} onChange={(e) => patchDraft({ cometSpeed: Number(e.target.value) })} /></label>
                <label className="flex min-w-0 flex-col gap-1"><span>流星数</span><input type="range" min="0" max="120" step="1" value={draftParams.meteorCount} onChange={(e) => patchDraft({ meteorCount: Number(e.target.value) })} /></label>
                <label className="flex min-w-0 flex-col gap-1"><span>流星速度</span><input type="range" min="0.2" max="3.4" step="0.01" value={draftParams.meteorSpeed} onChange={(e) => patchDraft({ meteorSpeed: Number(e.target.value) })} /></label>
                <label className="flex min-w-0 flex-col gap-1"><span>ブラックH</span><input type="range" min="0" max="1" step="0.01" value={draftParams.blackHoleStrength} onChange={(e) => patchDraft({ blackHoleStrength: Number(e.target.value) })} /></label>
                <label className="flex min-w-0 flex-col gap-1"><span>ショック波速度</span><input type="range" min="0.1" max="2.2" step="0.01" value={draftParams.shockwaveSpeed} onChange={(e) => patchDraft({ shockwaveSpeed: Number(e.target.value) })} /></label>
                <label className="flex min-w-0 flex-col gap-1"><span>軌道脈動速度</span><input type="range" min="0.1" max="2.5" step="0.01" value={draftParams.orbitPulseSpeed} onChange={(e) => patchDraft({ orbitPulseSpeed: Number(e.target.value) })} /></label>
                <label className="flex min-w-0 flex-col gap-1"><span>軌道脈動強度</span><input type="range" min="0" max="1" step="0.01" value={draftParams.orbitPulseStrength} onChange={(e) => patchDraft({ orbitPulseStrength: Number(e.target.value) })} /></label>
                <label className="flex min-w-0 flex-col gap-1"><span>環光</span><input type="range" min="0" max="1" step="0.01" value={draftParams.ringGlowIntensity} onChange={(e) => patchDraft({ ringGlowIntensity: Number(e.target.value) })} /></label>
                <label className="flex min-w-0 flex-col gap-1"><span>大気強化</span><input type="range" min="0" max="1" step="0.01" value={draftParams.planetAtmosphereBoost} onChange={(e) => patchDraft({ planetAtmosphereBoost: Number(e.target.value) })} /></label>
                <label className="flex min-w-0 flex-col gap-1"><span>レンズ塵</span><input type="range" min="0" max="1" step="0.01" value={draftParams.lensDustIntensity} onChange={(e) => patchDraft({ lensDustIntensity: Number(e.target.value) })} /></label>
                <label className="flex min-w-0 flex-col gap-1"><span>ワープ速度</span><input type="range" min="0.2" max="3.5" step="0.01" value={draftParams.warpStreaksSpeed} onChange={(e) => patchDraft({ warpStreaksSpeed: Number(e.target.value) })} /></label>
                <label className="flex min-w-0 flex-col gap-1"><span>ワープ密度</span><input type="range" min="0" max="1" step="0.01" value={draftParams.warpStreaksDensity} onChange={(e) => patchDraft({ warpStreaksDensity: Number(e.target.value) })} /></label>
                <label className="flex min-w-0 flex-col gap-1"><span>色温度</span><input type="range" min="-0.4" max="0.4" step="0.01" value={draftParams.colorTempShift} onChange={(e) => patchDraft({ colorTempShift: Number(e.target.value) })} /></label>
                <label className="flex min-w-0 flex-col gap-1"><span>コントラスト</span><input type="range" min="-0.5" max="0.8" step="0.01" value={draftParams.contrastBoost} onChange={(e) => patchDraft({ contrastBoost: Number(e.target.value) })} /></label>
                <label className="flex min-w-0 flex-col gap-1"><span>ビネット暗度</span><input type="range" min="0.2" max="1" step="0.01" value={draftParams.vignetteDarkness} onChange={(e) => patchDraft({ vignetteDarkness: Number(e.target.value) })} /></label>
                <label className="flex min-w-0 flex-col gap-1"><span>Bloom閾値</span><input type="range" min="0.01" max="0.5" step="0.01" value={draftParams.bloomThreshold} onChange={(e) => patchDraft({ bloomThreshold: Number(e.target.value) })} /></label>
                <label className="flex min-w-0 flex-col gap-1"><span>軌道太さ</span><input type="range" min="0.02" max="0.25" step="0.01" value={draftParams.orbitThickness} onChange={(e) => patchDraft({ orbitThickness: Number(e.target.value) })} /></label>
                <label className="flex min-w-0 flex-col gap-1"><span>軌道不透明度</span><input type="range" min="0.03" max="0.8" step="0.01" value={draftParams.orbitOpacity} onChange={(e) => patchDraft({ orbitOpacity: Number(e.target.value) })} /></label>
                <label className="flex min-w-0 flex-col gap-1"><span>小惑星サイズ</span><input type="range" min="0.2" max="2.4" step="0.01" value={draftParams.asteroidSize} onChange={(e) => patchDraft({ asteroidSize: Number(e.target.value) })} /></label>
                <label className="flex min-w-0 flex-col gap-1"><span>小惑星速度</span><input type="range" min="0.001" max="0.06" step="0.001" value={draftParams.asteroidSpeed} onChange={(e) => patchDraft({ asteroidSpeed: Number(e.target.value) })} /></label>
                <label className="flex min-w-0 flex-col gap-1"><span>衛星軌道倍率</span><input type="range" min="0.5" max="2.2" step="0.01" value={draftParams.moonOrbitBoost} onChange={(e) => patchDraft({ moonOrbitBoost: Number(e.target.value) })} /></label>
                <label className="flex min-w-0 flex-col gap-1"><span>ラベル倍率</span><input type="range" min="0.5" max="1.8" step="0.01" value={draftParams.labelScale} onChange={(e) => patchDraft({ labelScale: Number(e.target.value) })} /></label>
                <label className="flex min-w-0 flex-col gap-1"><span>ラベル不透明度</span><input type="range" min="0.1" max="1" step="0.01" value={draftParams.labelOpacity} onChange={(e) => patchDraft({ labelOpacity: Number(e.target.value) })} /></label>
                <label className="flex min-w-0 flex-col gap-1"><span>環境光</span><input type="range" min="0.05" max="0.9" step="0.01" value={draftParams.ambientGlow} onChange={(e) => patchDraft({ ambientGlow: Number(e.target.value) })} /></label>
                <label className="flex min-w-0 flex-col gap-1"><span>太陽脈動</span><input type="range" min="0" max="0.6" step="0.01" value={draftParams.sunPulseStrength} onChange={(e) => patchDraft({ sunPulseStrength: Number(e.target.value) })} /></label>
                <label className="flex min-w-0 flex-col gap-1"><span>コロナ速度</span><input type="range" min="0.2" max="3" step="0.01" value={draftParams.sunCoronaSpeed} onChange={(e) => patchDraft({ sunCoronaSpeed: Number(e.target.value) })} /></label>
                <label className="flex min-w-0 flex-col gap-1"><span>ノイズ量</span><input type="range" min="0" max="0.08" step="0.001" value={draftParams.noiseOpacity} onChange={(e) => patchDraft({ noiseOpacity: Number(e.target.value) })} /></label>
                <label className="flex min-w-0 flex-col gap-1"><span>色収差強度</span><input type="range" min="0" max="2.5" step="0.01" value={draftParams.chromaticIntensity} onChange={(e) => patchDraft({ chromaticIntensity: Number(e.target.value) })} /></label>
                <label className="flex min-w-0 flex-col gap-1"><span>ピクセル粒度</span><input type="range" min="2" max="12" step="1" value={draftParams.pixelGranularity} onChange={(e) => patchDraft({ pixelGranularity: Number(e.target.value) })} /></label>
                <label className="flex min-w-0 flex-col gap-1"><span>Bloom平滑</span><input type="range" min="0.2" max="0.95" step="0.01" value={draftParams.bloomSmoothing} onChange={(e) => patchDraft({ bloomSmoothing: Number(e.target.value) })} /></label>
                <label className="flex min-w-0 flex-col gap-1"><span>追従速度</span><input type="range" min="0.01" max="0.2" step="0.001" value={draftParams.cameraFollowLerp} onChange={(e) => patchDraft({ cameraFollowLerp: Number(e.target.value) })} /></label>
                <label className="flex min-w-0 flex-col gap-1"><span>注視X</span><input type="range" min="0.2" max="1.2" step="0.01" value={draftParams.focusOffsetX} onChange={(e) => patchDraft({ focusOffsetX: Number(e.target.value) })} /></label>
                <label className="flex min-w-0 flex-col gap-1"><span>注視Y</span><input type="range" min="0.05" max="0.8" step="0.01" value={draftParams.focusOffsetY} onChange={(e) => patchDraft({ focusOffsetY: Number(e.target.value) })} /></label>
                <label className="flex min-w-0 flex-col gap-1"><span>注視Z</span><input type="range" min="0.2" max="1.4" step="0.01" value={draftParams.focusOffsetZ} onChange={(e) => patchDraft({ focusOffsetZ: Number(e.target.value) })} /></label>
                <label className="flex min-w-0 flex-col gap-1"><span>注視距離倍率</span><input type="range" min="0.6" max="1.8" step="0.01" value={draftParams.focusTargetBoost} onChange={(e) => patchDraft({ focusTargetBoost: Number(e.target.value) })} /></label>
              </div>
            </div>

            <div className="rounded-xl border border-purple-300/20 bg-black/20 p-2">
              <div className="mb-1 text-[10px] tracking-wider text-zinc-300">スイッチ</div>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <button className={`rounded-md px-2 py-1 ${draftParams.auroraEnabled ? 'bg-yellow-300 text-purple-950' : 'bg-purple-700/50'}`} onClick={() => patchDraft({ auroraEnabled: !draftParams.auroraEnabled })}>オーロラ</button>
                <button className={`rounded-md px-2 py-1 ${draftParams.dustEnabled ? 'bg-yellow-300 text-purple-950' : 'bg-purple-700/50'}`} onClick={() => patchDraft({ dustEnabled: !draftParams.dustEnabled })}>宇宙塵</button>
                <button className={`rounded-md px-2 py-1 ${draftParams.lensFlareEnabled ? 'bg-yellow-300 text-purple-950' : 'bg-purple-700/50'}`} onClick={() => patchDraft({ lensFlareEnabled: !draftParams.lensFlareEnabled })}>レンズ</button>
                <button className={`rounded-md px-2 py-1 ${draftParams.blackHoleEnabled ? 'bg-yellow-300 text-purple-950' : 'bg-purple-700/50'}`} onClick={() => patchDraft({ blackHoleEnabled: !draftParams.blackHoleEnabled })}>ブラックH</button>
                <button className={`rounded-md px-2 py-1 ${draftParams.shockwaveEnabled ? 'bg-yellow-300 text-purple-950' : 'bg-purple-700/50'}`} onClick={() => patchDraft({ shockwaveEnabled: !draftParams.shockwaveEnabled })}>ショック波</button>
                <button className={`rounded-md px-2 py-1 ${draftParams.solarWindEnabled ? 'bg-yellow-300 text-purple-950' : 'bg-purple-700/50'}`} onClick={() => patchDraft({ solarWindEnabled: !draftParams.solarWindEnabled })}>太陽風</button>
                <button className={`rounded-md px-2 py-1 ${draftParams.orbitPulseEnabled ? 'bg-yellow-300 text-purple-950' : 'bg-purple-700/50'}`} onClick={() => patchDraft({ orbitPulseEnabled: !draftParams.orbitPulseEnabled })}>軌道脈動</button>
                <button className={`rounded-md px-2 py-1 ${draftParams.ringGlowEnabled ? 'bg-yellow-300 text-purple-950' : 'bg-purple-700/50'}`} onClick={() => patchDraft({ ringGlowEnabled: !draftParams.ringGlowEnabled })}>環光</button>
                <button className={`rounded-md px-2 py-1 ${draftParams.lensDustEnabled ? 'bg-yellow-300 text-purple-950' : 'bg-purple-700/50'}`} onClick={() => patchDraft({ lensDustEnabled: !draftParams.lensDustEnabled })}>レンズ塵</button>
                <button className={`rounded-md px-2 py-1 ${draftParams.warpStreaksEnabled ? 'bg-yellow-300 text-purple-950' : 'bg-purple-700/50'}`} onClick={() => patchDraft({ warpStreaksEnabled: !draftParams.warpStreaksEnabled })}>ワープ線</button>
                <button className={`rounded-md px-2 py-1 ${draftParams.autoRotateFocused ? 'bg-yellow-300 text-purple-950' : 'bg-purple-700/50'}`} onClick={() => patchDraft({ autoRotateFocused: !draftParams.autoRotateFocused })}>注視自動回転</button>
                <button className="col-span-2 rounded-md bg-cyan-300/90 px-2 py-1 text-slate-950" onClick={() => applyChanges({ ...draftParams, cameraDistance: clamp(draftParams.cameraDistance, 40, 260) })}>下バー適用</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Controls
        leftStore={leftLevaStore}
        rightStore={rightLevaStore}
        onApply={applyChanges}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onReset={resetAll}
        onRandomize={randomizeDraft}
        onApplyPreset={applyPreset}
        onApplyRecommended={() => applyPreset('vivid')}
        onValuesChange={handleDraftChange}
        externalValues={draftParams}
      />
    </main>
  );
}

