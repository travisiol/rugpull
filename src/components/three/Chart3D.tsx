"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { Chart } from "@/components/Chart";
import { AXIS_MAX, buildRun, SIM_CANDLES, SIM_RUG_AT, type Candle } from "@/lib/chartSim";
import { RUG_THRESHOLD_USD, type MarketCapReading, type RugPhase } from "@/lib/rug";

/*
 * The chart as an object. Candles are glass rods lit from inside, standing
 * on a black mirror floor; at $100,000 a red plane cuts across the scene.
 * The camera drifts around it slowly and leans toward the cursor.
 *
 * Same colour rule as the flat chart: up candles glow green, down candles
 * are dark glass, red is the rug — the plane, the one candle that reaches
 * it, and everything after.
 *
 * Same data rule: before launch this is a simulation (the caption under
 * the canvas says so); once the token trades it shows the real readings.
 */

const STEP = 0.092;
const BODY = 0.058;
const HEIGHT = 6.2;
const CANDLES_PER_SECOND = 7;
const HOLD_SECONDS = 4;
const Y_RUG = (RUG_THRESHOLD_USD / AXIS_MAX) * HEIGHT;

const yOf = (v: number) => (Math.min(v, AXIS_MAX) / AXIS_MAX) * HEIGHT;
const ease = (f: number) => 1 - Math.pow(1 - f, 2.2);

/** Cursor, normalised, kept outside React so the frame loop can read it. */
const view = { px: 0, py: 0 };

interface Bar {
  o: number;
  c: number;
  h: number;
  l: number;
  kind: "up" | "down" | "rug";
}

interface SimState {
  seed: number;
  run: Candle[];
  startedAt: number;
  reduced: boolean;
  /** Per-frame bar values. Lives in the ref so the frame loop may write it. */
  bars: Bar[];
}

