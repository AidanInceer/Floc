/**
 * The chrome a share link wears (#330, #442): the bar with the way in. One
 * page, so no tabs.
 *
 * ONE LINK, TWO AUDIENCES. This is the trip's own share link — the same token
 * Overview's Share trip copies — not a second kind beside it. What changes is who
 * is holding it: a member is sent to the real trip, and everybody else gets the
 * guest page under here.
 *
 * Nothing under this route imports a trip's `actions.ts`. The only writes
 * reachable from a share link are joining and a guest's own answers, all in
 * this folder's own `actions.ts`, so there is no trip mutation to forget a
 * check on.
 */
import type { ReactNode } from "react";

import { GuestCta } from "@/components/guest/guest-cta";
import { JoinControls } from "@/components/guest/join-controls";
import { inviteTrip, inviteViewer, type InviteViewer } from "./invite-access";

function barText(viewer: Exclude<InviteViewer, { kind: "member" }>): string {
  if (viewer.kind === "guest") return `Answering as ${viewer.name}. Sign up to keep your answers and plan with the group.`;
  if (viewer.kind === "canJoin") return "You are viewing this trip, not on it.";
  return "Vote and mark your dates with just a name.";
}

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

  // A member is on their way to the real trip; the bar would flash a
  // read-only copy of a trip they can actually edit.
  if (viewer.kind === "member") return <>{children}</>;

  return (
    <>
      <GuestCta text={barText(viewer)} controls={<JoinControls token={token} viewer={viewer} compact />} />
      {children}
    </>
  );
}
