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
    const up = (event: KeyboardEvent) => { keys.current[event.code] = false; };
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
  const position = useRef(new THREE.Vector3(0, 0, 9.2));
  const bodyYaw = useRef(Math.PI);
  const verticalVelocity = useRef(0);
  const orbitYaw = useRef(0);
  const orbitPitch = useRef(0);
  const look = useRef(new THREE.Vector3(0, 1.35, 0));
  const keys = useKeys();

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const k = keys.current;
    const forward = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0);
    const turn = (k.KeyA || k.ArrowLeft ? 1 : 0) - (k.KeyD || k.ArrowRight ? 1 : 0);
    bodyYaw.current += turn * dt * 1.9;
    const speed = (k.ShiftLeft || k.ShiftRight ? 7.8 : 4.8) * forward;
    position.current.x += Math.sin(bodyYaw.current) * speed * dt;
    position.current.z += Math.cos(bodyYaw.current) * speed * dt;
    if (k.Space && position.current.y <= 0.001) verticalVelocity.current = 4.45;
    verticalVelocity.current -= 13 * dt;
    position.current.y = Math.max(0, position.current.y + verticalVelocity.current * dt);
    if (position.current.y === 0) verticalVelocity.current = 0;
    position.current.x = THREE.MathUtils.clamp(position.current.x, -10.8, 10.8);
    position.current.z = THREE.MathUtils.clamp(position.current.z, -8.0, 14.0);
    if (root.current) {
      root.current.position.copy(position.current);
      root.current.rotation.y = bodyYaw.current;
    }
    const targetYaw = isMobile ? 0 : state.pointer.x * 1.18;
    const targetPitch = isMobile ? 0 : state.pointer.y * 0.62;
    const orbitBlend = 1 - Math.exp(-dt * 7.5);
    orbitYaw.current = THREE.MathUtils.lerp(orbitYaw.current, targetYaw, orbitBlend);
    orbitPitch.current = THREE.MathUtils.lerp(orbitPitch.current, targetPitch, orbitBlend);
    const cameraYaw = bodyYaw.current + orbitYaw.current;
    const radius = isMobile ? 5.9 : 6.7;
    const horizontalRadius = Math.cos(orbitPitch.current * 0.68) * radius;
    const desired = new THREE.Vector3(
      position.current.x - Math.sin(cameraYaw) * horizontalRadius,
      position.current.y + (isMobile ? 2.65 : 2.9) + orbitPitch.current * 4.0,
      position.current.z - Math.cos(cameraYaw) * horizontalRadius,
    );
    const desiredLook = new THREE.Vector3(
      position.current.x + Math.sin(cameraYaw) * 4.7,
      position.current.y + 1.25 + orbitPitch.current * 5.0,
      position.current.z + Math.cos(cameraYaw) * 4.7,
    );
    const cameraBlend = 1 - Math.exp(-dt * 8.2);
    camera.position.lerp(desired, cameraBlend);
    look.current.lerp(desiredLook, cameraBlend);
    camera.lookAt(look.current);
  });

  return <group ref={root}><Kitty color="#ff073d" scale={0.98} /></group>;
}

function PlazaFloor({ isMobile }: { isMobile: boolean }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, -1.5]}>
      <planeGeometry args={[54, 50]} />
      <MeshReflectorMaterial blur={isMobile ? [64, 18] : [290, 86]} resolution={isMobile ? 256 : 768} mixBlur={1} mixStrength={isMobile ? 19 : 40} mirror={0.8} roughness={0.2} depthScale={1.2} minDepthThreshold={0.14} maxDepthThreshold={1.2} color="#030305" metalness={0.97} />
    </mesh>
  );
}

const MOSAIC_TILES: MosaicTile[] = [
  { sectionIndex: 1, position: [-4.7, 6.15, -6.72], width: 4.25, height: 2.55 },
  { sectionIndex: 2, position: [-0.95, 6.15, -6.72], width: 2.85, height: 2.55 },
  { sectionIndex: 3, position: [2.15, 6.15, -6.72], width: 2.9, height: 2.55 },
  { sectionIndex: 4, position: [5.05, 6.15, -6.72], width: 2.4, height: 2.55 },
  { sectionIndex: 5, position: [-5.05, 3.35, -6.72], width: 2.55, height: 2.65 },
  { sectionIndex: 6, position: [-2.05, 3.35, -6.72], width: 3.05, height: 2.65 },
  { sectionIndex: 1, position: [1.0, 3.35, -6.72], width: 2.6, height: 2.65 },
  { sectionIndex: 3, position: [4.35, 3.35, -6.72], width: 3.55, height: 2.65 },
  { sectionIndex: 2, position: [-4.55, 0.8, -6.72], width: 3.65, height: 1.85 },
  { sectionIndex: 4, position: [-0.8, 0.8, -6.72], width: 3.45, height: 1.85 },
  { sectionIndex: 5, position: [2.7, 0.8, -6.72], width: 3.4, height: 1.85 },
  { sectionIndex: 6, position: [5.35, 0.8, -6.72], width: 1.65, height: 1.85 },
];

