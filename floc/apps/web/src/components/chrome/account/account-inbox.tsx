import { commentTime } from "@floc/core/notes/notes";
import Link from "next/link";

import { openNotification } from "@/app/inbox/actions";

export type InboxPreviewItem = { id: number; text: string; at: Date };

/** What is new, in the menu. Opening a row reads it, exactly as it does on /inbox. */
export function AccountInbox({ unread, items }: { unread: number; items: InboxPreviewItem[] }) {
  return (
    <div className="px-1.5 pb-1 pt-2">
      <div className="flex items-baseline justify-between gap-2 px-2 pb-1">
        {unread ? (
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-pen">
            {unread > 99 ? "99+" : unread} new
          </span>
        ) : (
          <span className="text-[12.5px] text-ink-faint">You are up to date.</span>
        )}
        <Link role="menuitem" href="/inbox" className="text-[12.5px] text-pen hover:underline">
          Open inbox
        </Link>
      </div>
      {items.length ? (
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              <form action={openNotification}>
                <input type="hidden" name="id" value={item.id} />
                <button
                  type="submit"
                  role="menuitem"
                  className="relative flex w-full items-start gap-2.5 rounded-[10px] py-1.5 pl-4 pr-2 text-left text-[12.5px] leading-snug text-ink hover:bg-sheet-2"
                >
                  <span aria-hidden className="absolute left-1.5 top-[0.78rem] size-[5px] rounded-full bg-pen" />
                  <span className="line-clamp-2 min-w-0 flex-1">{item.text}</span>
                  <span className="shrink-0 pt-px font-mono text-[10.5px] text-ink-faint">{commentTime(item.at)}</span>
                </button>
              </form>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
