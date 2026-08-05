import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Text } from "@react-three/drei";
import * as THREE from "three";
import { type Section, ACCENTS } from "./data";

/**
 * Mixed DOM/WebGL video billboard.
 * The DOM video is intentionally pointer-transparent so the R3F canvas keeps
 * receiving cursor movement for camera orbit. Clicks are handled by the WebGL
 * plane directly behind the DOM media.
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

  // Larger CSS-to-world mapping keeps the browser video filling the physical
  // billboard instead of looking like a small inset panel.
  const px = 112;
  const videoWidth = Math.max(300, Math.round(width * px));
  const videoHeight = Math.max(180, Math.round(height * px));

  return (
    <group ref={groupRef} position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0, -0.13]}>
        <boxGeometry args={[width + 0.3, height + 0.3, 0.2]} />
        <meshStandardMaterial color="#040507" metalness={0.78} roughness={0.23} />
      </mesh>

      <mesh
        position={[0, 0, -0.015]}
        onClick={(event) => {
          event.stopPropagation();
          onClick();
        }}
      >
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
          pointerEvents: "none",
          background: "#050508",
          boxShadow: active
            ? `0 0 34px ${accent}88, inset 0 0 0 1px ${accent}88`
            : `0 0 18px ${accent}44, inset 0 0 0 1px ${accent}55`,
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            display: "block",
            background: "#050508",
            overflow: "hidden",
            pointerEvents: "none",
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
              filter: "saturate(1.15) contrast(1.08) brightness(.86)",
              pointerEvents: "none",
            }}
          />
          <span
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background:
                "linear-gradient(180deg,rgba(0,0,0,.04),transparent 45%,rgba(0,0,0,.2)), repeating-linear-gradient(0deg,rgba(255,255,255,.025) 0 1px,transparent 1px 4px)",
              mixBlendMode: "screen",
            }}
          />
        </div>
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
