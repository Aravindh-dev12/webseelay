import * as THREE from "three";
import { useRef, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { NPCS, type NPC } from "./enhancedData";

/**
 * NPC System
 * ==========
 * Animated NPCs with patrol routes, dialogue bubbles, and interaction.
 */

export function NPCSystem({
  onInteract,
  playerPos,
}: {
  onInteract: (npc: NPC) => void;
  playerPos: React.MutableRefObject<THREE.Vector3>;
}) {
  return (
    <group>
      {NPCS.map((npc) => (
        <NPCCharacter
          key={npc.id}
          npc={npc}
          onInteract={onInteract}
          playerPos={playerPos}
        />
      ))}
    </group>
  );
}

function NPCCharacter({
  npc,
  onInteract,
  playerPos,
}: {
  npc: NPC;
  onInteract: (npc: NPC) => void;
  playerPos: React.MutableRefObject<THREE.Vector3>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [nearby, setNearby] = useState(false);

  const route = useMemo(() => npc.patrolRoute ?? [[...npc.position]], [npc]);
  const routeIndex = useRef(0);
  const currentPos = useRef(new THREE.Vector3(...npc.position));
  const targetPos = useRef(new THREE.Vector3(...route[0]));

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const dt = Math.min(delta, 0.05);

    // Patrol movement
    const speed = npc.speed;
    const dir = new THREE.Vector3().subVectors(targetPos.current, currentPos.current);
    const dist = dir.length();

    if (dist < 0.5) {
      routeIndex.current = (routeIndex.current + 1) % route.length;
      const pt = route[routeIndex.current];
      targetPos.current.set(pt[0], pt[1], pt[2]);
    } else {
      dir.normalize();
      currentPos.current.add(dir.multiplyScalar(speed * dt));
      groupRef.current.position.copy(currentPos.current);
      // Face movement direction
      if (dir.length() > 0.01) {
        const angle = Math.atan2(dir.x, dir.z);
        groupRef.current.rotation.y = angle;
      }
    }

    // Check player proximity
    const pDist = currentPos.current.distanceTo(playerPos.current);
    setNearby(pDist < 6);

    // Bob animation
    groupRef.current.position.y = npc.position[1] + Math.sin(performance.now() * 0.003 + npc.position[0]) * 0.1;
  });

  return (
    <group
      ref={groupRef}
      position={npc.position}
      onPointerOver={() => { setHovered(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = ""; }}
      onClick={(e) => { e.stopPropagation(); onInteract(npc); }}
    >
      {/* Body */}
      <mesh castShadow>
        <capsuleGeometry args={[0.35, 0.9, 4, 8]} />
        <meshStandardMaterial
          color={npc.color}
          emissive={npc.color}
          emissiveIntensity={hovered ? 2 : 0.8}
          roughness={0.4}
          metalness={0.6}
        />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.7, 0]}>
        <sphereGeometry args={[0.28, 12, 12]} />
        <meshStandardMaterial
          color={npc.color}
          emissive={npc.color}
          emissiveIntensity={hovered ? 3 : 1}
        />
      </mesh>
      {/* Holographic ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.45, 0]}>
        <ringGeometry args={[0.5, 0.7, 32]} />
        <meshBasicMaterial color={npc.color} transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
      {/* Name tag */}
      {nearby && (
        <Html position={[0, 1.4, 0]} center distanceFactor={12} pointerEvents="none">
          <div
            style={{
              padding: "4px 10px",
              background: "rgba(0,0,0,0.7)",
              border: `1px solid ${npc.color}`,
              color: npc.color,
              fontSize: 10,
              letterSpacing: 2,
              whiteSpace: "nowrap",
              boxShadow: `0 0 12px ${npc.color}55`,
            }}
          >
            {npc.name} // {npc.role.toUpperCase()}
          </div>
        </Html>
      )}
      {/* Quest indicator */}
      {npc.questId && (
        <mesh position={[0, 1.6, 0]}>
          <octahedronGeometry args={[0.12, 0]} />
          <meshBasicMaterial color="#ffe600" toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}
