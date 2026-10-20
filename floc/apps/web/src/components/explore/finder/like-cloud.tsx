"use client";

import { toggled, type Finder } from "@floc/core/trip/explore/finder/finder";
import { MAIN_TAGS, MORE_TAGS } from "@floc/core/trip/explore/finder/tag-groups";
import { useState } from "react";

import { FinderChip, linkClass } from "@/components/explore/finder/finder-chip";
import { FlockChevron } from "@/components/system/flock-chevron";
import { cx } from "@/components/system/ui";

/** What you like, as one cloud of tags. Pace, effort and getting around open behind "See more"; a picked one stays in view. */
export function LikeCloud({ finder, onChange }: { finder: Finder; onChange: (next: Finder) => void }) {
  const [more, setMore] = useState(false);
  const extra = more ? MORE_TAGS : MORE_TAGS.filter((t) => finder.likes.includes(t));
  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        {[...MAIN_TAGS, ...extra].map((tag) => (
          <FinderChip key={tag} small on={finder.likes.includes(tag)} onClick={() => onChange({ ...finder, likes: toggled(finder.likes, tag) })}>
            {tag}
          </FinderChip>
        ))}
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-2.5">
        <button type="button" aria-expanded={more} className={linkClass} onClick={() => setMore(!more)}>
          {more ? "See less" : "See more"}
          <FlockChevron size={8} className={cx("transition-transform", more && "rotate-180")} />
        </button>
        {finder.likes.length ? (
          <button type="button" className={linkClass} onClick={() => onChange({ ...finder, likes: [] })}>
            Clear
          </button>
        ) : null}
      </div>
    </>
  );
}
