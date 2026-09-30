"use client";

import Link from "next/link";
import { Mark } from "@/components/Mark";
import { WalletConnect } from "@/components/WalletConnect";
import { isHot } from "@/lib/rug";
import { siteConfig } from "@/lib/site-config";
import { useRug } from "@/lib/useRug";

/** The name on the left, the wallet on the right. That is the whole bar. */
export function Navbar() {
  const { phase } = useRug();

  return (
    <header className="mx-auto flex h-16 w-full max-w-[840px] items-center justify-between px-5 sm:px-6">
      <Link href="/" className="flex items-center gap-2.5">
        <Mark hot={isHot(phase)} />
        <span className="t-key !text-text">{siteConfig.name}</span>
      </Link>
      <WalletConnect />
    </header>
  );
}
