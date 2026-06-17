import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  EffectComposer,
  Bloom,
  Vignette,
} from "@react-three/postprocessing";
import { NeonTower } from "./NeonTower";
import { HoloScreen } from "./HoloScreen";
import { SignClutter } from "./SignClutter";
import { Kitty } from "./Kitty";
import { ACCENTS, SECTIONS, BRAND_RED, type Section } from "./data";

function useIsMobile() {
  const [m, setM] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const upd = () => setM(mq.matches);
    upd();
    mq.addEventListener("change", upd);
    return () => mq.removeEventListener("change", upd);
  }, []);
  return m;
}

/** Global keyboard state hook. */
function useKeys() {
  const keys = useRef<Record<string, boolean>>({});
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
      if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(e.code)) e.preventDefault();
    };
    const up = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);
  return keys;
}

/** Player-controlled kitty with third-person follow camera. */
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
  const velY = useRef(0);
  const pos = useRef(new THREE.Vector3(0, 0, -55));
  const keys = useKeys();
  const camLook = useRef(new THREE.Vector3(0, 1.2, 0));
  const camYaw = useRef(0);
  const camPitch = useRef(0.3);

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      camYaw.current += e.deltaX * 0.003;
      camPitch.current += e.deltaY * 0.002;
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => window.removeEventListener("wheel", onWheel);
  }, []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const k = keys.current;
    const fwd = (k["KeyW"] || k["ArrowUp"] ? 1 : 0) - (k["KeyS"] || k["ArrowDown"] ? 1 : 0);
    const turn = (k["KeyA"] || k["ArrowLeft"] ? 1 : 0) - (k["KeyD"] || k["ArrowRight"] ? 1 : 0);
    yaw.current += turn * dt * 2.2;
    const speed = (k["ShiftLeft"] || k["ShiftRight"] ? 14 : 8) * fwd;
    pos.current.x += Math.sin(yaw.current) * speed * dt;
    pos.current.z += Math.cos(yaw.current) * speed * dt;
    // jump
    if ((k["Space"]) && pos.current.y <= 0.001) velY.current = 5.5;
    velY.current -= 14 * dt;
    pos.current.y = Math.max(0, pos.current.y + velY.current * dt);
    if (pos.current.y === 0) velY.current = 0;

    if (group.current) {
      group.current.position.copy(pos.current);
      group.current.rotation.y = yaw.current;
    }

    // Camera: either focus target (when section selected) or orbit around kitty
    const desiredPos = new THREE.Vector3();
    const desiredLook = new THREE.Vector3();
    if (target) {
      desiredPos.copy(target.pos);
      desiredLook.copy(target.look);
    } else {
      const radius = isMobile ? 7 : 5.5;
      desiredPos.set(
        pos.current.x - Math.sin(camYaw.current) * Math.cos(camPitch.current) * radius,
        pos.current.y + Math.sin(camPitch.current) * radius + 1.2,
        pos.current.z - Math.cos(camYaw.current) * Math.cos(camPitch.current) * radius,
      );
      desiredLook.set(pos.current.x, pos.current.y + 1.2, pos.current.z);
    }
    const lerp = Math.min(1, dt * 4);
    camera.position.lerp(desiredPos, lerp);
    camLook.current.lerp(desiredLook, lerp);
    camera.lookAt(camLook.current);
  });

  return (
    <group ref={group}>
      <Kitty />
    </group>
  );
}

/** Reflective wet ground plane with subtle grid. */
function Ground() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial
          color="#03050d"
          metalness={0.9}
          roughness={0.35}
          envMapIntensity={0.6}
        />
      </mesh>
    </>
  );
}

