"use client";

import { sortIdeas, type IdeaRow } from "@floc/core/trip/ideas";
import { BulbIcon, ChevronIcon } from "@/components/system/icons";
import { OPEN_IDEAS } from "./open-ideas";

export function IdeasRow({ ideas }: { ideas: IdeaRow[] }) {
  const [top] = sortIdeas(ideas, "votes");
  if (!top) return null;
  return (
    <a
      href="#ideas"
      onClick={() => window.dispatchEvent(new Event(OPEN_IDEAS))}
      className="group flex w-full items-center gap-2.5 border-b border-rule py-3 text-left text-sm text-ink-soft hover:text-ink"
    >
      <BulbIcon className="text-highlight-ink" />
      <span className="grid min-w-0 flex-1 leading-snug">
        <span className="text-ink transition-colors group-hover:text-pen-deep">{ideas.length === 1 ? "1 idea" : `${ideas.length} ideas`}</span>
        <span className="truncate text-xs text-ink-faint">Top: {top.title}</span>
      </span>
      <ChevronIcon direction="right" size={13} className="text-ink-faint" />
    </a>
  );
}
