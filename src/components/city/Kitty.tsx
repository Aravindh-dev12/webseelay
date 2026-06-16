import * as THREE from "three";
import { forwardRef } from "react";

/** Low-poly dark kitty avatar with glowing red eyes. */
export const Kitty = forwardRef<THREE.Group>(function Kitty(_props, ref) {
  const body = "#0a0509";
  const eye = "#ff1a3c";
  return (
    <group ref={ref}>
      {/* body */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <capsuleGeometry args={[0.42, 0.55, 6, 12]} />
        <meshStandardMaterial color={body} roughness={0.65} metalness={0.2} />
      </mesh>
      {/* head */}
      <mesh position={[0, 1.25, 0.18]}>
        <sphereGeometry args={[0.42, 18, 16]} />
        <meshStandardMaterial color={body} roughness={0.6} metalness={0.25} />
      </mesh>
      {/* ears */}
      <mesh position={[-0.26, 1.65, 0.16]} rotation={[0, 0, -0.35]}>
        <coneGeometry args={[0.14, 0.34, 4]} />
        <meshStandardMaterial color={body} roughness={0.7} />
      </mesh>
      <mesh position={[0.26, 1.65, 0.16]} rotation={[0, 0, 0.35]}>
        <coneGeometry args={[0.14, 0.34, 4]} />
        <meshStandardMaterial color={body} roughness={0.7} />
      </mesh>
      {/* eyes (emissive) */}
      <mesh position={[-0.14, 1.28, 0.55]}>
        <sphereGeometry args={[0.07, 12, 10]} />
        <meshStandardMaterial color={eye} emissive={eye} emissiveIntensity={4} toneMapped={false} />
      </mesh>
      <mesh position={[0.14, 1.28, 0.55]}>
        <sphereGeometry args={[0.07, 12, 10]} />
        <meshStandardMaterial color={eye} emissive={eye} emissiveIntensity={4} toneMapped={false} />
      </mesh>
      {/* tail */}
      <mesh position={[0, 0.7, -0.45]} rotation={[0.7, 0, 0]}>
        <capsuleGeometry args={[0.07, 0.55, 4, 8]} />
        <meshStandardMaterial color={body} roughness={0.7} />
      </mesh>
      {/* eye glow point light */}
      <pointLight position={[0, 1.28, 0.55]} color={eye} intensity={1.2} distance={4} />
    </group>
  );
});
