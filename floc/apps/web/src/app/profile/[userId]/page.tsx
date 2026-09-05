/**
 * Someone else's profile (ticket 46; redesigned 201) — what a friend or a
 * co-traveller sees when they click your face anywhere on the site.
 *
 * Everything about who may see what is `requireProfileView`'s job, including
 * the 404 a viewer outside every ring gets. This page renders what it's handed
 * and never re-derives a permission: a hidden attribute arrives as `null`, not
 * as a value with a flag beside it.
 *
 * Deliberately absent: email, dietary and home currency (functional
 * attributes, they surface where they do work), and any way into a past trip —
 * that's #52/#53, and the roster would name third parties who never consented
 * to appear here.
 */
import { redirect } from "next/navigation";

import { requireUser } from "@/server/access";
import { formatDateRange } from "@floc/core/dates";
import { friendStateWith } from "@/server/friends";
import { requireProfileView } from "@/server/visibility";
import { AccountPage, Panel, PersonRow } from "@/components/account-ui";
import { Avatar, Badge } from "@/components/ui";
import { FriendButton } from "@/components/friend-button";
import { PersonLink } from "@/components/person-link";
import { TravelMap } from "@/components/travel-map";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const viewer = await requireUser(`/profile/${userId}`);

  // Your own face goes to the page you can edit, not to a read-only copy of it.
  if (userId === viewer.id) redirect("/profile");

  // Independent of each other, so they go out together (ticket 114). The 404
  // for a stranger still comes from `requireProfileView` — it throws, and the
  // other promise is discarded with the render.
  const [profile, friendState] = await Promise.all([
    requireProfileView(userId, viewer.id),
    friendStateWith(viewer.id, userId),
  ]);

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
      {/* The floor: name and picture, which anyone inside a ring always sees —
          a fully private profile still shows exactly these two. */}
      <Panel className="bg-butter text-butter-ink">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={profile.name} src={profile.avatarUrl} size={64} />
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

      {profile.travelMap ? (
        <Panel
          title="Where they've been"
          hint="Countries only — from their trips, plus anything they've marked by hand."
        >
          <TravelMap states={profile.travelMap.states} />
        </Panel>
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
                // Text, not a link: viewing someone else's trip properly is
                // its own piece of work (#52/#53).
                <li
                  key={t.id}
                  className="rounded-md bg-sheet-2 px-3 py-2 text-sm"
                >
                  <span className="font-semibold">{t.name}</span>
                  <span className="text-ink-soft">
                    {" · "}
                    {formatDateRange(t.startDate, t.endDate)}
                    {t.place ? ` · ${t.place}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      ) : null}

      {/* Friends-of-friends (ticket 145). Absent, not empty, when the ring
          shuts the viewer out — a panel saying "hidden" would answer the
          question the ring exists to refuse. */}
      {profile.friends ? (
        <Panel title="Their friends">
          {profile.friends.length === 0 ? (
            <p className="text-sm text-ink-soft">Nobody to show yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {profile.friends.map((f) => (
                <PersonRow key={f.id}>
                  <div className="flex min-w-0 items-center gap-2">
                    {/* A link only where it lands somewhere: anyone the viewer
                        isn't friends with yet may well be outside every ring,
                        and that profile 404s (ticket 46). */}
                    {f.state === "friends" ? (
                      <PersonLink
                        userId={f.id}
                        name={f.name}
                        avatarUrl={f.avatarUrl}
                      />
                    ) : (
                      <Avatar name={f.name} src={f.avatarUrl} />
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
