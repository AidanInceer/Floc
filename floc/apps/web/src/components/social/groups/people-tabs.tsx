"use client";

import { SegmentTrack } from "@/components/system/segment-track";
import { cx, trackSegmentClass } from "@/components/system/ui";

type Tab = "friends" | "groups";
const TABS = [["friends", "Friends"], ["groups", "Groups"]] as const;

export function PeopleTabs({ value, onChange, counts, stretch }: {
  value: Tab;
  onChange: (tab: Tab) => void;
  counts?: Record<Tab, number>;
  stretch?: boolean;
}) {
  return (
    <SegmentTrack role="group" aria-label="People" className={cx("flex gap-1", !stretch && "w-fit")}>
      {TABS.map(([id, label]) => (
        <button
          key={id}
          type="button"
          aria-pressed={id === value}
          onClick={() => onChange(id)}
          className={cx(trackSegmentClass(id === value), "flex min-h-9 items-center gap-2 px-3 text-sm", stretch && "flex-1 justify-center")}
        >
          {label}
          {counts ? <span className="nums font-mono text-xs">{counts[id]}</span> : null}
        </button>
      ))}
    </SegmentTrack>
  );
}
