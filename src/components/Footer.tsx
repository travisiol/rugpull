import { siteConfig } from "@/lib/site-config";

export function Footer() {
  const socials = [
    siteConfig.x ? { label: "X", href: siteConfig.x } : null,
    siteConfig.telegram ? { label: "Telegram", href: siteConfig.telegram } : null,
  ].filter((s): s is { label: string; href: string } => s !== null);

  return (
    <footer className="mx-auto max-w-[840px] px-5 pb-16 pt-8 sm:px-6">
      <div className="row flex flex-wrap items-center justify-between gap-4">
        <span className="t-key">{siteConfig.name} · {siteConfig.tagline}</span>
        {socials.length > 0 && (
          <ul className="flex items-center gap-5">
            {socials.map((social) => (
              <li key={social.label}>
                <a href={social.href} target="_blank" rel="noopener noreferrer" className="t-key hover:!text-amber">
                  {social.label} ↗
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="t-small mt-4 max-w-[70ch] text-text-muted">
        Not financial advice. A financial warning. This token has one announced
        feature and it is bad for holders. Everything on this page is true at the
        time it is displayed, including the part where nothing is happening.
      </p>
    </footer>
  );
}
