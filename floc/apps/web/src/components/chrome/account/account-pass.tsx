import Link from "next/link";

import { Avatar, cx } from "@/components/system/ui";
import { ProStar } from "@/components/system/pro-star";
import "./account-menu.css";

/** The top half of the account ticket: who you are, and your plan opposite. */
export function AccountPass({
  user,
  isPro,
}: {
  user: { name: string; email: string };
  isPro: boolean;
}) {
  return (
    <div className={cx("account-pass-top flex items-center gap-1.5 px-2 pb-2.5 pt-2.5", isPro ? "bg-pro-2" : "bg-sheet")}>
      <Link role="menuitem" href="/profile" className="flex min-w-0 flex-1 items-center gap-3 rounded-sm px-2 py-1.5 hover:bg-pen-soft">
        <Avatar name={user.name} size={34} />
        <span className="min-w-0">
          <span className="block truncate font-display text-[15px] font-semibold leading-tight text-ink">
            {user.name}
          </span>
          <span className="block truncate font-mono text-[11px] text-ink-faint">{user.email}</span>
        </span>
      </Link>
      <Link
        role="menuitem"
        href="/settings?section=billing"
        className="flex shrink-0 flex-col items-end gap-px rounded-sm px-2 py-1.5 hover:bg-pen-soft"
      >
        <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink-faint">Plan</span>
        <span className="inline-flex items-center gap-1 font-display text-[15px] font-semibold text-ink">
          {isPro ? (
            <>
              <ProStar />
              <span className="text-pro-ink">Pro</span>
            </>
          ) : (
            "Free"
          )}
        </span>
      </Link>
    </div>
  );
}
