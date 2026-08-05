import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { MeshReflectorMaterial, Text } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { HoloScreen } from "./HoloScreen";
import { Kitty } from "./Kitty";
import { SECTIONS, BRAND_RED, type Section } from "./data";

type ControlDetail = { code: string; down: boolean };
type VideoPanelSpec = {
  sectionIndex: number;
  position: [number, number, number];
  rotationY?: number;
  width: number;
  height: number;
};

type UtilityPanelSpec = {
  position: [number, number, number];
  rotationY?: number;
  width: number;
  height: number;
  color: string;
  title: string;
  subtitle: string;
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
  const pos = useRef(new THREE.Vector3(0, 0, 10.5));
  const yaw = useRef(Math.PI);
  const velocityY = useRef(0);
  const look = useRef(new THREE.Vector3(0, 1, -2));
  const keys = useKeys();

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const k = keys.current;
    const forward = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0);
    const turn = (k.KeyA || k.ArrowLeft ? 1 : 0) - (k.KeyD || k.ArrowRight ? 1 : 0);
    yaw.current += turn * dt * 2.05;
    const speed = (k.ShiftLeft || k.ShiftRight ? 8.0 : 5.0) * forward;
    pos.current.x += Math.sin(yaw.current) * speed * dt;
    pos.current.z += Math.cos(yaw.current) * speed * dt;

    if (k.Space && pos.current.y <= 0.001) velocityY.current = 4.4;
    velocityY.current -= 13 * dt;
    pos.current.y = Math.max(0, pos.current.y + velocityY.current * dt);
    if (pos.current.y === 0) velocityY.current = 0;

    pos.current.x = THREE.MathUtils.clamp(pos.current.x, -12.5, 12.5);
    pos.current.z = THREE.MathUtils.clamp(pos.current.z, -2.5, 16.5);

    if (root.current) {
      root.current.position.copy(pos.current);
      root.current.rotation.y = yaw.current;
    }

    const pointerYaw = state.pointer.x * (isMobile ? 0.03 : 0.09);
    const camYaw = yaw.current + pointerYaw;
    const radius = isMobile ? 6.4 : 7.1;
    const desired = new THREE.Vector3(
      pos.current.x - Math.sin(camYaw) * radius,
      pos.current.y + (isMobile ? 2.7 : 2.9),
      pos.current.z - Math.cos(camYaw) * radius,
    );
    const desiredLook = new THREE.Vector3(
      pos.current.x + Math.sin(yaw.current) * 4.0,
      pos.current.y + 1.15,
      pos.current.z + Math.cos(yaw.current) * 4.0,
    );

    const t = Math.min(1, dt * 4.7);
    camera.position.lerp(desired, t);
    look.current.lerp(desiredLook, t);
    camera.lookAt(look.current);
  });

  return (
    <group ref={root}>
      <Kitty color="#ff073d" scale={1.03} />
    </group>
  );
}

function Ground({ isMobile }: { isMobile: boolean }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.045, 1]}>
      <planeGeometry args={[80, 80]} />
      <MeshReflectorMaterial
        blur={isMobile ? [70, 18] : [260, 82]}
        resolution={isMobile ? 256 : 768}
        mixBlur={1}
        mixStrength={isMobile ? 20 : 38}
        mirror={0.72}
        roughness={0.24}
        depthScale={1.2}
        minDepthThreshold={0.16}
        maxDepthThreshold={1.2}
        color="#040406"
        metalness={0.94}
      />
    </mesh>
  );
}

function MainScreen({ activeId, onSelect }: { activeId: string | null; onSelect: (section: Section) => void }) {
  const main = SECTIONS.find((section) => section.kind === "project") ?? SECTIONS[0];
  return (
    <group>
      <mesh position={[0, 4.7, -7.8]}>
        <boxGeometry args={[17.9, 10.4, 0.44]} />
        <meshStandardMaterial color="#050608" roughness={0.32} metalness={0.74} />
      </mesh>
      <HoloScreen
        section={main}
        position={[0, 4.9, -7.5]}
        width={16.8}
        height={7.4}
        onClick={() => onSelect(main)}
        active={activeId === main.id}
        showTitle
        showPrompt
        float={false}
      />
      <Text position={[0, 9.75, -7.18]} fontSize={0.25} letterSpacing={0.32} color="#f4fbff" anchorX="center">
        DIGITAL PROJECT ARRAY
      </Text>
    </group>
  );
}

