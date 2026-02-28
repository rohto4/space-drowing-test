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
      <CosmosScene params={appliedParams} buildVersion={buildVersion} onStats={setStats} />

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

      <div className="absolute right-3 top-3 z-20 flex h-[calc(100vh-1.5rem)] flex-col gap-2 md:flex-row">
        <div className="leva-shell w-[220px]">
          <div className="leva-shell-title">シミュレーション</div>
          <Leva
            theme={levaTheme}
            store={leftLevaStore}
            fill
            collapsed={false}
            oneLineLabels
            hideCopyButton
            titleBar={{ title: '操作' }}
          />
        </div>
        <div className="leva-shell w-[220px]">
          <div className="leva-shell-title">描画・検証</div>
          <Leva
            theme={levaTheme}
            store={rightLevaStore}
            fill
            collapsed={false}
            oneLineLabels
            hideCopyButton
            titleBar={{ title: '演出' }}
          />
        </div>
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
        onApplyRecommended={() => applyPreset('cinematic')}
        onValuesChange={handleDraftChange}
        externalValues={draftParams}
      />
    </main>
  );
}

