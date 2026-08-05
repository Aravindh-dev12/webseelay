import * as THREE from "three";
import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { MeshReflectorMaterial, Text } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { HoloScreen } from "./HoloScreen";
import { Kitty } from "./Kitty";
import { SECTIONS, BRAND_RED, type Section } from "./data";

type ControlDetail = { code: string; down: boolean };
type Face = "front" | "left" | "right";
type MediaFace = { face: Face; sectionIndex: number; y: number; width: number; height: number };
type PlazaBlockSpec = { id: string; position: [number, number]; size: [number, number, number]; accent: string; faces: MediaFace[] };
type FloatingMediaSpec = { sectionIndex: number; position: [number, number, number]; rotationY: number; width: number; height: number };
type MosaicTile = { sectionIndex: number; position: [number, number, number]; width: number; height: number };

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 768px)");
    const update = () => setMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return mobile;
}

function useKeys() {
  const keys = useRef<Record<string, boolean>>({});
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      keys.current[event.code] = true;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) event.preventDefault();
    };
    const up = (event: KeyboardEvent) => {
      keys.current[event.code] = false;
    };
    const external = (event: Event) => {
      const detail = (event as CustomEvent<ControlDetail>).detail;
      if (detail) keys.current[detail.code] = detail.down;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("city-control", external);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("city-control", external);
    };
  }, []);
  return keys;
}

function Player({ isMobile }: { isMobile: boolean }) {
  const { camera } = useThree();
  const root = useRef<THREE.Group>(null);
  const position = useRef(new THREE.Vector3(5.5, 0, 8.6));
  const bodyYaw = useRef(Math.PI);
  const verticalVelocity = useRef(0);
  const orbitYaw = useRef(0);
  const orbitPitch = useRef(0);
  const look = useRef(new THREE.Vector3(2.5, 1.25, 0));
  const keys = useKeys();

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const k = keys.current;
    const forward = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0);
    const turn = (k.KeyA || k.ArrowLeft ? 1 : 0) - (k.KeyD || k.ArrowRight ? 1 : 0);

    bodyYaw.current += turn * dt * 1.9;
    const speed = (k.ShiftLeft || k.ShiftRight ? 7.8 : 4.9) * forward;
    position.current.x += Math.sin(bodyYaw.current) * speed * dt;
    position.current.z += Math.cos(bodyYaw.current) * speed * dt;

    if (k.Space && position.current.y <= 0.001) verticalVelocity.current = 4.45;
    verticalVelocity.current -= 13 * dt;
    position.current.y = Math.max(0, position.current.y + verticalVelocity.current * dt);
    if (position.current.y === 0) verticalVelocity.current = 0;

    position.current.x = THREE.MathUtils.clamp(position.current.x, -11.2, 11.2);
    position.current.z = THREE.MathUtils.clamp(position.current.z, -7.6, 13.4);

    if (root.current) {
      root.current.position.copy(position.current);
      root.current.rotation.y = bodyYaw.current;
    }

    const targetYaw = isMobile ? 0 : state.pointer.x * 1.28;
    const targetPitch = isMobile ? 0 : state.pointer.y * 0.66;
    const orbitBlend = 1 - Math.exp(-dt * 8.0);
    orbitYaw.current = THREE.MathUtils.lerp(orbitYaw.current, targetYaw, orbitBlend);
    orbitPitch.current = THREE.MathUtils.lerp(orbitPitch.current, targetPitch, orbitBlend);

    const cameraYaw = bodyYaw.current + orbitYaw.current;
    const radius = isMobile ? 5.7 : 6.35;
    const horizontalRadius = Math.cos(orbitPitch.current * 0.7) * radius;
    const desired = new THREE.Vector3(
      position.current.x - Math.sin(cameraYaw) * horizontalRadius,
      position.current.y + (isMobile ? 2.6 : 2.8) + orbitPitch.current * 4.1,
      position.current.z - Math.cos(cameraYaw) * horizontalRadius,
    );
    const desiredLook = new THREE.Vector3(
      position.current.x + Math.sin(cameraYaw) * 4.9,
      position.current.y + 1.2 + orbitPitch.current * 5.1,
      position.current.z + Math.cos(cameraYaw) * 4.9,
    );

    const cameraBlend = 1 - Math.exp(-dt * 8.5);
    camera.position.lerp(desired, cameraBlend);
    look.current.lerp(desiredLook, cameraBlend);
    camera.lookAt(look.current);
  });

  return (
    <group ref={root}>
      <Kitty color="#ff073d" scale={0.98} />
    </group>
  );
}

