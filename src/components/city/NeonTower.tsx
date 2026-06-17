import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";

/**
 * Procedural neon "city block" — a tall tower covered in animated
 * window grid emissive lights, with a holographic video screen on
 * its primary facade.
 */
export function NeonTower({
  position,
  width,
  depth,
  height,
  color,
}: {
  position: [number, number, number];
  width: number;
  depth: number;
  height: number;
  color: string;
}) {
  const matRef = useRef<THREE.ShaderMaterial>(null!);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uSize: { value: new THREE.Vector3(width, height, depth) },
    }),
    [color, width, height, depth],
  );

  useFrame((state) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={[width, height, depth]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </mesh>
  );
}

const vertexShader = /* glsl */ `
  varying vec3 vPos;
  varying vec3 vNormal;
  varying vec2 vUv;
  void main() {
    vPos = position;
    vNormal = normal;
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec3  uColor;
  uniform vec3  uSize;
  varying vec3  vPos;
  varying vec3  vNormal;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float hash1(float p) { return fract(sin(p * 127.1) * 43758.5453); }

  // Approximate an anime "face" silhouette inside a unit cell: dark hair frame,
  // skin oval, two glowing eyes. Returns RGB.
  vec3 animeFace(vec2 uv, float seed) {
    vec2 p = uv - 0.5;
    // skin oval
    float oval = smoothstep(0.42, 0.36, length(p * vec2(1.2, 0.95)));
    vec3 skin = mix(vec3(0.95, 0.82, 0.78), vec3(1.0, 0.7, 0.75), seed);
    // hair: top half darker mass with jagged bottom
    float hairLine = 0.55 + 0.08 * sin(uv.x * 18.0 + seed * 10.0);
    float hair = step(uv.y, hairLine) * smoothstep(0.48, 0.40, length(p * vec2(1.05, 0.9)));
    vec3 hairCol = mix(vec3(0.05,0.02,0.08), vec3(0.45,0.05,0.15), step(0.5, seed));
    // eyes
    vec2 e1 = p - vec2(-0.12, 0.02);
    vec2 e2 = p - vec2( 0.12, 0.02);
    float eye = smoothstep(0.05, 0.02, length(e1 * vec2(1.0, 1.6))) +
                smoothstep(0.05, 0.02, length(e2 * vec2(1.0, 1.6)));
    vec3 eyeCol = mix(vec3(1.0, 0.15, 0.30), vec3(0.2, 0.95, 1.0), step(0.5, fract(seed*3.7)));
    vec3 col = vec3(0.0);
    col = mix(col, skin, oval);
    col = mix(col, hairCol, hair);
    col += eyeCol * eye * 1.6;
    return col;
  }

  // Render a single billboard band given local uv 0..1 and a style seed.
  vec3 billboard(vec2 uv, float seed, float t) {
    float style = floor(seed * 5.0);
    vec3 accent = mix(uColor, vec3(1.0), step(0.5, fract(seed*11.0)));
    if (fract(seed*17.0) > 0.7) accent = vec3(0.0, 0.9, 1.0);
    if (fract(seed*23.0) > 0.85) accent = vec3(1.0, 0.85, 0.2);

    if (style < 1.0) {
      // anime portrait panel
      vec3 c = animeFace(uv, fract(seed*5.0));
      // scanlines
      c *= 0.75 + 0.25 * step(0.5, fract(uv.y * 80.0));
      return c;
    } else if (style < 2.0) {
      // dense kana grid
      vec2 cells = vec2(16.0, 6.0);
      vec2 g = floor(uv * cells);
      float c = step(0.35, hash(g + floor(t * 0.6 + seed*10.0)));
      vec2 sub = fract(uv * cells * vec2(3.0, 5.0));
      float glyph = step(0.45, hash(g*2.0 + floor(sub * 4.0)));
      return accent * c * glyph * 1.4;
    } else if (style < 3.0) {
      // horizontal scrolling marquee with big block letters
      float scroll = fract(uv.x * 1.5 - t * 0.18 + seed);
      vec2 cells = vec2(10.0, 2.0);
      vec2 g = floor(vec2(scroll, uv.y) * cells);
      float c = step(0.45, hash(g + floor(seed * 7.0)));
      // top/bottom black bars
      float bar = step(0.1, uv.y) * step(uv.y, 0.9);
      return accent * c * bar * 1.5;
    } else if (style < 4.0) {
      // vertical code rain
      vec2 cells = vec2(14.0, 22.0);
      vec2 g = floor(uv * cells);
      float lane = hash(vec2(g.x, seed));
      float y = fract(uv.y + t * (0.35 + lane * 0.9) + seed);
      float trail = smoothstep(0.0, 0.6, y) * smoothstep(1.0, 0.6, y);
      float ch = step(0.5, hash(g + floor(t * 4.0)));
      vec3 green = vec3(0.4, 1.0, 0.55);
      return mix(green, accent, 0.3) * ch * trail * 1.7;
    } else {
      // solid logo block with pulsing border and inner sigil
      float border = step(0.04, uv.x) * step(uv.x, 0.96) *
                     step(0.10, uv.y) * step(uv.y, 0.90);
      float inner  = step(0.10, uv.x) * step(uv.x, 0.90) *
                     step(0.18, uv.y) * step(uv.y, 0.82);
      float ring = border - inner;
      float pulse = 0.6 + 0.4 * sin(t * 2.0 + seed * 12.0);
      vec2 g = floor(uv * vec2(5.0, 3.0));
      float sym = step(0.55, hash(g + floor(seed*3.0)));
      return accent * (ring * pulse + sym * inner * 0.7);
    }
  }

  void main() {
    float topness = abs(vNormal.y);
    vec3 base = vec3(0.04, 0.035, 0.06);

    // Face-local UV across the visible side
    vec2 uv;
    float faceSeed;
    if (abs(vNormal.x) > 0.5) {
      uv = vec2((vPos.z / uSize.z) + 0.5, (vPos.y / uSize.y) + 0.5);
      faceSeed = sign(vNormal.x) * 0.5 + 0.5;
    } else if (abs(vNormal.z) > 0.5) {
      uv = vec2((vPos.x / uSize.x) + 0.5, (vPos.y / uSize.y) + 0.5);
      faceSeed = sign(vNormal.z) * 0.5 + 0.7;
    } else {
      // top/bottom: dark with thin emissive grid
      vec2 g = fract(vPos.xz * 0.6);
      float line = step(0.92, g.x) + step(0.92, g.y);
      gl_FragColor = vec4(base + uColor * line * 0.8, 1.0);
      return;
    }

    // Stack the facade with N billboard bands of varying heights
    vec3 col = base;
    float yCursor = 0.0;
    float seedRow = faceSeed * 13.37;
    for (int i = 0; i < 12; i++) {
      float fi = float(i);
      float bandH = 0.06 + 0.10 * hash1(seedRow + fi * 1.7);
      float y0 = yCursor;
      float y1 = min(1.0, yCursor + bandH);
      yCursor = y1;
      if (uv.y < y0 || uv.y > y1) continue;

      // Horizontal sub-cells per band (1..4 boards side by side)
      float subCount = floor(1.0 + hash1(seedRow + fi * 2.3) * 3.99);
      float sx = uv.x * subCount;
      float subId = floor(sx);
      float lx = fract(sx);
      float ly = (uv.y - y0) / max(0.0001, (y1 - y0));

      // gap between boards
      float gap = step(0.015, lx) * step(lx, 0.985) *
                  step(0.02, ly) * step(ly, 0.98);

      float bSeed = hash(vec2(seedRow + fi, subId));
      vec3 bcol = billboard(vec2(lx, ly), bSeed, uTime);
      // boost billboard brightness
      bcol *= 1.4;
      col = mix(col, bcol, gap);

      // emissive neon frame around board
      float frame = (1.0 - gap) * step(0.003, lx) * step(lx, 0.997) *
                                    step(0.005, ly) * step(ly, 0.995);
      col += uColor * frame * 1.2;
    }

    // Flicker per band
    col *= 0.85 + 0.15 * sin(uTime * 8.0 + faceSeed * 30.0 + uv.y * 50.0);

    // Bottom street glow
    col += uColor * smoothstep(0.0, 0.15, 0.15 - uv.y) * 0.8;

    // Top antenna glow
    if (topness > 0.5) {
      col = base + uColor * 0.5;
    }

    gl_FragColor = vec4(col, 1.0);
  }
`;