function MainBillboard({ activeId, onSelect }: { activeId: string | null; onSelect: (section: Section) => void }) {
  return (
    <group>
      <mesh position={[0, 4.0, -7.1]}>
        <boxGeometry args={[15.2, 10.2, 0.64]} />
        <meshStandardMaterial color="#050609" roughness={0.31} metalness={0.8} />
      </mesh>
      {MOSAIC_TILES.map((tile, index) => {
        const section = SECTIONS[tile.sectionIndex % SECTIONS.length];
        return <HoloScreen key={`mosaic-${index}`} section={section} position={tile.position} width={tile.width} height={tile.height} onClick={() => onSelect(section)} active={activeId === section.id} showTitle={false} showPrompt={false} float={false} />;
      })}
      <Text position={[-7.1, 9.42, -6.35]} fontSize={0.2} letterSpacing={0.16} color="#f5f7ff" anchorX="left">JIOMETRY // PROJECT DISPLAY</Text>
      <Text position={[7.0, -1.22, -6.35]} fontSize={0.12} letterSpacing={0.14} color={BRAND_RED} anchorX="right">LIVE MEDIA MOSAIC // 12 CHANNELS</Text>
    </group>
  );
}

function DiagnosticsRoof() {
  return (
    <group position={[0.7, 10.55, -8.05]} rotation={[0, -0.03, 0]}>
      <mesh><planeGeometry args={[11.6, 2.25]} /><meshStandardMaterial color="#071109" emissive="#70ff6a" emissiveIntensity={0.12} roughness={0.34} /></mesh>
      <mesh position={[0, 1.08, 0.02]}><planeGeometry args={[11.6, 0.045]} /><meshBasicMaterial color="#8dff76" toneMapped={false} /></mesh>
      <Text position={[-5.35, 0.55, 0.035]} fontSize={0.19} letterSpacing={0.12} color="#8dff76" anchorX="left">SYSTEM // VIRTUAL ENVIRONMENT</Text>
      <Text position={[-5.35, 0.08, 0.035]} fontSize={0.095} letterSpacing={0.09} color="#dfffe5" anchorX="left">GPU ONLINE   MEDIA ARRAY SYNCHRONIZED   LIVE NODE 02</Text>
      {Array.from({ length: 8 }).map((_, index) => <mesh key={index} position={[-4.7 + index * 1.35, -0.53, 0.03]}><planeGeometry args={[0.82, 0.045]} /><meshBasicMaterial color={index % 3 === 0 ? "#a1ff72" : "#366d3e"} toneMapped={false} /></mesh>)}
    </group>
  );
}