function PlazaFloor({ isMobile }: { isMobile: boolean }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, -1.2]}>
      <planeGeometry args={[54, 48]} />
      <MeshReflectorMaterial
        blur={isMobile ? [64, 18] : [300, 90]}
        resolution={isMobile ? 256 : 768}
        mixBlur={1}
        mixStrength={isMobile ? 20 : 42}
        mirror={0.8}
        roughness={0.2}
        depthScale={1.2}
        minDepthThreshold={0.14}
        maxDepthThreshold={1.2}
        color="#030305"
        metalness={0.97}
      />
    </mesh>
  );
}

const MOSAIC_TILES: MosaicTile[] = [
  { sectionIndex: 1, position: [-5.35, 6.45, -5.94], width: 4.7, height: 2.9 },
  { sectionIndex: 2, position: [-1.25, 6.45, -5.94], width: 3.1, height: 2.9 },
  { sectionIndex: 3, position: [2.2, 6.45, -5.94], width: 3.35, height: 2.9 },
  { sectionIndex: 4, position: [5.45, 6.45, -5.94], width: 2.7, height: 2.9 },
  { sectionIndex: 5, position: [-5.55, 3.25, -5.94], width: 2.95, height: 3.05 },
  { sectionIndex: 6, position: [-2.15, 3.25, -5.94], width: 3.4, height: 3.05 },
  { sectionIndex: 1, position: [1.35, 3.25, -5.94], width: 3.05, height: 3.05 },
  { sectionIndex: 3, position: [5.0, 3.25, -5.94], width: 3.75, height: 3.05 },
  { sectionIndex: 2, position: [-5.05, 0.25, -5.94], width: 4.2, height: 2.35 },
  { sectionIndex: 4, position: [-0.85, 0.25, -5.94], width: 3.85, height: 2.35 },
  { sectionIndex: 5, position: [3.0, 0.25, -5.94], width: 3.85, height: 2.35 },
  { sectionIndex: 6, position: [5.95, 0.25, -5.94], width: 1.85, height: 2.35 },
];

function MainBillboard({ activeId, onSelect }: { activeId: string | null; onSelect: (section: Section) => void }) {
  return (
    <group>
      <mesh position={[0, 3.65, -6.35]}>
        <boxGeometry args={[17.2, 11.5, 0.72]} />
        <meshStandardMaterial color="#050609" roughness={0.3} metalness={0.82} />
      </mesh>
      {MOSAIC_TILES.map((tile, index) => {
        const section = SECTIONS[tile.sectionIndex % SECTIONS.length];
        return (
          <HoloScreen
            key={`mosaic-${index}`}
            section={section}
            position={tile.position}
            width={tile.width}
            height={tile.height}
            onClick={() => onSelect(section)}
            active={activeId === section.id}
            showTitle={false}
            showPrompt={false}
            float={false}
          />
        );
      })}
      <Text position={[-8.0, 9.72, -5.55]} fontSize={0.22} letterSpacing={0.16} color="#f5f7ff" anchorX="left">
        JIOMETRY // PROJECT DISPLAY
      </Text>
      <Text position={[7.95, -1.7, -5.55]} fontSize={0.13} letterSpacing={0.14} color={BRAND_RED} anchorX="right">
        LIVE MEDIA MOSAIC // 12 CHANNELS
      </Text>
    </group>
  );
}

