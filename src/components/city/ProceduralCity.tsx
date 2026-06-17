import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";

/**
 * Procedural City Generator
 * ==========================
 * Generates hundreds of background buildings with varied shapes,
 * animated window lights, and faction colors.
 */

export function ProceduralCity({
  seed = 42,
  count = 300,
  radius = 200,
  streetLength = 300,
}: {
  seed?: number;
  count?: number;
  radius?: number;
  streetLength?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const lightMatRef = useRef<THREE.ShaderMaterial>(null);

  const rng = useMemo(() => mulberry32(seed), [seed]);

  const { geometry, windowGeometry, screenGeometry, lightUniforms } = useMemo(() => {
    const buildingPositions: number[] = [];
    const buildingSizes: number[] = [];
    const buildingColors: number[] = [];
    const buildingTypes: number[] = [];

    const windowPositions: number[] = [];
    const windowColors: number[] = [];
    const windowSeeds: number[] = [];

    const screenPositions: number[] = [];
    const screenSizes: number[] = [];
    const screenColors: number[] = [];
    const screenSeeds: number[] = [];

    const FACTION_COLORS: [number, number, number][] = [
      [1.0, 0.1, 0.23],   // Neural Syndicate - red
      [1.0, 0.0, 0.9],    // Agent Collective - magenta
      [1.0, 0.9, 0.2],    // Render Guild - yellow
      [0.0, 0.94, 1.0],   // Data Cartel - cyan
      [1.0, 0.4, 0.0],    // Void Walkers - orange
      [0.2, 0.4, 1.0],    // Quantum Front - blue
      [0.0, 1.0, 0.53],   // Sensory Net - green
    ];

    let winIdx = 0;
    for (let i = 0; i < count; i++) {
      const angle = rng() * Math.PI * 2;
      const dist = 35 + rng() * (radius - 35);
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      // Keep street clear
      if (Math.abs(x) < 18 && Math.abs(z) < streetLength / 2) continue;

      const h = 8 + rng() * 55;
      const w = 3 + rng() * 10;
      const d = 3 + rng() * 10;
      const type = Math.floor(rng() * 4);
      const color = FACTION_COLORS[Math.floor(rng() * FACTION_COLORS.length)];

      buildingPositions.push(x, h / 2, z);
      buildingSizes.push(w, h, d);
      buildingColors.push(color[0], color[1], color[2]);
      buildingTypes.push(type);

      // Add video facade screen for taller buildings
      if (h > 12) {
        const screenH = h * 0.5;
        const screenW = Math.min(w * 1.2, 8);
        screenPositions.push(x, h * 0.45, z + d / 2 + 0.15);
        screenSizes.push(screenW, screenH, 0);
        screenColors.push(color[0], color[1], color[2]);
        screenSeeds.push(rng() * 1000);
      }

      // Add windows for taller buildings
      if (h > 15) {
        const floors = Math.floor(h / 2.5);
        const windowsPerFloor = Math.max(2, Math.floor(w / 2));
        for (let f = 0; f < floors; f++) {
          for (let wx = 0; wx < windowsPerFloor; wx++) {
            if (rng() > 0.7) continue;
            const wxPos = x - w / 2 + (wx + 0.5) * (w / windowsPerFloor);
            const wy = f * 2.5 + 1.5;
            const wz = z + d / 2 + 0.1;
            windowPositions.push(wxPos, wy, wz);
            windowColors.push(color[0], color[1], color[2]);
            windowSeeds.push(rng() * 1000);
            winIdx++;
          }
        }
      }
    }

    // Building geometry - instanced boxes
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const bGeo = new THREE.InstancedBufferGeometry();
    bGeo.index = geo.index;
    bGeo.attributes.position = geo.attributes.position;
    bGeo.attributes.normal = geo.attributes.normal;
    bGeo.attributes.uv = geo.attributes.uv;

    const iPositions = new Float32Array(buildingPositions);
    const iSizes = new Float32Array(buildingSizes);
    const iColors = new Float32Array(buildingColors);
    const iTypes = new Float32Array(buildingTypes);

    bGeo.setAttribute("iPosition", new THREE.InstancedBufferAttribute(iPositions, 3));
    bGeo.setAttribute("iSize", new THREE.InstancedBufferAttribute(iSizes, 3));
    bGeo.setAttribute("iColor", new THREE.InstancedBufferAttribute(iColors, 3));
    bGeo.setAttribute("iType", new THREE.InstancedBufferAttribute(iTypes, 1));
    bGeo.instanceCount = buildingPositions.length / 3;

    // Window geometry
    const wGeo = new THREE.PlaneGeometry(0.4, 0.6);
    const winGeo = new THREE.InstancedBufferGeometry();
    winGeo.index = wGeo.index;
    winGeo.attributes.position = wGeo.attributes.position;
    winGeo.attributes.normal = wGeo.attributes.normal;
    winGeo.attributes.uv = wGeo.attributes.uv;

    const wPositions = new Float32Array(windowPositions);
    const wColors = new Float32Array(windowColors);
    const wSeeds = new Float32Array(windowSeeds);

    winGeo.setAttribute("iPosition", new THREE.InstancedBufferAttribute(wPositions, 3));
    winGeo.setAttribute("iColor", new THREE.InstancedBufferAttribute(wColors, 3));
    winGeo.setAttribute("iSeed", new THREE.InstancedBufferAttribute(wSeeds, 1));
    winGeo.instanceCount = windowPositions.length / 3;

    // Screen geometry (video facade)
    const sGeo = new THREE.PlaneGeometry(1, 1);
    const screenGeo = new THREE.InstancedBufferGeometry();
    screenGeo.index = sGeo.index;
    screenGeo.attributes.position = sGeo.attributes.position;
    screenGeo.attributes.normal = sGeo.attributes.normal;
    screenGeo.attributes.uv = sGeo.attributes.uv;

    const sPositions = new Float32Array(screenPositions);
    const sColors = new Float32Array(screenColors);
    const sSeeds = new Float32Array(screenSeeds);

    screenGeo.setAttribute("iPosition", new THREE.InstancedBufferAttribute(sPositions, 3));
    screenGeo.setAttribute("iSize", new THREE.InstancedBufferAttribute(new Float32Array(screenSizes), 3));
    screenGeo.setAttribute("iColor", new THREE.InstancedBufferAttribute(sColors, 3));
    screenGeo.setAttribute("iSeed", new THREE.InstancedBufferAttribute(sSeeds, 1));
    screenGeo.instanceCount = screenPositions.length / 3;

    const lightUniforms = { uTime: { value: 0 } };

    return {
      geometry: bGeo,
      windowGeometry: winGeo,
      screenGeometry: screenGeo,
      lightUniforms,
    };
  }, [count, radius, streetLength, rng]);

  useFrame((state) => {
    if (lightMatRef.current) {
      lightMatRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={geometry} frustumCulled={false}>
        <shaderMaterial
          vertexShader={buildingVert}
          fragmentShader={buildingFrag}
          transparent
          depthWrite
        />
      </mesh>
      <mesh geometry={windowGeometry} frustumCulled={false}>
        <shaderMaterial
          ref={lightMatRef}
          uniforms={lightUniforms}
          vertexShader={windowVert}
          fragmentShader={windowFrag}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh geometry={screenGeometry} frustumCulled={false}>
        <shaderMaterial
          uniforms={lightUniforms}
          vertexShader={screenVert}
          fragmentShader={screenFrag}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const buildingVert = /* glsl */ `
  attribute vec3 iPosition;
  attribute vec3 iSize;
  attribute vec3 iColor;
  attribute float iType;
  varying vec3 vColor;
  varying float vType;
  varying vec3 vNormal;
  void main() {
    vColor = iColor;
    vType = iType;
    vec3 pos = position * iSize + iPosition;
    vNormal = normal;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const buildingFrag = /* glsl */ `
  varying vec3 vColor;
  varying float vType;
  varying vec3 vNormal;
  void main() {
    vec3 base = vec3(0.02, 0.02, 0.04);
    float light = max(0.0, dot(vNormal, normalize(vec3(0.5, 1.0, 0.3))));
    vec3 col = mix(base, vColor * 0.15, light * 0.5);
    // Slight rim
    float rim = 1.0 - max(0.0, dot(vNormal, vec3(0.0, 0.0, 1.0)));
    col += vColor * rim * 0.08;
    gl_FragColor = vec4(col, 1.0);
  }
`;

const windowVert = /* glsl */ `
  attribute vec3 iPosition;
  attribute vec3 iColor;
  attribute float iSeed;
  varying vec3 vColor;
  varying float vSeed;
  void main() {
    vColor = iColor;
    vSeed = iSeed;
    vec3 pos = position + iPosition;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const windowFrag = /* glsl */ `
  uniform float uTime;
  varying vec3 vColor;
  varying float vSeed;
  void main() {
    float flicker = 0.6 + 0.4 * step(0.3, fract(sin(vSeed * 127.1 + uTime * 2.0) * 43758.5453));
    float pulse = 0.8 + 0.2 * sin(uTime * 3.0 + vSeed);
    float alpha = flicker * pulse;
    gl_FragColor = vec4(vColor * alpha * 2.0, alpha);
  }
`;

const screenVert = /* glsl */ `
  attribute vec3 iPosition;
  attribute vec3 iSize;
  attribute vec3 iColor;
  attribute float iSeed;
  varying vec3 vColor;
  varying float vSeed;
  varying vec2 vUv;
  void main() {
    vColor = iColor;
    vSeed = iSeed;
    vUv = uv;
    vec3 pos = position * iSize + iPosition;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const screenFrag = /* glsl */ `
  uniform float uTime;
  varying vec3 vColor;
  varying float vSeed;
  varying vec2 vUv;
  void main() {
    float t = uTime;
    vec2 uv = vUv;

    // Scrolling scanlines
    float scan = sin(uv.y * 30.0 + t * 2.0 + vSeed) * 0.5 + 0.5;
    float scan2 = sin(uv.y * 60.0 - t * 3.0 + vSeed * 2.0) * 0.5 + 0.5;

    // Waveform bars
    float bars = 0.0;
    for (float i = 0.0; i < 8.0; i++) {
      float x = (i + 0.5) / 8.0;
      float h = 0.1 + 0.4 * abs(sin(t * 4.0 + i * 3.0 + vSeed));
      bars += smoothstep(0.02, 0.0, abs(uv.x - x)) * smoothstep(h, h - 0.05, abs(uv.y - 0.5));
    }

    // Scrolling text lines
    float textLine = step(0.85, fract(sin(floor((uv.y + t * 0.15) * 12.0) * 127.1 + vSeed) * 43758.5453));
    float textBand = smoothstep(0.35, 0.4, uv.y) * smoothstep(0.65, 0.6, uv.y);

    // Grid overlay
    float grid = step(0.95, fract(uv.x * 16.0)) + step(0.95, fract(uv.y * 24.0));

    // Combine
    vec3 col = vColor * 0.3;
    col += vColor * scan * 0.4;
    col += vColor * scan2 * 0.2;
    col += vec3(1.0, 1.0, 1.0) * bars * 0.8;
    col += vColor * textLine * textBand * 1.5;
    col += vColor * grid * 0.15;

    // Vignette
    float vig = 1.0 - length((uv - 0.5) * 1.5);
    col *= vig;

    float alpha = 0.85 * vig + bars * 0.5;
    gl_FragColor = vec4(col, alpha);
  }
`;