/** Background skyline — fills the horizon with emissive, non-black buildings. */
function BackgroundCity() {
  const towers = useMemo(() => {
    const arr: { p: [number, number, number]; w: number; h: number; d: number }[] = [];
    const rand = mulberry32(42);
    for (let i = 0; i < 90; i++) {
      const ang = rand() * Math.PI * 2;
      const dist = 60 + rand() * 100;
      const x = Math.cos(ang) * dist;
      const z = Math.sin(ang) * dist;
      const h = 10 + rand() * 65;
      const w = 4 + rand() * 9;
      arr.push({ p: [x, h / 2, z], w, h, d: w });
    }
    return arr;
  }, []);

  return (
    <group>
      {towers.map((t, i) => (
        <BackgroundTower key={i} position={t.p} width={t.w} height={t.h} depth={t.d} />
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
    () => ({
      uSize: { value: new THREE.Vector3(width, height, depth) },
    }),
    [width, height, depth],
  );

  return (
    <mesh position={position}>
      <boxGeometry args={[width, height, depth]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={bgVert}
        fragmentShader={bgFrag}
      />
    </mesh>
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
    // Top/bottom: dark concrete
    if (topness > 0.5) {
      gl_FragColor = vec4(vec3(0.06, 0.065, 0.07), 1.0);
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

    // Building wall color (concrete gray)
    vec3 wall = vec3(0.10, 0.11, 0.12);

    // Window grid
    vec2 cells = vec2(4.0, 10.0);
    vec2 g = floor(uv * cells);
    vec2 f = fract(uv * cells);

    float frame = step(0.06, f.x) * step(f.x, 0.94) *
                 step(0.05, f.y) * step(f.y, 0.95);

    float seed = hash(vec2(g.x + faceSeed * 30.0, g.y));
    float lit = step(0.45, seed);

    // Warm window light
    vec3 winCol = mix(vec3(0.85, 0.80, 0.65), vec3(0.70, 0.85, 1.0), fract(seed * 5.0));
    vec3 darkWin = vec3(0.03, 0.035, 0.04);

    vec3 col = wall;
    col = mix(col, mix(darkWin, winCol, lit), frame);

    // Distance fade slightly darker for atmosphere
    col *= 0.85;

    gl_FragColor = vec4(col, 1.0);
  }
`;

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

function Building({
  section,
  activeId,
  onSelect,
}: {
  section: Section;
  activeId: string | null;
  onSelect: (s: Section) => void;
}) {
  const accent = ACCENTS[section.accent];
  const [x, z] = section.position;
  const y = section.height / 2;
  const screenW = Math.min(section.width * 1.4, 13);
  const screenH = section.height * 0.55;
  const screenY = y + 1.5;
  const isActive = activeId === section.id;
  const w = section.width;
  const d = section.depth;

  return (
    <group>
      <NeonTower
        position={[x, y, z]}
        width={w}
        depth={d}
        height={section.height}
        color={accent}
      />
      {/* Main front screen */}
      <HoloScreen
        section={section}
        position={[x, screenY, z + d / 2 + 0.6]}
        width={screenW}
        height={screenH}
        onClick={() => onSelect(section)}
        active={isActive}
      />
      {/* Point light at the top for bloom */}
      <pointLight
        position={[x, section.height + 2, z]}
        color={accent}
        intensity={4}
        distance={40}
      />
    </group>
  );
}

export function CityScene({
  activeId,
  onSelect,
}: {
  activeId: string | null;
  onSelect: (s: Section | null) => void;
}) {
  const isMobile = useIsMobile();

  const target = useMemo(() => {
    if (!activeId) return null;
    const s = SECTIONS.find((x) => x.id === activeId);
    if (!s) return null;
    const [x, z] = s.position;
    // Stand on the street, look up at the facade.
    const sign = x >= 0 ? -1 : 1;
    const offset = isMobile ? 14 : 10;
    return {
      pos: new THREE.Vector3(x + sign * offset, s.height * 0.35, z - 4),
      look: new THREE.Vector3(x, s.height * 0.55, z),
    };
  }, [activeId, isMobile]);

  return (
    <Canvas
      shadows={false}
      dpr={Math.min(window.devicePixelRatio, 3)}
      gl={{ antialias: true, powerPreference: "high-performance", alpha: false }}
      camera={{ position: [0, 3, -60], fov: 68, near: 0.1, far: 800 }}
      onPointerMissed={() => onSelect(null)}
      style={{ position: "fixed", inset: 0 }}
    >
      <color attach="background" args={["#000000"]} />
      <fog attach="fog" args={["#000000", 18, 130]} />

      <ambientLight intensity={0.2} color="#ff2050" />
      <directionalLight position={[40, 60, 20]} intensity={0.45} color={BRAND_RED} />
      <directionalLight position={[-40, 50, -20]} intensity={0.4} color="#ff00e5" />

      <Ground />
      <BackgroundCity />
      <SignClutter count={isMobile ? 50 : 110} />

      {SECTIONS.map((s) => (
        <Building
          key={s.id}
          section={s}
          activeId={activeId}
          onSelect={onSelect}
        />
      ))}

      <Player target={target} isMobile={isMobile} />

      <EffectComposer multisampling={0} enableNormalPass={false}>
        <Bloom
          intensity={isMobile ? 0.9 : 1.4}
          luminanceThreshold={0.18}
          luminanceSmoothing={0.85}
          mipmapBlur
        />
          <Vignette eskil={false} offset={0.12} darkness={0.5} />
      </EffectComposer>
    </Canvas>
  );
}
