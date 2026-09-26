// Why: the bell folded into the pill so the right of the bar is one control, and
// Pro shows only inside, on the pass — the pill must not change shape when you pay.
import type { AvatarIcon } from "@floc/core/people/avatar-icon";
import Link from "next/link";

import { Avatar } from "@/components/system/ui";
import { Menu } from "@/components/system/client-ui";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { AccountPass } from "@/components/chrome/account/account-pass";
import { AccountInbox, type InboxPreviewItem } from "@/components/chrome/account/account-inbox";
import { ChevronIcon, ListIcon, PersonIcon, SlidersIcon } from "@/components/chrome/account/account-icons";
import { ThemeSwitch } from "@/components/chrome/account/theme-switch";

const tileClass =
  "flex flex-col items-center gap-1.5 rounded-[10px] border border-rule px-1 pb-2 pt-2.5 text-xs text-ink hover:border-rule-strong hover:bg-sheet-2";

export function AccountMenu({
  user,
  isPro,
  unread,
  latest,
  tripCount,
  friendCount,
}: {
  user: { name: string; email: string; avatarIcon: AvatarIcon | null };
  isPro: boolean;
  unread: number;
  latest: InboxPreviewItem[];
  tripCount: number;
  friendCount: number;
}) {
  const firstName = user.name.trim().split(/\s+/)[0] ?? user.name;
  const shown = unread > 99 ? "99+" : String(unread);

  return (
    <Menu
      label={unread ? `Account, ${shown} new notifications` : "Account"}
      triggerClassName="inline-flex items-center gap-2 rounded-full border border-rule-strong bg-sheet py-1 pl-1 pr-2 text-ink-faint hover:bg-sheet-2 data-[open=true]:bg-sheet-2"
      panelClassName="account-ticket right-0 mt-2 w-[19rem] max-w-[calc(100vw-1rem)]"
      trigger={
        <>
          <span className="relative inline-flex">
            <Avatar name={user.name} icon={user.avatarIcon} size={26} />
            {unread ? (
              <span
                aria-hidden
                className="absolute -right-2 -top-1.5 min-w-4 rounded-full border-2 border-sheet bg-pen px-1 text-center text-[9.5px] font-semibold leading-[13px] text-sheet"
              >
                {shown}
              </span>
            ) : null}
          </span>
          <span className="hidden text-sm text-ink-soft sm:inline">{firstName}</span>
          <ChevronIcon />
        </>
      }
    >
      <AccountPass user={user} isPro={isPro} tripCount={tripCount} friendCount={friendCount} />
      <div className="account-pass-stub bg-sheet">
        <div aria-hidden className="mx-3.5 border-t-[1.5px] border-dashed border-rule-strong" />
        <AccountInbox unread={unread} items={latest} />
        <div className="grid grid-cols-3 gap-1.5 px-2.5 pb-2.5 pt-1.5">
          <Link role="menuitem" href="/profile" className={tileClass}>
            <PersonIcon />
            Profile
          </Link>
          <Link role="menuitem" href="/settings" className={tileClass}>
            <SlidersIcon />
            Settings
          </Link>
          <Link role="menuitem" href="/packing-lists" className={tileClass}>
            <ListIcon />
            Saved lists
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
