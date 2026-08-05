import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { MeshReflectorMaterial, Text } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { HoloScreen } from "./HoloScreen";
import { Kitty } from "./Kitty";
import { SECTIONS, BRAND_RED, type Section } from "./data";

type ControlDetail = { code: string; down: boolean };
type PanelSpec = {
  position: [number, number, number];
  rotationY?: number;
  size: [number, number];
  color: string;
  label: string;
  sub?: string;
};

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
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
        event.preventDefault();
      }
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

function Player({
  target,
  isMobile,
}: {
  target: { pos: THREE.Vector3; look: THREE.Vector3 } | null;
  isMobile: boolean;
}) {
  const { camera } = useThree();
  const root = useRef<THREE.Group>(null);
  const pos = useRef(new THREE.Vector3(0, 0, 8.8));
  const yaw = useRef(Math.PI);
  const velocityY = useRef(0);
  const look = useRef(new THREE.Vector3(0, 1, 0));
  const keys = useKeys();

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const pressed = keys.current;
    const forward =
      (pressed.KeyW || pressed.ArrowUp ? 1 : 0) -
      (pressed.KeyS || pressed.ArrowDown ? 1 : 0);
    const turn =
      (pressed.KeyA || pressed.ArrowLeft ? 1 : 0) -
      (pressed.KeyD || pressed.ArrowRight ? 1 : 0);

    yaw.current += turn * dt * 2.15;
    const speed = (pressed.ShiftLeft || pressed.ShiftRight ? 8.2 : 5.1) * forward;
    pos.current.x += Math.sin(yaw.current) * speed * dt;
    pos.current.z += Math.cos(yaw.current) * speed * dt;

    if (pressed.Space && pos.current.y <= 0.001) velocityY.current = 4.5;
    velocityY.current -= 13 * dt;
    pos.current.y = Math.max(0, pos.current.y + velocityY.current * dt);
    if (pos.current.y === 0) velocityY.current = 0;

    pos.current.x = THREE.MathUtils.clamp(pos.current.x, -13.5, 13.5);
    pos.current.z = THREE.MathUtils.clamp(pos.current.z, -7, 17);

    if (root.current) {
      root.current.position.copy(pos.current);
      root.current.rotation.y = yaw.current;
    }

    const desired = new THREE.Vector3();
    const desiredLook = new THREE.Vector3();
    if (target) {
      desired.copy(target.pos);
      desiredLook.copy(target.look);
    } else {
      const pointerLean = state.pointer.x * (isMobile ? 0.05 : 0.11);
      const cameraYaw = yaw.current + pointerLean;
      const radius = isMobile ? 6.7 : 7.4;
      desired.set(
        pos.current.x - Math.sin(cameraYaw) * radius,
        pos.current.y + (isMobile ? 2.85 : 3.0),
        pos.current.z - Math.cos(cameraYaw) * radius,
      );
      desiredLook.set(
        pos.current.x + Math.sin(yaw.current) * 3.7,
        pos.current.y + 1.28,
        pos.current.z + Math.cos(yaw.current) * 3.7,
      );
    }

    const t = Math.min(1, dt * 4.6);
    camera.position.lerp(desired, t);
    look.current.lerp(desiredLook, t);
    camera.lookAt(look.current);
  });

  return (
    <group ref={root}>
      <Kitty color="#ff073d" scale={1.08} />
    </group>
  );
}

function Ground({ isMobile }: { isMobile: boolean }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.045, 1]}>
      <planeGeometry args={[72, 72]} />
      <MeshReflectorMaterial
        blur={isMobile ? [72, 18] : [240, 70]}
        resolution={isMobile ? 256 : 768}
        mixBlur={1}
        mixStrength={isMobile ? 18 : 34}
        mirror={0.67}
        roughness={0.28}
        depthScale={1.15}
        minDepthThreshold={0.18}
        maxDepthThreshold={1.2}
        color="#050407"
        metalness={0.92}
      />
    </mesh>
  );
}

