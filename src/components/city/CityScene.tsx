import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { MeshReflectorMaterial, Text } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { HoloScreen } from "./HoloScreen";
import { Kitty } from "./Kitty";
import { SECTIONS, BRAND_RED, type Section } from "./data";

type ControlDetail = { code: string; down: boolean };

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return mobile;
}

function useKeys() {
  const keys = useRef<Record<string, boolean>>({});
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault();
    };
    const up = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };
    const external = (e: Event) => {
      const detail = (e as CustomEvent<ControlDetail>).detail;
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

function Player({ target, isMobile }: { target: { pos: THREE.Vector3; look: THREE.Vector3 } | null; isMobile: boolean }) {
  const { camera } = useThree();
  const keys = useKeys();
  const root = useRef<THREE.Group>(null);
  const pos = useRef(new THREE.Vector3(0, 0, 11));
  const yaw = useRef(Math.PI);
  const velY = useRef(0);
  const look = useRef(new THREE.Vector3(0, 1, 0));

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const k = keys.current;
    const forward = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0);
    const turn = (k.KeyA || k.ArrowLeft ? 1 : 0) - (k.KeyD || k.ArrowRight ? 1 : 0);
    yaw.current += turn * dt * 2.25;
    const speed = (k.ShiftLeft || k.ShiftRight ? 8.5 : 5.4) * forward;
    pos.current.x += Math.sin(yaw.current) * speed * dt;
    pos.current.z += Math.cos(yaw.current) * speed * dt;

    if (k.Space && pos.current.y <= 0.001) velY.current = 4.6;
    velY.current -= 13 * dt;
    pos.current.y = Math.max(0, pos.current.y + velY.current * dt);
    if (pos.current.y === 0) velY.current = 0;

    pos.current.x = THREE.MathUtils.clamp(pos.current.x, -14, 14);
    pos.current.z = THREE.MathUtils.clamp(pos.current.z, -4, 20);

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
      const orbit = state.pointer.x * (isMobile ? 0.02 : 0.08);
      const r = isMobile ? 5.4 : 4.5;
      const camYaw = yaw.current + orbit;
      desired.set(
        pos.current.x - Math.sin(camYaw) * r,
        pos.current.y + (isMobile ? 2.7 : 2.35),
        pos.current.z - Math.cos(camYaw) * r,
      );
      desiredLook.set(pos.current.x, pos.current.y + 0.9, pos.current.z - 2.8);
    }
    camera.position.lerp(desired, Math.min(1, dt * 4.8));
    look.current.lerp(desiredLook, Math.min(1, dt * 5));
    camera.lookAt(look.current);
  });

  return (
    <group ref={root}>
      <Kitty color="#ff0038" scale={0.92} />
    </group>
  );
}

function Floor({ isMobile }: { isMobile: boolean }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 5]}>
      <planeGeometry args={[90, 90]} />
      <MeshReflectorMaterial
        blur={isMobile ? [70, 18] : [220, 60]}
        resolution={isMobile ? 256 : 768}
        mixBlur={1}
        mixStrength={isMobile ? 12 : 28}
        roughness={0.22}
        depthScale={1.2}
        minDepthThreshold={0.2}
        maxDepthThreshold={1.3}
        color="#060307"
        metalness={0.94}
        mirror={0.78}
      />
    </mesh>
  );
}

function Plaza({ onSelect, activeId, isMobile }: { onSelect: (s: Section) => void; activeId: string | null; isMobile: boolean }) {
  const featured = SECTIONS.find((s) => s.kind === "project") ?? SECTIONS[0];
  const width = isMobile ? 12.8 : 18.5;
  const height = isMobile ? 6.4 : 9.4;

  const ghosts = useMemo(
    () => [
      [-6.5, 0, -0.8, "#ff0038", 0.8],
      [6.2, 0, 0.4, "#175cff", 0.82],
      [-8.2, 0, 4.7, "#ff0038", 0.64],
      [8.1, 0, 5.2, "#175cff", 0.64],
      [-3.6, 0, 4.9, "#175cff", 0.58],
      [3.5, 0, 5.5, "#ff0038", 0.6],
    ] as Array<[number, number, number, string, number]>,
    [],
  );

  return (
    <group position={[0, 0, -10]}>
      <mesh position={[0, 5.9, -0.9]}>
        <boxGeometry args={[width + 2.4, 12.6, 0.7]} />
        <meshStandardMaterial color="#070306" roughness={0.28} metalness={0.8} />
      </mesh>
      <mesh position={[0, 0.18, 0.9]}>
        <boxGeometry args={[width + 7.2, 0.35, 9.5]} />
        <meshStandardMaterial color="#090509" roughness={0.18} metalness={0.86} />
      </mesh>

      <HoloScreen
        section={featured}
        position={[0, 6.4, 0]}
        width={width}
        height={height}
        onClick={() => onSelect(featured)}
        active={activeId === featured.id}
      />

      <Text position={[0, 12.25, 0.18]} fontSize={0.48} letterSpacing={0.38} color={BRAND_RED}>
        DIGITAL EXPERIENCE / 2026
      </Text>

      <Text position={[0, 0.23, 4.4]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.36} letterSpacing={0.3} color="#ff1747">
        MOVE CLOSER · INTERACT WITH THE SCREEN
      </Text>

      {ghosts.map(([x, y, z, color, scale], i) => (
        <group key={i} position={[x, y, z]} rotation={[0, i % 2 ? -0.45 : 0.45, 0]}>
          <Kitty color={color} scale={scale} />
        </group>
      ))}

      <NeonMonolith position={[-10.6, 2.1, 0.2]} color="#ff0038" label="01" />
      <NeonMonolith position={[10.6, 2.1, 0.7]} color="#175cff" label="02" />
      <NeonMonolith position={[-11.5, 1.6, 6.7]} color="#175cff" label="LIVE" />
      <NeonMonolith position={[11.5, 1.6, 6.7]} color="#ff0038" label="PLAY" />
    </group>
  );
}

