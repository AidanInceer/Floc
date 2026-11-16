import type { ReactNode } from "react";

import { GuestCta } from "@/components/guest/guest-cta";
import { JoinControls } from "@/components/guest/join-controls";
import { inviteTrip, inviteViewer, type InviteViewer } from "./invite-access";

function barText(viewer: Exclude<InviteViewer, { kind: "member" | "stranger" }>): string {
  if (viewer.kind === "guest") return `Answering as ${viewer.name}. Sign up to keep your answers and plan with the group.`;
  return "You are viewing this trip, not on it.";
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

  if (!trip) return <>{children}</>;

  const viewer = await inviteViewer(trip.id);

  if (viewer.kind === "member") return <>{children}</>;

  if (viewer.kind === "stranger") return <>{children}</>;

  return (
    <>
      <GuestCta text={barText(viewer)} controls={<JoinControls token={token} viewer={viewer} compact />} />
      {children}
    </>
  );
}
