"use client";

import { useEffect, useState, type ReactNode } from "react";

import { INVITE_LINK_LIFE } from "@floc/core/trip/group/invite-link";

import { friendsToInvite, inviteFriends } from "@/app/trip/[id]/overview/actions";
import { CopyLink, SubmitButton } from "@/components/system/client-ui";
import { ErrorText, Stack } from "@/components/system/ui";
import { FriendPicker } from "@/components/social/friend-picker";
import type { Person } from "@/server/social/friends";

type Loaded = { friends: Person[] } | { failed: true };

function ShareLinkInstead({ inviteUrl, linkIcon, children }: { inviteUrl: string; linkIcon: ReactNode; children: ReactNode }) {
  return (
    <Stack gap={3}>
      {children}
      <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <CopyLink value={inviteUrl} label="Copy invite link" variant="primary" icon={linkIcon} />
        <span className="text-sm text-ink-soft">{INVITE_LINK_LIFE}</span>
      </span>
    </Stack>
  );
}

export function InviteFriends({
  tripId,
  inviteUrl,
  linkIcon,
  excludeIds,
}: {
  tripId: number;
  inviteUrl: string;
  linkIcon: ReactNode;
  excludeIds: string[];
}) {
  const [loaded, setLoaded] = useState<Loaded>();

  useEffect(() => {
    let live = true;
    friendsToInvite(tripId).then(
      (friends) => {
        if (live) setLoaded({ friends });
      },
      () => {
        if (live) setLoaded({ failed: true });
      },
    );
    return () => {
      live = false;
    };
  }, [tripId]);

  if (loaded && "failed" in loaded) {
    return (
      <ShareLinkInstead inviteUrl={inviteUrl} linkIcon={linkIcon}>
        <ErrorText>Floc could not load your friends. Share the trip link instead.</ErrorText>
      </ShareLinkInstead>
    );
  }
  if (loaded?.friends.length === 0) {
    return (
      <ShareLinkInstead inviteUrl={inviteUrl} linkIcon={linkIcon}>
        <p className="text-sm text-ink-soft">You have no friends on Floc yet. Share the trip link instead.</p>
      </ShareLinkInstead>
    );
  }
  return (
    <form action={inviteFriends}>
      <input type="hidden" name="tripId" value={tripId} />
      <Stack gap={3}>
        {loaded ? (
          <FriendPicker
            friends={loaded.friends}
            excludeIds={excludeIds}
            emptyNote="Everyone you're friends with is already on this trip, or has been asked."
          />
        ) : (
          <p role="status" className="flex min-h-11 items-center text-sm text-ink-soft">Loading friends…</p>
        )}
        <span className="flex flex-wrap items-center justify-end gap-2">
          <span className="mr-auto text-sm text-ink-soft max-sm:basis-full">{INVITE_LINK_LIFE}</span>
          <CopyLink value={inviteUrl} label="Copy link" icon={linkIcon} />
          <SubmitButton disabled={!loaded}>Send invites</SubmitButton>
        </span>
      </Stack>
    </form>
  );
}
