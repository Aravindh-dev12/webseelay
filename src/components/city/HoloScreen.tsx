import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Text } from "@react-three/drei";
import { type Section, ACCENTS } from "./data";

/**
 * Holographic video screen attached to the front of a building.
 * Plays a looping reel as a video texture; if the video errors,
 * falls back to an animated shader.
 */
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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const accent = ACCENTS[section.accent];

  // Build the <video> element once
  const video = useMemo(() => {
    if (typeof document === "undefined") return null;
    const v = document.createElement("video");
    v.src = section.videoUrl;
    v.loop = true;
    v.muted = true;
    v.playsInline = true;
    v.crossOrigin = "anonymous";
    v.autoplay = true;
    return v;
  }, [section.videoUrl]);

  useEffect(() => {
    if (!video) return;
    videoRef.current = video;
    const onCanPlay = () => {
      setVideoOk(true);
      video.play().catch(() => {});
    };
    const onError = () => setVideoOk(false);
    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("error", onError);
    video.load();
    return () => {
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("error", onError);
      video.pause();
    };
  }, [video]);

  const videoTexture = useMemo(() => {
    if (!video) return null;
    const t = new THREE.VideoTexture(video);
    t.colorSpace = THREE.SRGBColorSpace;
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
    return t;
  }, [video]);

  const shaderRef = useRef<THREE.ShaderMaterial>(null!);
  const frameRef = useRef<THREE.Mesh>(null!);
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (shaderRef.current) shaderRef.current.uniforms.uTime.value = t;
    if (groupRef.current) {
      groupRef.current.position.y =
        position[1] + Math.sin(t * 0.6 + position[0]) * 0.08;
    }
  });

  const shaderUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(accent) },
    }),
    [accent],
  );

  return (
    <group ref={groupRef} position={position} rotation={[0, rotationY, 0]}>
      {/* Outer neon frame */}
      <mesh ref={frameRef}>
        <boxGeometry args={[width + 0.6, height + 0.6, 0.15]} />
        <meshBasicMaterial color={accent} toneMapped={false} />
      </mesh>

      {/* Screen */}
      <mesh
        position={[0, 0, 0.12]}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => (document.body.style.cursor = "")}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <planeGeometry args={[width, height]} />
        {videoOk && videoTexture ? (
          <meshBasicMaterial map={videoTexture} toneMapped={false} />
        ) : (
          <shaderMaterial
            ref={shaderRef}
            uniforms={shaderUniforms}
            vertexShader={screenVert}
            fragmentShader={screenFrag}
          />
        )}
      </mesh>

      {/* Title bar across top of screen */}
      <Text
        position={[-width / 2 + 0.4, height / 2 - 0.5, 0.25]}
        anchorX="left"
        anchorY="middle"
        fontSize={0.55}
        color={accent}
        outlineWidth={0.01}
        outlineColor="#000"
      >
        {section.title}
      </Text>
      <Text
        position={[width / 2 - 0.4, -height / 2 + 0.4, 0.25]}
        anchorX="right"
        anchorY="middle"
        fontSize={0.32}
        color="#9ef3ff"
      >
        &gt; CLICK TO ENTER
      </Text>

      {/* Floating UI tag above */}
      <Html
        position={[0, height / 2 + 1.2, 0]}
        center
        distanceFactor={18}
        zIndexRange={[10, 0]}
        pointerEvents="none"
      >
        <div
          className="cy-panel cy-flicker"
          style={{
            padding: "6px 12px",
            color: accent,
            fontSize: 11,
            letterSpacing: 2,
            whiteSpace: "nowrap",
            borderColor: `${accent}66`,
            boxShadow: `0 0 16px ${accent}55`,
          }}
        >
          ● {section.subtitle.toUpperCase()}
        </div>
      </Html>

      {active && (
        <mesh position={[0, 0, -0.05]}>
          <planeGeometry args={[width + 4, height + 4]} />
          <meshBasicMaterial color={accent} transparent opacity={0.06} />
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
  float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
  void main() {
    vec2 uv = vUv;
    // scanlines
    float s = 0.5 + 0.5 * sin(uv.y * 400.0 + uTime * 6.0);
    // moving grid
    vec2 g = fract(uv * vec2(20.0, 30.0) + vec2(uTime*0.1, -uTime*0.2));
    float grid = step(0.92, max(g.x, g.y));
    // noise blocks
    float n = hash(floor(uv * 40.0 + floor(uTime*3.0)));
    vec3 col = uColor * (0.25 + 0.5 * s);
    col += uColor * grid * 0.8;
    col += vec3(n) * 0.08;
    // vignette
    float v = smoothstep(1.2, 0.3, length(uv - 0.5));
    col *= v;
    gl_FragColor = vec4(col, 1.0);
  }
`;
