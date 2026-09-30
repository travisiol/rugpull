import { clsx } from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";

/*
 * Boxed controls. Amber fill is the one you press; ghost is the rest;
 * down is for after the rug.
 */
type Variant = "solid" | "ghost" | "down";

const variantClass: Record<Variant, string> = {
  solid: "btn",
  ghost: "btn btn-ghost",
  down: "btn btn-down",
};

export function Button({
  children,
  variant = "solid",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: Variant;
}) {
  return (
    <button type="button" className={clsx(variantClass[variant], className)} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  children,
  href,
  variant = "solid",
  external = false,
  className,
}: {
  children: ReactNode;
  href: string;
  variant?: Variant;
  external?: boolean;
  className?: string;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={clsx(variantClass[variant], className)}
    >
      {children}
    </a>
  );
}
