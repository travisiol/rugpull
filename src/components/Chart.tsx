"use client";

import { useEffect, useRef } from "react";
import { AXIS_MAX, buildRun, SIM_CANDLES, SIM_RUG_AT, type Candle } from "@/lib/chartSim";
import { RUG_THRESHOLD_USD, type MarketCapReading, type RugPhase } from "@/lib/rug";

/*
 * The chart, with nothing on it but the chart: candles, and one dashed
 * red line across the top at $100,000.
 *
 * Before launch it replays a SIMULATION (the caption under it says so)
 * of the only thing that will ever happen here. Once the token trades it
 * plots the real readings this page has taken, and nothing else.
 *
 * Colour rule, kept strictly: up candles green, down candles hollow grey.
 * Red is the rug — the line, the one candle that crosses it, and after
 * that, everything.
 */

const PAD_R = 92;
const PAD_Y = 10;
const CANDLES_PER_SECOND = 7;
const HOLD_SECONDS = 4;
const HISTORY_KEY = "rugpull.mc.history";

interface Point {
  t: number;
  v: number;
}

// Live readings, kept across renders and reloads.
const history: Point[] = [];
let historyLoaded = false;

function loadHistory() {
  if (historyLoaded || typeof window === "undefined") return;
  historyLoaded = true;
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Point[];
      if (Array.isArray(parsed)) history.push(...parsed.filter((p) => Number.isFinite(p.v)));
    }
  } catch {
    // No storage; the chart starts empty this session.
  }
}

function pushHistory(point: Point) {
  const last = history[history.length - 1];
  if (last && last.t === point.t) return;
  history.push(point);
  if (history.length > 2000) history.splice(0, history.length - 2000);
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // Storage refused; in-memory history still draws.
  }
}

