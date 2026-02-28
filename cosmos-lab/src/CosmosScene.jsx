import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  HueSaturation,
  Noise,
  Pixelation,
  Vignette,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import WebGPU from 'three/examples/jsm/capabilities/WebGPU.js';
import { WebGPURenderer } from 'three/webgpu';

const PLANETS = [
  { key: 'mercury', name: '水星', color: '#a79d8f', radius: 0.383, distance: 0.39, period: 88, tilt: 0.01, inclination: 7.0, phase: 0.5 },
  { key: 'venus', name: '金星', color: '#c8a47c', radius: 0.949, distance: 0.72, period: 225, tilt: 177.4, inclination: 3.4, phase: 1.2 },
  { key: 'earth', name: '地球', color: '#4c8ad8', radius: 1.0, distance: 1.0, period: 365, tilt: 23.4, inclination: 0.0, phase: 2.2 },
  { key: 'mars', name: '火星', color: '#b66047', radius: 0.532, distance: 1.52, period: 687, tilt: 25.2, inclination: 1.9, phase: 2.8 },
  { key: 'jupiter', name: '木星', color: '#c9a67d', radius: 11.21, distance: 5.2, period: 4331, tilt: 3.1, inclination: 1.3, phase: 4.7 },
  { key: 'saturn', name: '土星', color: '#d8c08b', radius: 9.45, distance: 9.58, period: 10747, tilt: 26.7, inclination: 2.5, phase: 5.2 },
  { key: 'uranus', name: '天王星', color: '#8fc7d6', radius: 4.01, distance: 19.2, period: 30589, tilt: 97.8, inclination: 0.8, phase: 0.2 },
  { key: 'neptune', name: '海王星', color: '#3f68c7', radius: 3.88, distance: 30.05, period: 59800, tilt: 28.3, inclination: 1.8, phase: 3.8 },
];

const MOONS = [
  { key: 'moon', parent: 'earth', name: '月', color: '#b8b7b3', radius: 0.273, distance: 0.00257, period: 27.3, phase: 1.4 },
  { key: 'io', parent: 'jupiter', name: 'イオ', color: '#cfbf96', radius: 0.286, distance: 0.00282, period: 1.77, phase: 2.4 },
  { key: 'titan', parent: 'saturn', name: 'タイタン', color: '#c39a61', radius: 0.404, distance: 0.00817, period: 15.95, phase: 0.8 },
];

function verifySolarData() {
  const errors = [];

  for (let i = 1; i < PLANETS.length; i += 1) {
    if (!(PLANETS[i].distance > PLANETS[i - 1].distance)) errors.push(`距離順エラー:${PLANETS[i - 1].key}->${PLANETS[i].key}`);
    if (!(PLANETS[i].period > PLANETS[i - 1].period)) errors.push(`公転周期順エラー:${PLANETS[i - 1].key}->${PLANETS[i].key}`);
  }

  for (const p of PLANETS) {
    if (p.radius <= 0) errors.push(`半径不正:${p.key}`);
    if (p.distance <= 0) errors.push(`距離不正:${p.key}`);
    if (p.period <= 0) errors.push(`周期不正:${p.key}`);
  }

  for (const m of MOONS) {
    if (!PLANETS.some((p) => p.key === m.parent)) errors.push(`親惑星不明:${m.key}`);
  }

  return { ok: errors.length === 0, errors };
}

function scaledDistance(au, orbitScale) {
  return Math.log2(au + 1) * orbitScale * 3.4;
}

function scaledRadius(earthRadius, planetScale) {
  return Math.max(0.35, Math.cbrt(earthRadius) * planetScale * 1.8);
}

