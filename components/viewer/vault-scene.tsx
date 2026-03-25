"use client";

import { useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, SMAA } from "@react-three/postprocessing";
import * as THREE from "three";

function VaultMesh() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const edgesRef = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.15;
      meshRef.current.rotation.x = Math.sin(Date.now() * 0.0003) * 0.1;
    }
  });

  return (
    <group>
      {/* Main vault body */}
      <mesh ref={meshRef} castShadow>
        <icosahedronGeometry args={[1.8, 1]} />
        <meshStandardMaterial
          color="#111318"
          metalness={0.9}
          roughness={0.15}
          emissive="#00D4FF"
          emissiveIntensity={0.04}
        />
      </mesh>

      {/* Glowing cyan wireframe overlay */}
      <mesh ref={edgesRef}>
        <icosahedronGeometry args={[1.82, 1]} />
        <meshBasicMaterial color="#00D4FF" wireframe opacity={0.25} transparent />
      </mesh>

      {/* Inner core glow */}
      <mesh>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color="#00D4FF" opacity={0.05} transparent />
      </mesh>

      {/* Dial ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.8, 0.04, 8, 64]} />
        <meshStandardMaterial
          color="#00D4FF"
          emissive="#00D4FF"
          emissiveIntensity={1}
          metalness={1}
          roughness={0}
        />
      </mesh>
    </group>
  );
}

function Lighting() {
  return (
    <>
      <ambientLight intensity={0.15} />
      <directionalLight position={[5, 8, 5]} intensity={2.5} color="#ffffff" castShadow />
      <directionalLight position={[-5, 0, -5]} intensity={0.8} color="#7C3AED" />
      <directionalLight position={[0, -5, 3]} intensity={1} color="#00D4FF" />
      <pointLight position={[0, 0, 3]} intensity={3} color="#00D4FF" distance={8} />
      <pointLight position={[3, 3, 2]} intensity={1} color="#ffffff" distance={10} />
    </>
  );
}

function PostProcessing() {
  return (
    <EffectComposer multisampling={0}>
      <SMAA />
      <Bloom
        intensity={1.2}
        luminanceThreshold={0.6}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
      <Vignette eskil={false} offset={0.3} darkness={0.6} />
    </EffectComposer>
  );
}

function ResponsiveCamera() {
  const { camera, size } = useThree();
  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.aspect = size.width / size.height;
      camera.updateProjectionMatrix();
    }
  }, [camera, size]);
  return null;
}

export default function VaultScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 50 }}
      dpr={[1, 2]}
      shadows
      gl={{ antialias: true, alpha: false }}
      style={{ background: "#0A0C10", width: "100%", height: "100%" }}
    >
      <ResponsiveCamera />
      <Lighting />
      <VaultMesh />
      <PostProcessing />
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        enableZoom={true}
        minDistance={3}
        maxDistance={10}
        enablePan={false}
        autoRotate={false}
      />
    </Canvas>
  );
}
