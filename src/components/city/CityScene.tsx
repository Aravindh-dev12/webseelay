import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { MeshReflectorMaterial, Text } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { HoloScreen } from "./HoloScreen";
import { Kitty } from "./Kitty";
import { SECTIONS, BRAND_RED, type Section } from "./data";

type ControlDetail = { code: string; down: boolean };

type TileSpec = {
  sectionIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

type SideScreenSpec = {
  sectionIndex: number;
  position: [number, number, number];
  rotationY: number;
  width: number;
  height: number;
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

function Player({ isMobile }: { isMobile: boolean }) {
  const { camera } = useThree();
  const root = useRef<THREE.Group>(null);
  const pos = useRef(new THREE.Vector3(0, 0, 10.8));
  const yaw = useRef(Math.PI);
  const velocityY = useRef(0);
  const look = useRef(new THREE.Vector3(0, 1.15, -2));
  const keys = useKeys();

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const k = keys.current;
    const forward = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0);
    const turn = (k.KeyA || k.ArrowLeft ? 1 : 0) - (k.KeyD || k.ArrowRight ? 1 : 0);
    yaw.current += turn * dt * 2.05;
    const speed = (k.ShiftLeft || k.ShiftRight ? 7.8 : 4.9) * forward;
    pos.current.x += Math.sin(yaw.current) * speed * dt;
    pos.current.z += Math.cos(yaw.current) * speed * dt;

    if (k.Space && pos.current.y <= 0.001) velocityY.current = 4.4;
    velocityY.current -= 13 * dt;
    pos.current.y = Math.max(0, pos.current.y + velocityY.current * dt);
    if (pos.current.y === 0) velocityY.current = 0;

    pos.current.x = THREE.MathUtils.clamp(pos.current.x, -11.5, 11.5);
    pos.current.z = THREE.MathUtils.clamp(pos.current.z, -1.5, 17);

    if (root.current) {
      root.current.position.copy(pos.current);
      root.current.rotation.y = yaw.current;
    }

    const pointerYaw = state.pointer.x * (isMobile ? 0.03 : 0.08);
    const camYaw = yaw.current + pointerYaw;
    const radius = isMobile ? 6.2 : 7.0;
    const desired = new THREE.Vector3(
      pos.current.x - Math.sin(camYaw) * radius,
      pos.current.y + (isMobile ? 2.65 : 2.85),
      pos.current.z - Math.cos(camYaw) * radius,
    );
    const desiredLook = new THREE.Vector3(
      pos.current.x + Math.sin(yaw.current) * 4.0,
      pos.current.y + 1.14,
      pos.current.z + Math.cos(yaw.current) * 4.0,
    );

    const t = Math.min(1, dt * 4.7);
    camera.position.lerp(desired, t);
    look.current.lerp(desiredLook, t);
    camera.lookAt(look.current);
  });

  return (
    <group ref={root}>
      <Kitty color="#ff073d" scale={1.0} />
    </group>
  );
}

function Ground({ isMobile }: { isMobile: boolean }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.045, 1]}>
      <planeGeometry args={[80, 80]} />
      <MeshReflectorMaterial
        blur={isMobile ? [70, 18] : [280, 90]}
        resolution={isMobile ? 256 : 768}
        mixBlur={1}
        mixStrength={isMobile ? 22 : 40}
        mirror={0.75}
        roughness={0.22}
        depthScale={1.2}
        minDepthThreshold={0.14}
        maxDepthThreshold={1.2}
        color="#030305"
        metalness={0.95}
      />
    </mesh>
  );
}

const MOSAIC_TILES: TileSpec[] = [
  { sectionIndex: 1, x: -4.9, y: 2.15, width: 5.8, height: 3.7 },
  { sectionIndex: 2, x: 0.0, y: 2.15, width: 3.7, height: 3.7 },
  { sectionIndex: 3, x: 4.15, y: 2.15, width: 4.5, height: 3.7 },
  { sectionIndex: 4, x: -5.0, y: -1.7, width: 3.2, height: 3.3 },
  { sectionIndex: 5, x: -1.45, y: -1.7, width: 3.7, height: 3.3 },
  { sectionIndex: 6, x: 2.55, y: -1.7, width: 4.0, height: 3.3 },
  { sectionIndex: 1, x: 5.55, y: -1.7, width: 2.0, height: 3.3 },
];

const SIDE_SCREENS: SideScreenSpec[] = [
  { sectionIndex: 2, position: [-11.6, 6.1, -4.6], rotationY: 0.34, width: 4.4, height: 6.1 },
  { sectionIndex: 3, position: [11.6, 6.0, -4.5], rotationY: -0.34, width: 4.4, height: 6.0 },
  { sectionIndex: 4, position: [-8.8, 9.0, -8.4], rotationY: 0.16, width: 3.2, height: 3.2 },
  { sectionIndex: 5, position: [8.6, 9.2, -8.4], rotationY: -0.16, width: 3.4, height: 3.2 },
  { sectionIndex: 6, position: [-11.4, 2.5, -0.5], rotationY: 0.5, width: 3.4, height: 2.2 },
  { sectionIndex: 1, position: [11.2, 2.6, -0.3], rotationY: -0.5, width: 3.4, height: 2.3 },
];

