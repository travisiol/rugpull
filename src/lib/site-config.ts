/*
 * RUGPULL — the first rug with a warning label.
 *
 * One string here renames the site everywhere: metadata, nav, OG image,
 * footer. The ticker symbol is separate because it shows up in prose.
 */
export const siteConfig = {
  name: "RUGPULL",
  ticker: "$RUG",
  tagline: "Rugged at $100K. Not a dollar before.",
  description:
    "Every rug gets pulled. Ours comes with a warning. This token gets rugged the moment market cap hits $100,000 — and below that, nothing happens. Nothing at all.",
  seoDescription:
    "An announced rug pull on Robinhood Chain. Rugged at $100K market cap, not a dollar before. Below that, nothing happens.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://rugpull.example",
  x: envOrNull(process.env.NEXT_PUBLIC_RUG_X),
  telegram: envOrNull(process.env.NEXT_PUBLIC_RUG_TELEGRAM),
} as const;

export function envOrNull(value: string | undefined): string | null {
  return value && value.trim().length > 0 ? value.trim() : null;
}

export function envNumberOrNull(value: string | undefined): number | null {
  const parsed = Number.parseFloat(value ?? "");
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}
