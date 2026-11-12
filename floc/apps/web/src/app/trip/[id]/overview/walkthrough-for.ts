import type { ComponentProps } from "react";

import type { TripAccess } from "@/server/access";
import { absoluteUrl } from "@/server/auth/email";
import { mintShareToken } from "@/server/trips/invite-link";
import { formatDateRange } from "@floc/core/dates/dates";
import { sortIdeas, type IdeaRow } from "@floc/core/trip/ideas";
import type { WalkthroughDialog } from "@/components/walkthrough/walkthrough-dialog";

/** What the first-trip walkthrough is told about this trip: only facts it already holds. */
export function walkthroughFor(
  { trip, viewer, members }: Pick<TripAccess, "trip" | "viewer" | "members">,
  ideas: IdeaRow[],
  placesSet: boolean,
): ComponentProps<typeof WalkthroughDialog> {
  return {
    trip: {
      id: trip.id,
      name: trip.name,
      joined: trip.createdBy !== viewer.id,
      datesSet: trip.startDate !== null,
      placesSet,
    },
    firstName: viewer.name.split(" ")[0] || viewer.name,
    preview: {
      ideas: sortIdeas(ideas, "votes").slice(0, 3).map((i) => ({ title: i.title, votes: i.votes })),
      dates: trip.startDate ? formatDateRange(trip.startDate, trip.endDate) : null,
      inviteUrl: absoluteUrl(`/invite/${mintShareToken(trip.inviteToken)}`),
      group: members.map((m) => ({ name: m.name, avatarIcon: m.avatarIcon, tone: m.tone })),
    },
  };
}
