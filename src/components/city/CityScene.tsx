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
  const pos = useRef(new THREE.Vector3(0, 0, 18));
  const yaw = useRef(Math.PI);
  const velocityY = useRef(0);
  const look = useRef(new THREE.Vector3(0, 1.2, 8));
  const keys = useKeys();

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const k = keys.current;
    const forward = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0);
    const turn = (k.KeyA || k.ArrowLeft ? 1 : 0) - (k.KeyD || k.ArrowRight ? 1 : 0);

    yaw.current += turn * dt * 1.95;
    const speed = (k.ShiftLeft || k.ShiftRight ? 9.2 : 5.7) * forward;
    pos.current.x += Math.sin(yaw.current) * speed * dt;
    pos.current.z += Math.cos(yaw.current) * speed * dt;

    if (k.Space && pos.current.y <= 0.001) velocityY.current = 4.5;
    velocityY.current -= 13 * dt;
    pos.current.y = Math.max(0, pos.current.y + velocityY.current * dt);
    if (pos.current.y === 0) velocityY.current = 0;

    pos.current.x = THREE.MathUtils.clamp(pos.current.x, -5.4, 5.4);
    pos.current.z = THREE.MathUtils.clamp(pos.current.z, -57, 22);

    if (root.current) {
      root.current.position.copy(pos.current);
      root.current.rotation.y = yaw.current;
    }

    const pointerYaw = state.pointer.x * (isMobile ? 0.025 : 0.065);
    const camYaw = yaw.current + pointerYaw;
    const radius = isMobile ? 6.0 : 6.8;
    const desired = new THREE.Vector3(
      pos.current.x - Math.sin(camYaw) * radius,
      pos.current.y + (isMobile ? 2.7 : 2.85),
      pos.current.z - Math.cos(camYaw) * radius,
    );
    const desiredLook = new THREE.Vector3(
      pos.current.x + Math.sin(yaw.current) * 5.2,
      pos.current.y + 1.25,
      pos.current.z + Math.cos(yaw.current) * 5.2,
    );

    const t = Math.min(1, dt * 4.9);
    camera.position.lerp(desired, t);
    look.current.lerp(desiredLook, t);
    camera.lookAt(look.current);
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
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, -20]}>
        <planeGeometry args={[56, 118]} />
        <MeshReflectorMaterial
          blur={isMobile ? [70, 18] : [300, 96]}
          resolution={isMobile ? 256 : 768}
          mixBlur={1}
          mixStrength={isMobile ? 20 : 42}
          mirror={0.78}
          roughness={0.2}
          depthScale={1.25}
          minDepthThreshold={0.14}
          maxDepthThreshold={1.25}
          color="#030305"
          metalness={0.96}
        />
      </mesh>
      <StreetTrim />
    </>
  );
}

