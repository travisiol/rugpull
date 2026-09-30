"use client";

import { clsx } from "clsx";
import { useState } from "react";
import { useConnection } from "wagmi";
import { WalletConnect } from "@/components/WalletConnect";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Section } from "@/components/ui/Label";
import { robinhoodChain } from "@/lib/chain";
import { isHot, rugConfig, shortAddress, tokenPrice, usdExact } from "@/lib/rug";
import { siteConfig } from "@/lib/site-config";
import { useRug } from "@/lib/useRug";

/*
 * Where you would buy. Every field is real or says it is not set; nothing
 * here is a placeholder pretending to be a contract.
 */
export function BuyPanel() {
  const { phase, reading, marketCapUsd, threshold } = useRug();
  const { isConnected } = useConnection();
  const hot = isHot(phase);
  const [copied, setCopied] = useState(false);
  const address = rugConfig.tokenAddress;

  const copy = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard refused; the address is on screen anyway.
    }
  };

  const rows = [
    { key: "Token", value: siteConfig.ticker },
    { key: "Chain", value: robinhoodChain.name },
    { key: "Market cap", value: marketCapUsd === null ? "Not launched" : usdExact(marketCapUsd) },
    { key: "Price", value: tokenPrice(reading?.priceUsd ?? null) },
    { key: "Rug at", value: usdExact(threshold), tone: "text-down" },
    ...(rugConfig.totalSupply ? [{ key: "Supply", value: rugConfig.totalSupply }] : []),
    { key: "Wallet", value: isConnected ? "Connected" : "Not connected" },
  ];

  return (
    <Section id="buy" kicker="Participate" title="Buy the rug">
      <div className="row">
        <span className="t-key block">Contract</span>
        {address ? (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <code className="break-all text-text">{address}</code>
            <Button variant="ghost" onClick={copy} className="!h-8 !px-3">
              {copied ? "Copied" : "Copy"}
            </Button>
            <a
              href={`${robinhoodChain.blockExplorers.default.url}/token/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber underline underline-offset-4"
            >
              {shortAddress(address)} ↗
            </a>
          </div>
        ) : (
          <p className="mt-2 max-w-[58ch] text-text-dim">
            Not deployed. There is no address, so there is nothing to buy, so
            nothing is happening. Consistent.
          </p>
        )}
      </div>

      <dl>
        {rows.map((row) => (
          <div key={row.key} className="row flex justify-between gap-6 !py-3">
            <dt className="text-text-muted">{row.key}</dt>
            <dd className={clsx("text-text", row.tone)}>{row.value}</dd>
          </div>
        ))}
      </dl>

      <div className="row flex flex-wrap gap-3">
        <WalletConnect />
        {phase === "rugged" ? (
          <Button disabled>Rugged. You were told.</Button>
        ) : rugConfig.buyUrl ? (
          <ButtonLink href={rugConfig.buyUrl} external>
            Buy {siteConfig.ticker} · you were told
          </ButtonLink>
        ) : (
          <Button disabled>Not launched</Button>
        )}
      </div>

      <ul className="row">
        {[
          "This token will be rugged at $100,000 market cap.",
          "You are reading that sentence before buying, which is more than any other rug has offered you.",
          "If you are holding when the line is crossed, you are holding the bag. That is what a rug is.",
          "Not financial advice. A financial warning, with a number on it.",
        ].map((line) => (
          <li key={line} className="flex gap-3 py-1">
            <span className={clsx("shrink-0", hot ? "text-down" : "text-amber")}>›</span>
            <span className="t-small max-w-[60ch] text-text-dim">{line}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}
