"use client";

import { useRef, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

// Field: 120 world units wide × 54 tall (matches real football field ratio)
// Konva canvas: 1200 × 800 px — same proportional mapping
const FW = 120;
const FH = 54;
const CW = 1200;
const CH = 800;

function toWorld(cx: number, cy: number, y = 0.15): THREE.Vector3 {
  return new THREE.Vector3(
    (cx / CW) * FW - FW / 2,
    y,
    (cy / CH) * FH - FH / 2,
  );
}

// ── Field texture ────────────────────────────────────────────────────────────

function useFieldTexture() {
  return useMemo(() => {
    const W = 2048;
    const H = Math.round(W * (FH / FW));
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = "#1a5c2a";
    ctx.fillRect(0, 0, W, H);

    // Alternating stripe bands
    for (let i = 0; i < 12; i++) {
      if (i % 2 === 0) {
        ctx.fillStyle = "rgba(255,255,255,0.04)";
        ctx.fillRect((i * W) / 12, 0, W / 12, H);
      }
    }

    // End zone tints
    ctx.fillStyle = "rgba(0,212,255,0.12)";
    ctx.fillRect(0, 0, (10 / 120) * W, H);
    ctx.fillStyle = "rgba(124,58,237,0.12)";
    ctx.fillRect((110 / 120) * W, 0, W, H);

    // End-zone goal lines
    ctx.strokeStyle = "rgba(255,255,255,0.65)";
    ctx.lineWidth = 4;
    for (const yard of [10, 110]) {
      ctx.beginPath();
      ctx.moveTo((yard / 120) * W, 0);
      ctx.lineTo((yard / 120) * W, H);
      ctx.stroke();
    }

    // 10-yard lines
    ctx.lineWidth = 2;
    for (let y = 20; y <= 110; y += 10) {
      ctx.strokeStyle = "rgba(255,255,255,0.45)";
      ctx.beginPath();
      ctx.moveTo((y / 120) * W, 0);
      ctx.lineTo((y / 120) * W, H);
      ctx.stroke();
    }

    // 5-yard dashes
    ctx.lineWidth = 1;
    for (let y = 15; y <= 115; y += 10) {
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo((y / 120) * W, 0);
      ctx.lineTo((y / 120) * W, H);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Hash marks
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 2;
    const hashY1 = H * 0.36;
    const hashY2 = H * 0.64;
    for (let y = 10; y <= 110; y += 5) {
      const x = (y / 120) * W;
      ctx.beginPath(); ctx.moveTo(x, hashY1 - 12); ctx.lineTo(x, hashY1 + 12); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, hashY2 - 12); ctx.lineTo(x, hashY2 + 12); ctx.stroke();
    }

    // Yard numbers
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = `bold ${W / 48}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const [yard, label] of [[20,"10"],[30,"20"],[40,"30"],[50,"40"],[60,"50"],[70,"40"],[80,"30"],[90,"20"],[100,"10"]] as [number, string][]) {
      const x = (yard / 120) * W;
      ctx.fillText(label, x, H * 0.18);
      ctx.fillText(label, x, H * 0.82);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);
}

// ── Field plane ──────────────────────────────────────────────────────────────

function FieldPlane() {
  const texture = useFieldTexture();
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[FW, FH, 1, 1]} />
      <meshStandardMaterial map={texture} roughness={0.85} metalness={0} />
    </mesh>
  );
}

// ── Canvas-texture sprite helper ─────────────────────────────────────────────

function useTextTexture(text: string, color: string, fontSize = 56): THREE.CanvasTexture {
  return useMemo(() => {
    const size = 128;
    const c = document.createElement("canvas");
    c.width = size; c.height = size;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = color;
    ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text.slice(0, 3), size / 2, size / 2);
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, color, fontSize]);
}

// ── Player token ─────────────────────────────────────────────────────────────

function PlayerToken({
  position, label, side,
}: {
  position: THREE.Vector3;
  label: string;
  side: "offense" | "defense";
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const [hovered, setHovered] = useState(false);
  const color = side === "offense" ? "#00D4FF" : "#7C3AED";
  const labelTex = useTextTexture(label.slice(0, 3), "#ffffff", 64);
  const floatTex = useTextTexture(label, color, 44);

  useFrame(() => {
    if (!groupRef.current) return;
    const target = hovered ? 1.2 : 1.0;
    groupRef.current.scale.lerp(new THREE.Vector3(target, target, target), 0.12);
  });

  return (
    <group
      ref={groupRef}
      position={[position.x, 0, position.z]}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <mesh castShadow position={[0, 1.25, 0]}>
        <cylinderGeometry args={[1.15, 1.15, 2.5, 16]} />
        <meshStandardMaterial
          color={color}
          metalness={0.25}
          roughness={0.45}
          emissive={color}
          emissiveIntensity={hovered ? 0.6 : 0.25}
        />
      </mesh>
      <mesh position={[0, 2.52, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.15, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.85} />
      </mesh>
      {/* Jersey label on top */}
      <mesh position={[0, 2.62, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.0, 2.0]} />
        <meshBasicMaterial map={labelTex} transparent depthWrite={false} />
      </mesh>
      {/* Position name floating above */}
      <sprite position={[0, 4.6, 0]} scale={[2.8, 2.8, 1]}>
        <spriteMaterial map={floatTex} transparent depthWrite={false} />
      </sprite>
    </group>
  );
}

// ── Animated route ───────────────────────────────────────────────────────────

function AnimatedRoute({
  path, color, progress,
}: {
  path: Array<{ x: number; y: number }>;
  color: string;
  progress: number;
}) {
  const ballRef = useRef<THREE.Mesh>(null!);

  const curve = useMemo(() => {
    if (path.length < 2) return null;
    return new THREE.CatmullRomCurve3(path.map(p => toWorld(p.x, p.y, 0.3)));
  }, [path]);

  const tubeGeo = useMemo(
    () => curve ? new THREE.TubeGeometry(curve, 80, 0.22, 8, false) : null,
    [curve],
  );

  useFrame(() => {
    if (!ballRef.current || !curve) return;
    const t = Math.min(Math.max(progress, 0), 1);
    const pt = curve.getPointAt(t);
    ballRef.current.position.set(pt.x, 0.7, pt.z);
  });

  if (!curve || !tubeGeo) return null;

  return (
    <group>
      <mesh geometry={tubeGeo}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.4}
          transparent
          opacity={0.85}
        />
      </mesh>
      <mesh ref={ballRef}>
        <sphereGeometry args={[0.55, 12, 12]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}

// ── Demo data (used when no real play is loaded) ─────────────────────────────

const DEMO_PLAYERS = [
  { id: "qb",  x: 570, y: 500, label: "QB",  side: "offense" as const },
  { id: "wr1", x: 180, y: 400, label: "WR",  side: "offense" as const },
  { id: "wr2", x: 920, y: 400, label: "WR",  side: "offense" as const },
  { id: "rb",  x: 570, y: 560, label: "RB",  side: "offense" as const },
  { id: "te",  x: 760, y: 440, label: "TE",  side: "offense" as const },
  { id: "ol1", x: 460, y: 460, label: "OL",  side: "offense" as const },
  { id: "ol2", x: 680, y: 460, label: "OL",  side: "offense" as const },
  { id: "de1", x: 390, y: 360, label: "DE",  side: "defense" as const },
  { id: "dt",  x: 570, y: 350, label: "DT",  side: "defense" as const },
  { id: "de2", x: 750, y: 360, label: "DE",  side: "defense" as const },
  { id: "cb1", x: 150, y: 300, label: "CB",  side: "defense" as const },
  { id: "cb2", x: 910, y: 295, label: "CB",  side: "defense" as const },
  { id: "s",   x: 570, y: 240, label: "S",   side: "defense" as const },
  { id: "lb",  x: 570, y: 320, label: "LB",  side: "defense" as const },
];

const DEMO_ROUTES = [
  { id: "wr1", path: [{ x: 180, y: 390 }, { x: 180, y: 230 }, { x: 360, y: 190 }] },
  { id: "wr2", path: [{ x: 920, y: 390 }, { x: 920, y: 210 }, { x: 740, y: 185 }] },
  { id: "rb",  path: [{ x: 570, y: 560 }, { x: 570, y: 470 }, { x: 460, y: 390 }, { x: 360, y: 340 }] },
  { id: "te",  path: [{ x: 760, y: 440 }, { x: 810, y: 340 }, { x: 830, y: 265 }] },
];

// ── Scene content ─────────────────────────────────────────────────────────────

interface SceneProps {
  cards?: Array<{ id: string; cardType: string; geometry: Record<string, unknown> }>;
  assignments?: Array<{ card_id: string; recorded_path: Array<{ x: number; y: number }> }>;
  autoPlay: boolean;
}

function SceneContent({ cards, assignments, autoPlay }: SceneProps) {
  const progressRef = useRef(0);
  const [progress, setProgress] = useState(0);
  const playingRef = useRef(autoPlay);

  useFrame((_, delta) => {
    if (!playingRef.current) return;
    progressRef.current += delta * 0.1;
    if (progressRef.current >= 1) progressRef.current = 0;
    setProgress(progressRef.current);
  });

  // Build player list from cards, fall back to demo
  const players = useMemo(() => {
    if (cards && cards.length > 0) {
      return cards
        .filter(c => c.cardType === "player")
        .map(c => {
          const g = c.geometry as { x?: number; y?: number; label?: string; side?: string };
          return {
            id: c.id,
            x: g.x ?? 600,
            y: g.y ?? 400,
            label: g.label ?? "P",
            side: (g.side === "defense" ? "defense" : "offense") as "offense" | "defense",
          };
        });
    }
    return DEMO_PLAYERS;
  }, [cards]);

  // Build route list from assignments, fall back to demo
  const routes = useMemo(() => {
    if (assignments && assignments.length > 0) {
      return assignments
        .filter(a => a.recorded_path?.length >= 2)
        .map(a => ({ id: a.card_id, path: a.recorded_path }));
    }
    return DEMO_ROUTES;
  }, [assignments]);

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[30, 70, 25]} intensity={2.2} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-25, 25, -25]} intensity={0.5} color="#7C3AED" />
      <pointLight position={[0, 30, 0]} intensity={0.8} color="#ffffff" />

      <fog attach="fog" args={["#0A0C10", 80, 180]} />

      <FieldPlane />

      {players.map(p => (
        <PlayerToken
          key={p.id}
          position={toWorld(p.x, p.y)}
          label={p.label}
          side={p.side}
        />
      ))}

      {routes.map(r => {
        const player = players.find(p => p.id === r.id);
        const color = player?.side === "defense" ? "#7C3AED" : "#00D4FF";
        return (
          <AnimatedRoute key={r.id} path={r.path} color={color} progress={progress} />
        );
      })}

      <OrbitControls
        enableDamping
        dampingFactor={0.07}
        minPolarAngle={Math.PI / 10}
        maxPolarAngle={Math.PI / 2.1}
        minDistance={18}
        maxDistance={130}
        enablePan
      />
    </>
  );
}

// ── Public export ─────────────────────────────────────────────────────────────

export interface FootballFieldSceneProps {
  cards?: Array<{ id: string; cardType: string; geometry: Record<string, unknown> }>;
  assignments?: Array<{ card_id: string; recorded_path: Array<{ x: number; y: number }> }>;
  autoPlay?: boolean;
}

export function FootballFieldScene({
  cards,
  assignments,
  autoPlay = true,
}: FootballFieldSceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 70, 42], fov: 44 }}
      dpr={[1, 2]}
      shadows
      gl={{ antialias: true, alpha: false, toneMapping: 4 /* ACESFilmicToneMapping */ }}
      style={{ background: "#0A0C10", width: "100%", height: "100%" }}
    >
      <SceneContent cards={cards} assignments={assignments} autoPlay={autoPlay} />
    </Canvas>
  );
}

export default FootballFieldScene;
