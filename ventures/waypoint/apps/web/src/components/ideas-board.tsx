/**
 * The idea board. Owns which idea is expanded — one at a time, and the panel is
 * placed after the last card in that card's row rather than straight after the
 * card itself, so the rest of the row stays put instead of being shoved below a
 * full-width row.
 */
"use client";

import { Fragment, useEffect, useRef, useState } from "react";

import { IdeaCard } from "@/components/idea-card";
import type { IdeaCardData } from "@/components/idea-data";
import { IdeaDiscussion } from "@/components/idea-discussion";

export function IdeasBoard({
  ideas,
  tripId,
  viewerId,
  isAdmin,
}: {
  ideas: IdeaCardData[];
  tripId: number;
  viewerId: string;
  isAdmin: boolean;
}) {
  const [openId, setOpenId] = useState<number | null>(null);
  const [columns, setColumns] = useState(1);
  const listRef = useRef<HTMLUListElement>(null);

  // Collapsing unmounts the panel, which would drop focus to <body> and strand
  // a keyboard user at the top of the page — hand it back to the card's toggle.
  const collapse = (id: number) => {
    setOpenId(null);
    listRef.current
      ?.querySelector<HTMLButtonElement>(
        `[data-idea-card="${id}"] [aria-controls]`,
      )
      ?.focus();
  };

  // Read the column count off the resolved grid rather than duplicating the
  // breakpoints here — the class list stays the single source of truth.
  useEffect(() => {
    const measure = () => {
      const list = listRef.current;
      if (!list) return;
      const tracks = getComputedStyle(list)
        .gridTemplateColumns.split(" ")
        .filter(Boolean).length;
      setColumns(Math.max(1, tracks));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const openIndex =
    openId === null ? -1 : ideas.findIndex((i) => i.id === openId);
  const panelAfter =
    openIndex < 0
      ? -1
      : Math.min(
          ideas.length - 1,
          Math.floor(openIndex / columns) * columns + columns - 1,
        );

  return (
    <ul ref={listRef} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {ideas.map((idea, i) => (
        <Fragment key={idea.id}>
          <IdeaCard
            tripId={tripId}
            idea={idea}
            viewerId={viewerId}
            isAdmin={isAdmin}
            open={idea.id === openId}
            onToggle={() =>
              idea.id === openId ? collapse(idea.id) : setOpenId(idea.id)
            }
          />
          {i === panelAfter ? (
            <IdeaDiscussion
              tripId={tripId}
              idea={ideas[openIndex]}
              viewerId={viewerId}
              isAdmin={isAdmin}
              onCollapse={() => collapse(ideas[openIndex].id)}
            />
          ) : null}
        </Fragment>
      ))}
    </ul>
  );
}
