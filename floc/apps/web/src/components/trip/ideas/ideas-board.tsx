"use client";

import { useEffect, useState } from "react";

import { addIdea, removeIdea, voteIdea } from "@/app/trip/[id]/overview/actions";
import { Avatar, EmptyState, Input, cx } from "@/components/system/ui";
import { ActionForm, PillToggle, SubmitButton } from "@/components/system/client-ui";
import { TEXT_CAPS } from "@floc/core/text/text";
import {
  readIdeaSort,
  sortIdeas,
  voteLabel,
  type IdeaRow,
  type IdeaSort,
} from "@floc/core/trip/ideas";
import { ArrowUpIcon, CrossIcon } from "@/components/system/icons";

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
    <div className="flex flex-col gap-3 border-t border-rule px-4 pb-4 pt-3">
      <AddIdeaForm tripId={tripId} />
      {ideas.length === 0 ? (
        <EmptyState title="No ideas yet" />
      ) : (
        <>
          {ideas.length > 1 ? (
            <PillToggle
              label="Order the ideas"
              value={sort}
              onChange={choose}
              className="!w-auto self-start"
              options={[
                { value: "votes", label: "Most votes" },
                { value: "newest", label: "Newest" },
              ]}
            />
          ) : null}
          <ul className="divide-y divide-rule rounded-lg border border-rule bg-sheet">
            {sortIdeas(ideas, sort).map((idea) => (
              <IdeaLine key={idea.id} tripId={tripId} idea={idea} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function AddIdeaForm({ tripId }: { tripId: number }) {
  return (
    <ActionForm action={addIdea} className="flex items-center gap-2">
      <input type="hidden" name="tripId" value={tripId} />
      <Input name="title" aria-label="New idea" maxLength={TEXT_CAPS.ideaTitle} className="min-w-0 flex-1" />
      <SubmitButton pendingLabel="Adding…">Add</SubmitButton>
    </ActionForm>
  );
}

// One line an idea: the vote on the left, the idea, who put it up, and remove.
function IdeaLine({ tripId, idea }: { tripId: number; idea: IdeaRow }) {
  return (
    <li className="flex items-center gap-3 px-3 py-2.5">
      <form action={voteIdea}>
        <input type="hidden" name="tripId" value={tripId} />
        <input type="hidden" name="ideaId" value={idea.id} />
        <button
          type="submit"
          aria-pressed={idea.mine}
          aria-label={`${idea.mine ? "Take back your vote for" : "Vote for"} “${idea.title}” — ${voteLabel(idea.votes, idea.mine)}`}
          className={cx(
            "grid h-11 w-10 shrink-0 place-content-center justify-items-center gap-0.5 rounded-lg border text-ink-soft transition-colors",
            idea.mine ? "border-green-edge bg-green-soft text-green" : "border-rule-strong bg-sheet hover:border-pen hover:text-ink",
          )}
        >
          <ArrowUpIcon size={12} />
          <span className="nums text-xs leading-none">{idea.votes}</span>
        </button>
      </form>
      <span className="grid min-w-0 flex-1 gap-0.5 leading-snug">
        <span className="text-[15px] text-ink">{idea.title}</span>
        <span className="flex min-w-0 items-center gap-1.5 text-xs text-ink-faint">
          <Avatar name={idea.authorName} icon={idea.authorAvatarIcon} size={16} />
          <span className="truncate">{idea.authorName}</span>
        </span>
      </span>
      <form action={removeIdea}>
        <input type="hidden" name="tripId" value={tripId} />
        <input type="hidden" name="ideaId" value={idea.id} />
        <button
          type="submit"
          aria-label={`Remove “${idea.title}”`}
          title="Remove"
          className="grid size-7 shrink-0 place-items-center rounded-full text-ink-faint hover:bg-red-soft hover:text-red"
        >
          <CrossIcon size={12} />
        </button>
      </form>
    </li>
  );
}
