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

import type { AvatarIcon } from "@floc/core/people/avatar-icon";
import Link from "next/link";

import { Avatar, menuItemClass } from "@/components/system/ui";
import { Menu } from "@/components/system/client-ui";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ThemeSwitch } from "@/components/chrome/theme-switch";

// Pro's mark on the bar. A star and not a word, because the right-hand side is
// deliberately one control — a second pill beside it is what ticket 191 spent
// its time removing. Gold, the only paid colour in the product, and drawn to
// the house icon rules. Colour is never the whole story here (CLAUDE.md), so
// the word "Floc Pro" waits inside the open menu.
function ProStar() {
  return (
    <svg
      viewBox="0 0 14 14"
      aria-hidden="true"
      className="size-[13px] shrink-0 text-pro-gold"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 1.9 8.6 5.2 12.2 5.7 9.6 8.2 10.2 11.8 7 10.1 3.8 11.8 4.4 8.2 1.8 5.7 5.4 5.2Z" />
    </svg>
  );
}

export function AccountMenu({
  user,
  isPro = false,
}: {
  user: { name: string; avatarIcon: AvatarIcon | null };
  isPro?: boolean;
}) {
  const firstName = user.name.trim().split(/\s+/)[0] ?? user.name;

  return (
    <Menu
      label="Account"
      triggerClassName="inline-flex items-center gap-2 rounded-full border border-rule-strong bg-sheet py-1 pl-1 pr-2.5 hover:bg-sheet-2 data-[open=true]:bg-sheet-2"
      trigger={
        <>
          <Avatar name={user.name} icon={user.avatarIcon} size={26} />
          <span className="hidden text-sm text-ink-soft sm:inline">
            {firstName}
          </span>
          {isPro ? (
            <>
              <ProStar />
              {/* The star is decorative; this is what a screen reader gets. */}
              <span className="sr-only">Floc Pro</span>
            </>
          ) : null}
          <span aria-hidden className="text-[10px] leading-none text-ink-faint">
            ▾
          </span>
        </>
      }
    >
      {/* The star's word, and the route to billing — "what am I on" and
          "change it" are one question, so they are one row. */}
      {isPro ? (
        <Link
          role="menuitem"
          href="/settings?section=billing"
          className="mb-0.5 flex items-center justify-between gap-2 rounded-md bg-pro px-2.5 py-1.5 text-pro-ink hover:bg-pro-2"
        >
          <span className="font-display text-sm font-semibold">Floc Pro</span>
          <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-pro-gold">
            Manage
          </span>
        </Link>
      ) : null}
      <Link role="menuitem" href="/profile" className={menuItemClass}>
        Profile
      </Link>
      <Link role="menuitem" href="/settings" className={menuItemClass}>
        Settings
      </Link>
      <Link role="menuitem" href="/packing-lists" className={menuItemClass}>
        Saved lists
      </Link>
      <div className="my-1 border-t border-dotted border-rule-strong" />
      {/* The theme switch lives here rather than loose in the bar (ticket
          240 put it there): on a phone the bar had four pill controls and
          the account one was the first to be squeezed out. The menu stays
          open while you flick between light and dark. */}
      <div className="flex justify-center px-2 py-1">
        <ThemeSwitch />
      </div>
      <div className="my-1 border-t border-dotted border-rule-strong" />
      <SignOutButton role="menuitem" className={menuItemClass} />
    </Menu>
  );
}
