import type { Metadata } from "next";

import { AppChrome } from "@/components/app-chrome";
import { getSession } from "@/server/access";
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

  // The badge on Trips (ticket 146): an invite is the one thing that can arrive
  // while you're elsewhere in the app, so it has to be visible from anywhere.
  // A count, not the invites themselves — the answering happens on /trips.
  const inviteCount = session?.user
    ? await countPendingInvitesFor(session.user.id)
    : 0;

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
        />
        <main>{children}</main>
      </body>
    </html>
  );
}
