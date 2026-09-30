import { Section } from "@/components/ui/Label";
import { siteConfig } from "@/lib/site-config";

/*
 * The terms of the rug. Five clauses, numbered like a contract, because
 * that is what a dev promise usually pretends not to be.
 */
const clauses = [
  {
    title: "The rug happens at $100,000.",
    body: "Market cap, not a dollar before. Not at $99,999. When the number reads one hundred thousand, the dev pulls it. That is the entire product.",
  },
  {
    title: "Below $100,000, nothing happens.",
    body: "No dev sells. No liquidity moves. No tax changes, no “v2”, no “migration”, no surprise. The token just sits there, being a token, doing nothing. Exactly as advertised.",
  },
  {
    title: "There is no roadmap.",
    body: "This page is the roadmap. Phase one: launch. Phase two: nothing. Phase three: the rug. There is no phase four.",
  },
  {
    title: "There is no utility.",
    body: "No staking, no partnerships, no AI, no game. One feature, and it fires once. The feature is the warning you are reading.",
  },
  {
    title: "If it never gets there, it never happens.",
    body: "A rug at $100K on a token that never reaches $100K is a token that never gets rugged. That is not a loophole. That is arithmetic.",
  },
] as const;

export function Terms() {
  return (
    <Section id="terms" kicker="The terms" title="Terms of the rug">
      <ol>
        {clauses.map((clause, index) => (
          <li key={clause.title} className="row grid grid-cols-[3rem_1fr] gap-4">
            <span className="text-amber">§{index + 1}</span>
            <div>
              <h3 className="text-text">{clause.title}</h3>
              <p className="mt-1 max-w-[58ch] text-text-dim">{clause.body}</p>
            </div>
          </li>
        ))}
        <li className="row grid grid-cols-[3rem_1fr] gap-4">
          <span className="text-text-muted">—</span>
          <div>
            <h3 className="text-text">Signed, the dev.</h3>
            <p className="mt-1 max-w-[58ch] text-text-dim">
              Everything above is the one thing on this page you have to trust.
              It is the same thing you trust with every other token. The
              difference is that here it is written down, and here it says
              {" "}{siteConfig.name}.
            </p>
          </div>
        </li>
      </ol>
    </Section>
  );
}
