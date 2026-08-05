import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { type Section, ACCENTS } from "./data";

export function HoloScreen({
  section,
  position,
  rotationY = 0,
  width,
  height,
  onClick,
  active,
}: {
  section: Section;
  position: [number, number, number];
  rotationY?: number;
  width: number;
  height: number;
  onClick: () => void;
  active: boolean;
}) {
  const [videoOk, setVideoOk] = useState(false);
  const accent = ACCENTS[section.accent];
  const groupRef = useRef<THREE.Group>(null);
  const shaderRef = useRef<THREE.ShaderMaterial>(null);

  const video = useMemo(() => {
    if (typeof document === "undefined") return null;
    const element = document.createElement("video");
    element.src = section.videoUrl;
    element.loop = true;
    element.muted = true;
    element.playsInline = true;
    element.crossOrigin = "anonymous";
    element.autoplay = true;
    return element;
  }, [section.videoUrl]);

  useEffect(() => {
    if (!video) return;
    const canPlay = () => {
      setVideoOk(true);
      video.play().catch(() => undefined);
    };
    const failed = () => setVideoOk(false);
    video.addEventListener("canplay", canPlay);
    video.addEventListener("error", failed);
    video.load();
    return () => {
      video.removeEventListener("canplay", canPlay);
      video.removeEventListener("error", failed);
      video.pause();
    };
  }, [video]);

  const texture = useMemo(() => {
    if (!video) return null;
    const value = new THREE.VideoTexture(video);
    value.colorSpace = THREE.SRGBColorSpace;
    value.minFilter = THREE.LinearFilter;
    value.magFilter = THREE.LinearFilter;
    return value;
  }, [video]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(accent) },
    }),
    [accent],
  );

  useFrame((state) => {
    if (shaderRef.current) shaderRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.45 + position[0]) * 0.0015;
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0, -0.14]}>
        <boxGeometry args={[width + 0.55, height + 0.55, 0.22]} />
        <meshStandardMaterial color="#050508" metalness={0.72} roughness={0.26} />
      </mesh>

      <mesh
        position={[0, 0, 0.02]}
        onPointerOver={(event) => {
          event.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => (document.body.style.cursor = "")}
        onClick={(event) => {
          event.stopPropagation();
          onClick();
        }}
      >
        <planeGeometry args={[width, height]} />
        {videoOk && texture ? (
          <meshBasicMaterial map={texture} toneMapped={false} />
        ) : (
          <shaderMaterial
            ref={shaderRef}
            uniforms={uniforms}
            vertexShader={screenVert}
            fragmentShader={screenFrag}
          />
        )}
      </mesh>

      <mesh position={[0, height / 2 + 0.18, 0.08]}>
        <planeGeometry args={[width, 0.055]} />
        <meshBasicMaterial color={accent} toneMapped={false} />
      </mesh>
      <mesh position={[0, -height / 2 - 0.18, 0.08]}>
        <planeGeometry args={[width, 0.055]} />
        <meshBasicMaterial color={accent} toneMapped={false} />
      </mesh>

      <Text
        position={[-width / 2 + 0.18, height / 2 + 0.44, 0.06]}
        fontSize={0.28}
        letterSpacing={0.13}
        color={accent}
        anchorX="left"
        anchorY="middle"
      >
        {section.title}
      </Text>
      <Text
        position={[width / 2 - 0.12, -height / 2 - 0.43, 0.06]}
        fontSize={0.16}
        letterSpacing={0.1}
        color="#d6f9ff"
        anchorX="right"
        anchorY="middle"
      >
        {active ? "NODE OPEN" : "INTERACT"}
      </Text>

      {active && (
        <mesh position={[0, 0, -0.2]}>
          <planeGeometry args={[width + 0.9, height + 0.9]} />
          <meshBasicMaterial color={accent} transparent opacity={0.055} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

const screenVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const screenFrag = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec3 uColor;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    vec2 uv = vUv;
    vec2 gridUv = fract(uv * vec2(16.0, 10.0) + vec2(uTime * 0.02, 0.0));
    float grid = step(0.965, max(gridUv.x, gridUv.y));
    float scan = 0.5 + 0.5 * sin(uv.y * 520.0 + uTime * 3.0);
    float noise = hash(floor(uv * 70.0 + floor(uTime * 2.0)));
    float vignette = smoothstep(0.86, 0.24, length(uv - 0.5));
    vec3 base = mix(vec3(0.015, 0.02, 0.025), uColor * 0.17, uv.y);
    base += uColor * grid * 0.46;
    base += uColor * scan * 0.05;
    base += vec3(noise) * 0.025;
    gl_FragColor = vec4(base * vignette, 1.0);
  }
`;
