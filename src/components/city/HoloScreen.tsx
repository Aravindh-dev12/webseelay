import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Text } from "@react-three/drei";
import * as THREE from "three";
import { type Section, ACCENTS } from "./data";

/**
 * Mixed DOM/WebGL video billboard.
 * The actual media is rendered with a browser <video> inside drei Html, avoiding
 * cross-origin WebGL VideoTexture failures. A WebGL backing plate remains in the
 * scene so bloom and the reflective floor still pick up screen glow.
 */
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
  const accent = ACCENTS[section.accent];
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current || !float) return;
    groupRef.current.position.y =
      position[1] + Math.sin(state.clock.elapsedTime * 0.48 + position[0]) * 0.035;
  });

  const px = 72;
  const videoWidth = Math.max(220, Math.round(width * px));
  const videoHeight = Math.max(130, Math.round(height * px));

  return (
    <group ref={groupRef} position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0, -0.13]}>
        <boxGeometry args={[width + 0.3, height + 0.3, 0.2]} />
        <meshStandardMaterial color="#040507" metalness={0.78} roughness={0.23} />
      </mesh>

      <mesh position={[0, 0, -0.015]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial
          color="#0a0c10"
          emissive={accent}
          emissiveIntensity={active ? 0.34 : 0.17}
          metalness={0.42}
          roughness={0.34}
          toneMapped={false}
        />
      </mesh>

      <Html
        transform
        position={[0, 0, 0.055]}
        distanceFactor={1}
        zIndexRange={[24, 4]}
        style={{
          width: `${videoWidth}px`,
          height: `${videoHeight}px`,
          overflow: "hidden",
          pointerEvents: "auto",
          background: "#050508",
          boxShadow: active
            ? `0 0 34px ${accent}88, inset 0 0 0 1px ${accent}88`
            : `0 0 18px ${accent}44, inset 0 0 0 1px ${accent}55`,
        }}
      >
        <button
          type="button"
          aria-label={`Open ${section.title}`}
          onClick={(event) => {
            event.stopPropagation();
            onClick();
          }}
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            display: "block",
            border: 0,
            padding: 0,
            margin: 0,
            background: "#050508",
            cursor: "pointer",
            overflow: "hidden",
          }}
        >
          <video
            src={section.videoUrl}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            disablePictureInPicture
            controls={false}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              display: "block",
              objectFit: "cover",
              background: "#050508",
              filter: "saturate(1.15) contrast(1.08) brightness(.84)",
            }}
          />
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background:
                "linear-gradient(180deg,rgba(0,0,0,.05),transparent 45%,rgba(0,0,0,.22)), repeating-linear-gradient(0deg,rgba(255,255,255,.025) 0 1px,transparent 1px 4px)",
              mixBlendMode: "screen",
            }}
          />
        </button>
      </Html>

      <mesh position={[0, height / 2 + 0.09, 0.08]}>
        <planeGeometry args={[width, 0.035]} />
        <meshBasicMaterial color={accent} toneMapped={false} />
      </mesh>
      <mesh position={[0, -height / 2 - 0.09, 0.08]}>
        <planeGeometry args={[width, 0.035]} />
        <meshBasicMaterial color={accent} toneMapped={false} />
      </mesh>

      {showTitle && (
        <Text
          position={[-width / 2 + 0.14, height / 2 + 0.29, 0.08]}
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
          position={[width / 2 - 0.08, -height / 2 - 0.28, 0.08]}
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
        <mesh position={[0, 0, -0.2]}>
          <planeGeometry args={[width + 0.7, height + 0.7]} />
          <meshBasicMaterial color={accent} transparent opacity={0.05} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}
