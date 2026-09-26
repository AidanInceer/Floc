import type { ComponentProps, ReactNode } from "react";

import { OverviewGroup } from "@/components/trip/overview/overview-group";
import { TourSpotlight } from "@/components/tour/tour-spotlight";

type GroupProps = ComponentProps<typeof OverviewGroup>;
type GroupExtras = Pick<GroupProps, "friendStates" | "pendingInvitees" | "declinedInvitees" | "friends">;

export function PanelPlaceholder() {
  return <div aria-hidden className="m-5 h-24 rounded-lg bg-sheet-2 opacity-80" />;
}

export async function StreamedGroup({
  extras,
  ...props
}: Omit<GroupProps, keyof GroupExtras> & { extras: Promise<GroupExtras> }) {
  return <OverviewGroup {...props} {...await extras} />;
}

// Why: the tour measures its targets on mount, so it waits for the streamed panels it lights.
export async function TourWhenReady({
  targets,
  ...props
}: ComponentProps<typeof TourSpotlight> & { targets: Promise<unknown>[] }): Promise<ReactNode> {
  await Promise.all(targets);
  return <TourSpotlight {...props} />;
}