function Candles({
  live,
  hot,
  history,
}: {
  live: boolean;
  hot: boolean;
  history: { v: number }[];
}) {
  const shell = useRef<THREE.InstancedMesh>(null);
  const core = useRef<THREE.InstancedMesh>(null);
  const wick = useRef<THREE.InstancedMesh>(null);
  // The reflection in the floor: the same rods, mirrored and dimmed.
  const shellR = useRef<THREE.InstancedMesh>(null);
  const coreR = useRef<THREE.InstancedMesh>(null);
  const wickR = useRef<THREE.InstancedMesh>(null);
  const sim = useRef<SimState>({
    seed: 7,
    run: [],
    startedAt: -1,
    reduced: false,
    bars: Array.from({ length: SIM_CANDLES }, () => ({ o: 0, c: 0, h: 0, l: 0, kind: "up" })),
  });
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tint = useMemo(() => new THREE.Color(), []);

  useEffect(() => {
    sim.current.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useFrame((state) => {
    const s = sim.current;
    const bars = s.bars;
    const now = state.clock.elapsedTime;
    if (s.startedAt < 0) {
      s.run = buildRun(s.seed);
      s.startedAt = now;
    }

    // ---- What to show this frame --------------------------------------
    let count = 0;
    if (live) {
      const pts = history.slice(-SIM_CANDLES);
      count = pts.length;
      for (let i = 0; i < count; i += 1) {
        const b = bars[i];
        b.o = 0;
        b.c = pts[i].v;
        b.h = pts[i].v;
        b.l = 0;
        b.kind = hot ? "rug" : "up";
      }
    } else {
      const elapsed = now - s.startedAt;
      const total = SIM_CANDLES / CANDLES_PER_SECOND;
      if (!s.reduced && elapsed > total + HOLD_SECONDS) {
        s.seed += 1;
        s.run = buildRun(s.seed);
        s.startedAt = now;
      }
      const revealF = s.reduced ? SIM_CANDLES : Math.min(SIM_CANDLES, (now - s.startedAt) * CANDLES_PER_SECOND);
      const shown = Math.floor(revealF);
      const frac = revealF - shown;
      for (let i = 0; i < Math.min(SIM_CANDLES, shown + 1); i += 1) {
        const c = s.run[i];
        if (!c) break;
        const forming = i === shown;
        let close = c.c;
        let high = c.h;
        let low = c.l;
        if (forming) {
          if (frac <= 0) break;
          const e = ease(frac);
          close = c.o + (c.c - c.o) * e;
          high = Math.max(c.o, close) + (c.h - Math.max(c.o, c.c)) * e;
          low = Math.min(c.o, close) - (Math.min(c.o, c.c) - c.l) * e;
        }
        const b = bars[i];
        b.o = c.o;
        b.c = close;
        b.h = high;
        b.l = low;
        b.kind = i >= SIM_RUG_AT ? "rug" : close >= c.o ? "up" : "down";
        count = i + 1;
      }
    }

    // ---- Write the instances ------------------------------------------
    const sh = shell.current;
    const co = core.current;
    const wi = wick.current;
    const shR = shellR.current;
    const coR = coreR.current;
    const wiR = wickR.current;
    if (!sh || !co || !wi || !shR || !coR || !wiR) return;
    const REFLECT = 0.28;
    const slots = live ? Math.max(count, 40) : SIM_CANDLES;
    const x0 = -((slots - 1) * STEP) / 2;

    for (let i = 0; i < SIM_CANDLES; i += 1) {
      if (i >= count) {
        dummy.position.set(0, -10, 0);
        dummy.scale.set(0.0001, 0.0001, 0.0001);
        dummy.updateMatrix();
        sh.setMatrixAt(i, dummy.matrix);
        co.setMatrixAt(i, dummy.matrix);
        wi.setMatrixAt(i, dummy.matrix);
        shR.setMatrixAt(i, dummy.matrix);
        coR.setMatrixAt(i, dummy.matrix);
        wiR.setMatrixAt(i, dummy.matrix);
        continue;
      }
      const b = bars[i];
      const x = x0 + i * STEP;
      const yo = yOf(b.o);
      const yc = yOf(b.c);
      const top = Math.max(yo, yc);
      const bottom = Math.min(yo, yc);
      const h = Math.max(0.012, top - bottom);

      dummy.position.set(x, bottom + h / 2, 0);
      dummy.scale.set(BODY, h, BODY);
      dummy.updateMatrix();
      sh.setMatrixAt(i, dummy.matrix);
      dummy.position.setY(-(bottom + h / 2));
      dummy.updateMatrix();
      shR.setMatrixAt(i, dummy.matrix);

      dummy.position.setY(bottom + h / 2);
      dummy.scale.set(BODY * 0.5, Math.max(0.008, h - 0.008), BODY * 0.5);
      dummy.updateMatrix();
      co.setMatrixAt(i, dummy.matrix);
      dummy.position.setY(-(bottom + h / 2));
      dummy.updateMatrix();
      coR.setMatrixAt(i, dummy.matrix);

      const wh = Math.max(0.01, yOf(b.h) - yOf(b.l));
      dummy.position.set(x, yOf(b.l) + wh / 2, 0);
      dummy.scale.set(0.011, wh, 0.011);
      dummy.updateMatrix();
      wi.setMatrixAt(i, dummy.matrix);
      dummy.position.setY(-(yOf(b.l) + wh / 2));
      dummy.updateMatrix();
      wiR.setMatrixAt(i, dummy.matrix);

      // Colours. Core values above 1 are what the bloom picks up.
      let r = 0;
      let g = 0;
      let bl = 0;
      if (b.kind === "up") {
        sh.setColorAt(i, tint.setRGB(0.55, 1, 0.75));
        wi.setColorAt(i, tint.setRGB(0.1, 0.9, 0.45));
        r = 0.05;
        g = 2.6;
        bl = 1.15;
      } else if (b.kind === "down") {
        sh.setColorAt(i, tint.setRGB(0.6, 0.6, 0.6));
        wi.setColorAt(i, tint.setRGB(0.35, 0.35, 0.35));
        r = 0.16;
        g = 0.16;
        bl = 0.16;
      } else {
        sh.setColorAt(i, tint.setRGB(1, 0.55, 0.6));
        wi.setColorAt(i, tint.setRGB(1.2, 0.2, 0.25));
        r = 3.2;
        g = 0.35;
        bl = 0.45;
      }
      co.setColorAt(i, tint.setRGB(r, g, bl));
      coR.setColorAt(i, tint.setRGB(r * REFLECT, g * REFLECT, bl * REFLECT));
      shR.setColorAt(i, tint.setRGB(0.2, 0.2, 0.2));
      wiR.setColorAt(i, tint.setRGB(r * REFLECT * 0.4, g * REFLECT * 0.4, bl * REFLECT * 0.4));
    }
    for (const m of [sh, co, wi, shR, coR, wiR]) {
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }
  });

  return (
    <group>
      <instancedMesh ref={wick} args={[undefined, undefined, SIM_CANDLES]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={core} args={[undefined, undefined, SIM_CANDLES]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={shell} args={[undefined, undefined, SIM_CANDLES]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhysicalMaterial
          transparent
          opacity={0.32}
          roughness={0.08}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0.1}
          envMapIntensity={1.6}
          depthWrite={false}
        />
      </instancedMesh>

      {/* Reflection: the same rods below the floor, dimmed. */}
      <instancedMesh ref={wickR} args={[undefined, undefined, SIM_CANDLES]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial toneMapped={false} transparent opacity={0.6} depthWrite={false} />
      </instancedMesh>
      <instancedMesh ref={coreR} args={[undefined, undefined, SIM_CANDLES]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial toneMapped={false} transparent opacity={0.7} depthWrite={false} />
      </instancedMesh>
      <instancedMesh ref={shellR} args={[undefined, undefined, SIM_CANDLES]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial transparent opacity={0.12} depthWrite={false} />
      </instancedMesh>
    </group>
  );
}

let labelTexture: THREE.CanvasTexture | null = null;

/** "$100,000 / the rug", painted once, hung at the end of the line. */
function getLabelTexture() {
  if (labelTexture) return labelTexture;
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#ff3b3b";
    ctx.textBaseline = "top";
    ctx.font = "600 56px 'IBM Plex Mono', ui-monospace, monospace";
    ctx.fillText("$100,000", 8, 8);
    ctx.font = "500 44px 'IBM Plex Mono', ui-monospace, monospace";
    ctx.fillText("the rug", 8, 84);
  }
  labelTexture = new THREE.CanvasTexture(canvas);
  labelTexture.colorSpace = THREE.SRGBColorSpace;
  return labelTexture;
}

/** The line: a red plane at $100,000 with a glowing front edge. */
function RugPlane({ width }: { width: number }) {
  const label = useMemo(() => getLabelTexture(), []);
  return (
    <group position={[0, Y_RUG, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, 2.4]} />
        <meshBasicMaterial color="#ff3b3b" transparent opacity={0.16} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0, 1.2]}>
        <boxGeometry args={[width, 0.01, 0.01]} />
        <meshBasicMaterial color={[2.6, 0.3, 0.38]} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, -1.2]}>
        <boxGeometry args={[width, 0.006, 0.006]} />
        <meshBasicMaterial color="#ff3b3b" />
      </mesh>
      <sprite position={[width / 2 + 1.05, 0.02, 1.2]} scale={[1.9, 0.6, 1]}>
        <spriteMaterial map={label} transparent depthWrite={false} toneMapped={false} />
      </sprite>
    </group>
  );
}

function Rig() {
  const target = useMemo(() => new THREE.Vector3(0.6, 2.5, 0), []);
  useFrame((state, delta) => {
    const { camera, size } = state;
    const t = state.clock.elapsedTime;
    const aspect = size.width / Math.max(1, size.height);
    const radius = 17.5 * Math.min(2.4, Math.max(1, 1.9 / aspect));
    const angle = 0.3 + Math.sin(t * 0.09) * 0.14 + view.px * 0.16;
    const height = 7.6 - view.py * 0.8;
    const k = Math.min(1, delta * 2.5);
    const p = camera.position;
    p.set(
      p.x + (Math.sin(angle) * radius - p.x) * k,
      p.y + (height - p.y) * k,
      p.z + (Math.cos(angle) * radius - p.z) * k,
    );
    camera.lookAt(target);
  });
  return null;
}

function applyStudio(gl: THREE.WebGLRenderer, scene: THREE.Scene) {
  const pmrem = new THREE.PMREMGenerator(gl);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
}

export default function Chart3D({
  phase,
  marketCapUsd,
  reading,
  history,
  className,
}: {
  phase: RugPhase;
  marketCapUsd: number | null;
  reading: MarketCapReading | null;
  history: { v: number }[];
  className?: string;
}) {
  const live = marketCapUsd !== null || phase === "rugged";
  const hot = phase === "due" || phase === "rugged";
  const width = (SIM_CANDLES - 1) * STEP + 0.6;

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      view.px = (e.clientX / window.innerWidth) * 2 - 1;
      view.py = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <div className={className}>
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: false, powerPreference: "high-performance" }}
        camera={{ fov: 30, near: 0.1, far: 80, position: [5.2, 7.6, 16.7] }}
        onCreated={({ gl, scene }) => {
          gl.setClearColor(0x000000, 1);
          applyStudio(gl, scene);
        }}
        fallback={
          <Chart phase={phase} marketCapUsd={marketCapUsd} reading={reading} className="block h-full w-full" />
        }
      >
        <color attach="background" args={["#000000"]} />
        <fog attach="fog" args={["#000000", 20, 40]} />
        <Rig />
        <ambientLight intensity={0.15} />
        <directionalLight position={[4, 9, 5]} intensity={1.4} />
        <directionalLight position={[-6, 4, -3]} intensity={0.5} color="#8fb8ff" />

        <Candles live={live} hot={hot} history={history} />
        <RugPlane width={width} />

        {/* The floor: a hairline at zero. The reflection under it is drawn
            by the candles themselves; the black stays black. */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[width + 2, 0.006, 0.006]} />
          <meshBasicMaterial color="#2a2a2a" />
        </mesh>

        <EffectComposer>
          <Bloom luminanceThreshold={1} mipmapBlur intensity={1.15} radius={0.7} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
