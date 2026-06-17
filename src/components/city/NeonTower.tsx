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

  void main() {
    float topness = abs(vNormal.y);
    // Top / bottom faces: concrete slab
    if (topness > 0.5) {
      vec2 g = fract(vPos.xz * 0.8);
      float line = step(0.96, g.x) + step(0.96, g.y);
      gl_FragColor = vec4(vec3(0.09, 0.095, 0.10) + line * 0.04, 1.0);
      return;
    }

    // Face-local UV
    vec2 uv;
    float faceSeed;
    if (abs(vNormal.x) > 0.5) {
      uv = vec2((vPos.z / uSize.z) + 0.5, (vPos.y / uSize.y) + 0.5);
      faceSeed = sign(vNormal.x) * 0.5 + 0.5;
    } else {
      uv = vec2((vPos.x / uSize.x) + 0.5, (vPos.y / uSize.y) + 0.5);
      faceSeed = sign(vNormal.z) * 0.5 + 0.7;
    }

    // Building wall color (real concrete)
    vec3 wall = vec3(0.12, 0.125, 0.13);

    // Window grid
    vec2 cells = vec2(6.0, 14.0);
    vec2 g = floor(uv * cells);
    vec2 f = fract(uv * cells);

    float frame = step(0.08, f.x) * step(f.x, 0.92) *
                 step(0.06, f.y) * step(f.y, 0.94);

    float seed = hash(vec2(g.x + faceSeed * 20.0, g.y));
    float lit = step(0.35, seed);

    // Some windows slowly flicker on/off
    float flicker = step(0.92, seed) * step(0.5, sin(uTime * 2.0 + seed * 40.0));
    lit = max(lit, flicker);

    // Natural window light: warm white / cool white only
    vec3 winCol = mix(vec3(0.90, 0.85, 0.70), vec3(0.75, 0.90, 1.0), fract(seed * 3.7));

    // Dark window interior
    vec3 darkWin = vec3(0.025, 0.03, 0.035);

    vec3 col = wall;
    col = mix(col, mix(darkWin, winCol, lit), frame);

    // Very subtle floor variation
    col *= 0.95 + 0.05 * sin(g.y * 3.0 + faceSeed * 10.0);

    gl_FragColor = vec4(col, 1.0);
  }
`;
