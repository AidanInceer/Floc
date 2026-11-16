import { Avatar, cx } from "@/components/system/ui";
import type { Person } from "@/server/social/friends";

export function FriendPicker({
  friends,
  excludeIds = [],
  emptyNote,
  unbounded,
  ticked,
}: {
  friends: Person[];
  excludeIds?: string[];
  emptyNote: string;
  unbounded?: boolean;
  ticked?: boolean;
}) {
  const excluded = new Set(excludeIds);
  const offered = friends.filter((f) => !excluded.has(f.id));

  if (offered.length === 0) {
    return <p className="text-sm text-ink-soft">{emptyNote}</p>;
  }

  return (
    <ul
      className={cx(
        "grid grid-cols-2 gap-1.5 sm:grid-cols-1",
        !unbounded && "scroll-thin max-h-64 overflow-y-auto",
      )}
    >
      {offered.map((f) => (
        <li key={f.id}>
          <label className="group flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-rule bg-sheet px-2.5 py-1.5 text-sm transition-colors hover:border-pen has-[:checked]:border-pen has-[:checked]:bg-pen-soft has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-pen">
            <input type="checkbox" name="friendIds" value={f.id} defaultChecked={ticked} className="peer sr-only" />
            <Avatar name={f.name} size={26} />
            <span className="min-w-0 flex-1 truncate">{f.name}</span>
            <svg
              viewBox="0 0 14 14"
              width={13}
              height={13}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
              className="shrink-0 text-pen"
            >
              <path d="M7 3v8M3 7h8" className="group-has-[:checked]:hidden" />
              <path d="M3 7.5l2.5 2.5L11 4.5" className="hidden group-has-[:checked]:block" />
            </svg>
          </label>
        </li>
      ))}
    </ul>
  );
}
