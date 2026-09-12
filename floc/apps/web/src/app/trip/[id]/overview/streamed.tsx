import type { ComponentProps, ReactNode } from "react";

import { TripRoster } from "@/components/trip/trip-roster";
import { DocumentsBlock } from "@/components/documents/documents-block";
import { TourSpotlight } from "@/components/tour/tour-spotlight";

type RosterProps = ComponentProps<typeof TripRoster>;
type RosterExtras = Pick<RosterProps, "friendStates" | "pendingInvitees" | "friends">;

export function PanelPlaceholder({ tall }: { tall?: boolean }) {
  return (
    <div
      aria-hidden
      className={`${tall ? "h-64" : "h-40"} rounded-lg bg-sheet opacity-80 ring-1 ring-rule`}
    />
  );
}

export async function StreamedRoster({
  extras,
  ...props
}: Omit<RosterProps, keyof RosterExtras> & { extras: Promise<RosterExtras> }) {
  return <TripRoster {...props} {...await extras} />;
}

export async function StreamedDocuments({
  docs,
  ...props
}: Omit<ComponentProps<typeof DocumentsBlock>, "docs"> & {
  docs: Promise<ComponentProps<typeof DocumentsBlock>["docs"]>;
}) {
  return <DocumentsBlock {...props} docs={await docs} />;
}

// Why: the tour measures its targets on mount, so it waits for the streamed panels it lights.
export async function TourWhenReady({
  targets,
  ...props
}: ComponentProps<typeof TourSpotlight> & { targets: Promise<unknown>[] }): Promise<ReactNode> {
  await Promise.all(targets);
  return <TourSpotlight {...props} />;
}
