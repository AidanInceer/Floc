/**
 * The account-level chrome. Trip tabs live in the trip layout, not here —
 * ticket 05 keeps nav shape identical on mobile and desktop, so this is one
 * bar at both sizes with the label set collapsing to icons-plus-text.
 */
import Link from "next/link";

import { ButtonLink } from "@/components/ui";
import { AccountMenu } from "@/components/account-menu";

function WaypointWordmark() {
  return (
    <svg
      viewBox="0 0 420 130"
      width="122"
      height="38"
      role="img"
      aria-hidden="true"
    >
      {/* beige dotted trail: waves over the word, passes through the i-dot, loops below, trails off */}
      <path
        d="M22 30 C 52 8, 90 8, 130 22 C 166 36, 196 4, 224 50
           C 252 96, 244 124, 278 122 C 310 120, 336 96, 350 72"
        fill="none"
        stroke="#d9c9a8"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray="0.1 9"
      />
      {/* W */}
      <text
        x="16"
        y="98"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="68"
        fill="#23211c"
      >
        W
      </text>
      {/* aypoınt — dotless-i so we can place the red dot */}
      <text
        x="72 106 139 179 214 234 276"
        y="98"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="68"
        fill="#23211c"
      >
        aypoınt
      </text>
      {/* red dot over the i */}
      <circle cx="224" cy="50" r="6.5" fill="#a03f36" />
    </svg>
  );
}

/** Your own things, gathered at the thumb end of the bar. */
const accountLinks = [
  { href: "/trips", label: "Trips" },
  { href: "/friends", label: "Friends" },
];

/** Browsing, not your own data — so it sits with the wordmark, not the account. */
const discoverLinks = [{ href: "/explore", label: "Explore" }];

/* Nudged down a few pixels. Optically centred against the wordmark the links
   read as floating above the bar's midline — the wordmark's weight sits low. */
const navLinkClass =
  "translate-y-[3px] rounded-sm px-2 py-1 text-ink-soft hover:bg-sheet-2 hover:text-ink";

export function AppChrome({
  user,
}: {
  user: { id: string; name: string; image: string | null } | null;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-rule bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-[84rem] items-center gap-4 px-4 sm:px-6">
        {/* Always the marketing page, signed in or not — the wordmark is the
            front cover of the book. "Explore" sits beside it because both are
            the world outside your own trips; "Trips" is over on the right. */}
        <Link href="/" aria-label="Waypoint home" className="flex items-center">
          <WaypointWordmark />
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
