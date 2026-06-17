import * as THREE from "three";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useQuestEngine } from "./QuestEngine";

/**
 * Weather System
 * ==============
 * Dynamic rain, fog, emberfall, and storm effects driven by world state.
 */

export function WeatherSystem() {
  const { world } = useQuestEngine();
  const type = world.weather.type;

  return (
    <group>
      {type === "rain" && <Rain count={8000} />}
      {type === "storm" && <Rain count={15000} wind={3} />}
      {type === "emberfall" && <Emberfall count={5000} />}
      {type === "fog" && <FogVolume />}
      <TimeOfDayLighting />
    </group>
  );
}

function Rain({ count = 8000, wind = 1 }: { count?: number; wind?: number }) {
  const ref = useRef<THREE.Points>(null);
  const { geom, mat } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 120;
      positions[i * 3 + 1] = Math.random() * 60;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 120;
      speeds[i] = 15 + Math.random() * 10;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uWind: { value: wind } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        attribute float aSpeed;
        uniform float uTime;
        uniform float uWind;
        varying float vAlpha;
        void main() {
          vec3 p = position;
          p.y = mod(p.y - uTime * aSpeed, 60.0);
          p.x += uWind * (60.0 - p.y) * 0.05;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = 1.5 + 30.0 / -mv.z;
          gl_Position = projectionMatrix * mv;
          vAlpha = 0.3 + 0.4 * (p.y / 60.0);
        }
      `,
      fragmentShader: /* glsl */ `
        varying float vAlpha;
        void main() {
          gl_FragColor = vec4(vec3(0.4, 0.7, 1.0) * vAlpha, vAlpha * 0.6);
        }
      `,
    });
    return { geom: geo, mat };
  }, [count, wind]);

  useFrame((state) => {
    mat.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return <points ref={ref} geometry={geom} material={mat} />;
}

function Emberfall({ count = 5000 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const { geom, mat } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = Math.random() * 50;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        uniform float uTime;
        void main() {
          vec3 p = position;
          p.y = mod(p.y + uTime * (0.5 + sin(position.x * 10.0) * 0.3), 50.0);
          p.x += sin(uTime + position.z) * 0.5;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = 2.0 + 40.0 / -mv.z;
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        void main() {
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          float a = smoothstep(0.5, 0.0, d);
          gl_FragColor = vec4(vec3(1.0, 0.4, 0.0) * a * 1.5, a);
        }
      `,
    });
    return { geom: geo, mat };
  }, [count]);

  useFrame((state) => {
    mat.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return <points ref={ref} geometry={geom} material={mat} />;
}

function FogVolume() {
  return (
    <mesh position={[0, 10, 0]}>
      <boxGeometry args={[200, 20, 200]} />
      <meshBasicMaterial
        color="#0a0215"
        transparent
        opacity={0.15}
        depthWrite={false}
      />
    </mesh>
  );
}

function TimeOfDayLighting() {
  const { world } = useQuestEngine();
  const time = world.weather.timeOfDay;
  // Night: 20-6, Dawn: 6-8, Day: 8-18, Dusk: 18-20
  const isNight = time < 6 || time >= 20;
  const isDawn = time >= 6 && time < 8;
  const isDusk = time >= 18 && time < 20;

  const ambientIntensity = isNight ? 0.15 : isDawn || isDusk ? 0.35 : 0.5;
  const ambientColor = isNight ? "#1a0510" : isDawn ? "#ff6b35" : isDusk ? "#ff3366" : "#ffffff";
  const fogColor = isNight ? "#0a0210" : isDawn ? "#1a0a15" : isDusk ? "#1a0518" : "#0a0a15";
  const fogNear = isNight ? 15 : 25;
  const fogFar = isNight ? 100 : 140;

  const lightRef = useRef<THREE.AmbientLight>(null);
  const dirRef = useRef<THREE.DirectionalLight>(null);

  return (
    <>
      <ambientLight
        ref={lightRef}
        intensity={ambientIntensity}
        color={ambientColor}
      />
      <directionalLight
        ref={dirRef}
        position={[40, isNight ? 20 : 60, 20]}
        intensity={isNight ? 0.2 : 0.6}
        color={isDawn || isDusk ? "#ff3366" : "#ff2050"}
      />
      <fog attach="fog" args={[fogColor, fogNear, fogFar]} />
    </>
  );
}