function StreetTrim() {
  return (
    <group position={[0, 0.015, -20]}>
      {[-5.85, 5.85].map((x) => (
        <mesh key={x} position={[x, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.05, 116]} />
          <meshBasicMaterial color={BRAND_RED} transparent opacity={0.32} toneMapped={false} />
        </mesh>
      ))}
      {Array.from({ length: 15 }).map((_, i) => (
        <mesh key={i} position={[0, 0, 36 - i * 8]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.055, 3.3]} />
          <meshBasicMaterial color={i % 3 === 0 ? "#6e37ff" : "#391020"} transparent opacity={0.45} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

const BUILDINGS: BuildingSpec[] = [
  { id: "L1", side: "left", z: 8, width: 8.2, depth: 15, height: 17, sectionIndex: 1, frontSectionIndex: 4, accent: "#ff1747" },
  { id: "R1", side: "right", z: 5, width: 7.8, depth: 16, height: 20, sectionIndex: 2, frontSectionIndex: 3, accent: "#00dfff" },
  { id: "L2", side: "left", z: -11, width: 9.0, depth: 17, height: 24, sectionIndex: 3, frontSectionIndex: 5, accent: "#9f4dff" },
  { id: "R2", side: "right", z: -14, width: 8.4, depth: 15, height: 18, sectionIndex: 4, frontSectionIndex: 6, accent: "#ff2ecb" },
  { id: "L3", side: "left", z: -31, width: 8.5, depth: 18, height: 21, sectionIndex: 5, frontSectionIndex: 2, accent: "#ffe45c" },
  { id: "R3", side: "right", z: -34, width: 9.4, depth: 18, height: 27, sectionIndex: 6, frontSectionIndex: 1, accent: "#73ff91" },
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
  const x = spec.side === "left" ? -10.3 : 10.3;
  const innerX = spec.side === "left" ? x + spec.width / 2 + 0.03 : x - spec.width / 2 - 0.03;
  const innerRotation = spec.side === "left" ? Math.PI / 2 : -Math.PI / 2;
  const frontZ = spec.z + spec.depth / 2 + 0.03;

  return (
    <group>
      <mesh position={[x, spec.height / 2, spec.z]}>
        <boxGeometry args={[spec.width, spec.height, spec.depth]} />
        <meshStandardMaterial color="#06070a" roughness={0.42} metalness={0.65} />
      </mesh>

      <HoloScreen
        section={innerSection}
        position={[innerX, spec.height * 0.52, spec.z]}
        rotationY={innerRotation}
        width={spec.depth - 0.65}
        height={spec.height - 1.05}
        onClick={() => onSelect(innerSection)}
        active={activeId === innerSection.id}
        showTitle={false}
        showPrompt={false}
        float={false}
      />

      <HoloScreen
        section={frontSection}
        position={[x, spec.height * 0.68, frontZ]}
        width={spec.width - 0.55}
        height={spec.height * 0.56}
        onClick={() => onSelect(frontSection)}
        active={activeId === frontSection.id}
        showTitle={false}
        showPrompt={false}
        float={false}
      />

      <Text
        position={[
          spec.side === "left" ? innerX + 0.04 : innerX - 0.04,
          spec.height - 0.6,
          spec.z - spec.depth * 0.34,
        ]}
        rotation={[0, innerRotation, 0]}
        fontSize={0.22}
        letterSpacing={0.18}
        color={spec.accent}
        anchorX="center"
      >
        {spec.id} // LIVE MEDIA
      </Text>

      <pointLight
        position={[innerX, spec.height * 0.48, spec.z]}
        color={spec.accent}
        intensity={1.4}
        distance={12}
      />
    </group>
  );
}

function EndTower({ activeId, onSelect }: { activeId: string | null; onSelect: (section: Section) => void }) {
  const main = SECTIONS[1] ?? SECTIONS[0];
  const upper = SECTIONS[3] ?? main;
  return (
    <group>
      <mesh position={[0, 13, -53]}>
        <boxGeometry args={[23, 26, 6]} />
        <meshStandardMaterial color="#050609" roughness={0.4} metalness={0.72} />
      </mesh>
      <HoloScreen
        section={main}
        position={[0, 9.8, -49.95]}
        width={21.7}
        height={17.2}
        onClick={() => onSelect(main)}
        active={activeId === main.id}
        showTitle={false}
        showPrompt={false}
        float={false}
      />
      <HoloScreen
        section={upper}
        position={[0, 21.6, -49.9]}
        width={16.5}
        height={4.4}
        onClick={() => onSelect(upper)}
        active={activeId === upper.id}
        showTitle={false}
        showPrompt={false}
        float={false}
      />
      <Text position={[0, 24.3, -49.75]} fontSize={0.38} letterSpacing={0.32} color="#8cff7b" anchorX="center">
        GEN-02 // CITY SIGNAL
      </Text>
    </group>
  );
}

function RoofLights() {
  return (
    <group>
      {BUILDINGS.map((building, index) => {
        const x = building.side === "left" ? -10.3 : 10.3;
        return (
          <mesh key={building.id} position={[x, building.height + 1.8, building.z]} rotation={[0, 0, index % 2 ? -0.18 : 0.18]}>
            <boxGeometry args={[0.035, 4.5, 0.035]} />
            <meshBasicMaterial color={building.accent} transparent opacity={0.72} toneMapped={false} />
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
      camera={{ position: [0, 3.0, 25], fov: isMobile ? 72 : 61, near: 0.1, far: 190 }}
      onPointerMissed={() => onSelect(null)}
      style={{ position: "fixed", inset: 0 }}
    >
      <color attach="background" args={["#010102"]} />
      <fog attach="fog" args={["#020103", 24, 95]} />
      <ambientLight intensity={0.07} color="#ff1747" />
      <hemisphereLight args={["#30143c", "#010102", 0.14]} />
      <directionalLight position={[0, 18, 12]} intensity={0.17} color="#8f6cff" />

      <Ground isMobile={isMobile} />
      {buildings.map((spec) => (
        <VideoBuilding key={spec.id} spec={spec} activeId={activeId} onSelect={onSelect} />
      ))}
      <EndTower activeId={activeId} onSelect={onSelect} />
      <RoofLights />
      <Player isMobile={isMobile} />

      <EffectComposer multisampling={0} enableNormalPass={false}>
        <Bloom intensity={isMobile ? 0.9 : 1.38} luminanceThreshold={0.13} luminanceSmoothing={0.84} mipmapBlur />
        <Vignette eskil={false} offset={0.12} darkness={0.58} />
      </EffectComposer>
    </Canvas>
  );
}