function NeonMonolith({ position, color, label }: { position: [number, number, number]; color: string; label: string }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[2.2, 4.2, 0.42]} />
        <meshStandardMaterial color="#080408" emissive={color} emissiveIntensity={0.55} roughness={0.3} metalness={0.76} />
      </mesh>
      <mesh position={[0, 0, 0.24]}>
        <planeGeometry args={[1.8, 3.7]} />
        <meshBasicMaterial color={color} transparent opacity={0.11} toneMapped={false} />
      </mesh>
      <Text position={[0, 0, 0.28]} fontSize={0.42} color={color} letterSpacing={0.16}>
        {label}
      </Text>
      <pointLight color={color} intensity={2.5} distance={7} />
    </group>
  );
}

function Backdrop() {
  const blocks = useMemo(() => {
    const a: Array<[number, number, number, number, number, string]> = [];
    const r = mulberry32(7);
    for (let i = 0; i < 34; i++) {
      const x = (r() - 0.5) * 64;
      const z = -25 - r() * 30;
      const h = 5 + r() * 16;
      const w = 2 + r() * 5;
      const c = i % 3 === 0 ? "#ff0038" : i % 5 === 0 ? "#175cff" : "#0b0710";
      a.push([x, h / 2, z, w, h, c]);
    }
    return a;
  }, []);
  return (
    <group>
      {blocks.map(([x, y, z, w, h, c], i) => (
        <mesh key={i} position={[x, y, z]}>
          <boxGeometry args={[w, h, w]} />
          <meshStandardMaterial color="#09050a" emissive={c} emissiveIntensity={c === "#0b0710" ? 0.06 : 0.28} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function CityScene({ activeId, onSelect }: { activeId: string | null; onSelect: (s: Section | null) => void }) {
  const isMobile = useIsMobile();
  const target = useMemo(() => {
    if (!activeId) return null;
    return {
      pos: new THREE.Vector3(isMobile ? 6.5 : 8.2, 4.4, -2.5),
      look: new THREE.Vector3(0, 5.8, -10),
    };
  }, [activeId, isMobile]);

  return (
    <Canvas
      dpr={Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2)}
      gl={{ antialias: true, powerPreference: "high-performance", alpha: false }}
      camera={{ position: [0, 2.5, 16], fov: isMobile ? 70 : 58, near: 0.1, far: 220 }}
      onPointerMissed={() => onSelect(null)}
      style={{ position: "fixed", inset: 0 }}
    >
      <color attach="background" args={["#020104"]} />
      <fog attach="fog" args={["#030105", 22, 88]} />
      <ambientLight intensity={0.16} color="#ff0038" />
      <hemisphereLight args={["#290518", "#020104", 0.3]} />
      <directionalLight position={[14, 26, 10]} intensity={0.34} color="#ff1747" />
      <directionalLight position={[-16, 22, 3]} intensity={0.2} color="#175cff" />

      <Floor isMobile={isMobile} />
      <Backdrop />
      <Plaza onSelect={onSelect} activeId={activeId} isMobile={isMobile} />
      <Player target={target} isMobile={isMobile} />

      <EffectComposer multisampling={0} enableNormalPass={false}>
        <Bloom intensity={isMobile ? 0.8 : 1.2} luminanceThreshold={0.12} luminanceSmoothing={0.9} mipmapBlur />
        <Vignette eskil={false} offset={0.1} darkness={0.72} />
      </EffectComposer>
    </Canvas>
  );
}