function fmt(v: number) {
  return `$${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

const ease = (f: number) => 1 - Math.pow(1 - f, 2.2);

interface Frame {
  width: number;
  height: number;
  dpr: number;
  seed: number;
  run: Candle[];
  startedAt: number;
  reduced: boolean;
}

export function Chart({
  phase,
  marketCapUsd,
  reading,
  className,
}: {
  phase: RugPhase;
  marketCapUsd: number | null;
  reading: MarketCapReading | null;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frame = useRef<Frame>({
    width: 0,
    height: 0,
    dpr: 1,
    seed: 7,
    run: [],
    startedAt: 0,
    reduced: false,
  });

  // Record each live reading once.
  useEffect(() => {
    loadHistory();
    if (reading && marketCapUsd !== null) {
      pushHistory({ t: reading.fetchedAt, v: marketCapUsd });
    }
  }, [reading, marketCapUsd]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const f = frame.current;
    f.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    f.run = buildRun(f.seed);
    f.startedAt = performance.now();

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      f.width = Math.max(1, Math.floor(rect.width));
      f.height = Math.max(1, Math.floor(rect.height));
      f.dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = f.width * f.dpr;
      canvas.height = f.height * f.dpr;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const live = marketCapUsd !== null || phase === "rugged";
    const hot = phase === "due" || phase === "rugged";

    let raf = 0;
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      const { width: W, height: H, dpr } = f;
      if (W < 2 || H < 2) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      const plotW = W - PAD_R;
      const plotH = H - PAD_Y * 2;
      const y = (v: number) => PAD_Y + (1 - Math.min(v, AXIS_MAX) / AXIS_MAX) * plotH;

      ctx.font = "500 12px 'IBM Plex Mono', ui-monospace, monospace";
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";

      // Baseline: $0.
      ctx.strokeStyle = "#1c1c1c";
      ctx.beginPath();
      ctx.moveTo(0, Math.round(y(0)) + 0.5);
      ctx.lineTo(plotW, Math.round(y(0)) + 0.5);
      ctx.stroke();

      let lastValue: number | null = null;

      if (live) {
        const pts = history.slice();
        if (phase === "rugged") pts.push({ t: Date.now(), v: 0 });
        const slots = Math.max(pts.length, 40);
        const slot = plotW / slots;
        const x = (i: number) => (i + 0.5) * slot;
        if (pts.length > 0) {
          ctx.strokeStyle = hot ? "#ff3b3b" : "#00d26a";
          ctx.lineWidth = 2;
          ctx.beginPath();
          pts.forEach((p, i) => {
            if (i === 0) ctx.moveTo(x(i), y(p.v));
            else ctx.lineTo(x(i), y(p.v));
          });
          ctx.stroke();
          ctx.lineWidth = 1;
          lastValue = pts[pts.length - 1].v;
          ctx.fillStyle = hot ? "#ff3b3b" : "#00d26a";
          ctx.beginPath();
          ctx.arc(x(pts.length - 1), y(lastValue), 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        const elapsed = (now - f.startedAt) / 1000;
        const total = SIM_CANDLES / CANDLES_PER_SECOND;
        if (!f.reduced && elapsed > total + HOLD_SECONDS) {
          f.seed += 1;
          f.run = buildRun(f.seed);
          f.startedAt = now;
        }
        const revealF = f.reduced ? SIM_CANDLES : Math.min(SIM_CANDLES, elapsed * CANDLES_PER_SECOND);
        const shown = Math.floor(revealF);
        const frac = revealF - shown;
        const slot = plotW / SIM_CANDLES;
        const body = Math.max(2, Math.floor(slot * 0.6));
        const x = (i: number) => Math.round((i + 0.5) * slot);

        for (let i = 0; i < Math.min(SIM_CANDLES, shown + 1); i += 1) {
          const c = f.run[i];
          if (!c) break;
          const forming = i === shown;
          let close = c.c;
          let high = c.h;
          let low = c.l;
          if (forming) {
            if (frac <= 0) break;
            const e = ease(frac);
            const jitter = (Math.sin(now / 37 + i) + Math.sin(now / 61)) * 0.0025 * c.o;
            close = c.o + (c.c - c.o) * e + jitter * (1 - e);
            high = Math.max(c.o, close) + (c.h - Math.max(c.o, c.c)) * e;
            low = Math.min(c.o, close) - (Math.min(c.o, c.c) - c.l) * e;
          }
          const isRug = i >= SIM_RUG_AT;
          const up = close >= c.o;
          const xx = x(i);
          const yo = y(c.o);
          const yc = y(close);
          const color = isRug ? "#ff3b3b" : up ? "#00d26a" : "#5a5a5a";
          ctx.strokeStyle = color;
          ctx.fillStyle = color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(xx + 0.5, y(high));
          ctx.lineTo(xx + 0.5, y(low));
          ctx.stroke();
          const top = Math.min(yo, yc);
          const hgt = Math.max(1, Math.abs(yo - yc));
          if (up || isRug) {
            ctx.fillRect(xx - Math.floor(body / 2), top, body, hgt);
          } else {
            ctx.fillStyle = "#000000";
            ctx.fillRect(xx - Math.floor(body / 2), top, body, hgt);
            ctx.strokeRect(xx - Math.floor(body / 2) + 0.5, top + 0.5, body - 1, Math.max(1, hgt - 1));
          }
          lastValue = close;
        }
      }

      // The line.
      const yr = Math.round(y(RUG_THRESHOLD_USD)) + 0.5;
      ctx.save();
      ctx.setLineDash([6, 5]);
      ctx.strokeStyle = "#ff3b3b";
      ctx.beginPath();
      ctx.moveTo(0, yr);
      ctx.lineTo(plotW, yr);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = "#ff3b3b";
      ctx.font = "600 12px 'IBM Plex Mono', ui-monospace, monospace";
      ctx.fillText("$100,000", plotW + 10, yr);
      ctx.fillText("the rug", plotW + 10, yr + 16);

      // Last price, on the axis.
      if (lastValue !== null) {
        const yl = Math.round(y(lastValue)) + 0.5;
        const past = lastValue >= RUG_THRESHOLD_USD || (live && hot);
        if (Math.abs(yl - yr) > 26) {
          ctx.fillStyle = past ? "#ff3b3b" : "#8a8a8a";
          ctx.font = "500 12px 'IBM Plex Mono', ui-monospace, monospace";
          ctx.fillText(fmt(lastValue), plotW + 10, yl);
        }
      }
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [phase, marketCapUsd]);

  return <canvas ref={canvasRef} className={className} aria-hidden />;
}
