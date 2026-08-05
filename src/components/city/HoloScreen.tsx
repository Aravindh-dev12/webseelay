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
  showTitle = true,
  showPrompt = true,
  float = true,
}: {
  section: Section;
  position: [number, number, number];
  rotationY?: number;
  width: number;
  height: number;
  onClick: () => void;
  active: boolean;
  showTitle?: boolean;
  showPrompt?: boolean;
  float?: boolean;
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
    element.preload = "auto";
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
      video.removeAttribute("src");
      video.load();
    };
  }, [video]);

  const texture = useMemo(() => {
    if (!video) return null;
    const value = new THREE.VideoTexture(video);
    value.colorSpace = THREE.SRGBColorSpace;
    value.minFilter = THREE.LinearFilter;
    value.magFilter = THREE.LinearFilter;
    value.generateMipmaps = false;
    return value;
  }, [video]);

  useEffect(() => () => texture?.dispose(), [texture]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(accent) },
    }),
    [accent],
  );

  useFrame((state) => {
    if (shaderRef.current) shaderRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    if (groupRef.current && float) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.48 + position[0]) * 0.035;
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0, -0.12]}>
        <boxGeometry args={[width + 0.28, height + 0.28, 0.18]} />
        <meshStandardMaterial color="#040507" metalness={0.74} roughness={0.24} />
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
          <shaderMaterial ref={shaderRef} uniforms={uniforms} vertexShader={screenVert} fragmentShader={screenFrag} />
        )}
      </mesh>

      <mesh position={[0, height / 2 + 0.09, 0.06]}>
        <planeGeometry args={[width, 0.035]} />
        <meshBasicMaterial color={accent} toneMapped={false} />
      </mesh>
      <mesh position={[0, -height / 2 - 0.09, 0.06]}>
        <planeGeometry args={[width, 0.035]} />
        <meshBasicMaterial color={accent} toneMapped={false} />
      </mesh>

      {showTitle && (
        <Text
          position={[-width / 2 + 0.14, height / 2 + 0.29, 0.06]}
          fontSize={Math.min(0.24, height * 0.055)}
          letterSpacing={0.12}
          color={accent}
          anchorX="left"
          anchorY="middle"
        >
          {section.title}
        </Text>
      )}

      {showPrompt && (
        <Text
          position={[width / 2 - 0.08, -height / 2 - 0.28, 0.06]}
          fontSize={Math.min(0.14, height * 0.04)}
          letterSpacing={0.08}
          color="#dff8ff"
          anchorX="right"
          anchorY="middle"
        >
          {active ? "NODE OPEN" : "INTERACT"}
        </Text>
      )}

      {active && (
        <mesh position={[0, 0, -0.19]}>
          <planeGeometry args={[width + 0.7, height + 0.7]} />
          <meshBasicMaterial color={accent} transparent opacity={0.05} toneMapped={false} />
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
