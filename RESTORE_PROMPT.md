# Cosmos Lab 復元プロンプト（現行版）

以下の要件で、`cosmos-lab` を **現行機能と同等** に再構築せよ。  
最重要: ランダム化時に `THREE.WebGLAttributes` のバッファサイズ不一致エラーを絶対に出さないこと。

## 目的
- React + Three.js + React Three Fiber + Leva を使った「Solar System Lab」。
- 右側に2本のLeva縦パネル、下部に拡張パラメータパネルを持つ。
- 宇宙描画は右と下のコンパネ領域を避けた描画領域で表示する。

## 必須ファイル構成
- `src/App.jsx`
- `src/Controls.jsx`
- `src/CosmosScene.jsx`
- `src/spaceFxState.js`
- `src/spaceFxState.test.js`
- `src/index.css`

## 必須スタック
- `react`, `react-dom`
- `three`
- `@react-three/fiber`
- `@react-three/drei`
- `@react-three/postprocessing`
- `leva`
- `vite`
- `vitest`

## 機能要求
1. 右縦2パネル（Leva）
- 左: シミュレーション + 表示項目 + 操作
- 右: 注視・カメラ + 演出 + プリセット
- 各パネルに最小化ボタン（最小化時はタイトル+最大化だけ）

2. 下部拡張パラメータ
- 最小化可能
- 通常時は「ゲージ」と「スイッチ」を分離表示
- 3行程度で高密度表示

3. カメラ
- 注視ターゲット `free/sun/earth/jupiter`
- 注視中でもカメラ操作可能
- 注視時は OrbitControls の target を追従し、ユーザー操作中は自動カメラ補正を弱める

4. ランダム化/履歴
- ランダム化ボタンで1回のみ値反映
- Undo/Redo 履歴50件
- ランダム連打でも描画エラーなし

5. 描画安定化（必須）
- 可変本数の描画は **固定長バッファ + drawRange** で実装
- 特に `CometsAndMeteors`, `StarBackgroundLayer`, `SolarWindField` は固定長必須
- `BufferAttribute` 配列長の動的変更禁止

6. ポストFX
- Bloom, Hue/Saturation, BrightnessContrast, Noise, ChromaticAberration, Vignette, Pixelation
- 鮮やか寄りプリセット（`vivid`）をおすすめに設定

## 現行デフォルトパラメータ（完全一致）
```js
{
  timeScale: 1.2, planetScale: 1.15, orbitScale: 28, renderStyle: 'clean',
  showOrbits: true, showLabels: true, showAsteroidBelt: true, showMoons: true,
  focusTarget: 'free', cameraControl: true, autoRotateSpeed: 0.12, cameraDistance: 160,
  bloomIntensity: 1.18, saturation: 0.3, exposure: 1.3, starField: 0.52,
  nebulaIntensity: 0.6, nebulaSpeed: 0.22, nebulaHueShift: 0.08, milkyOpacity: 0.1,
  twinkleIntensity: 0.35, twinkleSpeed: 0.8, deepStarMultiplier: 1.0,
  auroraEnabled: true, auroraIntensity: 0.45, dustEnabled: true, dustDensity: 0.6,
  cometCount: 10, cometSpeed: 1.0, meteorCount: 44, meteorSpeed: 1.0,
  lensFlareEnabled: true, blackHoleEnabled: false, blackHoleStrength: 0.4,
  shockwaveEnabled: false, shockwaveSpeed: 0.55,
  solarWindEnabled: true, solarWindSpeed: 0.75, solarWindDensity: 0.5,
  orbitPulseEnabled: true, orbitPulseSpeed: 0.8, orbitPulseStrength: 0.4,
  ringGlowEnabled: true, ringGlowIntensity: 0.42, planetAtmosphereBoost: 0.4,
  backgroundRotationSpeed: 0.55, parallaxDepth: 0.45, lensDustEnabled: true,
  lensDustIntensity: 0.35, warpStreaksEnabled: true, warpStreaksSpeed: 0.9,
  warpStreaksDensity: 0.55, colorTempShift: 0.04, contrastBoost: 0.18,
  vignetteDarkness: 0.72, bloomThreshold: 0.08,
  orbitThickness: 0.07, orbitOpacity: 0.2, asteroidSize: 0.7, asteroidSpeed: 0.012,
  moonOrbitBoost: 1.0, labelScale: 1.0, labelOpacity: 1.0, ambientGlow: 0.22,
  sunPulseStrength: 0.1, sunCoronaSpeed: 1.0, noiseOpacity: 0.014,
  chromaticIntensity: 1.0, pixelGranularity: 6, bloomSmoothing: 0.63,
  cameraFollowLerp: 0.028, focusOffsetX: 0.45, focusOffsetY: 0.2, focusOffsetZ: 0.56,
  autoRotateFocused: false, focusTargetBoost: 1.0
}
```

## 受け入れ条件
- `npm test` が通ること
- `npm run build` が通ること
- ランダムボタン連打でコンソールに `Resizing buffer attributes is not supported` が出ないこと

