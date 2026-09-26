import type { ReactNode } from "react";

import { Avatar } from "@/components/system/ui";
import type { TripMember } from "@/server/access";

export function WhoAnswered({
  members,
  marked,
  viewerId,
  nudgeFor,
}: {
  members: TripMember[];
  /** userId → days marked free. */
  marked: Record<string, number>;
  viewerId: string;
  nudgeFor: (member: TripMember) => ReactNode;
}) {
  const answered = members.filter((m) => (marked[m.userId] ?? 0) > 0).length;

  return (
    <section className="rounded-md border border-rule bg-sheet p-4 shadow-card">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-faint">
          Who has answered
        </h2>
        <span className="nums font-mono text-[11px] text-ink-faint">
          {answered} of {members.length}
        </span>
      </div>
      <ul className="mt-2 divide-y divide-rule">
        {members.map((m) => {
          const days = marked[m.userId] ?? 0;
          const you = m.userId === viewerId;
          return (
            <li key={m.userId} className="flex items-center gap-2 py-2">
              <Avatar name={m.name} icon={m.avatarIcon} size={26} tone={m.tone} />
              <span className="min-w-0 flex-1 truncate text-sm">{you ? "You" : m.name}</span>
              {days > 0 ? (
                <span className="nums font-mono text-[11px] text-ink-faint">
                  {days} {days === 1 ? "day" : "days"}
                </span>
              ) : you ? (
                <span className="font-mono text-[11px] text-pastel-yellow-ink">Not yet</span>
              ) : (
                nudgeFor(m)
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
