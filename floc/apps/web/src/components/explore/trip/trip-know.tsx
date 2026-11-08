import { formatDate } from "@floc/core/dates/dates";
import type { TripKnow as TripKnowData } from "@floc/core/trip/explore/know/know-types";

import { KnowGlyphIcon } from "@/components/system/icons/know";
import { SectionHeading } from "@/components/system/ui";
import { KnowStageCard } from "./know-stage-card";

export function TripKnow({ know }: { know: TripKnowData | null }) {
  if (!know) return null;
  return (
    <section className="mt-12 border-t border-rule pt-8 lg:mt-[4.5rem] lg:pt-9">
      <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1.5">
        <SectionHeading>Good to know</SectionHeading>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-sm">
          <span className="typed">Checked {formatDate(know.checked, { year: true, weekday: false })}</span>
          {know.advice.map((a) => (
            <a
              key={a.slug}
              href={`https://www.gov.uk/foreign-travel-advice/${a.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-pen hover:underline hover:underline-offset-2"
            >
              UK travel advice for {a.country}
              <span className="sr-only"> (opens in a new tab)</span>
              <KnowGlyphIcon name="external" />
            </a>
          ))}
        </div>
      </div>
      <div className="mt-[18px] grid gap-2">
        {know.stages.map((stage) => (
          <KnowStageCard key={stage.stage} stage={stage} />
        ))}
      </div>
    </section>
  );
}
