import Link from "next/link";

import { ChevronIcon } from "@/components/system/icons";
import { AvatarRow } from "@/components/system/ui";
import type { WishListRow } from "@/server/wish-lists/wish-lists";
import { countWord } from "@floc/core/text/count-word";

/** Your wish lists as rows on one surface (#623): name, the faces on it, and how much it holds. A row opens anywhere. */
export function WishListRows({ lists }: { lists: WishListRow[] }) {
  return (
    <ul className="divide-y divide-rule overflow-hidden rounded-md bg-sheet shadow-[var(--shadow)]">
      {lists.map((list) => (
        <li key={list.id}>
          <Link
            href={`/lists/wish/${list.id}`}
            className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-pen-soft hover:text-pen-deep max-sm:px-3"
          >
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="truncate font-display text-base font-semibold tracking-[-0.015em]">{list.title}</span>
              <span className="nums font-mono text-xs text-ink-soft">{countWord(list.itemCount, "thing")}</span>
            </span>
            {list.people.length ? <AvatarRow people={list.people} size={26} max={4} /> : null}
            <ChevronIcon direction="right" className="shrink-0 text-ink-faint" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
