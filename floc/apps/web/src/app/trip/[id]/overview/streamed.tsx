import type { ComponentProps } from "react";

import { OverviewGroup } from "@/components/trip/overview/overview-group";

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
