"use client";

import { clsx } from "clsx";
import { Section } from "@/components/ui/Label";
import { isHot, rugConfig, usdExact } from "@/lib/rug";
import { useNow, useRug } from "@/lib/useRug";

const DAY_MS = 86_400_000;

function pad(value: number) {
  return String(value).padStart(2, "0");
}

/** d / h / m / s since launch, or dashes before the clock has started. */
function elapsed(from: Date | null, now: number | null) {
  if (!from || now === null) return null;
  const total = Math.max(0, Math.floor((now - from.getTime()) / 1000));
  return {
    days: Math.floor(total / 86_400),
    hours: Math.floor((total % 86_400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

/*
 * The record. A clock counting the seconds during which nothing has
 * happened, and a log of every day since launch, each entry reporting
 * that nothing happened.
 */
export function Record() {
  const { phase, marketCapUsd } = useRug();
  const now = useNow();
  const hot = isHot(phase);
  const since = elapsed(rugConfig.launchedAt, now);

  const launched = rugConfig.launchedAt;
  const daysSince =
    launched && now !== null
      ? Math.max(0, Math.floor((now - launched.getTime()) / DAY_MS))
      : null;

  const visible = 6;
  const days =
    daysSince === null
      ? []
      : Array.from({ length: Math.min(daysSince + 1, visible) }, (_, i) => daysSince - i);
  const hidden = daysSince === null ? 0 : Math.max(0, daysSince + 1 - visible);

  const clock = since
    ? `${since.days}d ${pad(since.hours)}:${pad(since.minutes)}:${pad(since.seconds)}`
    : "--d --:--:--";

  return (
    <Section id="record" kicker="The record" title="Everything that has happened so far">
      <span className="t-key block">
        {phase === "rugged"
          ? "Time during which nothing happened"
          : "Time during which nothing has happened"}
      </span>
      <div className={clsx("t-figure mt-2", hot ? "text-down" : "text-text")} aria-live="off">
        {clock}
      </div>
      <p className="t-small mt-3 max-w-[58ch] text-text-muted">
        {launched
          ? `Counting since ${launched.toISOString().slice(0, 10)}. Still counting.`
          : "The clock starts at launch. There is no launch yet, so it has not started. Nothing has happened for exactly as long as you would expect."}
      </p>

      <ol className="mt-8">
        {phase === "rugged" && (
          <li className="row grid grid-cols-[3rem_1fr] gap-4">
            <span className="text-down">D+{daysSince ?? "?"}</span>
            <span className="text-down">The rug was pulled at {usdExact(100_000)}. As announced.</span>
          </li>
        )}
        {days.map((day, i) => (
          <li key={day} className="row grid grid-cols-[3rem_1fr] gap-4">
            <span className="text-text-muted">D+{day}</span>
            <span className="text-text-dim">
              {i === 0 && phase !== "rugged"
                ? marketCapUsd === null
                  ? "Nothing has happened so far."
                  : `Nothing has happened so far. Market cap ${usdExact(marketCapUsd)}. Rug: not yet.`
                : "Nothing happened."}
            </span>
          </li>
        ))}
        {hidden > 0 && (
          <li className="row grid grid-cols-[3rem_1fr] gap-4">
            <span className="text-text-muted">…</span>
            <span className="text-text-muted">
              and {hidden} more {hidden === 1 ? "day" : "days"} on which nothing happened.
            </span>
          </li>
        )}
        {daysSince === null && (
          <li className="row grid grid-cols-[3rem_1fr] gap-4">
            <span className="text-text-muted">D+0</span>
            <span className="text-text-dim">Not launched. Nothing happened. Off to a strong start.</span>
          </li>
        )}
      </ol>
    </Section>
  );
}
