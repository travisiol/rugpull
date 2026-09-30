"use client";

import { clsx } from "clsx";
import { ChartStage } from "@/components/ChartStage";
import { HeroCta } from "@/components/HeroCta";
import { ButtonLink } from "@/components/ui/Button";
import { isHot, marketCapSource, phaseCopy, usdExact } from "@/lib/rug";
import { useRug } from "@/lib/useRug";

/*
 * The whole thing, above the fold: the sentence, the number, the button,
 * and the chart that shows what the sentence means.
 */
export function Hero() {
  const { phase, marketCapUsd, reading, threshold } = useRug();
  const hot = isHot(phase);
  const live = marketCapSource !== "none";

  return (
    <section className="mx-auto max-w-[840px] px-5 pt-16 sm:px-6 sm:pt-24">
      <h1 className={clsx("t-hero", hot ? "text-down" : "text-text")}>
        Rugged at $100,000.
        <br />
        <span className="text-text-dim">Not a dollar before.</span>
      </h1>

      <p className="mt-8 max-w-[58ch] text-text-dim">
        Every rug gets pulled. Ours comes with a warning. The moment market cap
        reads <span className="text-text">$100,000</span>, the dev pulls it.
        Below that, nothing happens: no sells, no liquidity moves, no
        &ldquo;migration&rdquo;. You are reading the announcement. There will
        not be another one.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <HeroCta />
        <ButtonLink href="#terms" variant="ghost">
          The terms
        </ButtonLink>
      </div>

      <p className={clsx("t-small mt-6", hot ? "text-down" : "text-text-dim")}>
        <span className="text-text-muted">status </span>
        <span className={clsx(!hot && "cursor")}>{phaseCopy[phase].headline}</span>
      </p>

      <div className="mt-16">
        <ChartStage
          phase={phase}
          marketCapUsd={marketCapUsd}
          reading={reading}
          className="relative -mx-5 h-[360px] overflow-hidden sm:-mx-6 sm:h-[460px] lg:-mx-40 lg:h-[540px]"
        />
        <p className="t-small mt-3 text-text-muted">
          {live
            ? marketCapUsd === null
              ? "Reading the pool…"
              : `Live. Market cap ${usdExact(marketCapUsd)}. Rug at ${usdExact(threshold)}.`
            : "Simulated. Not launched. This is the only thing that will ever happen here."}
        </p>
      </div>
    </section>
  );
}
