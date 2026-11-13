"use client";

import { peopleCount } from "@floc/core/people/group-ticks";
import Link from "next/link";
import { createContext, useContext, useState, useTransition, type ReactNode } from "react";

import { addWishItemAction } from "@/app/lists/wish/actions";
import { Menu } from "@/components/system/client-ui";
import { CheckIcon, PlusIcon } from "@/components/system/icons";
import { AvatarRow, buttonClass, cx, menuItemClass } from "@/components/system/ui";
import type { Person } from "@/server/social/friends";

type ListingWish = { lists: { id: number; title: string }[]; along: Person[] };

const Context = createContext<ListingWish>({ lists: [], along: [] });

/** A listing page's wish list facts (#623): your lists for Add to wish list, and who a `?wish=` start asks along. */
export function ListingWishProvider({ value, children }: { value: ListingWish; children: ReactNode }) {
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

/** Inside the copy form: the people a wish list start asks along, sent as the new trip's invites. */
export function CopyAlong() {
  const { along } = useContext(Context);
  if (along.length === 0) return null;
  return (
    <div className="mt-4 flex items-center gap-2 border-t border-rule pt-3">
      {along.map((p) => <input key={p.id} type="hidden" name="friendIds" value={p.id} />)}
      <AvatarRow people={along} size={22} max={5} />
      <span className="font-mono text-xs text-ink-soft">{peopleCount(along.length)} asked along</span>
    </div>
  );
}

/** Add to wish list on a listing: a menu of your lists, or the way to make one when you have none. */
export function AddToWishList({ presetId, className }: { presetId: string; className?: string }) {
  const { lists } = useContext(Context);
  const [added, setAdded] = useState<Set<number>>(() => new Set());
  const [, start] = useTransition();
  const trigger = (
    <>
      <PlusIcon />
      Add to wish list
    </>
  );
  if (lists.length === 0) {
    return (
      <Link href="/lists/wish" className={cx(buttonClass("ghost"), className)}>
        {trigger}
      </Link>
    );
  }
  const add = (listId: number) =>
    start(async () => {
      const outcome = await addWishItemAction(listId, { kind: "explore", presetId });
      if (!outcome.error) setAdded((now) => new Set(now).add(listId));
    });
  return (
    <Menu label="Add to wish list" align="left" trigger={trigger} triggerClassName={cx(buttonClass("ghost"), className)}>
      {lists.map((list) => (
        <button key={list.id} type="button" className={cx(menuItemClass, "!flex items-center gap-2")} onClick={() => add(list.id)}>
          <span className="min-w-0 flex-1 truncate">{list.title}</span>
          {added.has(list.id) ? (
            <span className="flex items-center gap-1 text-xs text-green">
              <CheckIcon />
              Added
            </span>
          ) : null}
        </button>
      ))}
    </Menu>
  );
}
