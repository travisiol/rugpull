"use client";

import { useQuery } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";
import {
  fetchMarketCap,
  marketCapSource,
  phaseFor,
  RUG_THRESHOLD_USD,
  rugConfig,
  type MarketCapReading,
  type RugPhase,
} from "@/lib/rug";

export interface RugState {
  phase: RugPhase;
  /** Null until a reading exists. Never invented. */
  marketCapUsd: number | null;
  reading: MarketCapReading | null;
  /** 0–1 of the way to the rug. */
  progress: number;
  /** Dollars of market cap still to go. Zero once due. */
  distanceUsd: number;
  threshold: number;
  isLoading: boolean;
  error: string | null;
}

/**
 * The state of the rug, shared by every component through one query key.
 * Polls the feed every 30 seconds while the tab is open.
 */
export function useRug(): RugState {
  const query = useQuery({
    queryKey: ["rug", "marketcap", marketCapSource, rugConfig.tokenAddress],
    queryFn: fetchMarketCap,
    enabled: marketCapSource !== "none",
    refetchInterval: 30_000,
    retry: 1,
  });

  const marketCapUsd = query.data?.marketCapUsd ?? null;
  const phase = phaseFor(marketCapUsd);
  // After the rug the number collapses, but the line was crossed: the meter
  // stays full so the page keeps showing what happened rather than what is left.
  const clamped =
    phase === "rugged"
      ? RUG_THRESHOLD_USD
      : Math.min(Math.max(marketCapUsd ?? 0, 0), RUG_THRESHOLD_USD);

  return {
    phase,
    marketCapUsd,
    reading: query.data ?? null,
    progress: clamped / RUG_THRESHOLD_USD,
    distanceUsd: RUG_THRESHOLD_USD - clamped,
    threshold: RUG_THRESHOLD_USD,
    isLoading: marketCapSource !== "none" && query.isPending,
    error: query.error ? query.error.message : null,
  };
}

/**
 * A clock that only runs on the client. The server snapshot is null, so the
 * server render and the first client render agree; the browser then ticks.
 */
function subscribeToClock(tickMs: number) {
  return (onTick: () => void) => {
    const timer = window.setInterval(onTick, tickMs);
    return () => window.clearInterval(timer);
  };
}

const subscribers = new Map<number, (onTick: () => void) => () => void>();

export function useNow(tickMs = 1000): number | null {
  let subscribe = subscribers.get(tickMs);
  if (!subscribe) {
    subscribe = subscribeToClock(tickMs);
    subscribers.set(tickMs, subscribe);
  }
  return useSyncExternalStore(
    subscribe,
    // Floored to the tick so a re-render between ticks reads a stable value.
    () => Math.floor(Date.now() / tickMs) * tickMs,
    () => null,
  );
}
