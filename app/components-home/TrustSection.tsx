import Section from "./ui/Section";
import SectionHeading from "./ui/SectionHeading";
import FeatureCard from "./FeatureCard";
import { trustFeatures as defaultTrustFeatures } from "./data/home-content";

type TrustFeature = { icon: string; title: string; subtitle: string };
import type { IconName } from "./ui/Icon";

/**
 * "Why WOWLifestyle?" — five service promises.
 *
 * The count doesn't divide evenly below `xl`, so intermediate breakpoints use
 * an auto-fit track: cards claim at least 15rem and share the remainder, which
 * avoids a lone stretched card on the final row.
 */
export default function TrustSection({
  className,
  features = defaultTrustFeatures,
}: {
  className?: string;
  features?: readonly TrustFeature[];
}) {
  const trustFeatures = features;
  return (
    <Section labelledBy="trust-heading" className={className}>
      <div className="hidden lg:block">
        <SectionHeading
          eyebrow="Why WOWLifestyle?"
          title={<span id="trust-heading">More Joy. More Discovery.</span>}
        />
      </div>
      <h2 id="trust-heading" className="sr-only lg:hidden">
        Why WOWLifestyle?
      </h2>

      {/* Four across on phones (the fifth wraps and centres), then the desktop
          auto-fit track so a lone card never stretches on the final row. */}
      <ul className="grid grid-cols-4 gap-x-2 gap-y-4 lg:mt-heading lg:grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] lg:gap-card xl:grid-cols-5">
        {trustFeatures.map((feature) => (
          <li key={feature.title}>
            <FeatureCard
              icon={feature.icon as IconName}
              title={feature.title}
              subtitle={feature.subtitle}
            />
          </li>
        ))}
      </ul>
    </Section>
  );
}
