# RUGPULL

The first rug pull with a warning label. A memecoin site for Robinhood Chain
whose entire product is one sentence: **this token gets rugged the moment
market cap hits $100,000, and below that, nothing happens.**

Most devs rug in silence. This one announces it, puts the number on a meter,
and does nothing in public until the number is reached.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · Tailwind v4 · wagmi v3 + viem ·
TanStack Query · TypeScript. Injected wallets only, Robinhood Chain, no backend.

## The meter is the product

`src/components/RugMeter.tsx` draws one bar from $0 to $100,000 and puts the
live market cap on it. Every other component on the page derives from the same
reading through `useRug()` in `src/lib/useRug.ts`:

| Phase | When | What the page says |
| --- | --- | --- |
| `unlaunched` | no token address set | Nothing is happening. There is no token, so there is nothing to rug. |
| `nothing` | market cap below 90% of the threshold | Nothing is happening. $X still to go. |
| `close` | within 10% of the threshold | Nothing is happening. Yet. |
| `due` | market cap ≥ $100,000 | The rug is due. Everything turns red. |
| `rugged` | `NEXT_PUBLIC_RUG_RUGGED=true` | It happened. You were told. |

The threshold is one constant, `RUG_THRESHOLD_USD` in `src/lib/rug.ts`. The
promise and the page can never disagree because there is only one number.

Red appears nowhere on the site until the threshold is crossed. Below it, the
only colour is caution-tape yellow.

## Where the number comes from

Market cap is read client-side from DexScreener's token endpoint for
`NEXT_PUBLIC_RUG_TOKEN_ADDRESS`, taking the deepest pool, polled every 30
seconds while the tab is open. If the feed is down or the chain is not indexed
yet, the page says so rather than showing a stale or invented figure.

`NEXT_PUBLIC_RUG_MARKETCAP_USD` overrides the feed with a hand-set value. Use
it for demos, for a chain the feed does not cover, or for the day the feed is
down and you still want the real number on the page.

## What is honest about the page

- With no env set, every figure is a real unknown: no market cap, no launch
  date, no address, disabled buy button. Nothing is happening, as promised.
- No supply, price, holder count or launch date is ever invented. Each appears
  only when its env var is set.
- The rugged state is an explicit flag, because market cap collapses the
  moment the rug happens and the page would otherwise report that nothing is
  happening again. Something did.

## Setup

```bash
npm install
cp .env.example .env.local   # optional — it runs with no env at all
npm run dev
```

## Going live

1. Deploy the token and open a pool on Robinhood Chain.
2. Set `NEXT_PUBLIC_RUG_TOKEN_ADDRESS`, `NEXT_PUBLIC_RUG_BUY_URL` and
   `NEXT_PUBLIC_RUG_LAUNCHED_AT`. The meter, the buy panel and the "time during
   which nothing happened" clock all switch on by themselves.
3. If DexScreener does not index the chain yet, set
   `NEXT_PUBLIC_RUG_MARKETCAP_USD` by hand until it does.
4. Set `NEXT_PUBLIC_SITE_URL` so metadata, `sitemap.xml` and `robots.txt` point
   at the real domain.
5. After the rug, set `NEXT_PUBLIC_RUG_RUGGED=true` and redeploy.

Social links stay hidden until their env vars are set, so no dead link ships.

Robinhood Chain network details in `src/lib/chain.ts` (chain id, RPC, explorer)
are unverified third-party research and must be re-confirmed against
`docs.robinhood.com/chain` before mainnet use.

## Art direction

One column of black, one monospaced face (IBM Plex Mono) at every size, and
three colours that each mean exactly one thing: amber for the one control you
can press, green for candles going up, red for the rug. Red appears nowhere
except the dashed line at $100,000 — until the number crosses it, and then it
is everywhere. No cards, no borders, no decoration: rules between rows, and
the number.

Under the headline sits the chart, as an object: `src/components/three/Chart3D.tsx`
draws the candles as glass rods lit from inside (instanced, bloom on the
cores), standing on a black floor that reflects them, with a red plane cutting
across at $100,000. The camera drifts and leans toward the cursor. On a device
without WebGL the canvas falls back to the flat chart in `Chart.tsx`, which is
also what records readings.

Before launch the chart replays a **simulation**, and the caption under it says
so: market cap climbs to the line and does the one thing the page promises, on a
loop (`src/lib/chartSim.ts`, seeded, deterministic). Once the token trades it
plots the real readings this page has taken (kept in `localStorage`) and
nothing else.

The scene was checked with headless Chrome + SwiftShader (the browser pane
cannot capture WebGL while hidden).

## Wallets

`src/components/ConnectDialog.tsx` lists every wallet the browser announces
(EIP-6963), WalletConnect when `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is set,
and install links when there is nothing to list. Connecting reads an address;
the site signs and moves nothing.

## Verification

`npx tsc --noEmit`, `npx eslint` and `npx next build` all pass clean.
