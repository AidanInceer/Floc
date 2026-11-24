import type { ComponentProps } from "react";

import { OverviewGroup } from "@/components/trip/overview/overview-group";
import { EstimateRow } from "@/components/trip/overview/estimate-row";
import { PhotosCard } from "@/components/trip/overview/media/photos-card";
import type { EstimateView } from "@/server/money/estimate/estimate-view";
import type { MediaView } from "@/server/media/media-view";

export async function StreamedEstimate({ tripId, estimate }: { tripId: number; estimate: Promise<EstimateView | null> }) {
  const view = await estimate;
  return view ? <EstimateRow tripId={tripId} view={view} /> : null;
}

export async function StreamedPhotos({ tripId, view }: { tripId: number; view: Promise<MediaView> }) {
  return <PhotosCard tripId={tripId} view={await view} />;
}

type GroupProps = ComponentProps<typeof OverviewGroup>;
type GroupExtras = Pick<GroupProps, "friendStates" | "pendingInvitees" | "declinedInvitees">;

export function PanelPlaceholder() {
  return <div aria-hidden className="h-10 min-w-0 flex-1 rounded-full bg-sheet-2 opacity-80" />;
}

export async function StreamedGroup({
  extras,
  ...props
}: Omit<GroupProps, keyof GroupExtras> & { extras: Promise<GroupExtras> }) {
  return <OverviewGroup {...props} {...await extras} />;
}
