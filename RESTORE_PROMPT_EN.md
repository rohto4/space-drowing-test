# Cosmos Lab Restore Prompt (Stable ASCII)

Rebuild the `cosmos-lab` project to match the current implementation.
Hard requirement: no runtime buffer-resize errors on randomize spam.

## Goal
- React + Three.js + React Three Fiber + Leva based "Solar System Lab"
- Two right-side Leva columns + bottom expansion panel
- Render only in free area (exclude right and bottom panel regions)

## Required files
- `src/App.jsx`
- `src/Controls.jsx`
- `src/CosmosScene.jsx`
- `src/spaceFxState.js`
- `src/spaceFxState.test.js`
- `src/index.css`

## Required stack
- react, react-dom
- three
- @react-three/fiber
- @react-three/drei
- @react-three/postprocessing
- leva
- vite
- vitest

## Must-have behavior
1. Right 2 Leva columns
- Left: simulation / visibility / actions
- Right: focus-camera / visuals / presets
- Each panel has minimize toggle (minimized: title + maximize button only)

2. Bottom expansion panel
- Minimizable
- Split into separate gauge panel and switch panel
- Dense 3-row style layout

3. Camera
- Focus targets: free, sun, earth, jupiter
- Camera must remain controllable after focus
- During focus, update OrbitControls target and reduce auto camera correction when user is interacting

4. Randomize and history
- Randomize applies once per click
- Undo/Redo history: 50
- No crashes on rapid randomize

5. Buffer stability (critical)
- Dynamic draw systems must use fixed-size arrays + drawRange
- Never resize BufferAttribute arrays at runtime
- Especially: CometsAndMeteors, StarBackgroundLayer, SolarWindField

6. Post FX
- Bloom, Hue/Saturation, BrightnessContrast, Noise, ChromaticAberration, Vignette, Pixelation
- Keep vivid-style preset as recommended default style

## Current defaults
Use `DEFAULT_PARAMS` from `src/Controls.jsx` exactly as source of truth.

## Acceptance checks
- `npm test` passes
- `npm run build` passes
- No `THREE.WebGLAttributes ... Resizing buffer attributes is not supported` on randomize spam