const VIDEO_PANELS: VideoPanelSpec[] = [
  { sectionIndex: 1, position: [-10.7, 6.2, -5.5], rotationY: 0.34, width: 4.6, height: 6.4 },
  { sectionIndex: 2, position: [-7.0, 9.5, -8.7], rotationY: 0.15, width: 3.4, height: 4.8 },
  { sectionIndex: 3, position: [10.5, 6.2, -5.3], rotationY: -0.32, width: 4.7, height: 6.0 },
  { sectionIndex: 4, position: [7.2, 9.7, -8.9], rotationY: -0.14, width: 4.3, height: 3.0 },
  { sectionIndex: 5, position: [-11.7, 2.15, -0.5], rotationY: 0.5, width: 3.8, height: 2.15 },
  { sectionIndex: 6, position: [11.4, 2.55, -0.1], rotationY: -0.48, width: 3.5, height: 3.0 },
  { sectionIndex: 2, position: [-5.0, 2.3, -4.2], rotationY: 0.12, width: 3.2, height: 1.75 },
  { sectionIndex: 3, position: [5.2, 2.25, -4.0], rotationY: -0.12, width: 3.2, height: 1.8 },
  { sectionIndex: 1, position: [-3.2, 7.9, -8.95], rotationY: 0.03, width: 2.3, height: 2.8 },
  { sectionIndex: 4, position: [3.4, 8.1, -9.0], rotationY: -0.03, width: 2.4, height: 2.6 },
  { sectionIndex: 5, position: [-12.0, 4.2, -2.8], rotationY: 0.42, width: 2.7, height: 3.3 },
  { sectionIndex: 6, position: [12.1, 4.4, -2.6], rotationY: -0.42, width: 2.8, height: 3.4 },
];

const UTILITY_PANELS: UtilityPanelSpec[] = [
  { position: [-8.2, 4.0, -2.8], rotationY: 0.28, width: 2.8, height: 4.5, color: "#00e8ff", title: "SIGNAL", subtitle: "NODE 021" },
  { position: [8.4, 4.2, -2.8], rotationY: -0.28, width: 2.9, height: 4.8, color: "#ff2cd3", title: "NEURAL", subtitle: "GRID 119" },
  { position: [-6.2, 3.0, -1.2], rotationY: 0.18, width: 2.1, height: 2.5, color: "#75ff9d", title: "ONLINE", subtitle: "SYS OK" },
  { position: [6.4, 3.1, -1.0], rotationY: -0.18, width: 2.1, height: 2.6, color: "#ffe65c", title: "LIVE", subtitle: "SYNC" },
];

function VideoWall({ activeId, onSelect }: { activeId: string | null; onSelect: (section: Section) => void }) {
  return (
    <group>
      {VIDEO_PANELS.map((panel, index) => {
        const section = SECTIONS[panel.sectionIndex % SECTIONS.length];
        return (
          <HoloScreen
            key={`${section.id}-${index}`}
            section={section}
            position={panel.position}
            rotationY={panel.rotationY}
            width={panel.width}
            height={panel.height}
            onClick={() => onSelect(section)}
            active={activeId === section.id}
            showTitle={index % 3 === 0}
            showPrompt={false}
          />
        );
      })}
      {UTILITY_PANELS.map((panel) => (
        <UtilityPanel key={panel.title + panel.subtitle} {...panel} />
      ))}
    </group>
  );
}

