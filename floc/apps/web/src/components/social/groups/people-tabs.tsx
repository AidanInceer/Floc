"use client";

import { cx, segmentTrack } from "@/components/system/ui";

type Tab = "friends" | "groups";
const TABS = [["friends", "Friends"], ["groups", "Groups"]] as const;

export function PeopleTabs({ value, onChange, counts, stretch }: {
  value: Tab;
  onChange: (tab: Tab) => void;
  counts?: Record<Tab, number>;
  stretch?: boolean;
}) {
  return (
    <div role="group" aria-label="People" className={cx(segmentTrack, "flex gap-1", !stretch && "w-fit")}>
      {TABS.map(([id, label]) => (
        <button
          key={id}
          type="button"
          aria-pressed={id === value}
          onClick={() => onChange(id)}
          className={cx(
            "flex min-h-9 items-center gap-2 rounded-sm px-3 text-sm font-medium",
            stretch && "flex-1 justify-center",
            id === value ? "bg-pen-soft text-pen-deep" : "text-ink-soft hover:bg-pen-soft hover:text-pen-deep",
          )}
        >
          {label}
          {counts ? <span className="nums font-mono text-xs">{counts[id]}</span> : null}
        </button>
      ))}
    </div>
  );
}