const PLAZA_BLOCKS: PlazaBlockSpec[] = [
  { id: "left-front", position: [-9.3, -2.1], size: [4.3, 10.8, 5.6], accent: "#ff2bd6", faces: [
    { face: "front", sectionIndex: 4, y: 6.1, width: 3.75, height: 7.4 },
    { face: "right", sectionIndex: 2, y: 5.9, width: 4.85, height: 4.4 },
    { face: "right", sectionIndex: 6, y: 2.0, width: 4.85, height: 2.7 },
  ] },
  { id: "right-front", position: [9.6, -1.2], size: [4.5, 12.8, 5.8], accent: "#00e9ff", faces: [
    { face: "front", sectionIndex: 3, y: 7.0, width: 3.95, height: 8.7 },
    { face: "left", sectionIndex: 6, y: 7.7, width: 5.0, height: 5.4 },
    { face: "left", sectionIndex: 1, y: 2.8, width: 5.0, height: 3.2 },
  ] },
  { id: "left-rear", position: [-7.2, -10.8], size: [4.4, 17.6, 4.7], accent: "#7d4dff", faces: [
    { face: "front", sectionIndex: 2, y: 11.0, width: 3.85, height: 8.9 },
    { face: "front", sectionIndex: 4, y: 4.4, width: 3.85, height: 3.6 },
    { face: "right", sectionIndex: 5, y: 8.0, width: 4.0, height: 6.2 },
    { face: "right", sectionIndex: 1, y: 2.7, width: 4.0, height: 3.0 },
  ] },
  { id: "right-rear", position: [8.2, -11.6], size: [4.8, 18.8, 4.9], accent: "#ff3158", faces: [
    { face: "front", sectionIndex: 5, y: 12.0, width: 4.2, height: 9.5 },
    { face: "front", sectionIndex: 2, y: 4.6, width: 4.2, height: 3.7 },
    { face: "left", sectionIndex: 1, y: 8.2, width: 4.15, height: 6.5 },
    { face: "left", sectionIndex: 3, y: 2.7, width: 4.15, height: 3.0 },
  ] },
  { id: "far-left", position: [-13.2, -8.4], size: [4.5, 15.5, 5.1], accent: "#ffe54a", faces: [
    { face: "right", sectionIndex: 3, y: 10.2, width: 4.45, height: 7.6 },
    { face: "right", sectionIndex: 5, y: 3.9, width: 4.45, height: 4.2 },
    { face: "front", sectionIndex: 6, y: 8.0, width: 3.95, height: 5.7 },
  ] },
  { id: "far-right", position: [13.3, -7.6], size: [4.3, 14.8, 5.0], accent: "#6bff91", faces: [
    { face: "left", sectionIndex: 4, y: 9.7, width: 4.35, height: 7.4 },
    { face: "left", sectionIndex: 2, y: 3.5, width: 4.35, height: 4.0 },
    { face: "front", sectionIndex: 1, y: 7.6, width: 3.8, height: 5.5 },
  ] },
];

function PlazaBlock({ spec, activeId, onSelect }: { spec: PlazaBlockSpec; activeId: string | null; onSelect: (section: Section) => void }) {
  const [x, z] = spec.position;
  const [width, height, depth] = spec.size;
  return (
    <group>
      <mesh position={[x, height / 2, z]}><boxGeometry args={[width, height, depth]} /><meshStandardMaterial color="#050609" roughness={0.42} metalness={0.68} /></mesh>
      <mesh position={[x, height + 0.02, z]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[width * 0.82, depth * 0.82]} /><meshBasicMaterial color={spec.accent} transparent opacity={0.12} toneMapped={false} /></mesh>
      {spec.faces.map((media, index) => {
        const section = SECTIONS[media.sectionIndex % SECTIONS.length];
        const transform = faceTransform(media.face, x, z, width, depth, media.y);
        return <HoloScreen key={`${spec.id}-${media.face}-${index}`} section={section} position={transform.position} rotationY={transform.rotationY} width={media.width} height={media.height} onClick={() => onSelect(section)} active={activeId === section.id} showTitle={false} showPrompt={false} float={false} />;
      })}
      <Text position={[x, height + 0.5, z + depth / 2 + 0.06]} fontSize={0.15} letterSpacing={0.16} color={spec.accent} anchorX="center">{spec.id.toUpperCase()} // SIGNAL</Text>
      <pointLight position={[x, Math.min(height * 0.6, 8.5), z + 1]} color={spec.accent} intensity={0.75} distance={9} />
    </group>
  );
}

function faceTransform(face: Face, x: number, z: number, width: number, depth: number, y: number): { position: [number, number, number]; rotationY: number } {
  if (face === "left") return { position: [x - width / 2 - 0.04, y, z], rotationY: Math.PI / 2 };
  if (face === "right") return { position: [x + width / 2 + 0.04, y, z], rotationY: -Math.PI / 2 };
  return { position: [x, y, z + depth / 2 + 0.04], rotationY: 0 };
}

