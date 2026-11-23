"use client";

import { useState, useTransition } from "react";

import { renameIdeaTitle, voteIdea } from "@/app/trip/[id]/overview/actions";
import { ArrowRightIcon, CrossIcon } from "@/components/system/icons";
import { IdeaGlyph } from "@/components/system/icons/idea-glyph";
import { Button, Input, busyMark, cx, iconFrameClass, pressArea } from "@/components/system/ui";
import { EVENT_CATEGORIES } from "@floc/core/itinerary/event-categories";
import { ideaCategoryLabel, ideaEventType } from "@floc/core/trip/idea-categories";
import type { IdeaRow } from "@floc/core/trip/ideas";
import { TEXT_CAPS } from "@floc/core/text/text";
import { IdeaMenu } from "./idea-menu";
import { IdeaVoteButton } from "./idea-vote-button";

export function IdeaLine({
  tripId,
  idea,
  showCategory,
  editing,
  onEdit,
  onPlace,
  onRemove,
}: {
  tripId: number;
  idea: IdeaRow;
  showCategory: boolean;
  editing: boolean;
  onEdit: (id: number | null) => void;
  onPlace: () => void;
  onRemove: () => void;
}) {
  if (editing) return <IdeaRename tripId={tripId} idea={idea} onDone={() => onEdit(null)} />;
  return (
    <li className="grid min-h-[46px] grid-cols-[auto_auto_minmax(0,1fr)_auto_auto] items-center gap-x-2.5 gap-y-1.5 px-4 py-1.5 max-sm:grid-cols-[auto_minmax(0,1fr)_auto] max-sm:gap-x-2 max-sm:px-3 max-sm:py-2">
      <form action={voteIdea} className="max-sm:col-span-2 max-sm:col-start-1 max-sm:row-start-2 max-sm:justify-self-start sm:min-w-12">
        <input type="hidden" name="tripId" value={tripId} />
        <input type="hidden" name="ideaId" value={idea.id} />
        <IdeaVoteButton fit="row" type="submit" title={idea.title} votes={idea.votes} mine={idea.mine} />
      </form>
      <span className={cx("grid h-[26px] w-[26px] place-items-center rounded-sm max-sm:col-start-1 max-sm:row-start-1", EVENT_CATEGORIES[ideaEventType(idea.category)].tile)}>
        <IdeaGlyph category={idea.category} />
      </span>
      <span className="grid min-w-0 leading-tight max-sm:col-start-2 max-sm:row-start-1">
        <span title={idea.title} className="text-sm font-semibold text-ink max-sm:line-clamp-2 sm:truncate">{idea.title}</span>
        {showCategory ? <span className="truncate text-xs text-ink-soft">{ideaCategoryLabel(idea.category)}</span> : null}
      </span>
      <button
        type="button"
        onClick={onPlace}
        aria-label={`Add ${idea.title} to Days`}
        className={cx(pressArea, "inline-flex h-[26px] items-center gap-1.5 whitespace-nowrap rounded-sm px-1.5 text-sm text-pen-deep transition-colors hover:bg-pen-soft max-sm:col-span-2 max-sm:col-start-2 max-sm:row-start-2 max-sm:-mr-1.5 max-sm:justify-self-end")}
      >
        Add to Days <ArrowRightIcon size={12} />
      </button>
      <div className="max-sm:col-start-3 max-sm:row-start-1">
        <IdeaMenu title={idea.title} onEdit={() => onEdit(idea.id)} onRemove={onRemove} />
      </div>
    </li>
  );
}

function IdeaRename({ tripId, idea, onDone }: { tripId: number; idea: IdeaRow; onDone: () => void }) {
  const [title, setTitle] = useState(idea.title);
  const [failed, setFailed] = useState(false);
  const [busy, start] = useTransition();

  const save = () =>
    start(async () => {
      try {
        const out = await renameIdeaTitle(tripId, idea.id, title);
        if (out?.error) setFailed(true);
        else onDone();
      } catch {
        setFailed(true);
      }
    });

  return (
    <li className="min-h-[46px] px-4 py-1.5 max-sm:px-3">
      <form
        className="flex items-center gap-1.5"
        onSubmit={(event) => {
          event.preventDefault();
          if (title.trim()) save();
        }}
      >
        <Input
          autoFocus
          aria-label="Idea name"
          aria-invalid={failed || undefined}
          value={title}
          maxLength={TEXT_CAPS.ideaTitle}
          onChange={(event) => {
            setTitle(event.target.value);
            setFailed(false);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") onDone();
          }}
          className="!h-[31px] min-w-0 flex-1 !py-0"
        />
        <Button type="submit" variant="primary" disabled={busy || !title.trim()} className="!h-[31px]">
          {failed ? "Try again" : "Save"}{busyMark(busy)}
        </Button>
        <button type="button" aria-label="Cancel editing" onClick={onDone} className={iconFrameClass()}>
          <CrossIcon size={12} />
        </button>
      </form>
    </li>
  );
}
