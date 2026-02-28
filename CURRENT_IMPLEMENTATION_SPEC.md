# Current Implementation Spec (Snapshot)

## Overview
- Project root: `G:\devwork\space-drowing-test`
- App root: `G:\devwork\space-drowing-test\cosmos-lab`
- Rendering: `three` + `@react-three/fiber`
- UI controls: `leva` (right 2 columns) + custom bottom panel
- State model: `DEFAULT_PARAMS` in `src/Controls.jsx`
- FX normalization/clamp layer: `src/spaceFxState.js`

## Core Architecture
1. `App.jsx`
- Owns draft/applied params
- Undo/Redo history (50)
- Randomize + Preset application
- Layout:
  - Right two Leva columns (minimizable)
  - Bottom expansion panel (minimizable)
  - Canvas render area excludes right/bottom panel regions

2. `Controls.jsx`
- Binds left/right Leva stores
- Sync strategy to prevent feedback loop:
  - external -> store sync only when diff exists
  - store -> parent update only when diff exists
- ON/OFF button yellow highlight via `🟨` marker

3. `CosmosScene.jsx`
- Scene composition:
  - Background texture, parallax shell
  - Multi-layer star fields
  - Nebula, aurora, dust, solar wind
  - Solar system bodies, asteroid belt, orbit rings
  - Comets/meteors, black hole anomaly, shockwaves
  - PostFX stack
- Camera:
  - focus target support
  - orbit controls enabled with focus

4. `spaceFxState.js`
- Single source for:
  - clamp limits
  - normalized runtime FX values
  - derived values (chromatic offsets, etc.)

## Stability Rules (Critical)
- Do not resize buffer attribute arrays during runtime.
- Use fixed-size typed arrays for dynamic line/point systems.
- Control active visible count only via `geometry.setDrawRange(...)`.
- High-load handling:
  - performance scale based on FPS bucket
  - dynamic count reductions for expensive particle groups

## Current Validation
- Unit tests: `src/spaceFxState.test.js`
  - mapping
  - clamp behavior
  - default behavior
  - derived-field behavior
- Build: Vite production build must pass

## Restore Priority
1. `DEFAULT_PARAMS` consistency
2. `spaceFxState` clamp + derived mapping
3. fixed-buffer rendering safety
4. UI minimization + panel layout logic
5. camera focus interaction behavior

