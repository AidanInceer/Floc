/**
 * The account-level chrome. Trip tabs live in the trip layout, not here —
 * ticket 05 keeps nav shape identical on mobile and desktop, so this is one
 * bar at both sizes with the label set collapsing to icons-plus-text.
 */
import Link from "next/link";

import { ButtonLink } from "@/components/ui";
import { AccountMenu } from "@/components/account-menu";

/** Your own things, gathered at the thumb end of the bar. */
const accountLinks = [
  { href: "/trips", label: "Trips" },
  { href: "/friends", label: "Friends" },
];

/** Browsing, not your own data — so it sits with the wordmark, not the account. */
const discoverLinks = [{ href: "/explore", label: "Explore" }];

const navLinkClass =
  "rounded-sm px-2 py-1 text-ink-soft hover:bg-sheet-2 hover:text-ink";

export function AppChrome({
  user,
}: {
  user: { id: string; name: string; image: string | null } | null;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-rule bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
        {/* Always the marketing page, signed in or not — the wordmark is the
            front cover of the book. "Explore" sits beside it because both are
            the world outside your own trips; "Trips" is over on the right. */}
        <Link
          href="/"
          /* 1.2rem, not text-lg: the ask was exactly 20% up from the old 1rem
             and the scale has no step there. */
          className="font-display text-[1.2rem] font-semibold tracking-tight text-pen"
        >
          Waypoint
        </Link>

        {user ? (
          <>
            <nav aria-label="Discover" className="flex items-center gap-1 text-sm">
              {discoverLinks.map((l) => (
                <Link key={l.href} href={l.href} className={navLinkClass}>
                  {l.label}
                </Link>
              ))}
            </nav>

            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <nav
                aria-label="Your account"
                className="flex items-center gap-1 text-sm"
              >
                {accountLinks.map((l) => (
                  <Link key={l.href} href={l.href} className={navLinkClass}>
                    {l.label}
                  </Link>
                ))}
              </nav>
              <AccountMenu user={user} />
            </div>
          </>
        ) : (
          <div className="ml-auto flex items-center gap-2">
            <ButtonLink href="/login" variant="ghost">
              Log in
            </ButtonLink>
            <ButtonLink href="/signup" variant="primary">
              Sign up
            </ButtonLink>
          </div>
        )}
      </div>
    </header>
  );
}
