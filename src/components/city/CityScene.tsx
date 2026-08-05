import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { MeshReflectorMaterial, Text } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { HoloScreen } from "./HoloScreen";
import { Kitty } from "./Kitty";
import { SECTIONS, BRAND_RED, type Section } from "./data";

type ControlDetail = { code: string; down: boolean };

type BuildingSpec = {
  id: string;
  side: "left" | "right";
  z: number;
  width: number;
  depth: number;
  height: number;
  sectionIndex: number;
  frontSectionIndex: number;
  accent: string;
  x?: number;
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
  const pos = useRef(new THREE.Vector3(0, 0, 20));
  const yaw = useRef(Math.PI);
  const velocityY = useRef(0);
  const cameraLook = useRef(new THREE.Vector3(0, 1.25, 8));
  const orbitYaw = useRef(0);
  const orbitPitch = useRef(0);
  const keys = useKeys();

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const k = keys.current;
    const forward = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0);
    const turn = (k.KeyA || k.ArrowLeft ? 1 : 0) - (k.KeyD || k.ArrowRight ? 1 : 0);

    yaw.current += turn * dt * 1.9;
    const speed = (k.ShiftLeft || k.ShiftRight ? 9.4 : 5.8) * forward;
    pos.current.x += Math.sin(yaw.current) * speed * dt;
    pos.current.z += Math.cos(yaw.current) * speed * dt;

    if (k.Space && pos.current.y <= 0.001) velocityY.current = 4.5;
    velocityY.current -= 13 * dt;
    pos.current.y = Math.max(0, pos.current.y + velocityY.current * dt);
    if (pos.current.y === 0) velocityY.current = 0;

    pos.current.x = THREE.MathUtils.clamp(pos.current.x, -4.9, 4.9);
    pos.current.z = THREE.MathUtils.clamp(pos.current.z, -78, 24);

    if (root.current) {
      root.current.position.copy(pos.current);
      root.current.rotation.y = yaw.current;
    }

    const targetOrbitYaw = isMobile ? 0 : state.pointer.x * 1.08;
    const targetOrbitPitch = isMobile ? 0 : state.pointer.y * 0.58;
    const orbitLerp = 1 - Math.exp(-dt * 7.2);
    orbitYaw.current = THREE.MathUtils.lerp(orbitYaw.current, targetOrbitYaw, orbitLerp);
    orbitPitch.current = THREE.MathUtils.lerp(orbitPitch.current, targetOrbitPitch, orbitLerp);

    const radius = isMobile ? 6.2 : 7.2;
    const cameraYaw = yaw.current + orbitYaw.current;
    const horizontalRadius = Math.cos(orbitPitch.current * 0.72) * radius;
    const baseHeight = isMobile ? 2.75 : 3.0;

    const desired = new THREE.Vector3(
      pos.current.x - Math.sin(cameraYaw) * horizontalRadius,
      pos.current.y + baseHeight + orbitPitch.current * 4.1,
      pos.current.z - Math.cos(cameraYaw) * horizontalRadius,
    );

    const desiredLook = new THREE.Vector3(
      pos.current.x + Math.sin(cameraYaw) * 5.4,
      pos.current.y + 1.3 + orbitPitch.current * 5.2,
      pos.current.z + Math.cos(cameraYaw) * 5.4,
    );

    const cameraLerp = 1 - Math.exp(-dt * 8.5);
    camera.position.lerp(desired, cameraLerp);
    cameraLook.current.lerp(desiredLook, cameraLerp);
    camera.lookAt(cameraLook.current);
  });

  return (
    <group ref={root}>
      <Kitty color="#ff073d" scale={0.98} />
    </group>
  );
}

function Ground({ isMobile }: { isMobile: boolean }) {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, -28]}>
        <planeGeometry args={[58, 148]} />
        <MeshReflectorMaterial
          blur={isMobile ? [70, 18] : [320, 100]}
          resolution={isMobile ? 256 : 768}
          mixBlur={1}
          mixStrength={isMobile ? 20 : 44}
          mirror={0.8}
          roughness={0.19}
          depthScale={1.3}
          minDepthThreshold={0.12}
          maxDepthThreshold={1.3}
          color="#030305"
          metalness={0.97}
        />
      </mesh>
      <StreetTrim />
    </>
  );
}

