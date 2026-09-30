import { clsx } from "clsx";
import type { ReactNode } from "react";

/** A small uppercase key. */
export function Label({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={clsx("t-key", className)}>{children}</span>;
}

/** A section: a key, a title, and whatever follows. One column. */
export function Section({
  id,
  kicker,
  title,
  children,
  className,
}: {
  id?: string;
  kicker: string;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={clsx("mx-auto max-w-[840px] scroll-mt-16 px-5 py-16 sm:px-6", className)}>
      <Label className="block">{kicker}</Label>
      {title && <h2 className="t-title mt-2 text-text">{title}</h2>}
      <div className="mt-8">{children}</div>
    </section>
  );
}