const FLOATING_MEDIA: FloatingMediaSpec[] = [
  { sectionIndex: 2, position: [-5.2, 2.0, -2.6], rotationY: 0.12, width: 2.7, height: 1.65 },
  { sectionIndex: 5, position: [5.25, 1.9, -2.4], rotationY: -0.12, width: 2.8, height: 1.7 },
  { sectionIndex: 6, position: [-4.0, 1.45, 2.0], rotationY: 0.2, width: 2.25, height: 1.25 },
  { sectionIndex: 3, position: [4.1, 1.45, 1.6], rotationY: -0.2, width: 2.25, height: 1.25 },
  { sectionIndex: 1, position: [-11.8, 4.0, 1.8], rotationY: 0.42, width: 3.0, height: 4.6 },
  { sectionIndex: 4, position: [11.9, 4.2, 1.5], rotationY: -0.42, width: 3.0, height: 4.8 },
  { sectionIndex: 3, position: [-9.3, 10.7, -5.0], rotationY: 0.18, width: 2.8, height: 3.6 },
  { sectionIndex: 6, position: [9.5, 11.2, -5.4], rotationY: -0.18, width: 2.9, height: 3.7 },
  { sectionIndex: 5, position: [-3.8, 11.8, -9.6], rotationY: 0.06, width: 2.5, height: 3.2 },
  { sectionIndex: 2, position: [4.1, 12.1, -9.7], rotationY: -0.06, width: 2.6, height: 3.3 },
];

function FloatingMedia({ activeId, onSelect }: { activeId: string | null; onSelect: (section: Section) => void }) {
  return (
    <group>
      {FLOATING_MEDIA.map((item, index) => {
        const section = SECTIONS[item.sectionIndex % SECTIONS.length];
        return <HoloScreen key={`floating-${index}`} section={section} position={item.position} rotationY={item.rotationY} width={item.width} height={item.height} onClick={() => onSelect(section)} active={activeId === section.id} showTitle={false} showPrompt={false} />;
      })}
    </group>
  );
}

function NeonCeiling() {
  const beams: Array<[number, number, number, number, string]> = [
    [-10.8, 10.5, 2.8, 0.36, BRAND_RED], [-4.8, 13.5, -0.6, -0.2, "#6c46ff"], [4.5, 13.2, -1.0, 0.23, "#6c46ff"], [11.2, 11.4, 1.8, -0.35, BRAND_RED],
  ];
  return (
    <group>
      {beams.map(([x, y, z, rotation, color], index) => <mesh key={index} position={[x, y, z]} rotation={[0, 0, rotation]}><boxGeometry args={[0.028, 7.8, 0.028]} /><meshBasicMaterial color={color} transparent opacity={0.48} toneMapped={false} /></mesh>)}
      <Text position={[-11.6, 4.0, -4.7]} rotation={[0, 0.22, -Math.PI / 2]} fontSize={0.22} letterSpacing={0.3} color="#00e5ff">デジタル・ワールド</Text>
      <Text position={[11.6, 4.2, -4.5]} rotation={[0, -0.22, Math.PI / 2]} fontSize={0.22} letterSpacing={0.3} color="#ff31d5">VIRTUAL // PROJECTS</Text>
    </group>
  );
}

export function CityScene({ activeId, onSelect }: { activeId: string | null; onSelect: (section: Section | null) => void }) {
  const isMobile = useIsMobile();
  return (
    <Canvas shadows={false} dpr={Math.min(window.devicePixelRatio, isMobile ? 1.35 : 1.9)} gl={{ antialias: true, powerPreference: "high-performance", alpha: false }} camera={{ position: [0, 3.0, 15.8], fov: isMobile ? 70 : 58, near: 0.1, far: 120 }} onPointerMissed={() => onSelect(null)} style={{ position: "fixed", inset: 0 }}>
      <color attach="background" args={["#010102"]} />
      <fog attach="fog" args={["#020103", 17, 55]} />
      <ambientLight intensity={0.075} color="#ff1747" />
      <hemisphereLight args={["#39143f", "#010102", 0.15]} />
      <directionalLight position={[2, 15, 8]} intensity={0.18} color="#8d74ff" />
      <PlazaFloor isMobile={isMobile} />
      <MainBillboard activeId={activeId} onSelect={onSelect} />
      <DiagnosticsRoof />
      {PLAZA_BLOCKS.map((spec) => <PlazaBlock key={spec.id} spec={spec} activeId={activeId} onSelect={onSelect} />)}
      <FloatingMedia activeId={activeId} onSelect={onSelect} />
      <NeonCeiling />
      <Player isMobile={isMobile} />
      <EffectComposer multisampling={0} enableNormalPass={false}>
        <Bloom intensity={isMobile ? 0.88 : 1.3} luminanceThreshold={0.13} luminanceSmoothing={0.84} mipmapBlur />
        <Vignette eskil={false} offset={0.12} darkness={0.6} />
      </EffectComposer>
    </Canvas>
  );
}