function MainStage({
  activeId,
  onSelect,
}: {
  activeId: string | null;
  onSelect: (section: Section) => void;
}) {
  const main = SECTIONS.find((section) => section.kind === "project") ?? SECTIONS[0];
  return (
    <group>
      <mesh position={[0, 4.5, -7.65]}>
        <boxGeometry args={[17.7, 10.1, 0.38]} />
        <meshStandardMaterial color="#06070a" roughness={0.34} metalness={0.68} />
      </mesh>
      <HoloScreen
        section={main}
        position={[0, 4.75, -7.38]}
        width={16.4}
        height={7.0}
        onClick={() => onSelect(main)}
        active={activeId === main.id}
      />
      <Text
        position={[0, 9.6, -7.08]}
        fontSize={0.29}
        letterSpacing={0.34}
        color="#f1f7ff"
        anchorX="center"
        anchorY="middle"
      >
        VIRTUAL // PROJECT ARRAY
      </Text>
    </group>
  );
}

const PANEL_SPECS: PanelSpec[] = [
  { position: [-10.6, 5.3, -5.0], rotationY: 0.34, size: [4.6, 7.2], color: "#ff28d7", label: "NEURAL", sub: "EXPERIENCE" },
  { position: [-6.7, 8.8, -8.5], rotationY: 0.12, size: [3.2, 5.0], color: "#785cff", label: "GEN-02", sub: "SYSTEM" },
  { position: [9.7, 6.8, -5.7], rotationY: -0.33, size: [4.3, 6.5], color: "#00eaff", label: "VIRTUAL", sub: "SIGNAL" },
  { position: [6.4, 9.4, -9.1], rotationY: -0.12, size: [4.5, 3.2], color: "#9aff76", label: "SYSTEM STATUS", sub: "ONLINE" },
  { position: [-11.6, 2.15, 0.2], rotationY: 0.52, size: [3.8, 2.0], color: "#d9f7ff", label: "DREAM", sub: "ARCHIVE" },
  { position: [11.4, 2.55, -0.2], rotationY: -0.5, size: [3.4, 3.1], color: "#ff315b", label: "LIVE", sub: "NODE" },
  { position: [-3.9, 3.05, -7.1], size: [2.35, 1.5], color: "#ff223f", label: "DRIFT", sub: "1101" },
  { position: [4.6, 3.2, -7.15], size: [2.5, 1.45], color: "#ffdc45", label: "SYNTH", sub: "WAVE" },
];

function NeonPanels() {
  return (
    <group>
      {PANEL_SPECS.map((spec, index) => (
        <StaticPanel key={`${spec.label}-${index}`} spec={spec} index={index} />
      ))}
      <VerticalGlyphs position={[-8.0, 3.4, -3.0]} color="#00d7ff" />
      <VerticalGlyphs position={[8.6, 4.4, -2.9]} color="#ff35da" mirrored />
    </group>
  );
}

function StaticPanel({ spec, index }: { spec: PanelSpec; index: number }) {
  const [width, height] = spec.size;
  return (
    <group position={spec.position} rotation={[0, spec.rotationY ?? 0, 0]}>
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial
          color="#05070a"
          emissive={spec.color}
          emissiveIntensity={0.06}
          roughness={0.4}
          metalness={0.5}
        />
      </mesh>
      <mesh position={[0, height / 2, 0.012]}>
        <planeGeometry args={[width, 0.045]} />
        <meshBasicMaterial color={spec.color} toneMapped={false} />
      </mesh>
      <mesh position={[-width / 2, 0, 0.012]}>
        <planeGeometry args={[0.045, height]} />
        <meshBasicMaterial color={spec.color} toneMapped={false} />
      </mesh>
      <Text
        position={[-width / 2 + 0.18, height / 2 - 0.42, 0.03]}
        fontSize={Math.min(0.36, width * 0.09)}
        letterSpacing={0.14}
        color={spec.color}
        anchorX="left"
        anchorY="middle"
      >
        {spec.label}
      </Text>
      <Text
        position={[-width / 2 + 0.18, height / 2 - 0.82, 0.03]}
        fontSize={0.15}
        letterSpacing={0.12}
        color="#d6e7ed"
        anchorX="left"
        anchorY="middle"
      >
        {spec.sub ?? "ONLINE"}
      </Text>
      {Array.from({ length: 6 }).map((_, row) => (
        <mesh key={row} position={[0.2, height / 2 - 1.35 - row * 0.42, 0.025]}>
          <planeGeometry args={[width * (0.45 + ((index + row) % 4) * 0.11), 0.035]} />
          <meshBasicMaterial color={row % 3 === 0 ? spec.color : "#8ba2aa"} transparent opacity={row % 3 === 0 ? 0.75 : 0.34} toneMapped={false} />
        </mesh>
      ))}
      <pointLight color={spec.color} intensity={0.65} distance={4.5} />
    </group>
  );
}

