"use client";

import { ButtonLink } from "@/components/ui/Button";
import { rugConfig } from "@/lib/rug";
import { siteConfig } from "@/lib/site-config";
import { useRug } from "@/lib/useRug";

/** The one button, worded for where the project is. */
export function HeroCta() {
  const { phase } = useRug();

  if (phase === "rugged") {
    return (
      <ButtonLink href="#record" variant="down">
        It happened · see the record
      </ButtonLink>
    );
  }
  if (!rugConfig.buyUrl) {
    return (
      <ButtonLink href="#buy" variant="ghost">
        Not launched yet
      </ButtonLink>
    );
  }
  return (
    <ButtonLink href={rugConfig.buyUrl} external>
      {phase === "due"
        ? `Buy ${siteConfig.ticker} · seriously?`
        : `Buy ${siteConfig.ticker} · you were warned`}
    </ButtonLink>
  );
}
