import { Section } from "@/components/ui/Label";

/*
 * Three beats. The middle one is the whole joke.
 */
const steps = [
  {
    mark: "▲",
    tone: "text-up",
    title: "You read this page.",
    body: "It says the token gets rugged at $100K market cap. You have now been told. Whatever you do next, you were told.",
  },
  {
    mark: "·",
    tone: "text-text-muted",
    title: "Nothing happens.",
    body: "For as long as the number is below $100,000. Days, weeks, forever. The dev does nothing, on purpose, in public, on a meter.",
  },
  {
    mark: "▼",
    tone: "text-down",
    title: "$100K. The rug.",
    body: "The line gets crossed, the rug gets pulled, and for once in the history of this industry nobody gets to say they didn't see it coming.",
  },
] as const;

export function HowItWorks() {
  return (
    <Section id="how" kicker="How it works" title="Three steps. One of them is nothing.">
      <ol>
        {steps.map((step) => (
          <li key={step.title} className="row grid grid-cols-[3rem_1fr] gap-4">
            <span className={step.tone}>{step.mark}</span>
            <div>
              <h3 className="text-text">{step.title}</h3>
              <p className="mt-1 max-w-[58ch] text-text-dim">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
