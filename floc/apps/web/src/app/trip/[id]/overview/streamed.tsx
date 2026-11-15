import type { ComponentProps } from "react";

import { OverviewGroup } from "@/components/trip/overview/overview-group";
import { EstimateBanner } from "@/components/trip/overview/estimate-banner";
import type { EstimateView } from "@/server/money/estimate/estimate-view";

export async function StreamedEstimate({ tripId, estimate }: { tripId: number; estimate: Promise<EstimateView | null> }) {
  const view = await estimate;
  return view ? <EstimateBanner tripId={tripId} view={view} /> : null;
}

type GroupProps = ComponentProps<typeof OverviewGroup>;
type GroupExtras = Pick<GroupProps, "friendStates" | "pendingInvitees" | "declinedInvitees" | "friends">;

export function PanelPlaceholder() {
  return <div aria-hidden className="h-10 min-w-0 flex-1 rounded-full bg-sheet-2 opacity-80" />;
}

export async function StreamedGroup({
  extras,
  ...props
}: Omit<GroupProps, keyof GroupExtras> & { extras: Promise<GroupExtras> }) {
  return <OverviewGroup {...props} {...await extras} />;
}
