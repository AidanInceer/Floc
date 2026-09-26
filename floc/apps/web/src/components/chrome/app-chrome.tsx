/**
 * The account-level chrome (ticket 191): wordmark left, one pill-navigation
 * group in the middle, account controls right — the same shape on every screen
 * and at every size. Trip tabs are the same pill group, rendered by the trip
 * layout; this bar holds the signed-in surfaces when you're outside a trip.
 */

import type { AvatarIcon } from "@floc/core/people/avatar-icon";
import Link from "next/link";

import { ButtonLink } from "@/components/system/ui";
import { PillNav, type PillNavItem } from "@/components/chrome/pill-nav";
import { AccountMenu } from "@/components/chrome/account/account-menu";
import type { InboxPreviewItem } from "@/components/chrome/account/account-inbox";
import { FlocWordmark } from "@/components/system/wordmark";

/**
 * How much is waiting behind a link — trip invites (ticket 146) and friend
 * requests (ticket 145). A count and not a dot: "2" says how much is behind the
 * link, which a dot never does, and the number is what the screen reader reads.
 */
function WaitingCount({ count, label }: { count: number; label: string }) {
  return (
    <span
      className="ml-1.5 inline-flex min-w-[17px] items-center justify-center rounded-full bg-pen px-1 text-[10.5px] font-semibold leading-[17px] text-sheet"
      aria-label={`${count} ${label} waiting`}
    >
      {count}
    </span>
  );
}

export function AppChrome({
  user,
  inviteCount = 0,
  friendRequestCount = 0,
  notificationCount = 0,
  latest = [],
  tripCount = 0,
  friendCount = 0,
  isPro = false,
}: {
  user: { id: string; name: string; email: string; avatarIcon: AvatarIcon | null } | null;
  isPro?: boolean;
  /** Open trip invites for this account — badges the Trips link. */
  inviteCount?: number;
  /** Friend requests waiting on this account — badges the Friends link. */
  friendRequestCount?: number;
  /** Unseen notifications (#344) — badges the avatar. */
  notificationCount?: number;
  latest?: InboxPreviewItem[];
  tripCount?: number;
  friendCount?: number;
}) {
  // Your signed-in surfaces, in one pill group. Discover sits among them —
  // browsing is still one of the places you go.
  const navItems: PillNavItem[] = [
    { href: "/explore", label: "Explore" },
    {
      href: "/trips",
      label: "Trips",
      badge: inviteCount ? (
        <WaitingCount
          count={inviteCount}
          label={`trip ${inviteCount === 1 ? "invitation" : "invitations"}`}
        />
      ) : undefined,
    },
    {
      href: "/friends",
      label: "Friends",
      badge: friendRequestCount ? (
        <WaitingCount
          count={friendRequestCount}
          label={`friend ${friendRequestCount === 1 ? "request" : "requests"}`}
        />
      ) : undefined,
    },
  ];

  return (
    <header className="sticky top-0 z-20 border-b border-rule bg-sheet/90 backdrop-blur">
      {/* Flex, not a three-column grid: an `auto` grid track refuses to shrink
          below its max-content, so at phone widths the pills grew past their
          column and sat over the wordmark. Here the ends are content-sized and
          unshrinkable, and the middle takes what is left — the track scrolls
          inside it rather than pushing anything off the row. */}
      <div className="relative mx-auto flex h-14 w-full max-w-[84rem] items-center gap-1.5 px-2 sm:gap-4 sm:px-6">
        <Link
          href="/"
          aria-label="Floc home"
          className="flex shrink-0 items-center transition-opacity hover:opacity-70"
        >
          <FlocWordmark />
        </Link>

        {/* Centred on the *bar*, not on what the two ends leave over: the ends
            are never equal widths, so flow-centring sat the pills ~39px left of
            true centre. Absolute only from `sm` up — on a phone there isn't the
            room, and the pills must stay in flow so the row can shrink. */}
        <div className="flex min-w-0 flex-1 justify-center sm:absolute sm:left-1/2 sm:w-auto sm:max-w-[calc(100%-22rem)] sm:flex-none sm:-translate-x-1/2">
          {/* Explore is public, so it stays in the bar signed out — the one
              surface a visitor can reach without an account. */}
          <PillNav
            label={user ? "Your surfaces" : "Browse"}
            items={user ? navItems : navItems.filter((i) => i.href === "/explore")}
          />
        </div>

        {/* `ml-auto`, because from `sm` up the middle leaves the flow and there
            is nothing left to push the account controls to the right edge. */}
        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          {user ? (
            <AccountMenu
              user={user}
              isPro={isPro}
              unread={notificationCount}
              latest={latest}
              tripCount={tripCount}
              friendCount={friendCount}
            />
          ) : (
            <>
              <ButtonLink href="/login" variant="ghost">
                Log in
              </ButtonLink>
              <ButtonLink href="/signup" variant="primary">
                Sign up
              </ButtonLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
