"use client";

import { useEffect, useRef, useState } from "react";

import { useEdgeFade } from "@/components/chrome/use-edge-fade";
import { ChevronIcon, CrossIcon, PlusIcon } from "@/components/system/icons";
import { SegmentTrack } from "@/components/system/segment-track";
import { Button, Input, cx, iconFrameClass, trackSegmentClass } from "@/components/system/ui";
import { IDEA_CATEGORY_MAX, type IdeaCategoryTab } from "@floc/core/trip/idea-categories";

function RailArrow({ way, can, onPress }: { way: "left" | "right"; can: boolean; onPress: () => void }) {
  const label = way === "left" ? "Show earlier categories" : "Show later categories";
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-disabled={!can}
      onClick={onPress}
      className={cx(iconFrameClass(), "aria-disabled:pointer-events-none aria-disabled:opacity-50")}
    >
      <ChevronIcon direction={way} />
    </button>
  );
}

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
  const [slides, setSlides] = useState(false);
  const row = useRef<HTMLDivElement>(null);
  const fade = useEdgeFade<HTMLDivElement>();
  const { ref: rail, measure, edges } = fade;
  const arrows = !making && slides;

  useEffect(() => {
    const box = rail.current;
    const whole = row.current;
    if (!box || !whole || making) return;
    const settle = () => {
      const add = whole.lastElementChild as HTMLElement;
      const gap = Number.parseFloat(getComputedStyle(whole).columnGap) || 0;
      setSlides(box.scrollWidth > whole.clientWidth - add.offsetWidth - gap + 1);
      const chosen = box.querySelector<HTMLElement>('[aria-pressed="true"]');
      if (chosen) {
        const offset = chosen.getBoundingClientRect().left - box.getBoundingClientRect().left;
        box.scrollTo({ left: box.scrollLeft + offset - (box.clientWidth - chosen.offsetWidth) / 2 });
      }
      measure();
    };
    settle();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(settle);
    observer.observe(box);
    observer.observe(whole);
    return () => observer.disconnect();
  }, [tab, tabs.length, making, rail, measure]);

  const slide = (way: 1 | -1) => {
    const box = rail.current;
    box?.scrollBy({ left: way * box.clientWidth * 0.7 });
  };

  const finish = () => {
    setMaking(false);
    setName("");
  };

  return (
    <div ref={row} className="flex min-w-0 items-center justify-end gap-1 max-sm:gap-3">
      {arrows ? <RailArrow way="left" can={edges.start} onPress={() => slide(-1)} /> : null}
      <div
        ref={rail}
        onScroll={fade.onScroll}
        style={fade.style}
        className={cx("min-w-0 overflow-x-auto rounded-sm [scrollbar-width:none] max-lg:flex-1", making && "hidden")}
      >
        {making ? null : (
          <SegmentTrack role="group" aria-label="Show ideas by category" className="ml-auto flex w-max items-center gap-0.5 !p-1 max-lg:min-w-full">
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
        )}
      </div>
      {arrows ? <RailArrow way="right" can={edges.end} onPress={() => slide(1)} /> : null}
      {making ? (
        <form
          className="flex w-full min-w-0 items-center justify-end gap-1"
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
            className="!h-[31px] !w-full !min-w-0 !py-0 lg:!max-w-[13rem]"
          />
          <Button type="submit" variant="primary" disabled={!name.trim()} className="!h-[31px] shrink-0">Add</Button>
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
