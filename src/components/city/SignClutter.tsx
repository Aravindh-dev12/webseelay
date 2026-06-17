import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";

/**
 * Dense procedural billboard clutter — many small kana/text signs and
 * neon panels scattered between the main buildings, like Shibuya.
 * Pure shader, no textures.
 */
export function SignClutter({
  count = 80,
  streetLength = 140,
  streetHalfWidth = 28,
}: {
  count?: number;
  streetLength?: number;
  streetHalfWidth?: number;
}) {
  const matRef = useRef<THREE.ShaderMaterial>(null!);

  const { geometry, uniforms } = useMemo(() => {
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    const aOffset: number[] = [];
    const aSeed: number[] = [];
    const aColor: number[] = [];

    const rng = mulberry32(7);
    const COLORS: [number, number, number][] = [
      [1.0, 0.15, 0.35], // red
      [1.0, 0.1, 1.0],   // magenta
      [0.2, 1.0, 1.0],   // cyan
      [1.0, 0.95, 0.3],  // yellow
      [0.3, 1.0, 0.65],  // green
      [1.0, 1.0, 1.0],   // white
      [1.0, 0.5, 0.1],   // orange
      [0.6, 0.3, 1.0],   // purple
    ];

    let vIdx = 0;
    for (let i = 0; i < count; i++) {
      // Random position along the street, biased to the sides.
      const side = rng() < 0.5 ? -1 : 1;
      const x = side * (12 + rng() * (streetHalfWidth - 12));
      const z = -streetLength / 2 + rng() * streetLength;
      const y = 3 + rng() * 32;

      const w = 1.5 + rng() * 5.5;
      const h = 0.6 + rng() * 3.2;

      // Face the street (look toward x=0)
      const yaw = side > 0 ? -Math.PI / 2 : Math.PI / 2;
      // Slight tilt to feel hand-mounted
      const tilt = (rng() - 0.5) * 0.25;

      const m = new THREE.Matrix4().compose(
        new THREE.Vector3(x, y, z),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(tilt, yaw, 0)),
        new THREE.Vector3(1, 1, 1),
      );

      const verts = [
        new THREE.Vector3(-w / 2, -h / 2, 0),
        new THREE.Vector3(w / 2, -h / 2, 0),
        new THREE.Vector3(w / 2, h / 2, 0),
        new THREE.Vector3(-w / 2, h / 2, 0),
      ];
      const uvList = [
        [0, 0], [1, 0], [1, 1], [0, 1],
      ];

      const seed = rng();
      const color = COLORS[Math.floor(rng() * COLORS.length)];
      const offset = rng() * 100;

      verts.forEach((v, k) => {
        v.applyMatrix4(m);
        positions.push(v.x, v.y, v.z);
        uvs.push(uvList[k][0], uvList[k][1]);
        aOffset.push(offset);
        aSeed.push(seed);
        aColor.push(color[0], color[1], color[2]);
      });

      indices.push(vIdx, vIdx + 1, vIdx + 2, vIdx, vIdx + 2, vIdx + 3);
      vIdx += 4;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geo.setAttribute("aOffset", new THREE.Float32BufferAttribute(aOffset, 1));
    geo.setAttribute("aSeed", new THREE.Float32BufferAttribute(aSeed, 1));
    geo.setAttribute("aColor", new THREE.Float32BufferAttribute(aColor, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const uniforms = { uTime: { value: 0 } };
    return { geometry: geo, uniforms };
  }, [count, streetLength, streetHalfWidth]);

  useFrame((state) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh geometry={geometry}>
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        vertexShader={vert}
        fragmentShader={frag}
      />
    </mesh>
  );
}

function mulberry32(a: number) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const vert = /* glsl */ `
  attribute float aOffset;
  attribute float aSeed;
  attribute vec3 aColor;
  varying vec2 vUv;
  varying float vOffset;
  varying float vSeed;
  varying vec3 vColor;
  void main() {
    vUv = uv;
    vOffset = aOffset;
    vSeed = aSeed;
    vColor = aColor;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const frag = /* glsl */ `
  precision highp float;
  uniform float uTime;
  varying vec2 vUv;
  varying float vOffset;
  varying float vSeed;
  varying vec3 vColor;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    vec2 uv = vUv;

    // Pick a "sign style" from the seed
    float style = floor(vSeed * 4.0);

    vec3 col = vec3(0.0);
    float alpha = 1.0;

    if (style < 1.0) {
      // Style 0: dense kana-like character grid
      vec2 cells = vec2(14.0, 5.0);
      vec2 g = floor(uv * cells);
      float c = hash(g + floor(uTime * 0.5 + vOffset));
      float ch = step(0.35, c);
      // glyph noise
      vec2 sub = fract(uv * cells * vec2(3.0, 5.0));
      float glyph = step(0.4, hash(g * 2.0 + floor(sub * 4.0)));
      col = vColor * ch * glyph * 2.0;
    } else if (style < 2.0) {
      // Style 1: horizontal scrolling marquee
      float scroll = fract(uv.x - uTime * 0.25 + vOffset);
      vec2 cells = vec2(20.0, 1.0);
      vec2 g = floor(vec2(scroll, uv.y) * cells);
      float c = step(0.4, hash(g + floor(vOffset * 7.0)));
      col = vColor * c * 1.8;
    } else if (style < 3.0) {
      // Style 2: solid neon panel with logo block
      float border = step(0.05, uv.x) * step(uv.x, 0.95) *
                     step(0.10, uv.y) * step(uv.y, 0.90);
      float pulse = 0.7 + 0.3 * sin(uTime * 2.0 + vOffset);
      col = vColor * border * pulse * 1.4;
      // inner glyph
      vec2 g = floor(uv * vec2(6.0, 3.0));
      float sym = step(0.55, hash(g));
      col += vColor * sym * 0.5;
    } else {
      // Style 3: vertical streaming code rain
      vec2 cells = vec2(8.0, 18.0);
      vec2 g = floor(uv * cells);
      float lane = hash(vec2(g.x, vOffset));
      float y = fract(uv.y + uTime * (0.4 + lane * 0.8) + vOffset);
      float trail = smoothstep(0.0, 0.5, y) * smoothstep(1.0, 0.5, y);
      float ch = step(0.5, hash(g + floor(uTime * 4.0)));
      col = vColor * ch * trail * 2.2;
    }

    // Slight flicker
    float flick = 0.8 + 0.2 * step(0.05, fract(sin(uTime * 8.0 + vOffset) * 7.0));
    col *= flick;

    if (max(col.r, max(col.g, col.b)) < 0.02) discard;
    gl_FragColor = vec4(col, alpha);
  }
`;
