"use client";

import { clsx } from "clsx";
import { Section } from "@/components/ui/Label";
import { isHot, marketCapSource, phaseCopy, usdExact } from "@/lib/rug";
import { useRug } from "@/lib/useRug";

/*
 * The meter. One bar from $0 to the line, the number on it, and the
 * distance left. Everything else on the page is a footnote to this.
 */
export function RugMeter() {
  const { phase, marketCapUsd, progress, distanceUsd, threshold, reading, isLoading, error } =
    useRug();
  const hot = isHot(phase);
  const pct = Math.round(progress * 1000) / 10;
  const fill = Math.max(progress * 100, marketCapUsd ? 0.5 : 0);

  return (
    <Section id="meter" kicker="Distance to rug">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <span className="t-key block">Market cap</span>
          <div className={clsx("t-figure mt-2", hot ? "text-down" : "text-text")}>
            {marketCapUsd === null ? (isLoading ? "…" : "—") : usdExact(marketCapUsd)}
          </div>
        </div>
        <div className="text-right">
          <span className="t-key block">Rug at</span>
          <div className="t-figure mt-2 text-down">{usdExact(threshold)}</div>
        </div>
      </div>

      <div
        className="relative mt-8 h-2 bg-rule"
        role="progressbar"
        aria-label="Market cap progress towards the rug threshold"
        aria-valuemin={0}
        aria-valuemax={threshold}
        aria-valuenow={Math.min(marketCapUsd ?? 0, threshold)}
      >
        <div
          className={clsx("absolute inset-y-0 left-0 transition-[width] duration-700", hot ? "bg-down" : "bg-up")}
          style={{ width: `${fill}%` }}
        />
        <span aria-hidden className="absolute -inset-y-2 right-0 w-0.5 bg-down" />
      </div>
      <div className="mt-3 flex justify-between">
        <span className="t-key">$0 · nothing</span>
        <span className={clsx("t-key", hot && "!text-down")}>{phase === "rugged" ? "pulled" : `${pct}%`}</span>
        <span className="t-key !text-down">the rug</span>
      </div>

      <p className={clsx("t-title mt-10", hot ? "text-down" : "text-text")}>
        {phaseCopy[phase].headline}
      </p>
      <p className="mt-2 max-w-[58ch] text-text-dim">
        {phase === "nothing" || phase === "close"
          ? `${usdExact(distanceUsd)} of market cap still to go before anything happens.`
          : phaseCopy[phase].detail}
      </p>
      <p className="t-small mt-4 text-text-muted">
        {marketCapSource === "none" && "No token address set. Nothing is being read, because there is nothing to read."}
        {marketCapSource === "override" && "Market cap set by hand. The rug is still at $100,000."}
        {marketCapSource === "dexscreener" &&
          (error
            ? `Feed unavailable: ${error}. The rug is still at $100,000.`
            : reading
              ? `Deepest pool, polled every 30 seconds${reading.pairUrl ? ". " : "."}`
              : "Reading the pool…")}
        {marketCapSource === "dexscreener" && reading?.pairUrl && !error && (
          <a href={reading.pairUrl} target="_blank" rel="noopener noreferrer" className="text-amber underline underline-offset-4">
            See the pair
          </a>
        )}
      </p>
    </Section>
  );
}
