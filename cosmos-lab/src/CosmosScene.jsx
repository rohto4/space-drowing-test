import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import {
  BrightnessContrast,
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
import { computeSpaceFxState } from './spaceFxState';

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

function BackgroundParallaxShell({ speed = 0.5, depth = 0.4 }) {
  const ref = useRef(null);
  const tex = useMemo(() => createSpaceBackdropTexture(), []);
  useEffect(() => {
    return () => tex?.dispose?.();
  }, [tex]);

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.006 * speed;
    ref.current.rotation.z += delta * 0.002 * speed;
  });

  return (
    <mesh ref={ref} scale={[1 + depth * 0.25, 1 + depth * 0.25, 1 + depth * 0.25]}>
      <sphereGeometry args={[2400, 48, 48]} />
      <meshBasicMaterial map={tex || undefined} side={THREE.BackSide} transparent opacity={0.06 + depth * 0.1} depthWrite={false} />
    </mesh>
  );
}

function StarBackgroundLayer({ count, maxCount, radius, opacity, size, rotSpeed, twinkleIntensity = 0, twinkleSpeed = 1 }) {
  const ref = useRef(null);
  const matRef = useRef(null);
  const data = useMemo(() => {
    const arr = new Float32Array(maxCount * 3);
    for (let i = 0; i < maxCount; i += 1) {
      const r = radius + Math.random() * radius * 0.42;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(ph) * Math.cos(th);
      arr[i * 3 + 1] = r * Math.cos(ph);
      arr[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
    }
    return arr;
  }, [maxCount, radius]);

  useEffect(() => {
    if (!ref.current) return;
    const active = Math.min(maxCount, Math.max(1, Math.floor(count)));
    ref.current.geometry.setDrawRange(0, active);
  }, [count, maxCount]);

  useFrame((state, d) => {
    if (!ref.current) return;
    ref.current.rotation.y += d * rotSpeed;
    ref.current.rotation.x += d * (rotSpeed * 0.25);
    if (matRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * Math.max(0.01, twinkleSpeed)) * twinkleIntensity * 0.45;
      matRef.current.opacity = THREE.MathUtils.clamp(opacity * pulse, 0.02, 1);
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={data} count={data.length / 3} itemSize={3} usage={THREE.DynamicDrawUsage} />
      </bufferGeometry>
      <pointsMaterial ref={matRef} color="#c8d8ff" size={size} sizeAttenuation transparent opacity={opacity} depthWrite={false} />
    </points>
  );
}

function MilkyBand({ opacity = 0.08 }) {
  return (
    <mesh rotation={[0.23, 0.4, 0.9]}>
      <torusGeometry args={[920, 180, 44, 280]} />
      <meshBasicMaterial color="#7f95d8" transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  );
}

function NebulaClouds({ intensity, speed, hueShift }) {
  const g1 = useRef(null);
  const g2 = useRef(null);
  const color = useMemo(() => {
    const c = new THREE.Color('#6b56d8');
    c.offsetHSL(hueShift, 0.05, 0);
    return c;
  }, [hueShift]);

  useFrame((state, delta) => {
    if (g1.current) {
      g1.current.rotation.y += delta * (0.012 + speed * 0.018);
      g1.current.rotation.z += delta * 0.006;
      g1.current.material.opacity = 0.08 + intensity * 0.18 + Math.sin(state.clock.elapsedTime * (0.6 + speed)) * 0.03;
    }
    if (g2.current) {
      g2.current.rotation.y -= delta * (0.009 + speed * 0.014);
      g2.current.rotation.x += delta * 0.004;
      g2.current.material.opacity = 0.04 + intensity * 0.11;
    }
  });

  return (
    <>
      <mesh ref={g1} rotation={[0.2, 0, 0.1]}>
        <torusGeometry args={[680, 260, 28, 180]} />
        <meshBasicMaterial color={color} transparent opacity={0.16} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh ref={g2} rotation={[-0.35, 0.8, 0.2]}>
        <torusGeometry args={[1040, 360, 22, 160]} />
        <meshBasicMaterial color="#4f5fc4" transparent opacity={0.1} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </>
  );
}

function AuroraCurtains({ enabled, intensity }) {
  const ref = useRef(null);
  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.025;
    ref.current.position.y = 30 + Math.sin(state.clock.elapsedTime * 0.5) * 8;
  });

  if (!enabled) return null;
  return (
    <group ref={ref}>
      <mesh rotation={[Math.PI / 2, 0.4, 0.1]} position={[0, 30, -180]}>
        <ringGeometry args={[180, 260, 140]} />
        <meshBasicMaterial color="#8ec7ff" transparent opacity={0.06 + intensity * 0.18} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh rotation={[Math.PI / 2, -0.1, -0.3]} position={[0, 40, 120]}>
        <ringGeometry args={[220, 300, 140]} />
        <meshBasicMaterial color="#b19cff" transparent opacity={0.04 + intensity * 0.14} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}

function OrbitRings({ orbitScale, highlightTarget, pulseEnabled = false, pulseSpeed = 0.8, pulseStrength = 0.4, thickness = 0.07, baseOpacity = 0.2 }) {
  const groupRef = useRef(null);
  useFrame((state) => {
    if (!groupRef.current || !pulseEnabled) return;
    const pulse = 1 + Math.sin(state.clock.elapsedTime * pulseSpeed) * pulseStrength * 0.1;
    groupRef.current.scale.setScalar(pulse);
  });

  return (
    <group ref={groupRef}>
      {PLANETS.map((p) => {
        const h = highlightTarget === p.key;
        return (
          <mesh key={`orbit-${p.key}`} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[scaledDistance(p.distance, orbitScale) - thickness, scaledDistance(p.distance, orbitScale) + thickness, 180]} />
            <meshBasicMaterial color={h ? '#a9c7ff' : '#7d8eb8'} transparent opacity={h ? Math.min(0.85, baseOpacity + 0.28) : baseOpacity} side={THREE.DoubleSide} />
          </mesh>
        );
      })}
    </group>
  );
}

