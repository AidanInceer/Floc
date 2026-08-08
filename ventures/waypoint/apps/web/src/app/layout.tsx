import type { Metadata } from "next";

import { AppChrome } from "@/components/app-chrome";
import { getSession } from "@/server/access";
import { countIncomingFriendRequests } from "@/server/friends";
import { countPendingInvitesFor } from "@/server/membership";

import "./globals.css";

export const metadata: Metadata = {
  title: "Waypoint — plan a trip with the group",
  description:
    "Waypoint keeps a group trip in one place: ideas, the route, the days, and who owes who.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // The badges on Trips (ticket 146) and Friends (ticket 145): an invite and a
  // friend request are the two things that arrive while you're elsewhere in the
  // app, so both have to be visible from anywhere. Counts, not the things
  // themselves — the answering happens on the page behind each link.
  const [inviteCount, friendRequestCount] = session?.user
    ? await Promise.all([
        countPendingInvitesFor(session.user.id),
        countIncomingFriendRequests(session.user.id),
      ])
    : [0, 0];

  // No `data-theme` and no theme lookup: Waypoint is light-only by design
  // (ticket 07 — ink on paper, and a dark notebook is a different product).
  return (
    <html lang="en">
      <body className="min-h-dvh">
        <AppChrome
          user={
            session?.user
              ? {
                  id: session.user.id,
                  name: session.user.name,
                  image: session.user.image ?? null,
                }
              : null
          }
          inviteCount={inviteCount}
          friendRequestCount={friendRequestCount}
        />
        <main>{children}</main>
      </body>
    </html>
  );
}