function StreetTrim() {
  return (
    <group position={[0, 0.015, -28]}>
      {[-5.45, 5.45].map((x) => (
        <mesh key={x} position={[x, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.05, 146]} />
          <meshBasicMaterial color={BRAND_RED} transparent opacity={0.34} toneMapped={false} />
        </mesh>
      ))}
      {Array.from({ length: 19 }).map((_, i) => (
        <mesh key={i} position={[0, 0, 50 - i * 8]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.055, 3.3]} />
          <meshBasicMaterial color={i % 3 === 0 ? "#6e37ff" : "#391020"} transparent opacity={0.48} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

const BUILDINGS: BuildingSpec[] = [
  { id: "L1", side: "left", z: 12, width: 8.6, depth: 14, height: 22, sectionIndex: 1, frontSectionIndex: 4, accent: "#ff1747", x: -9.8 },
  { id: "R1", side: "right", z: 9, width: 8.2, depth: 15, height: 26, sectionIndex: 2, frontSectionIndex: 3, accent: "#00dfff", x: 9.8 },
  { id: "L2", side: "left", z: -5, width: 9.2, depth: 16, height: 31, sectionIndex: 3, frontSectionIndex: 5, accent: "#9f4dff", x: -10.0 },
  { id: "R2", side: "right", z: -8, width: 8.7, depth: 16, height: 24, sectionIndex: 4, frontSectionIndex: 6, accent: "#ff2ecb", x: 10.1 },
  { id: "L3", side: "left", z: -24, width: 8.8, depth: 17, height: 28, sectionIndex: 5, frontSectionIndex: 2, accent: "#ffe45c", x: -9.9 },
  { id: "R3", side: "right", z: -27, width: 9.5, depth: 18, height: 35, sectionIndex: 6, frontSectionIndex: 1, accent: "#73ff91", x: 10.2 },
  { id: "L4", side: "left", z: -44, width: 9.4, depth: 17, height: 36, sectionIndex: 2, frontSectionIndex: 3, accent: "#00e5ff", x: -10.1 },
  { id: "R4", side: "right", z: -48, width: 8.9, depth: 17, height: 30, sectionIndex: 1, frontSectionIndex: 5, accent: "#ff1747", x: 10.0 },
  { id: "L5", side: "left", z: -63, width: 9.0, depth: 15, height: 25, sectionIndex: 4, frontSectionIndex: 6, accent: "#ff2ecb", x: -9.7 },
  { id: "R5", side: "right", z: -66, width: 9.3, depth: 16, height: 33, sectionIndex: 3, frontSectionIndex: 2, accent: "#8e5cff", x: 10.1 },
];

function VideoBuilding({
  spec,
  activeId,
  onSelect,
}: {
  spec: BuildingSpec;
  activeId: string | null;
  onSelect: (section: Section) => void;
}) {
  const innerSection = SECTIONS[spec.sectionIndex % SECTIONS.length];
  const frontSection = SECTIONS[spec.frontSectionIndex % SECTIONS.length];
  const x = spec.x ?? (spec.side === "left" ? -10 : 10);
  const innerX = spec.side === "left" ? x + spec.width / 2 + 0.03 : x - spec.width / 2 - 0.03;
  const innerRotation = spec.side === "left" ? Math.PI / 2 : -Math.PI / 2;
  const frontZ = spec.z + spec.depth / 2 + 0.03;

  return (
    <group>
      <mesh position={[x, spec.height / 2, spec.z]}>
        <boxGeometry args={[spec.width, spec.height, spec.depth]} />
        <meshStandardMaterial color="#06070a" roughness={0.4} metalness={0.68} />
      </mesh>

      <HoloScreen
        section={innerSection}
        position={[innerX, spec.height * 0.5, spec.z]}
        rotationY={innerRotation}
        width={spec.depth - 0.45}
        height={spec.height - 0.55}
        onClick={() => onSelect(innerSection)}
        active={activeId === innerSection.id}
        showTitle={false}
        showPrompt={false}
        float={false}
      />

      <HoloScreen
        section={frontSection}
        position={[x, spec.height * 0.66, frontZ]}
        width={spec.width - 0.35}
        height={spec.height * 0.6}
        onClick={() => onSelect(frontSection)}
        active={activeId === frontSection.id}
        showTitle={false}
        showPrompt={false}
        float={false}
      />

      <Text
        position={[
          spec.side === "left" ? innerX + 0.04 : innerX - 0.04,
          spec.height - 0.42,
          spec.z - spec.depth * 0.35,
        ]}
        rotation={[0, innerRotation, 0]}
        fontSize={0.2}
        letterSpacing={0.18}
        color={spec.accent}
        anchorX="center"
      >
        {spec.id} // LIVE MEDIA
      </Text>

      <pointLight position={[innerX, spec.height * 0.48, spec.z]} color={spec.accent} intensity={1.5} distance={13} />
    </group>
  );
}

function EndTower({ activeId, onSelect }: { activeId: string | null; onSelect: (section: Section) => void }) {
  const main = SECTIONS[1] ?? SECTIONS[0];
  const upper = SECTIONS[3] ?? main;
  return (
    <group>
      <mesh position={[0, 18, -82]}>
        <boxGeometry args={[24, 36, 7]} />
        <meshStandardMaterial color="#050609" roughness={0.38} metalness={0.74} />
      </mesh>
      <HoloScreen
        section={main}
        position={[0, 13.4, -78.45]}
        width={22.4}
        height={24.5}
        onClick={() => onSelect(main)}
        active={activeId === main.id}
        showTitle={false}
        showPrompt={false}
        float={false}
      />
      <HoloScreen
        section={upper}
        position={[0, 30.8, -78.4]}
        width={17.3}
        height={5.0}
        onClick={() => onSelect(upper)}
        active={activeId === upper.id}
        showTitle={false}
        showPrompt={false}
        float={false}
      />
      <Text position={[0, 34.0, -78.2]} fontSize={0.4} letterSpacing={0.34} color="#8cff7b" anchorX="center">
        GEN-02 // CITY SIGNAL
      </Text>
    </group>
  );
}

function RoofLights() {
  return (
    <group>
      {BUILDINGS.map((building, index) => {
        const x = building.x ?? (building.side === "left" ? -10 : 10);
        return (
          <mesh key={building.id} position={[x, building.height + 2.0, building.z]} rotation={[0, 0, index % 2 ? -0.18 : 0.18]}>
            <boxGeometry args={[0.035, 5.2, 0.035]} />
            <meshBasicMaterial color={building.accent} transparent opacity={0.75} toneMapped={false} />
          </mesh>
        );
      })}
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
  const buildings = useMemo(() => BUILDINGS, []);

  return (
    <Canvas
      shadows={false}
      dpr={Math.min(window.devicePixelRatio, isMobile ? 1.4 : 2.0)}
      gl={{ antialias: true, powerPreference: "high-performance", alpha: false }}
      camera={{ position: [0, 3.0, 27], fov: isMobile ? 72 : 60, near: 0.1, far: 230 }}
      onPointerMissed={() => onSelect(null)}
      style={{ position: "fixed", inset: 0 }}
    >
      <color attach="background" args={["#010102"]} />
      <fog attach="fog" args={["#020103", 26, 118]} />
      <ambientLight intensity={0.065} color="#ff1747" />
      <hemisphereLight args={["#30143c", "#010102", 0.14]} />
      <directionalLight position={[0, 20, 14]} intensity={0.18} color="#8f6cff" />

      <Ground isMobile={isMobile} />
      {buildings.map((spec) => (
        <VideoBuilding key={spec.id} spec={spec} activeId={activeId} onSelect={onSelect} />
      ))}
      <EndTower activeId={activeId} onSelect={onSelect} />
      <RoofLights />
      <Player isMobile={isMobile} />

      <EffectComposer multisampling={0} enableNormalPass={false}>
        <Bloom intensity={isMobile ? 0.9 : 1.42} luminanceThreshold={0.12} luminanceSmoothing={0.85} mipmapBlur />
        <Vignette eskil={false} offset={0.12} darkness={0.58} />
      </EffectComposer>
    </Canvas>
  );
}
