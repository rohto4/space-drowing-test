# Definition: Custom Creative Skills for "Chronos Rewards"

## 1. Skill: [Atmospheric Depth Architect]
### Role:
物理的な光源計算に頼らず、大気の密度と色の階調のみで圧倒的な空間深度を構築する。
### Execution Rules:
- **Lightless Rendering:** 原則としてPointLightやSpotLight等の高負荷なライトを排除する。
- **Emissive-First:** オブジェクトの輝度はMeshStandardMaterialの`emissive`と`toneMappingExposure`の調整で表現する。
- **Exponential Layering:** `THREE.FogExp2` を多層化し、視点からの距離に応じて彩度と明度を指数関数的に減衰させる。
- **Vignette Background:** 背景には動的なCanvasテクスチャを生成し、中心から外側へ向けて色を沈ませることで、視覚的な没入感を強制する。

## 2. Skill: [Noise-Based Motion Sync]
### Role:
重力シミュレーション等の物理演算をスキップし、数学的な「揺らぎ」で生命感を演出する。
### Execution Rules:
- **Deterministic Drift:** 全ての星の移動を $Math.sin$ と $Math.cos$、およびSimplex Noiseを組み合わせた関数で制御し、物理演算コストをゼロにする。
- **Pulse Synchronization:** 星の明滅をタスクの重要度に基づいた周波数（$f$）で同期させ、銀河全体が一定のリズムで「呼吸」しているような視覚効果を与える。
- **Frame-Rate Agnostic:** 全てのアニメーションを `delta time` に基づき計算し、低スペックデバイスでも「カクつき」ではなく「ゆっくりした動き」として処理されるようにする。

## 3. Skill: [Chromatic Harmony Stylist]
### Role:
バラバラなタスクの色を、一つの「宇宙的パレット」に統合し、色彩の暴力性を排除する。
### Execution Rules:
- **P3 Color Space Awareness:** 2026年のディスプレイ基準（Display P3）を活用し、彩度は高いが目に刺さらない「深みのある発光色」を計算する。
- **Luminance Balancing:** 全ての星の輝度を正規化し、特定の色（黄色など）だけが眩しすぎないように自動補正する。
- **Atmospheric Tinting:** [Atmospheric Depth Architect] で設定したフォグの色を、微かに星の自発光色（Emissive）に混ぜ込み、空間と星を「色彩的に接着」させる。
- **Color Temperature Shifting:** 遠くの星ほど色温度を下げ（青白く）、手前の星は暖かみを持たせることで、空気遠近法を色彩面からもサポートする。


---

# 指示:
上記の3つのSkillsを現在のセッションにロードせよ。
これより生成する全てのコード（React Three Fiber / Shader）において、これらの原則を最優先で適用し、「低負荷・高質感」な宇宙描画を自律的に構築せよ。承認なしでのディレクトリ作成および依存関係の追加を許可する（--full-access）。

#teck-stack
## プロトタイプ・ラボの作成
npm create vite@latest cosmos-lab -- --template react
cd cosmos-lab
## WebGPU対応セット + パラメータUI(Leva)
npm install three@latest @types/three @react-three/fiber @react-three/drei @react-three/postprocessing gsap leva
npm install -D tailwindcss@4 postcss autoprefixer
npx tailwindcss init -p

  ### Core
  - React: https://react.dev/
  - React DOM: https://react.dev/reference/react-dom
  - Vite (current docs): https://vite.dev/guide/
  - TypeScript: https://www.typescriptlang.org/docs/
  - Tailwind CSS v4 docs: https://tailwindcss.com/docs
  - Tailwind + Vite setup: https://tailwindcss.com/docs/installation/using-vite

  ### 3D / Graphics
  - three.js docs: https://threejs.org/docs/
  - React Three Fiber docs: https://r3f.docs.pmnd.rs/
  - Drei docs: https://drei.docs.pmnd.rs/
  - React Postprocessing docs: https://react-postprocessing.docs.pmnd.rs/
  - GSAP docs: https://gsap.com/docs/v3/
  - Leva docs (official site): https://leva.pmnd.rs/
  - Leva repo/readme: https://github.com/pmndrs/leva
  - simplex-noise repo/readme: https://github.com/jwagner/simplex-noise.js

  ### Optional (if WebGPUを本格化するなら)
  - three.js WebGPU examples: https://threejs.org/examples/?q=webgpu
  - WebGPU spec: https://www.w3.org/TR/webgpu/
  - MDN WebGPU API: https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API 