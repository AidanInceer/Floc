/**
 * Someone else's profile (ticket 46) — what a friend or a co-traveller sees
 * when they click your face anywhere on the site.
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

import { requireUser } from "@/lib/access";
import { formatDateRange } from "@/lib/dates";
import { friendStateWith } from "@/lib/friends";
import { requireProfileView } from "@/lib/visibility";
import {
  Avatar,
  Badge,
  Card,
  CardHeader,
  Page,
  PageHeader,
  Stack,
} from "@/components/ui";
import { FriendButton } from "@/components/friend-button";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const viewer = await requireUser(`/profile/${userId}`);

  // Your own face goes to the page you can edit, not to a read-only copy of it.
  if (userId === viewer.id) redirect("/profile");

  const profile = await requireProfileView(userId, viewer.id);
  const friendState = await friendStateWith(viewer.id, userId);

  return (
    <Page>
      <PageHeader
        title={profile.name}
        subtitle={
          profile.relation === "friend"
            ? "You're friends."
            : "You've shared a trip."
        }
        actions={
          <FriendButton
            userId={profile.userId}
            name={profile.name}
            state={friendState}
          />
        }
      />

      <Stack gap={6}>
        <Card>
          <div className="flex flex-wrap items-center gap-4 p-5">
            {/* The floor: name and picture, which anyone inside a ring always
                sees — a fully private profile still shows exactly these two. */}
            <Avatar name={profile.name} src={profile.avatarUrl} size={64} />
            <div className="min-w-0">
              <p className="font-display text-xl font-semibold">{profile.name}</p>
              {profile.isPrivate ? (
                <p className="mt-1 text-sm text-ink-soft">
                  This profile is private.
                </p>
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
        </Card>

        {profile.pastTrips ? (
          <Card>
            <CardHeader
              title="Trips they've been on"
              hint="Ended trips only — nothing still being planned."
            />
            <div className="p-4">
              {profile.pastTrips.length === 0 ? (
                <p className="text-sm text-ink-soft">Nothing to show yet.</p>
              ) : (
                <Stack gap={2}>
                  {profile.pastTrips.map((t) => (
                    // Text, not a link: viewing someone else's trip properly is
                    // its own piece of work (#52/#53).
                    <div key={t.id} className="text-sm">
                      <span className="font-semibold">{t.name}</span>
                      <span className="text-ink-soft">
                        {" · "}
                        {formatDateRange(t.startDate, t.endDate)}
                        {t.place ? ` · ${t.place}` : ""}
                      </span>
                    </div>
                  ))}
                </Stack>
              )}
            </div>
          </Card>
        ) : null}
      </Stack>
    </Page>
  );
}
