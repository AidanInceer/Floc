/**
 * Pick friends to ask onto a trip (ticket 146) — the same control on the
 * "Start a trip" form and behind Invite friends on the roster.
 *
 * A plain checkbox list of `friendIds`, not a search box: v1's friends list is
 * the people you have already travelled with, so it is short by construction
 * and a filter over a dozen names would be furniture. It grows a scroll area
 * rather than a search when it gets long.
 *
 * Renders its own nothing-here state instead of collapsing to an empty box,
 * because "you have no friends yet" is the answer to why the list is blank and
 * the form around it still has a job to do.
 */
import { Avatar } from "@/components/ui";
import type { Person } from "@/server/social/friends";

export function FriendPicker({
  friends,
  /** Already on the trip, or already asked — offered nowhere, listed nowhere. */
  excludeIds = [],
  emptyNote,
}: {
  friends: Person[];
  excludeIds?: string[];
  emptyNote: string;
}) {
  const excluded = new Set(excludeIds);
  const offered = friends.filter((f) => !excluded.has(f.id));

  if (offered.length === 0) {
    return <p className="text-sm text-ink-soft">{emptyNote}</p>;
  }

  return (
    <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto">
      {offered.map((f) => (
        <li key={f.id}>
          {/* The whole row is the target, not the 16px box on its left. */}
          <label className="flex cursor-pointer items-center gap-2.5 rounded-md bg-sheet-2 px-3 py-2 text-sm transition-colors hover:bg-sheet-3">
            <input
              type="checkbox"
              name="friendIds"
              value={f.id}
              className="size-4 rounded-sm border-rule-strong"
            />
            <Avatar name={f.name} src={f.avatarUrl} size={24} />
            <span className="min-w-0 truncate">{f.name}</span>
          </label>
        </li>
      ))}
    </ul>
  );
}
