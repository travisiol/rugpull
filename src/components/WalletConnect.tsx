"use client";

import { clsx } from "clsx";
import { useState } from "react";
import { useConnection, useDisconnect, useSwitchChain } from "wagmi";
import { ConnectDialog } from "@/components/ConnectDialog";
import { robinhoodChain } from "@/lib/chain";

function short(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/*
 * The wallet control in the status bar. Disconnected: one amber button
 * that opens the connect panel. Connected: the address, and a menu with
 * copy / explorer / disconnect. On the wrong chain, the one thing it
 * offers is the switch.
 */
export function WalletConnect({
  className,
  full = false,
}: {
  className?: string;
  /** Stretches the control, e.g. inside the buy ticket. */
  full?: boolean;
}) {
  const { address, isConnected, chainId } = useConnection();
  const { mutate: disconnect } = useDisconnect();
  const { mutate: switchChain, isPending: isSwitching } = useSwitchChain();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const shell = clsx("btn !h-8 !px-3", full && "w-full !h-10", className);

  if (isConnected && address) {
    if (chainId !== robinhoodChain.id) {
      return (
        <button
          type="button"
          onClick={() => switchChain({ chainId: robinhoodChain.id })}
          disabled={isSwitching}
          className={shell}
        >
          {isSwitching ? "Switching…" : "Switch to Robinhood Chain"}
        </button>
      );
    }
    return (
      <span className={clsx("relative inline-flex", full && "w-full")}>
        <button
          type="button"
          onClick={() => setMenu((m) => !m)}
          aria-expanded={menu}
          className={clsx(shell, "btn-ghost")}
        >
          <span className="text-up">●</span>
          {short(address)}
        </button>
        {menu && (
          <ul className="panel absolute right-0 top-full z-[60] mt-1 w-56 border border-rule-strong">
            <li>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left hover:bg-rule"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(address);
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 1200);
                  } catch {
                    // Clipboard refused; the address is visible anyway.
                  }
                }}
              >
                <span className="text-amber">›</span> {copied ? "Copied" : "Copy address"}
              </button>
            </li>
            <li>
              <a
                href={`${robinhoodChain.blockExplorers.default.url}/address/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-3 py-2 hover:bg-rule"
              >
                <span className="text-amber">›</span> View on explorer ↗
              </a>
            </li>
            <li className="border-t border-rule">
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-down hover:bg-rule"
                onClick={() => {
                  setMenu(false);
                  disconnect();
                }}
              >
                <span className="text-amber">›</span> Disconnect
              </button>
            </li>
          </ul>
        )}
      </span>
    );
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={shell}>
        Connect wallet
      </button>
      <ConnectDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
