import { RUG_THRESHOLD_USD } from "@/lib/rug";

/*
 * The chart the page opens on.
 *
 * There is no price history to plot before launch, and this site does not
 * invent numbers — so the hero chart is a SIMULATION, labelled as one on
 * screen: a market cap that climbs to $100,000 and then does the one
 * thing the page promises. It replays forever. Once the token trades, the
 * live readings take over (see Chart.tsx).
 */

export interface Candle {
  o: number;
  h: number;
  l: number;
  c: number;
}

export const SIM_CANDLES = 150;
/** Index of the candle that crosses the line. */
export const SIM_RUG_AT = 126;
/** Top of the price axis: room above the line so it is a line, not a lid. */
export const AXIS_MAX = 118_000;

/** Deterministic PRNG so a given seed always draws the same run. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gauss(rnd: () => number) {
  // Box–Muller.
  const u = Math.max(1e-9, rnd());
  const v = rnd();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/**
 * One run: a geometric random walk with upward drift, forced to cross the
 * threshold at SIM_RUG_AT, then the rug — one red candle to nothing — and
 * a flat line after it.
 */
export function buildRun(seed: number): Candle[] {
  const rnd = mulberry32(seed);
  const start = 1_400 + rnd() * 1_200;
  const drift = Math.log(RUG_THRESHOLD_USD / start) / (SIM_RUG_AT - 1);
  const vol = 0.075;

  const closes: number[] = [start];
  for (let i = 1; i < SIM_RUG_AT; i += 1) {
    const step = drift + vol * gauss(rnd);
    // Two or three "nothing happened" stretches where it goes sideways.
    const sideways = (i > 30 && i < 42) || (i > 78 && i < 92);
    closes.push(closes[i - 1] * Math.exp(sideways ? vol * 0.4 * gauss(rnd) : step));
  }
  // Force the crossing: the last pre-rug close clears the line.
  const scale = (RUG_THRESHOLD_USD * (1.004 + rnd() * 0.01)) / closes[SIM_RUG_AT - 1];
  // Ease the scale in over the final third so the tail is not a kink.
  for (let i = 0; i < SIM_RUG_AT; i += 1) {
    const w = Math.max(0, (i - SIM_RUG_AT * 0.66) / (SIM_RUG_AT * 0.34));
    closes[i] *= 1 + (scale - 1) * w * w;
  }

  const candles: Candle[] = [];
  for (let i = 0; i < SIM_RUG_AT; i += 1) {
    const o = i === 0 ? closes[0] * (1 - 0.02 * rnd()) : closes[i - 1];
    const c = closes[i];
    const span = Math.abs(c - o);
    const h = Math.max(o, c) + span * rnd() * 0.9 + c * 0.004 * rnd();
    const l = Math.min(o, c) - span * rnd() * 0.9 - c * 0.004 * rnd();
    candles.push({ o, h: Math.min(h, AXIS_MAX * 0.995), l: Math.max(l, 0), c });
  }
  // The rug.
  const top = candles[SIM_RUG_AT - 1].c;
  candles.push({ o: top, h: top * 1.006, l: 0, c: top * 0.004 });
  // After: nothing, at nothing.
  for (let i = SIM_RUG_AT + 1; i < SIM_CANDLES; i += 1) {
    const prev = candles[i - 1].c;
    const c = Math.max(0, prev * (1 + 0.08 * gauss(rnd)));
    candles.push({ o: prev, h: Math.max(prev, c) * 1.02, l: Math.min(prev, c) * 0.98, c });
  }
  return candles;
}

/** Time labels along the bottom axis: days since launch, every 25 candles. */
export function dayLabel(index: number) {
  return `D+${index}`;
}
