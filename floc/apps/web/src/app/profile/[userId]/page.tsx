import { wantToGoCountries } from "@floc/core/itinerary/travel-map";
import { friendSavedPart } from "@floc/core/people/shared-saves";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { ListingRatesProvider } from "@/components/explore/listing-rates";
import { SavedTripsProvider } from "@/components/explore/save/saved-trips";
import { FriendSaved } from "@/components/lists/friend-saved";
import { StartWishWith } from "@/components/lists/wish/start-wish-with";
import { invitableIdsOf } from "@/server/social/groups";
import { savedTripIds } from "@/server/explore/explore-saves";
import { travelMapFor } from "@/server/itinerary/travel-map";
import { listingRates, viewerCurrency } from "@/server/money/viewer-currency";
import { requireUser } from "@/server/access";
import { formatDateRange } from "@floc/core/dates/dates";
import { friendStateWith } from "@/server/social/friends";
import { requireProfileView } from "@/server/auth/visibility";
import { AccountPage, Panel, PersonRow } from "@/components/auth/account-ui";
import { Avatar, Badge } from "@/components/system/ui";
import { FriendButton } from "@/components/social/friend-button";
import { PersonLink } from "@/components/social/person-link";

export const metadata = { title: "Profile" };

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const viewer = await requireUser(`/profile/${userId}`);

  if (userId === viewer.id) redirect("/profile");

  const [profile, friendState, yourTrips, yourMap, rates, askable] = await Promise.all([
    requireProfileView(userId, viewer.id),
    friendStateWith(viewer.id, userId),
    savedTripIds(viewer.id),
    travelMapFor(viewer.id),
    viewerCurrency(viewer.id, await headers()).then(listingRates),
    invitableIdsOf(viewer.id, [userId]),
  ]);
  const saved = friendSavedPart(profile.saved, profile.travelMap);

  return (
    <AccountPage
      eyebrow={
        profile.relation === "friend" ? "You're friends" : "You've shared a trip"
      }
      title={profile.name}
      actions={
        <FriendButton
          userId={profile.userId}
          name={profile.name}
          state={friendState}
        />
      }
    >
      <Panel className="bg-pastel-yellow text-pastel-yellow-ink">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={profile.name} size={64} />
          <div className="min-w-0">
            <p className="font-display text-2xl font-semibold">{profile.name}</p>
            {profile.isPrivate ? (
              <p className="mt-1 text-sm opacity-75">This profile is private.</p>
            ) : profile.vibeTags?.length ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {profile.vibeTags.map((t) => (
                  <Badge key={t} tone="marine">
                    {t}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </Panel>

      {saved ? (
        <ListingRatesProvider rates={rates}>
          <SavedTripsProvider ids={yourTrips} signedIn>
            {askable.has(userId) ? <StartWishWith friendId={userId} name={profile.name} /> : null}
            <FriendSaved part={saved} yourCountries={wantToGoCountries(yourMap).map((c) => c.code)} />
          </SavedTripsProvider>
        </ListingRatesProvider>
      ) : null}

      {profile.pastTrips ? (
        <Panel
          title="Trips they've been on"
          hint="Ended trips only — nothing still being planned."
        >
          {profile.pastTrips.length === 0 ? (
            <p className="text-sm text-ink-soft">Nothing to show yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {profile.pastTrips.map((t) => (
                <li
                  key={t.id}
                  className="rounded-md bg-sheet-2 px-3 py-2 text-sm"
                >
                  <span className="font-semibold">{t.name}</span>
                  <span className="text-ink-soft">
                    {" · "}
                    <span className="nums">{formatDateRange(t.startDate, t.endDate)}</span>
                    {t.place ? ` · ${t.place}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      ) : null}

      {profile.friends ? (
        <Panel title="Their friends">
          {profile.friends.length === 0 ? (
            <p className="text-sm text-ink-soft">Nobody to show yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {profile.friends.map((f) => (
                <PersonRow key={f.id}>
                  <div className="flex min-w-0 items-center gap-2">
                    {f.state === "friends" ? (
                      <PersonLink
                        userId={f.id}
                        name={f.name}
                      />
                    ) : (
                      <Avatar name={f.name} />
                    )}
                    <span className="min-w-0 truncate text-sm">{f.name}</span>
                  </div>
                  <FriendButton
                    userId={f.id}
                    name={f.name}
                    state={f.state}
                    viaId={profile.userId}
                    compact
                  />
                </PersonRow>
              ))}
            </ul>
          )}
        </Panel>
      ) : null}
    </AccountPage>
  );
}
