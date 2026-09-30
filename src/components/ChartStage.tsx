"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { MarketCapReading, RugPhase } from "@/lib/rug";

/*
 * Loads the 3D chart on the client only. On a device without WebGL the
 * canvas falls back to the flat chart by itself.
 */
const Chart3D = dynamic(() => import("@/components/three/Chart3D"), {
  ssr: false,
  loading: () => null,
});

const HISTORY_KEY = "rugpull.mc.history";

function readHistory(): { v: number }[] {
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { v: number }[];
    return Array.isArray(parsed) ? parsed.filter((p) => Number.isFinite(p.v)) : [];
  } catch {
    return [];
  }
}

export function ChartStage({
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
  const [history, setHistory] = useState<{ v: number }[]>([]);

  // The flat chart records each reading; this side re-reads the log.
  useEffect(() => {
    const id = window.setTimeout(() => setHistory(readHistory()), 0);
    return () => window.clearTimeout(id);
  }, [reading, marketCapUsd]);

  return (
    <div className={className}>
      <Chart3D
        phase={phase}
        marketCapUsd={marketCapUsd}
        reading={reading}
        history={history}
        className="h-full w-full"
      />
    </div>
  );
}
