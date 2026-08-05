import * as THREE from "three";
import { forwardRef } from "react";

type KittyProps = {
  color?: string;
  eyeColor?: string;
  scale?: number;
};

/**
 * Rounded neon mascot used by the player and plaza NPCs.
 * The component keeps the historical Kitty export so the rest of the scene API stays stable.
 */
export const Kitty = forwardRef<THREE.Group, KittyProps>(function Kitty(
  { color = "#ff0038", eyeColor = "#ffffff", scale = 1 },
  ref,
) {
  const dark = new THREE.Color(color).multiplyScalar(0.42).getStyle();

  return (
    <group ref={ref} scale={scale}>
      {/* soft ghost body */}
      <mesh position={[0, 0.72, 0]} castShadow>
        <capsuleGeometry args={[0.48, 0.72, 10, 22]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.42}
          roughness={0.44}
          metalness={0.08}
        />
      </mesh>

      {/* flattened face visor */}
      <mesh position={[0, 1.05, 0.47]} scale={[1.18, 0.66, 0.35]}>
        <sphereGeometry args={[0.33, 24, 18]} />
        <meshStandardMaterial color={dark} roughness={0.32} metalness={0.24} />
      </mesh>

      {/* glowing eyes */}
      <mesh position={[-0.14, 1.1, 0.595]}>
        <sphereGeometry args={[0.055, 14, 12]} />
        <meshBasicMaterial color={eyeColor} toneMapped={false} />
      </mesh>
      <mesh position={[0.14, 1.1, 0.595]}>
        <sphereGeometry args={[0.055, 14, 12]} />
        <meshBasicMaterial color={eyeColor} toneMapped={false} />
      </mesh>

      {/* tiny smile */}
      <mesh position={[0, 0.94, 0.603]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.095, 0.018, 8, 18, Math.PI]} />
        <meshBasicMaterial color={eyeColor} toneMapped={false} />
      </mesh>

      {/* short floating feet */}
      <mesh position={[-0.22, 0.1, 0.02]} scale={[1, 0.65, 1]}>
        <sphereGeometry args={[0.16, 12, 10]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[0.22, 0.1, 0.02]} scale={[1, 0.65, 1]}>
        <sphereGeometry args={[0.16, 12, 10]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} />
      </mesh>

      <pointLight position={[0, 1.02, 0.45]} color={color} intensity={2.1} distance={5.5} />
    </group>
  );
});
