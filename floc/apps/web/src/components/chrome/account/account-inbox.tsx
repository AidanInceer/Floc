import { commentTime } from "@floc/core/notes/notes";
import { BELL_ROWS, groupByTrip, lineUnderTrip, planFirst } from "@floc/core/notifications/by-trip";
import Link from "next/link";

import { openNotification, readEverything } from "@/app/inbox/actions";
import { ChangeWords } from "@/components/notifications/change-words";
import { cx, pressArea } from "@/components/system/ui";

export type InboxPreviewItem = {
  id: number;
  text: string;
  at: Date;
  tripId: number | null;
  tripName: string | null;
  change: { date: string; time: string | null } | null;
  words: { was: string | null; now: string | null } | null;
  share: string | null;
};

function PreviewRow({ item }: { item: InboxPreviewItem }) {
  return (
    <form action={openNotification}>
      <input type="hidden" name="id" value={item.id} />
      <button
        type="submit"
        role="menuitem"
        className="relative flex w-full items-start gap-2.5 rounded-sm py-1.5 pl-4 pr-2 text-left text-[13px] leading-snug text-ink hover:bg-pen-soft"
      >
        <span aria-hidden className="absolute left-1.5 top-[0.78rem] size-[5px] rounded-full bg-pen" />
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 block">{lineUnderTrip(item.text, item.tripName)}</span>
          {item.words ? <ChangeWords words={item.words} /> : null}
          {item.share ? (
            <span className="block text-xs text-ink-soft">
              Your share <span className="nums text-ink">{item.share}</span>
            </span>
          ) : null}
        </span>
        <span className="shrink-0 pt-px font-mono text-[11px] text-ink-faint">{commentTime(item.at)}</span>
      </button>
    </form>
  );
}

export function AccountInbox({ items }: { items: InboxPreviewItem[] }) {
  return (
    <div className="px-1.5 pb-1 pt-2">
      <div className="flex items-baseline justify-between gap-2 px-2 pb-1">
        {items.length ? (
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-pen">
            {items.length}
            {items.length >= BELL_ROWS ? "+" : ""} new
          </span>
        ) : (
          <span className="text-[13px] text-ink-faint">You are up to date.</span>
        )}
        <span className="flex items-baseline gap-3">
          {items.length ? (
            <form action={readEverything}>
              <button type="submit" role="menuitem" className={cx(pressArea, "text-[13px] text-ink-soft hover:text-pen")}>
                Mark all as read
              </button>
            </form>
          ) : null}
          <Link role="menuitem" href="/inbox" className={cx(pressArea, "text-[13px] text-pen hover:underline")}>
            Open inbox
          </Link>
        </span>
      </div>
      {items.length ? (
        <div className="max-h-[min(30rem,70dvh)] overflow-y-auto">
          {groupByTrip(items).map((group) => (
            <section key={group.tripId ?? "none"} className="border-t border-rule first:border-t-0">
              {group.tripName ? <h3 className="px-2 pb-0.5 pt-2 font-display text-md">{group.tripName}</h3> : null}
              <ul>
                {planFirst(group.items).map((item) => (
                  <li key={item.id}>
                    <PreviewRow item={item} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}