function UtilityPanel({ position, rotationY = 0, width, height, color, title, subtitle }: UtilityPanelSpec) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color="#040507" emissive={color} emissiveIntensity={0.08} metalness={0.5} roughness={0.38} />
      </mesh>
      <mesh position={[0, height / 2, 0.02]}>
        <planeGeometry args={[width, 0.04]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh position={[-width / 2, 0, 0.02]}>
        <planeGeometry args={[0.04, height]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <Text position={[-width / 2 + 0.14, height / 2 - 0.34, 0.04]} fontSize={0.22} letterSpacing={0.12} color={color} anchorX="left">
        {title}
      </Text>
      <Text position={[-width / 2 + 0.14, height / 2 - 0.68, 0.04]} fontSize={0.11} letterSpacing={0.1} color="#e7faff" anchorX="left">
        {subtitle}
      </Text>
      {Array.from({ length: 8 }).map((_, row) => (
        <mesh key={row} position={[0, height / 2 - 1.05 - row * 0.32, 0.03]}>
          <planeGeometry args={[width * (0.44 + ((row + title.length) % 4) * 0.11), 0.025]} />
          <meshBasicMaterial color={row % 3 === 0 ? color : "#78909a"} transparent opacity={row % 3 === 0 ? 0.72 : 0.28} toneMapped={false} />
        </mesh>
      ))}
      <pointLight color={color} intensity={0.55} distance={4} />
    </group>
  );
}

function LightArchitecture() {
  return (
    <group>
      {[
        [-11, 10, 2, 0.52, BRAND_RED],
        [-5, 12, -1, -0.24, "#5b3dff"],
        [5, 12, 0, 0.24, "#5b3dff"],
        [11, 10, 1, -0.5, BRAND_RED],
      ].map(([x, y, z, r, color], index) => (
        <mesh key={index} position={[x as number, y as number, z as number]} rotation={[0, 0, r as number]}>
          <boxGeometry args={[0.025, 8.5, 0.025]} />
          <meshBasicMaterial color={color as string} transparent opacity={0.52} toneMapped={false} />
        </mesh>
      ))}
      <Text position={[-12.8, 5.0, -3.6]} rotation={[0, 0.3, -Math.PI / 2]} fontSize={0.25} letterSpacing={0.3} color="#00dfff">
        デジタル・ワールド
      </Text>
      <Text position={[12.8, 5.3, -3.5]} rotation={[0, -0.3, Math.PI / 2]} fontSize={0.25} letterSpacing={0.3} color="#ff31d5">
        PROJECT // ARRAY
      </Text>
    </group>
  );
}

export function CityScene({ activeId, onSelect }: { activeId: string | null; onSelect: (section: Section | null) => void }) {
  const isMobile = useIsMobile();

  return (
    <Canvas
      shadows={false}
      dpr={Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2.1)}
      gl={{ antialias: true, powerPreference: "high-performance", alpha: false }}
      camera={{ position: [0, 3.0, 16.5], fov: isMobile ? 70 : 58, near: 0.1, far: 150 }}
      onPointerMissed={() => onSelect(null)}
      style={{ position: "fixed", inset: 0 }}
    >
      <color attach="background" args={["#010102"]} />
      <fog attach="fog" args={["#030105", 17, 58]} />
      <ambientLight intensity={0.08} color="#ff1747" />
      <hemisphereLight args={["#42163f", "#010102", 0.16]} />
      <directionalLight position={[4, 15, 8]} intensity={0.2} color="#8d74ff" />
      <directionalLight position={[-8, 9, -1]} intensity={0.16} color="#ff1747" />

      <Ground isMobile={isMobile} />
      <MainScreen activeId={activeId} onSelect={onSelect} />
      <VideoWall activeId={activeId} onSelect={onSelect} />
      <LightArchitecture />
      <Player isMobile={isMobile} />

      <EffectComposer multisampling={0} enableNormalPass={false}>
        <Bloom intensity={isMobile ? 0.95 : 1.4} luminanceThreshold={0.14} luminanceSmoothing={0.84} mipmapBlur />
        <Vignette eskil={false} offset={0.13} darkness={0.64} />
      </EffectComposer>
    </Canvas>
  );
}
