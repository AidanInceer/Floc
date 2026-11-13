"use client";

import { readWishLink, WISH_CAPS, type WishItemInput } from "@floc/core/lists/wish-list";
import { COUNTRIES } from "@floc/core/people/countries";
import { useState, useTransition } from "react";

import { addWishItemAction } from "@/app/lists/wish/actions";
import { PlusIcon } from "@/components/system/icons";
import { Button, ErrorText, Input, busyMark } from "@/components/system/ui";

export type ListingChoice = { id: string; title: string; country: string };

const SHOWN = 6;
const ROW = "flex w-full items-center gap-2 rounded-sm px-2.5 py-2 text-left text-sm hover:bg-pen-soft hover:text-pen-deep";

const looksLikeLink = (typed: string) => !/\s/.test(typed.trim()) && /\./.test(typed) && readWishLink(typed) !== null;

/** Why one field (#623): an idea, a matching country or Explore trip, or a pasted link all go in the same place. */
export function WishAddBox({ listId, listings }: { listId: number; listings: ListingChoice[] }) {
  const [typed, setTyped] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const needle = typed.trim().toLowerCase();
  const link = looksLikeLink(typed);
  const matches =
    needle.length >= 2 && !link
      ? [
          ...COUNTRIES.filter((c) => c.name.toLowerCase().includes(needle)).map((c) => ({ key: `c:${c.code}`, name: c.name, hint: "Country", item: { kind: "country", code: c.code } as WishItemInput })),
          ...listings
            .filter((l) => l.title.toLowerCase().includes(needle) || l.country.toLowerCase().includes(needle))
            .map((l) => ({ key: `e:${l.id}`, name: l.title, hint: "Explore trip", item: { kind: "explore", presetId: l.id } as WishItemInput })),
        ].slice(0, SHOWN)
      : [];

  const add = (item: WishItemInput) =>
    start(async () => {
      setError(undefined);
      const outcome = await addWishItemAction(listId, item);
      if (outcome.error) return setError(outcome.error);
      setTyped("");
      setLabel("");
    });
  const submit = () => {
    if (!needle) return;
    add(link ? { kind: "link", url: typed.trim(), label: label.trim() || null } : { kind: "text", text: typed.trim() });
  };

  return (
    <form
      className="mb-6"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <div className="flex flex-wrap gap-2">
        <label className="min-w-0 flex-[1_1_16rem]">
          <span className="typed mb-1.5 block">Add an idea, a place or a link</span>
          <Input value={typed} onChange={(e) => setTyped(e.target.value)} maxLength={WISH_CAPS.url} autoComplete="off" />
        </label>
        {link ? (
          <label className="min-w-0 flex-[1_1_12rem]">
            <span className="typed mb-1.5 block">Label</span>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={WISH_CAPS.label} autoComplete="off" />
          </label>
        ) : null}
        <Button type="submit" variant="primary" disabled={!needle || pending} className="self-end">
          <PlusIcon />
          {link ? "Add link" : "Add"}
          {busyMark(pending)}
        </Button>
      </div>
      {matches.length ? (
        <ul className="mt-2 max-h-64 overflow-y-auto rounded-md bg-sheet-2" aria-label="Matches">
          {matches.map((m) => (
            <li key={m.key}>
              <button type="button" className={ROW} onClick={() => add(m.item)}>
                <PlusIcon />
                <span className="min-w-0 flex-1 truncate">{m.name}</span>
                <span className="typed shrink-0 text-ink-faint">{m.hint}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <ErrorText>{error}</ErrorText>
    </form>
  );
}
