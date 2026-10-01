import type { PresetAdvice, PresetFact } from "@floc/core/trip/explore/detail/preset-detail-types";

import { AdviceIcon } from "@/components/explore/trip/trip-glyphs";
import { SectionHeading, cx } from "@/components/system/ui";

function Facts({ facts }: { facts: PresetFact[] }) {
  return (
    <div>
      <SectionHeading>Good to know</SectionHeading>
      <dl className="mt-3.5">
        {facts.map((f) => (
          <div key={f.label} className="grid grid-cols-[4.75rem_1fr] items-baseline gap-3 border-t border-rule py-2.5 sm:grid-cols-[6rem_1fr]">
            <dt className="typed">{f.label}</dt>
            <dd className="text-sm text-ink-soft">{f.text}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Advice({ advice }: { advice: PresetAdvice[] }) {
  return (
    <div>
      <SectionHeading>Travel advice</SectionHeading>
      <div className="mt-3.5 grid gap-2.5 sm:grid-cols-2">
        {advice.map((a) => (
          <div key={a.title} className="rounded-md border border-rule bg-sheet px-4 py-3.5">
            <p className="flex items-center gap-2 text-ink-faint">
              <AdviceIcon topic={a.topic} />
              <b className="font-display text-md font-semibold text-ink">{a.title}</b>
            </p>
            <ul className="mt-1.5 grid gap-1 text-sm text-ink-soft">
              {a.lines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TripKnow({ advice, facts }: { advice: PresetAdvice[]; facts: PresetFact[] }) {
  return (
    <section className={cx("mt-12 grid gap-9 border-t border-rule pt-8 lg:mt-[4.5rem] lg:gap-14 lg:pt-9", advice.length > 0 && "lg:grid-cols-[1.5fr_1fr]")}>
      {advice.length > 0 ? <Advice advice={advice} /> : null}
      <Facts facts={facts} />
    </section>
  );
}