function createProceduralTexture(kind, baseColor) {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);

  if (kind === 'jupiter') {
    for (let y = 0; y < size; y += 8) {
      const alpha = 0.08 + Math.random() * 0.22;
      const sat = 155 + Math.floor(Math.random() * 40);
      ctx.fillStyle = `rgba(${sat},${125 + Math.floor(Math.random() * 35)},${90 + Math.floor(Math.random() * 20)},${alpha})`;
      ctx.fillRect(0, y, size, 6 + Math.random() * 8);
    }
    ctx.fillStyle = 'rgba(165, 80, 62, 0.45)';
    ctx.beginPath();
    ctx.ellipse(size * 0.68, size * 0.58, size * 0.13, size * 0.09, -0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  if (kind === 'earth') {
    ctx.fillStyle = 'rgba(65,145,88,0.85)';
    for (let i = 0; i < 18; i += 1) {
      ctx.beginPath();
      ctx.ellipse(Math.random() * size, Math.random() * size, 22 + Math.random() * 46, 10 + Math.random() * 24, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.38)';
    for (let i = 0; i < 40; i += 1) {
      ctx.beginPath();
      ctx.ellipse(Math.random() * size, Math.random() * size, 12 + Math.random() * 42, 3 + Math.random() * 12, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (kind === 'neptune') {
    ctx.fillStyle = 'rgba(35,54,112,0.42)';
    ctx.beginPath();
    ctx.ellipse(size * 0.58, size * 0.42, size * 0.12, size * 0.08, 0.6, 0, Math.PI * 2);
    ctx.fill();
  }

  if (kind === 'sun') {
    const g = ctx.createRadialGradient(size * 0.5, size * 0.5, size * 0.04, size * 0.5, size * 0.5, size * 0.48);
    g.addColorStop(0, 'rgba(255,248,200,1)');
    g.addColorStop(1, 'rgba(255,170,80,1)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 320; i += 1) {
      const alpha = 0.03 + Math.random() * 0.06;
      ctx.fillStyle = `rgba(255, 120, 40, ${alpha})`;
      ctx.beginPath();
      ctx.arc(Math.random() * size, Math.random() * size, 3 + Math.random() * 16, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createSpaceBackdropTexture() {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const bg = ctx.createLinearGradient(0, 0, size, size);
  bg.addColorStop(0, '#04070f');
  bg.addColorStop(1, '#0a1331');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 180; i += 1) {
    ctx.fillStyle = `rgba(${90 + Math.floor(Math.random() * 110)}, ${80 + Math.floor(Math.random() * 80)}, ${160 + Math.floor(Math.random() * 95)}, ${0.04 + Math.random() * 0.08})`;
    ctx.beginPath();
    ctx.ellipse(Math.random() * size, Math.random() * size, 70 + Math.random() * 220, 22 + Math.random() * 84, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalCompositeOperation = 'multiply';
  for (let i = 0; i < 70; i += 1) {
    ctx.fillStyle = `rgba(20,20,45,${0.08 + Math.random() * 0.16})`;
    ctx.beginPath();
    ctx.ellipse(Math.random() * size, Math.random() * size, 80 + Math.random() * 170, 40 + Math.random() * 120, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = 'rgba(180, 200, 255, 0.08)';
  ctx.save();
  ctx.translate(size * 0.5, size * 0.5);
  ctx.rotate(-0.25);
  ctx.fillRect(-size * 0.65, -22, size * 1.3, 44);
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function SpaceBackdrop() {
  const { scene } = useThree();
  useEffect(() => {
    const tex = createSpaceBackdropTexture();
    scene.background = tex;
    return () => {
      if (tex) tex.dispose();
    };
  }, [scene]);
  return null;
}

function StarBackgroundLayer({ count, radius, opacity, size, rotSpeed }) {
  const ref = useRef(null);
  const data = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const r = radius + Math.random() * radius * 0.42;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(ph) * Math.cos(th);
      arr[i * 3 + 1] = r * Math.cos(ph);
      arr[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
    }
    return arr;
  }, [count, radius]);

  useFrame((_, d) => {
    if (!ref.current) return;
    ref.current.rotation.y += d * rotSpeed;
    ref.current.rotation.x += d * (rotSpeed * 0.25);
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={data} count={data.length / 3} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#c8d8ff" size={size} sizeAttenuation transparent opacity={opacity} depthWrite={false} />
    </points>
  );
}

function MilkyBand() {
  return (
    <mesh rotation={[0.23, 0.4, 0.9]}>
      <torusGeometry args={[920, 180, 44, 280]} />
      <meshBasicMaterial color="#7f95d8" transparent opacity={0.08} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  );
}

function OrbitRings({ orbitScale, highlightTarget }) {
  return (
    <group>
      {PLANETS.map((p) => {
        const h = highlightTarget === p.key;
        return (
          <mesh key={`orbit-${p.key}`} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[scaledDistance(p.distance, orbitScale) - 0.07, scaledDistance(p.distance, orbitScale) + 0.07, 180]} />
            <meshBasicMaterial color={h ? '#a9c7ff' : '#7d8eb8'} transparent opacity={h ? 0.55 : 0.18} side={THREE.DoubleSide} />
          </mesh>
        );
      })}
    </group>
  );
}

function AsteroidBelt({ orbitScale }) {
  const ref = useRef(null);
  const positions = useMemo(() => {
    const count = 2400;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const distAu = 2.05 + Math.random() * 1.45;
      const r = scaledDistance(distAu, orbitScale);
      const a = Math.random() * Math.PI * 2;
      arr[i * 3] = Math.cos(a) * r + (Math.random() - 0.5) * 1.8;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 1.5;
      arr[i * 3 + 2] = Math.sin(a) * r + (Math.random() - 0.5) * 1.8;
    }
    return arr;
  }, [orbitScale]);

  useFrame((_, d) => {
    if (ref.current) ref.current.rotation.y += d * 0.012;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={positions.length / 3} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#8d8f97" size={0.7} sizeAttenuation transparent opacity={0.82} depthWrite={false} />
    </points>
  );
}

function SolarFlares({ radius }) {
  const ref = useRef(null);
  const positions = useMemo(() => {
    const count = 900;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const r = radius * (1.06 + Math.random() * 0.28);
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(ph) * Math.cos(th);
      arr[i * 3 + 1] = r * Math.cos(ph);
      arr[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
    }
    return arr;
  }, [radius]);

  useFrame((_, d) => {
    if (!ref.current) return;
    ref.current.rotation.y += d * 0.06;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={positions.length / 3} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#ffb56d" size={0.95} sizeAttenuation transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}

function SolarCorona({ radius }) {
  const inner = useRef(null);
  const outer = useRef(null);

  useFrame((state, d) => {
    const pulse = 0.72 + Math.sin(state.clock.elapsedTime * 1.3) * 0.15;
    if (inner.current) {
      inner.current.rotation.y += d * 0.14;
      inner.current.material.opacity = pulse * 0.28;
    }
    if (outer.current) {
      outer.current.rotation.x += d * 0.06;
      outer.current.material.opacity = pulse * 0.14;
    }
  });

  return (
    <>
      <mesh ref={inner}>
        <sphereGeometry args={[radius * 1.27, 64, 64]} />
        <meshBasicMaterial color="#ffd6a2" transparent opacity={0.24} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.BackSide} />
      </mesh>
      <mesh ref={outer}>
        <sphereGeometry args={[radius * 1.68, 64, 64]} />
        <meshBasicMaterial color="#ffb66d" transparent opacity={0.13} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.BackSide} />
      </mesh>
    </>
  );
}

function CometsAndMeteors() {
  const cometRef = useRef(null);
  const meteorRef = useRef(null);

  const cometData = useMemo(() => {
    const count = 10;
    const line = new Float32Array(count * 12);
    const seed = Array.from({ length: count }, () => ({
      origin: new THREE.Vector3((Math.random() - 0.5) * 420, (Math.random() - 0.5) * 160, (Math.random() - 0.5) * 420),
      dir: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.2, Math.random() - 0.5).normalize(),
      speed: 0.5 + Math.random() * 1.8,
      phase: Math.random() * Math.PI * 2,
    }));
    return { count, line, seed };
  }, []);

  const meteorData = useMemo(() => {
    const count = 44;
    const line = new Float32Array(count * 6);
    const seed = Array.from({ length: count }, () => ({
      angle: Math.random() * Math.PI * 2,
      radius: 130 + Math.random() * 260,
      speed: 1.8 + Math.random() * 5.2,
      phase: Math.random() * Math.PI * 2,
    }));
    return { count, line, seed };
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    for (let i = 0; i < cometData.count; i += 1) {
      const s = cometData.seed[i];
      const progress = ((t * s.speed + s.phase) % 1 + 1) % 1;
      const travel = progress * 560 - 280;
      const head = s.origin.clone().addScaledVector(s.dir, travel);
      const ionTail = head.clone().addScaledVector(s.dir, -36);
      const dustTail = head.clone().addScaledVector(s.dir, -20).add(new THREE.Vector3(0, -8, 0));

      const idx = i * 12;
      cometData.line[idx + 0] = ionTail.x;
      cometData.line[idx + 1] = ionTail.y;
      cometData.line[idx + 2] = ionTail.z;
      cometData.line[idx + 3] = head.x;
      cometData.line[idx + 4] = head.y;
      cometData.line[idx + 5] = head.z;
      cometData.line[idx + 6] = dustTail.x;
      cometData.line[idx + 7] = dustTail.y;
      cometData.line[idx + 8] = dustTail.z;
      cometData.line[idx + 9] = head.x;
      cometData.line[idx + 10] = head.y;
      cometData.line[idx + 11] = head.z;
    }

    for (let i = 0; i < meteorData.count; i += 1) {
      const s = meteorData.seed[i];
      const p = ((t * s.speed + s.phase) % 1 + 1) % 1;
      const a = s.angle + p * Math.PI * 2;
      const r = s.radius;
      const head = new THREE.Vector3(Math.cos(a) * r, Math.sin(a * 1.7) * 20, Math.sin(a) * r);
      const tail = head.clone().multiplyScalar(0.92);

      const idx = i * 6;
      meteorData.line[idx + 0] = tail.x;
      meteorData.line[idx + 1] = tail.y;
      meteorData.line[idx + 2] = tail.z;
      meteorData.line[idx + 3] = head.x;
      meteorData.line[idx + 4] = head.y;
      meteorData.line[idx + 5] = head.z;
    }

    if (cometRef.current) cometRef.current.geometry.attributes.position.needsUpdate = true;
    if (meteorRef.current) meteorRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <>
      <lineSegments ref={cometRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" array={cometData.line} count={cometData.line.length / 3} itemSize={3} />
        </bufferGeometry>
        <lineBasicMaterial color="#9bc8ff" transparent opacity={0.68} blending={THREE.AdditiveBlending} />
      </lineSegments>

      <lineSegments ref={meteorRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" array={meteorData.line} count={meteorData.line.length / 3} itemSize={3} />
        </bufferGeometry>
        <lineBasicMaterial color="#f2d0b3" transparent opacity={0.26} blending={THREE.AdditiveBlending} />
      </lineSegments>
    </>
  );
}

function SolarBodies({ params, onPlanetPositions }) {
  const groupRef = useRef(null);
  const planetRefs = useRef(new Map());
  const moonRefs = useRef(new Map());
  const sunRef = useRef(null);
  const sunTexture = useMemo(() => createProceduralTexture('sun', '#ffbf72'), []);
  const jupiterTexture = useMemo(() => createProceduralTexture('jupiter', '#b78f69'), []);
  const earthTexture = useMemo(() => createProceduralTexture('earth', '#1f5eaf'), []);
  const neptuneTexture = useMemo(() => createProceduralTexture('neptune', '#3155a8'), []);

  const sunRadius = 6.8 * params.planetScale;

  useEffect(() => {
    return () => {
      sunTexture?.dispose?.();
      jupiterTexture?.dispose?.();
      earthTexture?.dispose?.();
      neptuneTexture?.dispose?.();
    };
  }, [sunTexture, jupiterTexture, earthTexture, neptuneTexture]);

  useFrame((state, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.0028;
    if (sunRef.current) {
      sunRef.current.rotation.y += delta * 0.06;
      sunRef.current.rotation.x += delta * 0.02;
      sunRef.current.material.emissiveIntensity = 1.25 + Math.sin(state.clock.elapsedTime * 1.1) * 0.1;
    }

    const tDays = state.clock.elapsedTime * 10 * params.timeScale;
    const localPositions = {};
    const positions = {};
    const worldPos = new THREE.Vector3();

    if (sunRef.current) {
      sunRef.current.updateWorldMatrix(true, false);
      sunRef.current.getWorldPosition(worldPos);
      positions.sun = worldPos.clone();
    }

    for (const p of PLANETS) {
      const ref = planetRefs.current.get(p.key);
      if (!ref) continue;

      const baseR = scaledDistance(p.distance, params.orbitScale);
      const angle = (tDays / p.period) * Math.PI * 2 + p.phase;
      const inc = THREE.MathUtils.degToRad(p.inclination);

      const x = Math.cos(angle) * baseR;
      const z = Math.sin(angle) * baseR;
      const y = Math.sin(angle * 1.7) * Math.sin(inc) * baseR * 0.07;

      ref.position.set(x, y, z);
      ref.rotation.y += delta * (0.5 + p.radius * 0.03);
      localPositions[p.key] = new THREE.Vector3(x, y, z);
    }

    for (const m of MOONS) {
      const ref = moonRefs.current.get(m.key);
      const parent = localPositions[m.parent];
      if (!ref || !parent || !params.showMoons) continue;

      const dist = scaledDistance(m.distance * 12, params.orbitScale) * 0.22;
      const ang = (tDays / m.period) * Math.PI * 2 + m.phase;
      ref.position.set(parent.x + Math.cos(ang) * dist, parent.y + Math.sin(ang * 1.2) * dist * 0.2, parent.z + Math.sin(ang) * dist);
      ref.rotation.y += delta * 1.3;
    }

    for (const p of PLANETS) {
      const ref = planetRefs.current.get(p.key);
      if (!ref) continue;
      ref.updateWorldMatrix(true, false);
      ref.getWorldPosition(worldPos);
      positions[p.key] = worldPos.clone();
    }

    if (params.showMoons) {
      for (const m of MOONS) {
        const ref = moonRefs.current.get(m.key);
        if (!ref) continue;
        ref.updateWorldMatrix(true, false);
        ref.getWorldPosition(worldPos);
        positions[m.key] = worldPos.clone();
      }
    }

    if (onPlanetPositions) onPlanetPositions(positions);
  });

  return (
    <group ref={groupRef}>
      <mesh ref={sunRef} position={[0, 0, 0]}>
        <sphereGeometry args={[sunRadius, 64, 64]} />
        <meshStandardMaterial map={sunTexture} color="#ffd88a" emissive="#ffad54" emissiveIntensity={1.22} roughness={0.55} metalness={0.04} />
      </mesh>

      <SolarCorona radius={sunRadius} />
      <SolarFlares radius={sunRadius} />

      {PLANETS.map((p) => {
        const r = scaledRadius(p.radius, params.planetScale);
        const map = p.key === 'jupiter' ? jupiterTexture : p.key === 'earth' ? earthTexture : p.key === 'neptune' ? neptuneTexture : null;
        return (
          <group key={p.key} ref={(node) => node && planetRefs.current.set(p.key, node)}>
            <mesh>
              <sphereGeometry args={[r, 36, 36]} />
              <meshStandardMaterial map={map || undefined} color={p.color} emissive={p.color} emissiveIntensity={0.18} roughness={0.9} metalness={0.05} />
            </mesh>

            {(p.key === 'earth' || p.key === 'venus' || p.key === 'mars' || p.key === 'neptune') && (
              <mesh>
                <sphereGeometry args={[r * 1.06, 30, 30]} />
                <meshBasicMaterial color={p.key === 'earth' ? '#8ec8ff' : p.key === 'venus' ? '#d5bb8e' : '#8ea3d4'} transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} />
              </mesh>
            )}

            {p.key === 'earth' && (
              <mesh>
                <sphereGeometry args={[r * 1.02, 30, 30]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.17} blending={THREE.AdditiveBlending} depthWrite={false} />
              </mesh>
            )}

            {p.key === 'saturn' && (
              <>
                <mesh rotation={[1.25, 0, 0]}>
                  <ringGeometry args={[r * 1.34, r * 1.86, 120]} />
                  <meshBasicMaterial color="#d8c892" side={THREE.DoubleSide} transparent opacity={0.42} />
                </mesh>
                <mesh rotation={[1.25, 0, 0]}>
                  <ringGeometry args={[r * 1.98, r * 2.34, 120]} />
                  <meshBasicMaterial color="#ceb786" side={THREE.DoubleSide} transparent opacity={0.32} />
                </mesh>
              </>
            )}

            {params.showLabels && (
              <Html position={[0, r + 0.95, 0]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
                <span style={{ color: '#dbe8ff', fontSize: '11px', textShadow: '0 0 8px rgba(0,0,0,0.8)' }}>{p.name}</span>
              </Html>
            )}
          </group>
        );
      })}

      {params.showMoons &&
        MOONS.map((m) => {
          const r = scaledRadius(m.radius, params.planetScale) * 0.55;
          return (
            <group key={m.key} ref={(node) => node && moonRefs.current.set(m.key, node)}>
              <mesh>
                <sphereGeometry args={[r, 20, 20]} />
                <meshStandardMaterial color={m.color} emissive={m.color} emissiveIntensity={0.08} roughness={1} metalness={0} />
              </mesh>
            </group>
          );
        })}
    </group>
  );
}

function CameraDirector({ params, planetPositions }) {
  const { camera } = useThree();

  useFrame(() => {
    const targetName = params.focusTarget;
    if (!targetName || targetName === 'free') return;

    const target = planetPositions.current[targetName];
    if (!target) return;

    const desired = target.clone().add(new THREE.Vector3(params.cameraDistance * 0.45, params.cameraDistance * 0.2, params.cameraDistance * 0.56));
    camera.position.lerp(desired, 0.03);
    camera.lookAt(target);
  });

  return null;
}

function SceneContent({ params, buildVersion, onStats }) {
  const planetPositions = useRef({});
  const verification = useMemo(() => verifySolarData(), []);

  useEffect(() => {
    if (onStats) onStats((prev) => ({ ...prev, checks: verification.ok ? 'OK' : verification.errors.join(', ') }));
  }, [onStats, verification]);

  const perf = useRef({ acc: 0, frames: 0 });
  useFrame((state, delta) => {
    perf.current.acc += delta;
    perf.current.frames += 1;
    if (perf.current.acc >= 0.5) {
      const fps = Math.round(perf.current.frames / perf.current.acc);
      const renderer = state.gl?.isWebGPURenderer ? 'WebGPU' : 'WebGL';
      if (onStats) onStats((prev) => ({ ...prev, fps, renderer }));
      perf.current.acc = 0;
      perf.current.frames = 0;
    }
  });

  return (
    <>
      <SpaceBackdrop />

      <ambientLight intensity={0.22} />
      <pointLight position={[0, 0, 0]} intensity={2.35} distance={1900} decay={1.9} color="#ffd8aa" />
      <pointLight position={[0, 0, 0]} intensity={0.7} distance={2400} decay={1.1} color="#ffefcf" />

      <StarBackgroundLayer key={`stars-a-${buildVersion}`} count={1300 + Math.floor(params.starField * 1400)} radius={800} opacity={0.56} size={1.15} rotSpeed={0.0014} />
      <StarBackgroundLayer key={`stars-b-${buildVersion}`} count={900 + Math.floor(params.starField * 1300)} radius={1220} opacity={0.34} size={1.55} rotSpeed={0.0007} />
      <StarBackgroundLayer key={`stars-c-${buildVersion}`} count={700 + Math.floor(params.starField * 900)} radius={1680} opacity={0.22} size={1.9} rotSpeed={0.00025} />
      <MilkyBand />

      {params.showOrbits && <OrbitRings orbitScale={params.orbitScale} highlightTarget={params.focusTarget} />}
      {params.showAsteroidBelt && <AsteroidBelt orbitScale={params.orbitScale} key={`belt-${buildVersion}`} />}

      <SolarBodies
        params={params}
        key={`bodies-${buildVersion}-${params.planetScale}-${params.orbitScale}`}
        onPlanetPositions={(positions) => {
          planetPositions.current = positions;
        }}
      />

      <CometsAndMeteors />
      <CameraDirector params={params} planetPositions={planetPositions} />

      <EffectComposer>
        <Bloom intensity={params.bloomIntensity} luminanceThreshold={0.08} luminanceSmoothing={0.63} blendFunction={BlendFunction.SCREEN} />
        <HueSaturation saturation={params.saturation} />
        {params.renderStyle === 'clean' && (
          <>
            <Noise premultiply opacity={0.014} />
            <ChromaticAberration offset={[0.0007, 0.0005]} />
            <Vignette eskil={false} offset={0.28} darkness={0.72} />
          </>
        )}
        {params.renderStyle === 'pixel' && <Pixelation granularity={6} />}
      </EffectComposer>

      <OrbitControls
        enabled={params.cameraControl && params.focusTarget === 'free'}
        enablePan={false}
        minDistance={30}
        maxDistance={420}
        autoRotate
        autoRotateSpeed={params.autoRotateSpeed}
      />
    </>
  );
}

export default function CosmosScene({ params, buildVersion, onStats }) {
  const webgpuAvailable = WebGPU.isAvailable();
  const pixelMode = params.renderStyle === 'pixel';

  return (
    <Canvas
      className="h-full w-full"
      camera={{ position: [0, 55, params.cameraDistance], fov: 48, near: 0.1, far: 6000 }}
      dpr={pixelMode ? [0.65, 0.92] : [1, 1.8]}
      gl={async (props) => {
        if (webgpuAvailable) {
          try {
            const renderer = new WebGPURenderer({ antialias: !pixelMode, alpha: true, canvas: props.canvas });
            await renderer.init();
            renderer.setSize(props.size.width, props.size.height);
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = params.exposure;
            renderer.outputColorSpace = THREE.SRGBColorSpace;
            return renderer;
          } catch {
            // Fallback below
          }
        }

        const fallback = new THREE.WebGLRenderer({ antialias: !pixelMode, alpha: true, canvas: props.canvas });
        fallback.toneMapping = THREE.ACESFilmicToneMapping;
        fallback.toneMappingExposure = params.exposure;
        fallback.outputColorSpace = THREE.SRGBColorSpace;
        return fallback;
      }}
    >
      <SceneContent params={params} buildVersion={buildVersion} onStats={onStats} />
    </Canvas>
  );
}
