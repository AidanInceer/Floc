import "server-only";

import { cache } from "react";

import { getProfile } from "@/server/auth/profile";
import { subscriptionOf } from "@/server/billing/billing";
import { countUnread, listUnseen } from "@/server/notifications/inbox";
import { countIncomingFriendRequests } from "@/server/social/friends";
import { countPendingInvitesFor } from "@/server/trips/invites";

/**
 * Everything the top bar and account menu show, read once per request.
 * Why `cache`: with the `@modal` slot beside `children`, Next renders the root layout a second time as the
 * not-found fallback (its own comment in create-component-tree.js), so without this every request ran these twice.
 */
export const topBarFor = cache(async function topBarFor(userId: string, previewLimit: number) {
  const [inviteCount, friendRequestCount, profile, proRow, notificationCount, latest] =
    await Promise.all([
      countPendingInvitesFor(userId),
      countIncomingFriendRequests(userId),
      getProfile(userId),
      subscriptionOf(userId),
      countUnread(userId),
      listUnseen(userId, previewLimit),
    ]);
  return { inviteCount, friendRequestCount, profile, proRow, notificationCount, latest };
});
