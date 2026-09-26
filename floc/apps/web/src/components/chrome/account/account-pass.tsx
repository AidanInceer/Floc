import type { AvatarIcon } from "@floc/core/people/avatar-icon";
import Link from "next/link";

import { Avatar, cx } from "@/components/system/ui";
import { ProStar } from "@/components/system/pro-star";

function Field({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <Link
      role="menuitem"
      href={href}
      className="flex flex-col gap-px rounded-[10px] px-2 py-1.5 hover:bg-sheet-2"
    >
      <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink-faint">{label}</span>
      <span className="inline-flex items-center gap-1 font-display text-[15px] font-semibold text-ink">
        {children}
      </span>
    </Link>
  );
}

/** The top half of the account ticket: who you are, and three figures that each open their page. */
export function AccountPass({
  user,
  isPro,
  tripCount,
  friendCount,
}: {
  user: { name: string; email: string; avatarIcon: AvatarIcon | null };
  isPro: boolean;
  tripCount: number;
  friendCount: number;
}) {
  return (
    <div className={cx("account-pass-top flex flex-col gap-1.5 px-2 pb-2 pt-2.5", isPro ? "bg-pro-2" : "bg-sheet")}>
      <Link role="menuitem" href="/profile" className="flex min-w-0 items-center gap-3 rounded-[10px] px-2 py-1.5 hover:bg-sheet-2">
        <Avatar name={user.name} icon={user.avatarIcon} size={34} />
        <span className="min-w-0">
          <span className="block truncate font-display text-[15px] font-semibold leading-tight text-ink">
            {user.name}
          </span>
          <span className="block truncate font-mono text-[11px] text-ink-faint">{user.email}</span>
        </span>
      </Link>
      <div className="grid grid-cols-3 gap-1.5">
        <Field href="/settings?section=billing" label="Plan">
          {isPro ? (
            <>
              <ProStar />
              <span className="text-pro-ink">Pro</span>
            </>
          ) : (
            "Free"
          )}
        </Field>
        <Field href="/trips" label="Trips">
          <span className="font-mono tabular-nums">{tripCount}</span>
        </Field>
        <Field href="/friends" label="Friends">
          <span className="font-mono tabular-nums">{friendCount}</span>
        </Field>
      </div>
    </div>
  );
}
