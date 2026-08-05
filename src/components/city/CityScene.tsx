import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { MeshReflectorMaterial, Text } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { NeonTower } from "./NeonTower";
import { HoloScreen } from "./HoloScreen";
import { SignClutter } from "./SignClutter";
import { Kitty } from "./Kitty";
import { ACCENTS, SECTIONS, BRAND_RED, type Section } from "./data";

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
      if (!detail) return;
      keys.current[detail.code] = detail.down;
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
  const group = useRef<THREE.Group>(null);
  const yaw = useRef(0);
  const velocityY = useRef(0);
  const position = useRef(new THREE.Vector3(0, 0, -54));
  const keys = useKeys();
  const cameraLook = useRef(new THREE.Vector3(0, 1.2, 0));

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const pressed = keys.current;
    const forward =
      (pressed.KeyW || pressed.ArrowUp ? 1 : 0) -
      (pressed.KeyS || pressed.ArrowDown ? 1 : 0);
    const turn =
      (pressed.KeyA || pressed.ArrowLeft ? 1 : 0) -
      (pressed.KeyD || pressed.ArrowRight ? 1 : 0);

    yaw.current += turn * dt * 2.35;
    const speed = (pressed.ShiftLeft || pressed.ShiftRight ? 14 : 8.5) * forward;
    position.current.x += Math.sin(yaw.current) * speed * dt;
    position.current.z += Math.cos(yaw.current) * speed * dt;

    if (pressed.Space && position.current.y <= 0.001) velocityY.current = 5.8;
    velocityY.current -= 14 * dt;
    position.current.y = Math.max(0, position.current.y + velocityY.current * dt);
    if (position.current.y === 0) velocityY.current = 0;

    position.current.x = THREE.MathUtils.clamp(position.current.x, -38, 38);
    position.current.z = THREE.MathUtils.clamp(position.current.z, -70, 96);

    if (group.current) {
      group.current.position.copy(position.current);
      group.current.rotation.y = yaw.current;
    }

    const desiredPosition = new THREE.Vector3();
    const desiredLook = new THREE.Vector3();

    if (target) {
      desiredPosition.copy(target.pos);
      desiredLook.copy(target.look);
    } else {
      const pointerYaw = state.pointer.x * (isMobile ? 0.04 : 0.15);
      const pointerPitch = state.pointer.y * (isMobile ? 0.02 : 0.08);
      const cameraYaw = yaw.current + pointerYaw;
      const radius = isMobile ? 7.6 : 6.2;
      const height = isMobile ? 3.7 : 3.25;

      desiredPosition.set(
        position.current.x - Math.sin(cameraYaw) * radius,
        position.current.y + height - pointerPitch,
        position.current.z - Math.cos(cameraYaw) * radius,
      );
      desiredLook.set(
        position.current.x + Math.sin(yaw.current) * 2.2,
        position.current.y + 1.25,
        position.current.z + Math.cos(yaw.current) * 2.2,
      );
    }

    const lerp = Math.min(1, dt * 4.6);
    camera.position.lerp(desiredPosition, lerp);
    cameraLook.current.lerp(desiredLook, lerp);
    camera.lookAt(cameraLook.current);
  });

  return (
    <group ref={group}>
      <Kitty />
      <pointLight position={[0, 0.35, -0.25]} color={BRAND_RED} intensity={1.6} distance={6} />
    </group>
  );
}

function Ground({ isMobile }: { isMobile: boolean }) {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.045, 20]}>
        <planeGeometry args={[260, 280]} />
        <MeshReflectorMaterial
          blur={isMobile ? [90, 25] : [260, 80]}
          resolution={isMobile ? 256 : 768}
          mixBlur={1}
          mixStrength={isMobile ? 16 : 32}
          roughness={0.34}
          depthScale={1.1}
          minDepthThreshold={0.28}
          maxDepthThreshold={1.25}
          color="#09070b"
          metalness={0.88}
          mirror={0.52}
        />
      </mesh>
      <StreetGuides />
    </>
  );
}

