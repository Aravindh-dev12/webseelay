import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";

/** Animated drones flying through the city. */
export function Drones({ count = 24 }: { count?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const data = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        radius: 18 + Math.random() * 30,
        speed: 0.15 + Math.random() * 0.35,
        offset: Math.random() * Math.PI * 2,
        y: 6 + Math.random() * 30,
        color: new THREE.Color(
          Math.random() < 0.5 ? "#00f0ff" : "#ff00e5",
        ),
        i,
      })),
    [count],
  );
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    data.forEach((d, idx) => {
      const a = t * d.speed + d.offset;
      dummy.position.set(
        Math.cos(a) * d.radius,
        d.y + Math.sin(t * 0.8 + d.offset) * 1.5,
        Math.sin(a) * d.radius,
      );
      dummy.rotation.y = -a;
      dummy.updateMatrix();
      ref.current.setMatrixAt(idx, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined as never, undefined as never, count]}>
      <sphereGeometry args={[0.18, 8, 8]} />
      <meshBasicMaterial color="#ff00e5" toneMapped={false} />
    </instancedMesh>
  );
}

/** Floating particle field — ash, embers, data motes. */
export function Particles({ count = 1200 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null!);
  const { geom, mat } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 120;
      positions[i * 3 + 1] = Math.random() * 60;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 120;
      speeds[i] = 0.2 + Math.random() * 0.6;
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        attribute float aSpeed;
        uniform float uTime;
        varying float vAlpha;
        void main() {
          vec3 p = position;
          p.y = mod(p.y + uTime * aSpeed, 60.0);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = 2.0 + 60.0 / -mv.z;
          gl_Position = projectionMatrix * mv;
          vAlpha = 0.4 + 0.6 * fract(aSpeed * 9.0);
        }
      `,
      fragmentShader: /* glsl */ `
        varying float vAlpha;
        void main() {
          vec2 c = gl_PointCoord - 0.5;
          float d = length(c);
          if (d > 0.5) discard;
          float a = smoothstep(0.5, 0.0, d) * vAlpha;
          gl_FragColor = vec4(vec3(0.55, 0.95, 1.0) * a, a);
        }
      `,
    });
    return { geom, mat };
  }, [count]);

  useFrame((state) => {
    mat.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return <points ref={ref} geometry={geom} material={mat} />;
}

/** Energy beams between two points. */
export function EnergyBeam({
  from,
  to,
  color = "#00f0ff",
}: {
  from: [number, number, number];
  to: [number, number, number];
  color?: string;
}) {
  const ref = useRef<THREE.ShaderMaterial>(null!);
  const { geometry, length } = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const len = a.distanceTo(b);
    const geo = new THREE.CylinderGeometry(0.08, 0.08, len, 8, 1, true);
    geo.translate(0, len / 2, 0);
    return { geometry: geo, length: len };
  }, [from, to]);

  const group = useRef<THREE.Group>(null!);
  useMemo(() => {
    if (!group.current) return;
  }, []);

  useFrame((state) => {
    if (ref.current) ref.current.uniforms.uTime.value = state.clock.elapsedTime;
  });

  const dir = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const d = b.clone().sub(a);
    const q = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      d.normalize(),
    );
    return q;
  }, [from, to]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uLen: { value: length },
    }),
    [color, length],
  );

  return (
    <group ref={group} position={from} quaternion={dir}>
      <mesh geometry={geometry}>
        <shaderMaterial
          ref={ref}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          vertexShader={/* glsl */ `
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={/* glsl */ `
            uniform float uTime;
            uniform vec3 uColor;
            varying vec2 vUv;
            void main() {
              float pulse = fract(vUv.y * 3.0 - uTime * 0.8);
              float core = smoothstep(0.0, 0.4, 1.0 - abs(vUv.x - 0.5) * 2.0);
              float spark = smoothstep(0.85, 1.0, pulse);
              float a = core * (0.25 + spark * 0.9);
              gl_FragColor = vec4(uColor * (0.5 + spark), a);
            }
          `}
        />
      </mesh>
    </group>
  );
}
