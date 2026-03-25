"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

function FloatingVault({ position, scale, speed }: { position: [number, number, number]; scale: number; speed: number }) {
  const ref = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    ref.current.rotation.y += 0.003 * speed;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3 * speed) * 0.05;
    ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.4 * speed) * 0.15;
  });

  return (
    <mesh ref={ref} position={position} scale={scale}>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial
        color="#1A1D24"
        metalness={0.8}
        roughness={0.2}
        emissive="#00D4FF"
        emissiveIntensity={0.03}
      />
    </mesh>
  );
}

function FloatingWireframe({ position, scale, speed }: { position: [number, number, number]; scale: number; speed: number }) {
  const ref = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    ref.current.rotation.y += 0.002 * speed;
    ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.2 * speed) * 0.03;
    ref.current.position.y = position[1] + Math.cos(state.clock.elapsedTime * 0.35 * speed) * 0.1;
  });

  return (
    <mesh ref={ref} position={position} scale={scale}>
      <icosahedronGeometry args={[1, 1]} />
      <meshBasicMaterial color="#00D4FF" wireframe opacity={0.12} transparent />
    </mesh>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight position={[5, 10, 5]} intensity={1.5} color="#ffffff" />
      <pointLight position={[0, 0, 5]} intensity={3} color="#00D4FF" distance={20} />
      <pointLight position={[-10, 5, -5]} intensity={1} color="#7C3AED" distance={25} />
      <pointLight position={[10, -5, -8]} intensity={0.8} color="#00D4FF" distance={20} />

      {/* Background floating shapes */}
      <FloatingVault position={[-6, 2, -8]} scale={0.8} speed={0.7} />
      <FloatingVault position={[7, -2, -10]} scale={1.2} speed={0.5} />
      <FloatingVault position={[3, 4, -12]} scale={0.5} speed={1.1} />
      <FloatingVault position={[-8, -3, -6]} scale={0.6} speed={0.9} />

      <FloatingWireframe position={[-4, 1, -5]} scale={0.9} speed={0.8} />
      <FloatingWireframe position={[5, -1, -7]} scale={1.0} speed={0.6} />
      <FloatingWireframe position={[0, -4, -9]} scale={0.7} speed={1.2} />

      <EffectComposer multisampling={0}>
        <Bloom intensity={0.8} luminanceThreshold={0.7} mipmapBlur />
      </EffectComposer>
    </>
  );
}

export default function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 60 }}
      dpr={[1, 1.5]}
      gl={{ antialias: false, alpha: true }}
      style={{ width: "100%", height: "100%", background: "transparent" }}
    >
      <Scene />
    </Canvas>
  );
}
