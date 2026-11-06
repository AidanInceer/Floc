/** First-trip glyphs: the Ideas bulb, a pin for where, people for the invite, the tabs' own marks for the rest. */
import type { Sorted, WalkthroughStepKey } from "@floc/core/trip/walkthrough";
import { LineIcon } from "@/components/system/icons";

const PEOPLE = (
  <>
    <circle cx="5.2" cy="5" r="2" />
    <path d="M1.8 11.4c0-1.9 1.5-3 3.4-3s3.4 1.1 3.4 3M9.4 3.3a2 2 0 0 1 0 3.9M9.8 8.6c1.5.2 2.6 1.2 2.6 2.8" />
  </>
);
const CALENDAR = (
  <path d="M3.4 3h7.2A1.4 1.4 0 0 1 12 4.4v6.4a1.4 1.4 0 0 1-1.4 1.4H3.4A1.4 1.4 0 0 1 2 10.8V4.4A1.4 1.4 0 0 1 3.4 3ZM4.8 1.8v2.4M9.2 1.8v2.4M2 6h10" />
);

const PATHS: Record<WalkthroughStepKey | keyof Sorted, React.ReactNode> = {
  ideas: (
    <path d="M5.2 10.2h3.6M5.6 12h2.8M7 1.8a3.6 3.6 0 0 0-2.2 6.4c.4.3.5.7.5 1.1v.9h3.4v-.9c0-.4.1-.8.5-1.1A3.6 3.6 0 0 0 7 1.8Z" />
  ),
  where: (
    <>
      <path d="M7 12.4s3.8-3.6 3.8-6.6a3.8 3.8 0 0 0-7.6 0c0 3 3.8 6.6 3.8 6.6Z" />
      <circle cx="7" cy="5.8" r="1.3" />
    </>
  ),
  invite: PEOPLE,
  who: PEOPLE,
  dates: CALENDAR,
  when: CALENDAR,
  days: (
    <>
      <circle cx="2.8" cy="3.6" r=".9" />
      <circle cx="2.8" cy="7" r=".9" />
      <circle cx="2.8" cy="10.4" r=".9" />
      <path d="M6 3.6h6M6 7h6M6 10.4h4" />
    </>
  ),
  book: <path d="M1.8 11.6V3.2M1.8 8.8h10.4v2.8M1.8 6.6h3.6v2.2M5.4 6.6h5a1.8 1.8 0 0 1 1.8 1.8v.4" />,
};

export function StepGlyph({ step, size = 14, className }: { step: WalkthroughStepKey | keyof Sorted; size?: number; className?: string }) {
  return (
    <LineIcon size={size} className={className}>
      {PATHS[step]}
    </LineIcon>
  );
}