function StreetGuides() {
  const zPositions = useMemo(() => Array.from({ length: 17 }, (_, i) => -58 + i * 9), []);
  return (
    <group position={[0, 0.018, 0]}>
      {zPositions.map((z, index) => (
        <group key={z}>
          <mesh position={[-5.5, 0, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.055, 5.2]} />
            <meshBasicMaterial
              color={index % 3 === 0 ? "#ff1647" : "#35101d"}
              transparent
              opacity={index % 3 === 0 ? 0.9 : 0.42}
              toneMapped={false}
            />
          </mesh>
          <mesh position={[5.5, 0, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.055, 5.2]} />
            <meshBasicMaterial
              color={index % 4 === 0 ? "#00d6ff" : "#151428"}
              transparent
              opacity={index % 4 === 0 ? 0.7 : 0.38}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function BackgroundCity() {
  const towers = useMemo(() => {
    const items: { p: [number, number, number]; w: number; h: number; d: number }[] = [];
    const random = mulberry32(42);
    for (let i = 0; i < 90; i++) {
      const angle = random() * Math.PI * 2;
      const distance = 58 + random() * 105;
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance + 16;
      const h = 10 + random() * 66;
      const w = 4 + random() * 9;
      items.push({ p: [x, h / 2, z], w, h, d: w });
    }
    return items;
  }, []);

  return (
    <group>
      {towers.map((tower, index) => (
        <BackgroundTower
          key={index}
          position={tower.p}
          width={tower.w}
          height={tower.h}
          depth={tower.d}
        />
      ))}
    </group>
  );
}

function BackgroundTower({
  position,
  width,
  height,
  depth,
}: {
  position: [number, number, number];
  width: number;
  height: number;
  depth: number;
}) {
  const uniforms = useMemo(
    () => ({ uSize: { value: new THREE.Vector3(width, height, depth) } }),
    [width, height, depth],
  );

  return (
    <mesh position={position}>
      <boxGeometry args={[width, height, depth]} />
      <shaderMaterial uniforms={uniforms} vertexShader={bgVert} fragmentShader={bgFrag} />
    </mesh>
  );
}

function HeroPlaza({
  activeId,
  onSelect,
  isMobile,
}: {
  activeId: string | null;
  onSelect: (section: Section) => void;
  isMobile: boolean;
}) {
  const featured = SECTIONS.find((section) => section.kind === "project") ?? SECTIONS[0];
  const width = isMobile ? 14.5 : 20;
  const height = isMobile ? 7.2 : 9.2;

  return (
    <group position={[0, 0, -13]}>
      <mesh position={[0, 0.18, 0]}>
        <boxGeometry args={[width + 5, 0.35, 6]} />
        <meshStandardMaterial color="#0b070d" metalness={0.75} roughness={0.26} />
      </mesh>
      <mesh position={[0, 5.8, -0.85]}>
        <boxGeometry args={[width + 1.5, 12.8, 0.48]} />
        <meshStandardMaterial color="#08070a" metalness={0.8} roughness={0.3} />
      </mesh>
      <HoloScreen
        section={featured}
        position={[0, 6.6, 0]}
        width={width}
        height={height}
        onClick={() => onSelect(featured)}
        active={activeId === featured.id}
      />
      <Text
        position={[0, 12.6, 0.2]}
        fontSize={0.58}
        letterSpacing={0.28}
        color={BRAND_RED}
        anchorX="center"
        anchorY="middle"
      >
        MAIN PROJECT ARRAY
      </Text>
      <Text
        position={[0, 1.05, 2.72]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.46}
        letterSpacing={0.42}
        color="#ff3159"
        anchorX="center"
        anchorY="middle"
      >
        APPROACH // INTERACT // ENTER
      </Text>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * (width / 2 + 1.8), 1.15, 1.5]}>
          <mesh>
            <cylinderGeometry args={[0.16, 0.2, 2.3, 12]} />
            <meshStandardMaterial
              color="#19060d"
              emissive={BRAND_RED}
              emissiveIntensity={2.4}
              toneMapped={false}
            />
          </mesh>
          <pointLight color={BRAND_RED} intensity={3} distance={8} />
        </group>
      ))}
    </group>
  );
}