function AsteroidBelt({ orbitScale, size = 0.7, speed = 0.012 }) {
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
    if (ref.current) ref.current.rotation.y += d * speed;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={positions.length / 3} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#8d8f97" size={size} sizeAttenuation transparent opacity={0.82} depthWrite={false} />
    </points>
  );
}

function DustCloudLayer({ enabled, density }) {
  const ref = useRef(null);
  const positions = useMemo(() => {
    const count = 1200;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      arr[i * 3] = (Math.random() - 0.5) * 1500;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 220;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 1500;
    }
    return arr;
  }, []);

  useFrame((_, d) => {
    if (ref.current) ref.current.rotation.y += d * 0.0045;
  });

  if (!enabled) return null;
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={positions.length / 3} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#b9b2c8" size={2.8} sizeAttenuation transparent opacity={0.05 + density * 0.17} depthWrite={false} />
    </points>
  );
}

function SolarWindField({ enabled, speed, density, radius = 40 }) {
  const ref = useRef(null);
  const MAX_COUNT = 1200;
  const count = Math.max(120, Math.floor(120 + density * 900));
  const positions = useMemo(() => {
    const arr = new Float32Array(MAX_COUNT * 3);
    for (let i = 0; i < MAX_COUNT; i += 1) {
      const r = 10 + Math.random() * radius;
      const a = Math.random() * Math.PI * 2;
      const h = (Math.random() - 0.5) * 8;
      arr[i * 3] = Math.cos(a) * r;
      arr[i * 3 + 1] = h;
      arr[i * 3 + 2] = Math.sin(a) * r;
    }
    return arr;
  }, [radius]);

  useEffect(() => {
    if (!ref.current) return;
    const active = Math.min(MAX_COUNT, Math.max(1, count));
    ref.current.geometry.setDrawRange(0, active);
  }, [count]);

  useFrame((state) => {
    if (!enabled || !ref.current) return;
    const arr = ref.current.geometry.attributes.position.array;
    const t = state.clock.elapsedTime;
    const active = Math.min(MAX_COUNT, Math.max(1, count));
    for (let i = 0; i < active; i += 1) {
      const idx = i * 3;
      const x = arr[idx];
      const z = arr[idx + 2];
      const len = Math.max(0.001, Math.sqrt(x * x + z * z));
      const nx = x / len;
      const nz = z / len;
      arr[idx] += nx * speed * 0.08;
      arr[idx + 2] += nz * speed * 0.08;
      arr[idx + 1] += Math.sin(t + i * 0.13) * 0.002;
      if (Math.abs(arr[idx]) > 240 || Math.abs(arr[idx + 2]) > 240) {
        arr[idx] = -nx * (18 + Math.random() * 40);
        arr[idx + 2] = -nz * (18 + Math.random() * 40);
      }
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  if (!enabled) return null;
  return (
    <points ref={ref}>
        <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={positions.length / 3} itemSize={3} usage={THREE.DynamicDrawUsage} />
      </bufferGeometry>
      <pointsMaterial color="#ffd7a3" size={0.9} transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

function LensDustParticles({ enabled, intensity }) {
  const ref = useRef(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(420 * 3);
    for (let i = 0; i < 420; i += 1) {
      arr[i * 3] = (Math.random() - 0.5) * 320;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 180;
      arr[i * 3 + 2] = -120 + Math.random() * 180;
    }
    return arr;
  }, []);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.z += delta * 0.01;
  });

  if (!enabled) return null;
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={positions.length / 3} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#ffe7ba" size={1.8} transparent opacity={0.03 + intensity * 0.12} depthWrite={false} />
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

function SolarCorona({ radius, speed = 1, pulseStrength = 0.1 }) {
  const inner = useRef(null);
  const outer = useRef(null);

  useFrame((state, d) => {
    const pulse = 0.72 + Math.sin(state.clock.elapsedTime * 1.3 * speed) * (0.07 + pulseStrength * 0.22);
    if (inner.current) {
      inner.current.rotation.y += d * 0.14 * speed;
      inner.current.material.opacity = pulse * 0.28;
    }
    if (outer.current) {
      outer.current.rotation.x += d * 0.06 * speed;
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

function CometsAndMeteors({
  cometCount = 10,
  cometSpeed = 1,
  meteorCount = 44,
  meteorSpeed = 1,
  warpEnabled = true,
  warpSpeed = 1,
  warpDensity = 0.5,
}) {
  const cometRef = useRef(null);
  const meteorRef = useRef(null);
  const MAX_COMETS = 32;
  const MAX_METEORS = 160;

  const cometData = useMemo(() => {
    const line = new Float32Array(MAX_COMETS * 12);
    const seed = Array.from({ length: MAX_COMETS }, () => ({
      origin: new THREE.Vector3((Math.random() - 0.5) * 420, (Math.random() - 0.5) * 160, (Math.random() - 0.5) * 420),
      dir: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.2, Math.random() - 0.5).normalize(),
      speed: 0.5 + Math.random() * 1.8,
      phase: Math.random() * Math.PI * 2,
    }));
    return { line, seed };
  }, []);

  const meteorData = useMemo(() => {
    const line = new Float32Array(MAX_METEORS * 6);
    const seed = Array.from({ length: MAX_METEORS }, () => ({
      angle: Math.random() * Math.PI * 2,
      radius: 130 + Math.random() * 260,
      speed: 1.8 + Math.random() * 5.2,
      phase: Math.random() * Math.PI * 2,
    }));
    return { line, seed };
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const activeComets = Math.min(MAX_COMETS, Math.max(0, Math.floor(cometCount)));
    const baseMeteors = Math.max(0, Math.floor(meteorCount));
    const activeMeteors = Math.min(MAX_METEORS, warpEnabled ? Math.max(0, Math.floor(baseMeteors * (1 + warpDensity * 1.4))) : baseMeteors);

    for (let i = 0; i < activeComets; i += 1) {
      const s = cometData.seed[i];
      const progress = ((t * s.speed * cometSpeed + s.phase) % 1 + 1) % 1;
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

    for (let i = 0; i < activeMeteors; i += 1) {
      const s = meteorData.seed[i];
      const p = ((t * s.speed * meteorSpeed * (warpEnabled ? warpSpeed : 1) + s.phase) % 1 + 1) % 1;
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

    if (cometRef.current) {
      cometRef.current.geometry.setDrawRange(0, activeComets * 4);
      cometRef.current.geometry.attributes.position.needsUpdate = true;
    }
    if (meteorRef.current) {
      meteorRef.current.geometry.setDrawRange(0, activeMeteors * 2);
      meteorRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <>
      <lineSegments ref={cometRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" array={cometData.line} count={cometData.line.length / 3} itemSize={3} usage={THREE.DynamicDrawUsage} />
        </bufferGeometry>
        <lineBasicMaterial color="#9bc8ff" transparent opacity={0.68} blending={THREE.AdditiveBlending} />
      </lineSegments>

      <lineSegments ref={meteorRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" array={meteorData.line} count={meteorData.line.length / 3} itemSize={3} usage={THREE.DynamicDrawUsage} />
        </bufferGeometry>
        <lineBasicMaterial color="#f2d0b3" transparent opacity={0.16 + (warpEnabled ? warpDensity * 0.32 : 0.1)} blending={THREE.AdditiveBlending} />
      </lineSegments>
    </>
  );
}

function LensFlareHalo({ enabled, intensity, sunRadius }) {
  const ref = useRef(null);
  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.z += delta * 0.06;
    ref.current.material.opacity = 0.06 + intensity * 0.16 + Math.sin(state.clock.elapsedTime * 2.2) * 0.02;
  });

  if (!enabled) return null;
  return (
    <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[sunRadius * 1.9, sunRadius * 3.4, 84]} />
      <meshBasicMaterial color="#ffdca8" transparent opacity={0.16} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
}

function BlackHoleAnomaly({ enabled, strength }) {
  const ref = useRef(null);
  if (!enabled) return null;

  return (
    <group ref={ref} position={[-220, 10, 180]}>
      <mesh>
        <sphereGeometry args={[10 + strength * 14, 48, 48]} />
        <meshBasicMaterial color="#05050d" />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[26 + strength * 24, 1.6 + strength * 1.8, 18, 120]} />
        <meshBasicMaterial color="#84a9ff" transparent opacity={0.2 + strength * 0.22} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

function ShockwaveShells({ enabled, speed }) {
  const aRef = useRef(null);
  const bRef = useRef(null);

  useFrame((state) => {
    if (!enabled) return;
    const t = state.clock.elapsedTime * Math.max(0.1, speed);
    const p1 = (t % 3) / 3;
    const p2 = ((t + 1.5) % 3) / 3;
    if (aRef.current) {
      const s = 1 + p1 * 18;
      aRef.current.scale.setScalar(s);
      aRef.current.material.opacity = (1 - p1) * 0.18;
    }
    if (bRef.current) {
      const s = 1 + p2 * 18;
      bRef.current.scale.setScalar(s);
      bRef.current.material.opacity = (1 - p2) * 0.14;
    }
  });

  if (!enabled) return null;
  return (
    <>
      <mesh ref={aRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[7.5, 8.1, 96]} />
        <meshBasicMaterial color="#9ec5ff" transparent opacity={0.16} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={bRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[7.4, 8.0, 96]} />
        <meshBasicMaterial color="#ffd3a6" transparent opacity={0.12} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </mesh>
    </>
  );
}

function SolarBodies({ params, fx, onPlanetPositions }) {
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
      sunRef.current.material.emissiveIntensity = 1.22 + Math.sin(state.clock.elapsedTime * 1.1 * fx.sunCoronaSpeed) * fx.sunPulseStrength;
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

      const dist = scaledDistance(m.distance * 12, params.orbitScale) * 0.22 * fx.moonOrbitBoost;
      const ang = (tDays / m.period) * Math.PI * 2 + m.phase;
      ref.position.set(parent.x + Math.cos(ang) * dist, parent.y + Math.sin(ang * 1.2) * dist * 0.2, parent.z + Math.sin(ang) * dist);
      ref.rotation.y += delta * (1.3 * fx.moonOrbitBoost);
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

      <SolarCorona radius={sunRadius} speed={fx.sunCoronaSpeed} pulseStrength={fx.sunPulseStrength} />
      <SolarFlares radius={sunRadius} />
      <LensFlareHalo enabled={fx.lensFlareEnabled} intensity={params.bloomIntensity} sunRadius={sunRadius} />

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
                <meshBasicMaterial
                  color={p.key === 'earth' ? '#8ec8ff' : p.key === 'venus' ? '#d5bb8e' : '#8ea3d4'}
                  transparent
                  opacity={0.06 + fx.planetAtmosphereBoost * 0.24}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              </mesh>
            )}

            {p.key === 'earth' && (
              <mesh>
                <sphereGeometry args={[r * 1.02, 30, 30]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.08 + fx.planetAtmosphereBoost * 0.2} blending={THREE.AdditiveBlending} depthWrite={false} />
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
                {fx.ringGlowEnabled && (
                  <mesh rotation={[1.25, 0, 0]}>
                    <ringGeometry args={[r * 2.4, r * 2.9, 120]} />
                    <meshBasicMaterial color="#ffe0a7" side={THREE.DoubleSide} transparent opacity={0.06 + fx.ringGlowIntensity * 0.26} blending={THREE.AdditiveBlending} />
                  </mesh>
                )}
              </>
            )}

            {params.showLabels && (
              <Html position={[0, r + 0.95, 0]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
                <span style={{ color: '#dbe8ff', opacity: fx.labelOpacity, fontSize: `${11 * fx.labelScale}px`, textShadow: '0 0 8px rgba(0,0,0,0.8)' }}>{p.name}</span>
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

function CameraDirector({ params, planetPositions, controlsRef, isUserInteractingRef }) {
  const { camera } = useThree();

  useFrame(() => {
    const targetName = params.focusTarget;
    if (!targetName || targetName === 'free') return;

    const target = planetPositions.current[targetName];
    if (!target) return;

    if (controlsRef.current) {
      controlsRef.current.target.lerp(target, 0.16);
      controlsRef.current.update();
    }

    if (!isUserInteractingRef.current) {
      const boost = params.focusTarget === 'free' ? 1 : params.focusTargetBoost;
      const desired = target
        .clone()
        .add(
          new THREE.Vector3(
            params.cameraDistance * params.focusOffsetX * boost,
            params.cameraDistance * params.focusOffsetY * boost,
            params.cameraDistance * params.focusOffsetZ * boost
          )
        );
      camera.position.lerp(desired, params.cameraFollowLerp);
      camera.lookAt(target);
    }
  });

  return null;
}

function SceneContent({ params, buildVersion, onStats }) {
  const planetPositions = useRef({});
  const verification = useMemo(() => verifySolarData(), []);
  const fx = useMemo(() => computeSpaceFxState(params), [params]);
  const controlsRef = useRef(null);
  const isUserInteractingRef = useRef(false);
  const perfBucketRef = useRef(0);
  const [perfScale, setPerfScale] = useState(1);

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
      const nextBucket = fps < 24 ? 2 : fps < 32 ? 1 : 0;
      if (nextBucket !== perfBucketRef.current) {
        perfBucketRef.current = nextBucket;
        setPerfScale(nextBucket === 2 ? 0.56 : nextBucket === 1 ? 0.76 : 1);
      }
      perf.current.acc = 0;
      perf.current.frames = 0;
    }
  });

  return (
    <>
      <SpaceBackdrop />
      <BackgroundParallaxShell speed={fx.backgroundRotationSpeed} depth={fx.parallaxDepth} />

      <ambientLight intensity={fx.ambientGlow} />
      <pointLight position={[0, 0, 0]} intensity={2.35} distance={1900} decay={1.9} color="#ffd8aa" />
      <pointLight position={[0, 0, 0]} intensity={0.7} distance={2400} decay={1.1} color="#ffefcf" />

      <NebulaClouds intensity={fx.nebulaIntensity} speed={fx.nebulaSpeed} hueShift={fx.nebulaHueShift} />
      <SolarWindField enabled={fx.solarWindEnabled} speed={fx.solarWindSpeed} density={fx.solarWindDensity} />
      <StarBackgroundLayer
        key={`stars-a-${buildVersion}`}
        count={Math.floor((1300 + params.starField * 1400) * fx.deepStarMultiplier * perfScale)}
        maxCount={5000}
        radius={800}
        opacity={0.56}
        size={1.15}
        rotSpeed={0.0014}
        twinkleIntensity={fx.twinkleIntensity}
        twinkleSpeed={fx.twinkleSpeed}
      />
      <StarBackgroundLayer
        key={`stars-b-${buildVersion}`}
        count={Math.floor((900 + params.starField * 1300) * fx.deepStarMultiplier * perfScale)}
        maxCount={4200}
        radius={1220}
        opacity={0.34}
        size={1.55}
        rotSpeed={0.0007}
        twinkleIntensity={fx.twinkleIntensity * 0.8}
        twinkleSpeed={fx.twinkleSpeed * 0.8}
      />
      <StarBackgroundLayer
        key={`stars-c-${buildVersion}`}
        count={Math.floor((700 + params.starField * 900) * fx.deepStarMultiplier * perfScale)}
        maxCount={3200}
        radius={1680}
        opacity={0.22}
        size={1.9}
        rotSpeed={0.00025}
        twinkleIntensity={fx.twinkleIntensity * 0.6}
        twinkleSpeed={fx.twinkleSpeed * 0.6}
      />
      <MilkyBand opacity={fx.milkyOpacity} />
      <AuroraCurtains enabled={fx.auroraEnabled} intensity={fx.auroraIntensity} />
      <DustCloudLayer enabled={fx.dustEnabled} density={fx.dustDensity} />
      <LensDustParticles enabled={fx.lensDustEnabled} intensity={fx.lensDustIntensity} />
      <BlackHoleAnomaly enabled={fx.blackHoleEnabled} strength={fx.blackHoleStrength} />

      {params.showOrbits && (
        <OrbitRings
          orbitScale={params.orbitScale}
          highlightTarget={params.focusTarget}
          pulseEnabled={fx.orbitPulseEnabled}
          pulseSpeed={fx.orbitPulseSpeed}
          pulseStrength={fx.orbitPulseStrength}
          thickness={fx.orbitThickness}
          baseOpacity={fx.orbitOpacity}
        />
      )}
      {params.showAsteroidBelt && <AsteroidBelt orbitScale={params.orbitScale} size={fx.asteroidSize} speed={fx.asteroidSpeed} key={`belt-${buildVersion}`} />}

      <SolarBodies
        params={params}
        fx={fx}
        key={`bodies-${buildVersion}-${params.planetScale}-${params.orbitScale}`}
        onPlanetPositions={(positions) => {
          planetPositions.current = positions;
        }}
      />

      <CometsAndMeteors
        cometCount={Math.floor(fx.cometCount * perfScale)}
        cometSpeed={fx.cometSpeed}
        meteorCount={Math.floor(fx.meteorCount * perfScale)}
        meteorSpeed={fx.meteorSpeed}
        warpEnabled={fx.warpStreaksEnabled}
        warpSpeed={fx.warpStreaksSpeed}
        warpDensity={fx.warpStreaksDensity}
      />
      <ShockwaveShells enabled={fx.shockwaveEnabled} speed={fx.shockwaveSpeed} />
      <CameraDirector params={params} planetPositions={planetPositions} controlsRef={controlsRef} isUserInteractingRef={isUserInteractingRef} />

      <EffectComposer>
        <Bloom intensity={params.bloomIntensity} luminanceThreshold={fx.bloomThreshold} luminanceSmoothing={fx.bloomSmoothing} blendFunction={BlendFunction.SCREEN} />
        <HueSaturation saturation={params.saturation} hue={fx.colorTempShift} />
        <BrightnessContrast contrast={fx.contrastBoost} />
        {params.renderStyle === 'clean' && (
          <>
            <Noise premultiply opacity={fx.noiseOpacity} />
            <ChromaticAberration offset={[fx.chromaticBoostX * fx.chromaticIntensity, fx.chromaticBoostY * fx.chromaticIntensity]} />
            <Vignette eskil={false} offset={0.28} darkness={fx.vignetteDarkness} />
          </>
        )}
        {params.renderStyle === 'pixel' && <Pixelation granularity={fx.pixelGranularity} />}
      </EffectComposer>

      <OrbitControls
        ref={controlsRef}
        enabled={params.cameraControl}
        enablePan={false}
        minDistance={30}
        maxDistance={420}
        autoRotate={params.focusTarget === 'free' || fx.autoRotateFocused}
        autoRotateSpeed={params.autoRotateSpeed}
        onStart={() => {
          isUserInteractingRef.current = true;
        }}
        onEnd={() => {
          isUserInteractingRef.current = false;
        }}
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
      dpr={pixelMode ? [0.65, 0.92] : [0.9, 1.45]}
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


