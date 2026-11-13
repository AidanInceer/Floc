// Why: the bell folded into the pill so the right of the bar is one control, and
// Pro shows only inside, on the pass — the pill must not change shape when you pay.
import Link from "next/link";

import { Avatar } from "@/components/system/ui";
import { Menu } from "@/components/system/client-ui";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { AccountPass } from "@/components/chrome/account/account-pass";
import { AccountInbox, type InboxPreviewItem } from "@/components/chrome/account/account-inbox";
import { ListIcon, PersonIcon, SlidersIcon, TicketIcon } from "@/components/system/icons/account";
import { ChevronIcon } from "@/components/system/icons";
import { ThemeSwitch } from "@/components/chrome/account/theme-switch";
import "./account-menu.css";

const tileClass =
  "flex flex-col items-center gap-1.5 rounded-sm border border-rule px-1 pb-2 pt-2.5 text-xs text-ink hover:border-rule-strong hover:bg-sheet-2";

/** One count badge for the avatar and the Bookings tile, so the two read as the same mark. */
const badgeClass =
  "absolute -right-2 -top-1.5 min-w-4 rounded-full border-2 border-sheet bg-pen px-1 text-center text-[11px] font-semibold leading-[13px] text-sheet";

export function AccountMenu({
  user,
  isPro,
  unread,
  latest,
  waiting = 0,
}: {
  user: { name: string; email: string };
  isPro: boolean;
  unread: number;
  latest: InboxPreviewItem[];
  /** Bookings waiting for a trip (#559). */
  waiting?: number;
}) {
  const firstName = user.name.trim().split(/\s+/)[0] ?? user.name;
  const shown = unread > 99 ? "99+" : String(unread);

  return (
    <Menu
      label={unread ? `Account, ${shown} new notifications` : "Account"}
      triggerClassName="fuse-bead inline-flex h-11 items-center gap-2 rounded-md bg-sheet pl-1.5 pr-3 text-ink-faint shadow-[inset_0_0_0_1px_var(--rule),var(--shadow-sm)] hover:bg-sheet-2 data-[open=true]:bg-sheet-2"
      panelClassName="account-ticket right-0 mt-2 w-[19rem] max-w-[calc(100vw-1rem)]"
      trigger={
        <>
          <span className="relative inline-flex">
            <Avatar name={user.name} size={32} />
            {unread ? (
              <span aria-hidden className={badgeClass}>
                {shown}
              </span>
            ) : null}
          </span>
          <span data-fuse="label" className="hidden text-sm text-ink-soft sm:inline">
            {firstName}
          </span>
          <ChevronIcon direction="down" size={12} />
        </>
      }
    >
      <AccountPass user={user} isPro={isPro} />
      <div className="account-pass-stub bg-sheet">
        <div aria-hidden className="mx-3.5 border-t-[1.5px] border-dashed border-rule-strong" />
        <AccountInbox unread={unread} items={latest} />
        <div className="grid grid-cols-4 gap-1.5 px-2.5 pb-2.5 pt-1.5">
          <Link role="menuitem" href="/profile" className={tileClass}>
            <PersonIcon />
            Profile
          </Link>
          <Link role="menuitem" href="/settings" className={tileClass}>
            <SlidersIcon />
            Settings
          </Link>
          <Link role="menuitem" href="/lists" className={tileClass}>
            <ListIcon />
            Lists
          </Link>
          <Link role="menuitem" href="/bookings" className={tileClass} aria-label={waiting ? `Bookings, ${waiting} waiting` : "Bookings"}>
            <span className="relative inline-flex">
              <TicketIcon />
              {waiting ? (
                <span aria-hidden className={badgeClass}>
                  {waiting > 99 ? "99+" : waiting}
                </span>
              ) : null}
            </span>
            Bookings
          </Link>
        </div>
        <div className="flex items-center justify-between border-t border-rule bg-sheet-2 px-2.5 py-2">
          <ThemeSwitch />
          <SignOutButton role="menuitem" />
        </div>
      </div>
    </Menu>
  );
}