function DiagnosticsRoof() {
  return (
    <group position={[1.2, 10.85, -6.9]} rotation={[0, -0.04, 0]}>
      <mesh>
        <planeGeometry args={[12.8, 2.45]} />
        <meshStandardMaterial color="#071109" emissive="#70ff6a" emissiveIntensity={0.13} roughness={0.34} />
      </mesh>
      <mesh position={[0, 1.18, 0.02]}>
        <planeGeometry args={[12.8, 0.05]} />
        <meshBasicMaterial color="#8dff76" toneMapped={false} />
      </mesh>
      <Text position={[-5.85, 0.62, 0.035]} fontSize={0.2} letterSpacing={0.12} color="#8dff76" anchorX="left">
        SYSTEM // VIRTUAL ENVIRONMENT
      </Text>
      <Text position={[-5.85, 0.12, 0.035]} fontSize={0.1} letterSpacing={0.09} color="#dfffe5" anchorX="left">
        GPU ONLINE   MEDIA ARRAY SYNCHRONIZED   LIVE NODE 02
      </Text>
      {Array.from({ length: 9 }).map((_, index) => (
        <mesh key={index} position={[-5.1 + index * 1.28, -0.58, 0.03]}>
          <planeGeometry args={[0.78, 0.045]} />
          <meshBasicMaterial color={index % 3 === 0 ? "#a1ff72" : "#366d3e"} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

const PLAZA_BLOCKS: PlazaBlockSpec[] = [
  {
    id: "left-front",
    position: [-10.6, -2.2],
    size: [4.9, 12.6, 6.0],
    accent: "#ff2bd6",
    faces: [
      { face: "front", sectionIndex: 4, y: 7.0, width: 4.35, height: 8.9 },
      { face: "right", sectionIndex: 2, y: 6.6, width: 5.35, height: 5.3 },
      { face: "right", sectionIndex: 6, y: 2.1, width: 5.35, height: 3.2 },
    ],
  },
  {
    id: "right-front",
    position: [10.4, -1.5],
    size: [5.0, 14.2, 6.1],
    accent: "#00e9ff",
    faces: [
      { face: "front", sectionIndex: 3, y: 7.8, width: 4.45, height: 10.1 },
      { face: "left", sectionIndex: 6, y: 8.1, width: 5.45, height: 6.2 },
      { face: "left", sectionIndex: 1, y: 2.8, width: 5.45, height: 3.5 },
    ],
  },
  {
    id: "left-rear",
    position: [-8.1, -10.6],
    size: [4.8, 19.2, 5.2],
    accent: "#7d4dff",
    faces: [
      { face: "front", sectionIndex: 2, y: 12.0, width: 4.25, height: 10.3 },
      { face: "front", sectionIndex: 4, y: 4.2, width: 4.25, height: 4.4 },
      { face: "right", sectionIndex: 5, y: 8.5, width: 4.55, height: 7.3 },
    ],
  },
  {
    id: "right-rear",
    position: [8.8, -11.2],
    size: [5.2, 20.4, 5.4],
    accent: "#ff3158",
    faces: [
      { face: "front", sectionIndex: 5, y: 12.8, width: 4.65, height: 10.9 },
      { face: "front", sectionIndex: 2, y: 4.4, width: 4.65, height: 4.6 },
      { face: "left", sectionIndex: 1, y: 8.8, width: 4.75, height: 7.6 },
    ],
  },
  {
    id: "far-left",
    position: [-13.6, -8.0],
    size: [4.8, 16.6, 5.5],
    accent: "#ffe54a",
    faces: [
      { face: "right", sectionIndex: 3, y: 10.8, width: 4.85, height: 8.5 },
      { face: "right", sectionIndex: 5, y: 3.8, width: 4.85, height: 4.7 },
    ],
  },
  {
    id: "far-right",
    position: [13.7, -7.4],
    size: [4.7, 16.0, 5.4],
    accent: "#6bff91",
    faces: [
      { face: "left", sectionIndex: 4, y: 10.2, width: 4.75, height: 8.3 },
      { face: "left", sectionIndex: 2, y: 3.5, width: 4.75, height: 4.5 },
    ],
  },
];

function faceTransform(face: Face, x: number, z: number, width: number, depth: number, y: number): { position: [number, number, number]; rotationY: number } {
  if (face === "left") return { position: [x - width / 2 - 0.04, y, z], rotationY: Math.PI / 2 };
  if (face === "right") return { position: [x + width / 2 + 0.04, y, z], rotationY: -Math.PI / 2 };
  return { position: [x, y, z + depth / 2 + 0.04], rotationY: 0 };
}

function PlazaBlock({ spec, activeId, onSelect }: { spec: PlazaBlockSpec; activeId: string | null; onSelect: (section: Section) => void }) {
  const [x, z] = spec.position;
  const [width, height, depth] = spec.size;
  return (
    <group>
      <mesh position={[x, height / 2, z]}>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color="#050609" roughness={0.4} metalness={0.7} />
      </mesh>
      <mesh position={[x, height + 0.02, z]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width * 0.84, depth * 0.84]} />
        <meshBasicMaterial color={spec.accent} transparent opacity={0.13} toneMapped={false} />
      </mesh>
      {spec.faces.map((media, index) => {
        const section = SECTIONS[media.sectionIndex % SECTIONS.length];
        const transform = faceTransform(media.face, x, z, width, depth, media.y);
        return (
          <HoloScreen
            key={`${spec.id}-${media.face}-${index}`}
            section={section}
            position={transform.position}
            rotationY={transform.rotationY}
            width={media.width}
            height={media.height}
            onClick={() => onSelect(section)}
            active={activeId === section.id}
            showTitle={false}
            showPrompt={false}
            float={false}
          />
        );
      })}
      <Text position={[x, height + 0.5, z + depth / 2 + 0.06]} fontSize={0.15} letterSpacing={0.16} color={spec.accent} anchorX="center">
        {spec.id.toUpperCase()} // SIGNAL
      </Text>
      <pointLight position={[x, Math.min(height * 0.6, 9), z + 1]} color={spec.accent} intensity={0.8} distance={10} />
    </group>
  );
}

const FLOATING_MEDIA: FloatingMediaSpec[] = [
  { sectionIndex: 2, position: [-5.5, 2.25, -1.7], rotationY: 0.12, width: 3.6, height: 2.2 },
  { sectionIndex: 5, position: [5.5, 2.2, -1.5], rotationY: -0.12, width: 3.65, height: 2.25 },
  { sectionIndex: 6, position: [-4.5, 1.7, 2.2], rotationY: 0.18, width: 3.0, height: 1.7 },
  { sectionIndex: 3, position: [4.6, 1.7, 1.9], rotationY: -0.18, width: 3.0, height: 1.7 },
  { sectionIndex: 1, position: [-11.5, 5.0, 2.0], rotationY: 0.42, width: 3.9, height: 6.4 },
  { sectionIndex: 4, position: [11.7, 5.2, 1.7], rotationY: -0.42, width: 3.9, height: 6.6 },
  { sectionIndex: 3, position: [-9.6, 11.6, -4.7], rotationY: 0.16, width: 3.5, height: 4.6 },
  { sectionIndex: 6, position: [9.8, 12.1, -5.0], rotationY: -0.16, width: 3.6, height: 4.7 },
  { sectionIndex: 5, position: [-4.1, 12.8, -8.7], rotationY: 0.05, width: 3.2, height: 4.1 },
  { sectionIndex: 2, position: [4.4, 13.0, -8.8], rotationY: -0.05, width: 3.25, height: 4.2 },
];

function FloatingMedia({ activeId, onSelect }: { activeId: string | null; onSelect: (section: Section) => void }) {
  return (
    <group>
      {FLOATING_MEDIA.map((item, index) => {
        const section = SECTIONS[item.sectionIndex % SECTIONS.length];
        return (
          <HoloScreen
            key={`floating-${index}`}
            section={section}
            position={item.position}
            rotationY={item.rotationY}
            width={item.width}
            height={item.height}
            onClick={() => onSelect(section)}
            active={activeId === section.id}
            showTitle={false}
            showPrompt={false}
          />
        );
      })}
    </group>
  );
}

function NeonCeiling() {
  const beams: Array<[number, number, number, number, string]> = [
    [-11.2, 11.0, 3.2, 0.34, BRAND_RED],
    [-5.0, 14.2, -0.2, -0.2, "#6c46ff"],
    [4.8, 14.0, -0.5, 0.22, "#6c46ff"],
    [11.5, 11.8, 2.0, -0.34, BRAND_RED],
  ];
  return (
    <group>
      {beams.map(([x, y, z, rotation, color], index) => (
        <mesh key={index} position={[x, y, z]} rotation={[0, 0, rotation]}>
          <boxGeometry args={[0.028, 8.2, 0.028]} />
          <meshBasicMaterial color={color} transparent opacity={0.5} toneMapped={false} />
        </mesh>
      ))}
      <Text position={[-12.1, 4.2, -4.5]} rotation={[0, 0.22, -Math.PI / 2]} fontSize={0.23} letterSpacing={0.3} color="#00e5ff">
        デジタル・ワールド
      </Text>
      <Text position={[12.1, 4.3, -4.4]} rotation={[0, -0.22, Math.PI / 2]} fontSize={0.23} letterSpacing={0.3} color="#ff31d5">
        VIRTUAL // PROJECTS
      </Text>
    </group>
  );
}

export function CityScene({ activeId, onSelect }: { activeId: string | null; onSelect: (section: Section | null) => void }) {
  const isMobile = useIsMobile();
  return (
    <Canvas
      shadows={false}
      dpr={Math.min(window.devicePixelRatio, isMobile ? 1.35 : 1.9)}
      gl={{ antialias: true, powerPreference: "high-performance", alpha: false }}
      camera={{ position: [5.5, 2.9, 14.2], fov: isMobile ? 68 : 54, near: 0.1, far: 120 }}
      onPointerMissed={() => onSelect(null)}
      style={{ position: "fixed", inset: 0 }}
    >
      <color attach="background" args={["#010102"]} />
      <fog attach="fog" args={["#020103", 16, 52]} />
      <ambientLight intensity={0.075} color="#ff1747" />
      <hemisphereLight args={["#39143f", "#010102", 0.15]} />
      <directionalLight position={[2, 15, 8]} intensity={0.18} color="#8d74ff" />
      <PlazaFloor isMobile={isMobile} />
      <MainBillboard activeId={activeId} onSelect={onSelect} />
      <DiagnosticsRoof />
      {PLAZA_BLOCKS.map((spec) => (
        <PlazaBlock key={spec.id} spec={spec} activeId={activeId} onSelect={onSelect} />
      ))}
      <FloatingMedia activeId={activeId} onSelect={onSelect} />
      <NeonCeiling />
      <Player isMobile={isMobile} />
      <EffectComposer multisampling={0} enableNormalPass={false}>
        <Bloom intensity={isMobile ? 0.9 : 1.36} luminanceThreshold={0.12} luminanceSmoothing={0.84} mipmapBlur />
        <Vignette eskil={false} offset={0.12} darkness={0.6} />
      </EffectComposer>
    </Canvas>
  );
}
