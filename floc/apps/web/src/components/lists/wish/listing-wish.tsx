"use client";

import Link from "next/link";
import { createContext, useContext, useState, useTransition, type ReactNode } from "react";

import { addWishItemAction } from "@/app/lists/wish/actions";
import { Menu } from "@/components/system/client-ui";
import { CheckIcon, PlusIcon } from "@/components/system/icons";
import { buttonClass, cx, menuItemClass } from "@/components/system/ui";
import type { Person } from "@/server/social/friends";

type ListingWish = { lists: { id: number; title: string }[]; along: Person[]; me: string; people: { id: string; name: string }[] };

export const ListingWishContext = createContext<ListingWish>({ lists: [], along: [], me: "", people: [] });
const Context = ListingWishContext;

export function ListingWishProvider({ value, children }: { value: ListingWish; children: ReactNode }) {
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

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
