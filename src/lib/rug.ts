import { envNumberOrNull, envOrNull } from "@/lib/site-config";

/*
 * The one rule.
 *
 * The rug happens at exactly this market cap. Below it, nothing happens.
 * Everything else on the site is derived from this number and the live
 * reading against it, so the promise and the page can never disagree.
 */
export const RUG_THRESHOLD_USD = 100_000;

/** Above this share of the threshold the site admits things are getting close. */
export const CLOSE_CALL_RATIO = 0.9;

/**
 * Everything that changes between "site is up" and "token exists" lives in
 * env, so no placeholder address, invented market cap or fake launch date
 * can ship hardcoded. With nothing set the site is honestly pre-launch:
 * market cap is unknown, and nothing is happening — as promised.
 */
export const rugConfig = {
  tokenAddress: envOrNull(process.env.NEXT_PUBLIC_RUG_TOKEN_ADDRESS) as
    | `0x${string}`
    | null,
  /** Where the buy button goes. Hidden while unset. */
  buyUrl: envOrNull(process.env.NEXT_PUBLIC_RUG_BUY_URL),
  /** ISO date. Drives the "time during which nothing happened" counter. */
  launchedAt: parseDate(process.env.NEXT_PUBLIC_RUG_LAUNCHED_AT),
  /**
   * Manual market cap in USD. Overrides the live feed — for demos, for
   * chains the feed does not index, or for the day the feed is down and
   * you still want the number on the page to be the real one.
   */
  marketCapOverrideUsd: envNumberOrNull(process.env.NEXT_PUBLIC_RUG_MARKETCAP_USD),
  /**
   * Restrict the DexScreener lookup to one chain slug (e.g. "robinhood").
   * Unset takes the deepest pair for the token on any chain.
   */
  dexChainId: envOrNull(process.env.NEXT_PUBLIC_RUG_DEX_CHAIN_ID),
  /**
   * Flip to true after the rug. Market cap goes to ~zero the moment it
   * happens, and without this the page would cheerfully report that
   * nothing is happening again. Something did.
   */
  rugged: process.env.NEXT_PUBLIC_RUG_RUGGED === "true",
  /** Total supply, as a display string. Shown only when set. */
  totalSupply: envOrNull(process.env.NEXT_PUBLIC_RUG_TOTAL_SUPPLY),
} as const;

function parseDate(value: string | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

// ---- Market cap source --------------------------------------------------

export type MarketCapSource = "override" | "dexscreener" | "none";

export const marketCapSource: MarketCapSource =
  rugConfig.marketCapOverrideUsd !== null
    ? "override"
    : rugConfig.tokenAddress
      ? "dexscreener"
      : "none";

export interface MarketCapReading {
  marketCapUsd: number;
  priceUsd: number | null;
  liquidityUsd: number | null;
  /** Link to the pair the number was read from. */
  pairUrl: string | null;
  fetchedAt: number;
}

/** The subset of DexScreener's token response this page reads. */
interface DexPair {
  chainId: string;
  url?: string;
  priceUsd?: string;
  liquidity?: { usd?: number };
  fdv?: number;
  marketCap?: number;
}

interface DexTokenResponse {
  pairs: DexPair[] | null;
}

/**
 * Reads the market cap straight off the deepest pool for the token. Polled,
 * not cached: the number is for watching, and the rug is at $100K whether
 * or not this endpoint agrees.
 */
export async function fetchMarketCap(): Promise<MarketCapReading> {
  if (marketCapSource === "override") {
    return {
      marketCapUsd: rugConfig.marketCapOverrideUsd ?? 0,
      priceUsd: null,
      liquidityUsd: null,
      pairUrl: null,
      fetchedAt: Date.now(),
    };
  }
  if (marketCapSource === "none" || !rugConfig.tokenAddress) {
    throw new Error("No token address configured");
  }

  const response = await fetch(
    `https://api.dexscreener.com/latest/dex/tokens/${rugConfig.tokenAddress}`,
    { cache: "no-store" },
  );
  if (!response.ok) {
    throw new Error(`Market feed answered ${response.status}`);
  }
  const body = (await response.json()) as DexTokenResponse;

  const pairs = (body.pairs ?? []).filter(
    (pair) => !rugConfig.dexChainId || pair.chainId === rugConfig.dexChainId,
  );
  if (pairs.length === 0) {
    throw new Error("No pair found for this token yet");
  }

  const deepest = pairs.reduce((best, pair) =>
    (pair.liquidity?.usd ?? 0) > (best.liquidity?.usd ?? 0) ? pair : best,
  );

  return {
    marketCapUsd: deepest.marketCap ?? deepest.fdv ?? 0,
    priceUsd: deepest.priceUsd ? Number.parseFloat(deepest.priceUsd) : null,
    liquidityUsd: deepest.liquidity?.usd ?? null,
    pairUrl: deepest.url ?? null,
    fetchedAt: Date.now(),
  };
}

// ---- Phases ---------------------------------------------------------------

/**
 * Where the project is relative to its one event.
 *
 *   unlaunched  no token yet — nothing is happening, and cannot
 *   nothing     trading, below the threshold — nothing is happening
 *   close       within 10% of the threshold — nothing is happening, yet
 *   due         threshold crossed — the rug is due
 *   rugged      it happened
 */
export type RugPhase = "unlaunched" | "nothing" | "close" | "due" | "rugged";

export function phaseFor(marketCapUsd: number | null): RugPhase {
  if (rugConfig.rugged) return "rugged";
  if (marketCapUsd === null) return "unlaunched";
  if (marketCapUsd >= RUG_THRESHOLD_USD) return "due";
  if (marketCapUsd >= RUG_THRESHOLD_USD * CLOSE_CALL_RATIO) return "close";
  return "nothing";
}

export const phaseCopy: Record<
  RugPhase,
  { status: string; headline: string; detail: string }
> = {
  unlaunched: {
    status: "Not launched",
    headline: "Nothing is happening.",
    detail: "There is no token yet, so there is nothing to rug. As promised.",
  },
  nothing: {
    status: "Nothing is happening",
    headline: "Nothing is happening.",
    detail: "Market cap is below $100,000. The dev is doing nothing. As promised.",
  },
  close: {
    status: "Getting close",
    headline: "Nothing is happening. Yet.",
    detail:
      "Within 10% of the threshold. Still nothing — but you can see it from here.",
  },
  due: {
    status: "Threshold reached",
    headline: "The rug is due.",
    detail:
      "Market cap crossed $100,000. This is the moment the whole page was about.",
  },
  rugged: {
    status: "Rugged",
    headline: "It happened.",
    detail: "The rug was pulled at $100,000, exactly as announced. You were told.",
  },
};

/** True once the page is past "nothing" — the only time red is allowed. */
export function isHot(phase: RugPhase): boolean {
  return phase === "due" || phase === "rugged";
}

// ---- Formatting ---------------------------------------------------------

export function usd(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 10_000) {
    const k = value / 1_000;
    return `$${Number.isInteger(k) ? k : k.toFixed(1)}K`;
  }
  return `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function usdExact(value: number): string {
  return `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function tokenPrice(value: number | null): string {
  if (value === null || value === 0) return "—";
  if (value < 0.0001) return `$${value.toExponential(2)}`;
  if (value < 0.01) return `$${value.toFixed(6)}`;
  if (value < 1) return `$${value.toFixed(4)}`;
  return `$${value.toFixed(3)}`;
}

export function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
