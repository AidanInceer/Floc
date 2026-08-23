"use client";

/**
 * The account pill in the header: avatar + first name, expanding to Profile,
 * Settings and Sign out. Settings used to be a loose link beside the avatar —
 * collapsing all three into one control is what keeps the right-hand side of
 * the bar readable now the nav sits there too.
 *
 * Not built on `Sheet`: that's a modal <dialog>, which is the wrong affordance
 * for a menu hanging off its own trigger. It used to own that dropdown outright
 * — "the only one in v1" — and ticket 125 gave every cluttered row one too, so
 * the mechanics moved into `Menu` and this kept what is actually specific to
 * it: the avatar-and-name pill it hangs off.
 */
import Link from "next/link";

import { Avatar } from "@/components/ui";
import { Menu, menuItemClass } from "@/components/client-ui";
import { SignOutButton } from "@/components/sign-out-button";

export function AccountMenu({
  user,
}: {
  user: { name: string; image: string | null };
}) {
  const firstName = user.name.trim().split(/\s+/)[0] ?? user.name;

  return (
    <Menu
      label="Account"
      triggerClassName="inline-flex items-center gap-2 rounded-full border border-rule-strong bg-sheet py-1 pl-1 pr-2.5 hover:bg-sheet-2 data-[open=true]:bg-sheet-2"
      trigger={
        <>
          {/* Same avatar as the rosters (ticket 149): the profile photo when
              there is one — Avatar sends no referrer so Google serves it — else
              the initials fallback, keyed off the same name so it matches. */}
          <Avatar name={user.name} src={user.image} size={26} />
          <span className="hidden text-sm text-ink-soft sm:inline">
            {firstName}
          </span>
          <span aria-hidden className="text-[10px] leading-none text-ink-faint">
            ▾
          </span>
        </>
      }
    >
      <Link role="menuitem" href="/profile" className={menuItemClass}>
        Profile
      </Link>
      <Link role="menuitem" href="/settings" className={menuItemClass}>
        Settings
      </Link>
      <div className="my-1 border-t border-dotted border-rule-strong" />
      <SignOutButton role="menuitem" className={menuItemClass} />
    </Menu>
  );
}
