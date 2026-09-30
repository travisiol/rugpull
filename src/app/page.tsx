import { BuyPanel } from "@/components/BuyPanel";
import { Faq } from "@/components/Faq";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { Record } from "@/components/Record";
import { RugMeter } from "@/components/RugMeter";
import { Terms } from "@/components/Terms";

/*
 * One column, top to bottom: the notice and the chart, the meter, the
 * terms, how it goes, the record (nothing), the ticket, the questions.
 */
export default function Home() {
  return (
    <>
      <Hero />
      <RugMeter />
      <Terms />
      <HowItWorks />
      <Record />
      <BuyPanel />
      <Faq />
      <Footer />
    </>
  );
}