function Building({
  section,
  activeId,
  onSelect,
}: {
  section: Section;
  activeId: string | null;
  onSelect: (section: Section) => void;
}) {
  const accent = ACCENTS[section.accent];
  const [x, z] = section.position;
  const y = section.height / 2;
  const screenWidth = Math.min(section.width * 1.4, 13);
  const screenHeight = section.height * 0.55;
  const screenY = y + 1.5;
  const active = activeId === section.id;

  return (
    <group>
      <NeonTower
        position={[x, y, z]}
        width={section.width}
        depth={section.depth}
        height={section.height}
        color={accent}
      />
      <HoloScreen
        section={section}
        position={[x, screenY, z + section.depth / 2 + 0.6]}
        width={screenWidth}
        height={screenHeight}
        onClick={() => onSelect(section)}
        active={active}
      />
      <pointLight
        position={[x, section.height + 2, z]}
        color={accent}
        intensity={3.4}
        distance={36}
      />
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
    const [x, z] = section.position;
    const side = x >= 0 ? -1 : 1;
    const offset = isMobile ? 14 : 10;
    return {
      pos: new THREE.Vector3(x + side * offset, section.height * 0.35, z - 4),
      look: new THREE.Vector3(x, section.height * 0.55, z),
    };
  }, [activeId, isMobile]);

  return (
    <Canvas
      shadows={false}
      dpr={Math.min(window.devicePixelRatio, isMobile ? 1.6 : 2.2)}
      gl={{ antialias: true, powerPreference: "high-performance", alpha: false }}
      camera={{ position: [0, 3.3, -61], fov: isMobile ? 72 : 64, near: 0.1, far: 800 }}
      onPointerMissed={() => onSelect(null)}
      style={{ position: "fixed", inset: 0 }}
    >
      <color attach="background" args={["#020104"]} />
      <fog attach="fog" args={["#060108", 19, 124]} />

      <ambientLight intensity={0.17} color="#ff1a3c" />
      <hemisphereLight args={["#4c1435", "#030105", 0.24]} />
      <directionalLight position={[35, 60, 18]} intensity={0.35} color={BRAND_RED} />
      <directionalLight position={[-38, 46, -20]} intensity={0.3} color="#5c30ff" />

      <Ground isMobile={isMobile} />
      <BackgroundCity />
      <SignClutter count={isMobile ? 42 : 95} />
      <HeroPlaza activeId={activeId} onSelect={onSelect} isMobile={isMobile} />

      {SECTIONS.map((section) => (
        <Building
          key={section.id}
          section={section}
          activeId={activeId}
          onSelect={onSelect}
        />
      ))}

      <Player target={target} isMobile={isMobile} />

      <EffectComposer multisampling={0} enableNormalPass={false}>
        <Bloom
          intensity={isMobile ? 0.82 : 1.15}
          luminanceThreshold={0.14}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
        <Vignette eskil={false} offset={0.08} darkness={0.6} />
      </EffectComposer>
    </Canvas>
  );
}

const bgVert = /* glsl */ `
  varying vec3 vPos;
  varying vec3 vNormal;
  void main() {
    vPos = position;
    vNormal = normal;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const bgFrag = /* glsl */ `
  precision highp float;
  uniform vec3 uSize;
  varying vec3 vPos;
  varying vec3 vNormal;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    float topness = abs(vNormal.y);
    if (topness > 0.5) {
      gl_FragColor = vec4(vec3(0.035, 0.03, 0.04), 1.0);
      return;
    }

    vec2 uv;
    float faceSeed;
    if (abs(vNormal.x) > 0.5) {
      uv = vec2((vPos.z / uSize.z) + 0.5, (vPos.y / uSize.y) + 0.5);
      faceSeed = sign(vNormal.x) * 0.5 + 0.5;
    } else {
      uv = vec2((vPos.x / uSize.x) + 0.5, (vPos.y / uSize.y) + 0.5);
      faceSeed = sign(vNormal.z) * 0.5 + 0.7;
    }

    vec3 wall = vec3(0.055, 0.048, 0.06);
    vec2 cells = vec2(4.0, 10.0);
    vec2 g = floor(uv * cells);
    vec2 f = fract(uv * cells);
    float frame = step(0.08, f.x) * step(f.x, 0.92) * step(0.07, f.y) * step(f.y, 0.93);
    float seed = hash(vec2(g.x + faceSeed * 30.0, g.y));
    float lit = step(0.62, seed);
    vec3 winA = vec3(0.88, 0.12, 0.34);
    vec3 winB = vec3(0.18, 0.62, 0.95);
    vec3 winCol = mix(winA, winB, fract(seed * 5.0));
    vec3 darkWin = vec3(0.018, 0.016, 0.024);
    vec3 col = mix(wall, mix(darkWin, winCol, lit), frame);
    col *= 0.72;
    gl_FragColor = vec4(col, 1.0);
  }
`;

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
