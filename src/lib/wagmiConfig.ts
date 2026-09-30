import { createConfig, http } from "wagmi";
import { injected, walletConnect } from "wagmi/connectors";
import { robinhoodChain } from "@/lib/chain";
import { envOrNull, siteConfig } from "@/lib/site-config";

/*
 * Wallets: every browser wallet the page can see (EIP-6963 discovery is on
 * by default, so MetaMask, Rabby, Coinbase… each get their own row), plus
 * WalletConnect for phones when a project id is configured. Nothing here
 * signs or moves anything; connecting only reads an address.
 */
const walletConnectProjectId = envOrNull(process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID);

export const wagmiConfig = createConfig({
  chains: [robinhoodChain],
  connectors: [
    injected(),
    ...(walletConnectProjectId
      ? [
          walletConnect({
            projectId: walletConnectProjectId,
            showQrModal: true,
            metadata: {
              name: siteConfig.name,
              description: siteConfig.seoDescription,
              url: siteConfig.url,
              icons: [`${siteConfig.url}/icon`],
            },
          }),
        ]
      : []),
  ],
  transports: {
    [robinhoodChain.id]: http(),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
