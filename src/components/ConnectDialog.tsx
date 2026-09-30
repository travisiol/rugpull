"use client";

import { clsx } from "clsx";
import { useEffect, useState } from "react";
import { useConnect, useConnectors } from "wagmi";
import { Button } from "@/components/ui/Button";

/*
 * The connect panel. Lists every wallet the browser announces (EIP-6963),
 * WalletConnect when a project id is configured, and — when there is
 * nothing to list — where to get one. Drawn like every other panel on the
 * screen: a header, rows, one-pixel rules.
 */

const installs = [
  { name: "MetaMask", href: "https://metamask.io/download/" },
  { name: "Rabby", href: "https://rabby.io/" },
  { name: "Coinbase Wallet", href: "https://www.coinbase.com/wallet/downloads" },
];

export function ConnectDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const connectors = useConnectors();
  const { mutateAsync: connect, isPending, error, reset } = useConnect();
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  // Wallets announced by the browser come with their own name and icon;
  // the generic "injected" connector only earns a row when nothing
  // announced itself but a provider is present.
  const announced = connectors.filter((c) => c.type === "injected" && c.id !== "injected");
  const generic = connectors.find((c) => c.id === "injected");
  const hasProvider = typeof window !== "undefined" && "ethereum" in window;
  const others = connectors.filter((c) => c.type !== "injected");
  const rows = [
    ...announced,
    ...(announced.length === 0 && generic && hasProvider ? [generic] : []),
    ...others,
  ];

  const pick = async (uid: string) => {
    const connector = connectors.find((c) => c.uid === uid);
    if (!connector) return;
    setBusy(uid);
    try {
      await connect({ connector });
      onClose();
    } catch {
      // The error is shown below; the panel stays open.
    } finally {
      setBusy(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/80 p-4 pt-[12vh]"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="connect-title"
        className="panel w-full max-w-[420px] border border-rule-strong"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="panel-head">
          <h2 id="connect-title" className="t-key flex items-center gap-2 text-text">
            Connect wallet
          </h2>
          <button type="button" onClick={onClose} className="t-key text-text-dim hover:text-text">
            Esc ✕
          </button>
        </div>

        {rows.length > 0 ? (
          <ul>
            {rows.map((c) => (
              <li key={c.uid} className="border-b border-rule last:border-b-0">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    reset();
                    void pick(c.uid);
                  }}
                  className={clsx(
                    "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-rule disabled:cursor-wait",
                    busy === c.uid && "bg-rule",
                  )}
                >
                  <span className="text-amber">›</span>
                  {c.icon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.icon} alt="" width={18} height={18} className="shrink-0" />
                  ) : (
                    <span className="inline-block h-[18px] w-[18px] shrink-0 border border-rule-strong" />
                  )}
                  <span className="text-text">{c.name}</span>
                  <span className="t-key ml-auto text-text-muted">
                    {busy === c.uid ? "Connecting…" : c.type === "walletConnect" ? "QR · mobile" : "Browser"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="panel-body">
            <p className="text-text-dim">
              No wallet found in this browser. Install one, then come back:
            </p>
            <ul className="mt-3">
              {installs.map((w) => (
                <li key={w.name} className="border-b border-rule last:border-b-0">
                  <a
                    href={w.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 py-3 hover:text-amber"
                  >
                    <span className="text-amber">›</span>
                    <span className="t-body">{w.name}</span>
                    <span className="t-key ml-auto text-text-muted">Install ↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <p className="border-t border-rule px-4 py-3 text-down">
            {error.message.split("\n")[0]}
          </p>
        )}

        <div className="flex items-center justify-between border-t border-rule px-4 py-3">
          <p className="t-small text-text-muted">
            Connecting reads your address. It signs nothing and moves nothing.
          </p>
          <Button variant="ghost" onClick={onClose} className="!h-8 !px-3">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
