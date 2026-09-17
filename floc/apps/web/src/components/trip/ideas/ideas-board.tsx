"use client";

import { useEffect, useState } from "react";

import { addIdea, removeIdea, voteIdea } from "@/app/trip/[id]/overview/actions";
import { Avatar, Button, EmptyState, Input, cx } from "@/components/system/ui";
import { ActionForm, PillToggle, SubmitButton } from "@/components/system/client-ui";
import { commentTime } from "@floc/core/notes/notes";
import { TEXT_CAPS } from "@floc/core/text/text";
import {
  readIdeaSort,
  sortIdeas,
  voteLabel,
  type IdeaRow,
  type IdeaSort,
} from "@floc/core/trip/ideas";

const SORT_KEY = "floc:ideas-sort";

export function IdeasBoard({ tripId, ideas }: { tripId: number; ideas: IdeaRow[] }) {
  const [sort, setSort] = useState<IdeaSort>("votes");

  // The order is a reading preference, not trip data — it rides in the browser.
  useEffect(() => {
    setSort(readIdeaSort(window.localStorage.getItem(SORT_KEY)));
  }, []);

  const choose = (next: IdeaSort) => {
    setSort(next);
    window.localStorage.setItem(SORT_KEY, next);
  };

  return (
    <div className="border-t border-rule px-4 pb-4 pt-3">
      <div className="flex flex-wrap items-center gap-3">
        {ideas.length > 1 ? (
          <PillToggle
            label="Order the ideas"
            value={sort}
            onChange={choose}
            className="!w-auto"
            options={[
              { value: "votes", label: "Most votes" },
              { value: "newest", label: "Newest" },
            ]}
          />
        ) : null}
        <AddIdeaForm tripId={tripId} />
      </div>

      {ideas.length === 0 ? (
        <div className="mt-3">
          <EmptyState title="No ideas yet">
            Where could this go? Put the first one up and let the group vote.
          </EmptyState>
        </div>
      ) : (
        <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
          {sortIdeas(ideas, sort).map((idea) => (
            <IdeaCard key={idea.id} tripId={tripId} idea={idea} />
          ))}
        </ul>
      )}
    </div>
  );
}

function AddIdeaForm({ tripId }: { tripId: number }) {
  return (
    <ActionForm action={addIdea} className="flex min-w-[16rem] flex-1 items-center gap-2">
      <input type="hidden" name="tripId" value={tripId} />
      <Input
        name="title"
        aria-label="Your idea"
        placeholder="Lisbon, a week in September…"
        maxLength={TEXT_CAPS.ideaTitle}
        className="flex-1"
      />
      <SubmitButton pendingLabel="Adding…">Add</SubmitButton>
    </ActionForm>
  );
}

function IdeaCard({ tripId, idea }: { tripId: number; idea: IdeaRow }) {
  return (
    <li className="flex flex-col gap-3 rounded-lg border border-rule bg-sheet p-3.5">
      <p className="text-[15px] leading-snug">{idea.title}</p>
      <div className="mt-auto flex items-center gap-2">
        <Avatar name={idea.authorName} icon={idea.authorAvatarIcon} size={22} />
        <span className="truncate text-xs text-ink-soft">
          {idea.authorName} · {commentTime(idea.createdAt)}
        </span>
        <span className="flex-1" />
        <form action={voteIdea}>
          <input type="hidden" name="tripId" value={tripId} />
          <input type="hidden" name="ideaId" value={idea.id} />
          <Button
            type="submit"
            variant="secondary"
            aria-pressed={idea.mine}
            aria-label={`${idea.mine ? "Take back your vote for" : "Vote for"} “${idea.title}” — ${voteLabel(idea.votes, idea.mine)}`}
            className={cx("!px-3", idea.mine && "!border-green-edge !bg-green-soft !text-green")}
          >
            <ArrowGlyph />
            <span className="nums">{idea.votes}</span>
          </Button>
        </form>
        <form action={removeIdea}>
          <input type="hidden" name="tripId" value={tripId} />
          <input type="hidden" name="ideaId" value={idea.id} />
          <Button
            type="submit"
            variant="ghost"
            aria-label={`Remove “${idea.title}”`}
            className="!px-2 !text-red hover:!bg-red-soft hover:!text-red"
          >
            <CrossGlyph />
          </Button>
        </form>
      </div>
    </li>
  );
}

const glyph = {
  viewBox: "0 0 14 14",
  width: 13,
  height: 13,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

function ArrowGlyph() {
  return (
    <svg {...glyph}>
      <path d="M7 11.2V3.2M3.6 6.6 7 3.2l3.4 3.4" />
    </svg>
  );
}

// The app draws the same cross for the same job — one mark, both surfaces.
function CrossGlyph() {
  return (
    <svg {...glyph}>
      <path d="M3.8 3.8l6.4 6.4M10.2 3.8l-6.4 6.4" />
    </svg>
  );
}
