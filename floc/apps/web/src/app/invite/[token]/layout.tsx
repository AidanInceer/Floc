/**
 * The chrome every page of a share link wears (#330): the way in, then the two
 * tabs a guest has.
 *
 * ONE LINK, TWO AUDIENCES. This is the trip's own share link — the same token
 * `trip-roster.tsx` copies — not a second kind beside it. What changes is who
 * is holding it: a member is sent to the real trip, and everybody else gets the
 * read-only copy under here.
 *
 * Nothing under this route imports a trip's `actions.ts`. The only writes
 * reachable from a share link are joining and resending a confirmation, both in
 * this folder's own `actions.ts`, so there is no trip mutation to forget a
 * check on.
 */
import type { ReactNode } from "react";

import { GuestCta } from "@/components/guest/guest-cta";
import { JoinControls } from "@/components/guest/join-controls";
import { GuestTabs } from "@/components/guest/guest-tabs";
import { inviteTrip, inviteViewer } from "./invite-access";

export default async function InviteLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const trip = await inviteTrip(token);

  // A dead token gets no chrome — the page under it draws the whole answer.
  if (!trip) return <>{children}</>;

  const viewer = await inviteViewer(trip.id);

  // A member is on their way to the real trip; the bar and tabs would flash a
  // read-only copy of a trip they can actually edit.
  if (viewer.kind === "member") return <>{children}</>;

  return (
    <>
      <GuestCta
        controls={<JoinControls token={token} viewer={viewer} compact />}
      />
      <GuestTabs token={token} />
      {children}
    </>
  );
}
