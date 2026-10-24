"use client";

import type { Finder, FinderCounts } from "@floc/core/trip/explore/finder/finder";
import type { ReactNode } from "react";

import { linkClass } from "@/components/explore/finder/finder-chip";
import { LengthFacet, PriceFacet, WhenFacet, WhereFacet } from "@/components/explore/finder/finder-facets";
import { LikeCloud } from "@/components/explore/finder/like-cloud";
import { FlockChevron } from "@/components/system/flock-chevron";
import { CrossIcon } from "@/components/system/icons";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details open className="group border-b border-rule py-1">
      <summary className="flex cursor-pointer list-none items-center justify-between py-2.5 text-sm font-medium [&::-webkit-details-marker]:hidden">
        {title}
        <FlockChevron size={8} className="text-ink-faint transition-transform group-open:rotate-180" />
      </summary>
      <div className="pb-3 pt-0.5">{children}</div>
    </details>
  );
}

const group = "typed mb-0.5 mt-4 border-t border-ink pt-3 text-ink";

/** The filters, top to bottom: what must fit, then what you like. Beside the trips on a wide screen, in a sheet on a narrow one. */
export function FinderRail({
  finder,
  counts,
  shown,
  onChange,
  onClear,
  onClose,
}: {
  finder: Finder;
  counts: FinderCounts;
  shown: number;
  onChange: (next: Finder) => void;
  onClear: () => void;
  /** Set when the rail is a sheet. */
  onClose?: () => void;
}) {
  const facet = { finder, counts, shown, onChange };
  return (
    <div>
      <div className="flex items-center justify-between gap-3 pb-1.5">
        <h3 className="text-lg">Filters</h3>
        <span className="flex items-center gap-3">
          <button type="button" className={linkClass} onClick={onClear}>
            Clear all
          </button>
          {onClose ? (
            <button type="button" onClick={onClose} aria-label="Close" className="grid size-9 place-items-center rounded-full text-ink-soft hover:text-ink">
              <CrossIcon />
            </button>
          ) : null}
        </span>
      </div>
      <p className={group}>Must fit</p>
      <Section title="Where">
        <WhereFacet {...facet} />
      </Section>
      <Section title="Dates">
        <WhenFacet {...facet} />
      </Section>
      <Section title="Duration">
        <LengthFacet {...facet} />
      </Section>
      <Section title="Price">
        <PriceFacet {...facet} />
      </Section>
      <p className={group}>Tags</p>
      <div className="pt-2.5">
        <LikeCloud finder={finder} onChange={onChange} />
      </div>
    </div>
  );
}