function DiagnosticsStrip() {
  return (
    <group position={[0, 9.6, -7.5]}>
      <mesh>
        <planeGeometry args={[13.8, 1.6]} />
        <meshStandardMaterial color="#061108" emissive="#71ff64" emissiveIntensity={0.13} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.78, 0.02]}>
        <planeGeometry args={[13.8, 0.04]} />
        <meshBasicMaterial color="#7dff69" toneMapped={false} />
      </mesh>
      <Text position={[-6.5, 0.34, 0.03]} fontSize={0.2} letterSpacing={0.13} color="#8aff74" anchorX="left">
        GEN-02 SYSTEM / LIVE SIGNAL MAP
      </Text>
      <Text position={[-6.5, -0.08, 0.03]} fontSize={0.105} letterSpacing={0.08} color="#d8ffe0" anchorX="left">
        24 NODES ONLINE   ·   MEDIA ARRAY SYNCED   ·   GPU NOMINAL   ·   CITY FEED ACTIVE
      </Text>
      {Array.from({ length: 10 }).map((_, i) => (
        <mesh key={i} position={[-5.8 + i * 1.25, -0.48, 0.025]}>
          <planeGeometry args={[0.78, 0.04]} />
          <meshBasicMaterial color={i % 3 === 0 ? "#b4ff78" : "#3e7647"} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function MosaicWall({ activeId, onSelect }: { activeId: string | null; onSelect: (section: Section) => void }) {
  return (
    <group position={[0, 5.25, -7.5]}>
      <mesh position={[0, 0.25, -0.32]}>
        <boxGeometry args={[15.8, 8.2, 0.42]} />
        <meshStandardMaterial color="#040507" metalness={0.8} roughness={0.28} />
      </mesh>
      {MOSAIC_TILES.map((tile, index) => {
        const section = SECTIONS[tile.sectionIndex % SECTIONS.length];
        return (
          <HoloScreen
            key={`mosaic-${index}-${section.id}`}
            section={section}
            position={[tile.x, tile.y, 0]}
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
    </group>
  );
}

function SideScreens({ activeId, onSelect }: { activeId: string | null; onSelect: (section: Section) => void }) {
  return (
    <group>
      {SIDE_SCREENS.map((screen, index) => {
        const section = SECTIONS[screen.sectionIndex % SECTIONS.length];
        return (
          <HoloScreen
            key={`side-${index}-${section.id}`}
            section={section}
            position={screen.position}
            rotationY={screen.rotationY}
            width={screen.width}
            height={screen.height}
            onClick={() => onSelect(section)}
            active={activeId === section.id}
            showTitle={index < 2}
            showPrompt={false}
          />
        );
      })}
    </group>
  );
}

function NeonArchitecture() {
  return (
    <group>
      {[
        [-12.4, 10.4, 1.5, 0.5, BRAND_RED],
        [-5.8, 12.0, -0.6, -0.24, "#5a3fff"],
        [5.8, 12.2, -0.4, 0.24, "#5a3fff"],
        [12.4, 10.2, 1.4, -0.5, BRAND_RED],
      ].map(([x, y, z, r, color], index) => (
        <mesh key={index} position={[x as number, y as number, z as number]} rotation={[0, 0, r as number]}>
          <boxGeometry args={[0.025, 9.2, 0.025]} />
          <meshBasicMaterial color={color as string} transparent opacity={0.5} toneMapped={false} />
        </mesh>
      ))}
      <Text position={[-13.0, 5.0, -3.2]} rotation={[0, 0.3, -Math.PI / 2]} fontSize={0.24} letterSpacing={0.3} color="#00e5ff">
        デジタル・ワールド
      </Text>
      <Text position={[13.0, 5.0, -3.2]} rotation={[0, -0.3, Math.PI / 2]} fontSize={0.24} letterSpacing={0.3} color="#ff31d5">
        MEDIA // ARRAY
      </Text>
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

  return (
    <Canvas
      shadows={false}
      dpr={Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2.1)}
      gl={{ antialias: true, powerPreference: "high-performance", alpha: false }}
      camera={{ position: [0, 2.95, 16.8], fov: isMobile ? 70 : 57, near: 0.1, far: 150 }}
      onPointerMissed={() => onSelect(null)}
      style={{ position: "fixed", inset: 0 }}
    >
      <color attach="background" args={["#010102"]} />
      <fog attach="fog" args={["#020103", 17, 60]} />
      <ambientLight intensity={0.075} color="#ff1747" />
      <hemisphereLight args={["#42163f", "#010102", 0.15]} />
      <directionalLight position={[4, 15, 8]} intensity={0.19} color="#8d74ff" />
      <directionalLight position={[-8, 9, -1]} intensity={0.15} color="#ff1747" />

      <Ground isMobile={isMobile} />
      <DiagnosticsStrip />
      <MosaicWall activeId={activeId} onSelect={onSelect} />
      <SideScreens activeId={activeId} onSelect={onSelect} />
      <NeonArchitecture />
      <Player isMobile={isMobile} />

      <EffectComposer multisampling={0} enableNormalPass={false}>
        <Bloom intensity={isMobile ? 0.95 : 1.45} luminanceThreshold={0.14} luminanceSmoothing={0.84} mipmapBlur />
        <Vignette eskil={false} offset={0.13} darkness={0.64} />
      </EffectComposer>
    </Canvas>
  );
}
