"use client";

import { useState } from "react";

import { CrossIcon, PlusIcon } from "@/components/system/icons";
import { SegmentTrack } from "@/components/system/segment-track";
import { Button, Input, cx, iconFrameClass, trackSegmentClass } from "@/components/system/ui";
import { IDEA_CATEGORY_MAX, type IdeaCategoryTab } from "@floc/core/trip/idea-categories";

export function IdeaCategoryTrack({
  tabs,
  tab,
  onPick,
  onMake,
}: {
  tabs: IdeaCategoryTab[];
  tab: string;
  onPick: (id: string) => void;
  onMake: (name: string) => void;
}) {
  const [making, setMaking] = useState(false);
  const [name, setName] = useState("");

  const finish = () => {
    setMaking(false);
    setName("");
  };

  return (
    <div className="flex min-w-0 items-center justify-end gap-1">
      <SegmentTrack role="group" aria-label="Show ideas by category" className="flex min-w-0 items-center gap-0.5 overflow-x-auto !p-1 [scrollbar-width:none] max-lg:flex-1 lg:flex-wrap lg:justify-end lg:overflow-visible">
        {tabs.map((option) => {
          const on = option.id.toLowerCase() === tab.toLowerCase();
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={on}
              aria-label={`${option.label}, ${option.count === 1 ? "1 idea" : `${option.count} ideas`}`}
              onClick={() => onPick(option.id)}
              className={cx(trackSegmentClass(on), "h-[23px] shrink-0 whitespace-nowrap px-2.5 text-sm max-sm:after:absolute max-sm:after:inset-x-0 max-sm:after:-inset-y-1 max-sm:after:content-['']")}
            >
              <span className="relative">{option.label}</span>
            </button>
          );
        })}
      </SegmentTrack>
      {making ? (
        <form
          className="flex shrink-0 items-center gap-1"
          onSubmit={(event) => {
            event.preventDefault();
            if (!name.trim()) return;
            onMake(name);
            finish();
          }}
        >
          <Input
            autoFocus
            aria-label="New category"
            value={name}
            maxLength={IDEA_CATEGORY_MAX}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") finish();
            }}
            className="!h-[31px] !w-28 !py-0"
          />
          <Button type="submit" variant="primary" disabled={!name.trim()} className="!h-[31px]">Add</Button>
          <button type="button" aria-label="Cancel new category" onClick={finish} className={iconFrameClass()}>
            <CrossIcon size={12} />
          </button>
        </form>
      ) : (
        <button type="button" aria-label="Add a category" title="Add a category" onClick={() => setMaking(true)} className={iconFrameClass()}>
          <PlusIcon size={13} />
        </button>
      )}
    </div>
  );
}