function VerticalGlyphs({
  position,
  color,
  mirrored = false,
}: {
  position: [number, number, number];
  color: string;
  mirrored?: boolean;
}) {
  return (
    <group position={position} rotation={[0, mirrored ? -0.25 : 0.25, 0]}>
      <Text
        position={[0, 0, 0]}
        rotation={[0, 0, -Math.PI / 2]}
        fontSize={0.33}
        letterSpacing={0.32}
        color={color}
        anchorX="center"
        anchorY="middle"
      >
        デジタル・ワールド
      </Text>
    </group>
  );
}

function Crowd() {
  const crowd = useMemo(
    () => [
      { p: [-5.6, 0, 1.3] as [number, number, number], c: "#ff073d", s: 0.8, r: 0.2 },
      { p: [-2.5, 0, -0.7] as [number, number, number], c: "#ff073d", s: 0.72, r: -0.15 },
      { p: [2.35, 0, 0.15] as [number, number, number], c: "#ff073d", s: 0.78, r: 0.12 },
      { p: [5.8, 0, 1.0] as [number, number, number], c: "#006dff", s: 0.86, r: -0.18 },
      { p: [8.7, 0, -0.9] as [number, number, number], c: "#006dff", s: 0.66, r: 0.25 },
      { p: [-8.25, 0, -1.5] as [number, number, number], c: "#ff7a18", s: 0.64, r: -0.25 },
      { p: [0.0, 0, -2.15] as [number, number, number], c: "#ff073d", s: 0.62, r: 0 },
    ],
    [],
  );

  return (
    <group>
      {crowd.map((npc, index) => (
        <group key={index} position={npc.p} rotation={[0, npc.r, 0]}>
          <Kitty color={npc.c} scale={npc.s} />
        </group>
      ))}
    </group>
  );
}

function CeilingLasers() {
  return (
    <group>
      {[
        [-10, 11, 2, 0.55],
        [-4, 13, -1, -0.24],
        [5, 12, 0, 0.25],
        [10, 10, 1, -0.48],
      ].map(([x, y, z, r], index) => (
        <mesh key={index} position={[x, y, z]} rotation={[0, 0, r]}>
          <boxGeometry args={[0.025, 7.5, 0.025]} />
          <meshBasicMaterial color={index % 2 ? "#5c34ff" : BRAND_RED} transparent opacity={0.45} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

export function CityScene({
  activeId,
  onSelect,
}: {
  activeId: string | null;
  onSelect: (section: Section | null) => void;
}) {
  const isMobile = useIsMobile();
  const target = useMemo(() => {
    if (!activeId) return null;
    const section = SECTIONS.find((item) => item.id === activeId);
    if (!section) return null;
    return {
      pos: new THREE.Vector3(isMobile ? 5.8 : 6.8, isMobile ? 4.1 : 4.6, 2.8),
      look: new THREE.Vector3(0, 4.5, -7.2),
    };
  }, [activeId, isMobile]);

  return (
    <Canvas
      shadows={false}
      dpr={Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2.15)}
      gl={{ antialias: true, powerPreference: "high-performance", alpha: false }}
      camera={{ position: [0, 3.2, 15.2], fov: isMobile ? 70 : 59, near: 0.1, far: 150 }}
      onPointerMissed={() => onSelect(null)}
      style={{ position: "fixed", inset: 0 }}
    >
      <color attach="background" args={["#010102"]} />
      <fog attach="fog" args={["#030105", 18, 58]} />

      <ambientLight intensity={0.09} color="#ff1747" />
      <hemisphereLight args={["#4b1747", "#010102", 0.18]} />
      <directionalLight position={[4, 15, 8]} intensity={0.22} color="#9d73ff" />
      <directionalLight position={[-8, 9, -1]} intensity={0.18} color="#ff1747" />

      <Ground isMobile={isMobile} />
      <MainStage activeId={activeId} onSelect={onSelect} />
      <NeonPanels />
      <Crowd />
      <CeilingLasers />
      <Player target={target} isMobile={isMobile} />

      <EffectComposer multisampling={0} enableNormalPass={false}>
        <Bloom intensity={isMobile ? 0.95 : 1.35} luminanceThreshold={0.16} luminanceSmoothing={0.82} mipmapBlur />
        <Vignette eskil={false} offset={0.13} darkness={0.63} />
      </EffectComposer>
    </Canvas>
  );
}
