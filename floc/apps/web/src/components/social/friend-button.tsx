/**
 * "Add as friend", wherever you're already looking at the person (ticket 96) —
 * their profile, or their row in a trip you share.
 *
 * One component for both surfaces because the states are the same four either
 * way, and a control that says "add" to someone who already asked *you* is the
 * bug this shape exists to avoid: `friendship` is one row per direction, so a
 * pending request means different things at its two ends.
 *
 * `compact` is the roster's dressing — an icon-sized button on a row that
 * already carries a bell and a boot — not a different control.
 */
import {
  acceptFriend,
  cancelRequest,
  declineFriend,
  requestFriendById,
} from "@/app/friends/actions";
import { Badge } from "@/components/system/ui";
import { ActionForm, SubmitButton } from "@/components/system/client-ui";
import type { FriendState } from "@/server/social/friends";

export function FriendButton({
  userId,
  name,
  state,
  compact,
  viaId,
}: {
  userId: string;
  name: string;
  state: FriendState;
  compact?: boolean;
  /**
   * Whose friends list this row was found on (ticket 145). Only the "add"
   * branch carries it, and only as a claim — the action re-derives the chain.
   */
  viaId?: string;
}) {
  if (state === "friends") {
    // Nothing to do here — removing a friend stays on /friends, where you can
    // see what you're removing.
    return compact ? null : <Badge tone="agreed">Friends</Badge>;
  }

  if (state === "incoming") {
    return (
      <span className="flex items-center gap-2">
        <form action={acceptFriend}>
          <input type="hidden" name="requesterId" value={userId} />
          <SubmitButton variant="primary" pendingLabel="Accepting…">
            {compact ? "Accept" : `Accept ${firstName(name)}'s request`}
          </SubmitButton>
        </form>
        {compact ? null : (
          <form action={declineFriend}>
            <input type="hidden" name="requesterId" value={userId} />
            <SubmitButton variant="ghost" pendingLabel="Declining…">
              Decline
            </SubmitButton>
          </form>
        )}
      </span>
    );
  }

  if (state === "outgoing") {
    return (
      <form action={cancelRequest}>
        <input type="hidden" name="targetId" value={userId} />
        <SubmitButton variant="ghost" pendingLabel="Cancelling…">
          {compact ? "Requested" : "Requested — cancel"}
        </SubmitButton>
      </form>
    );
  }

  return (
    // ActionForm, not a plain form: this is the one branch whose action can
    // hand back a readable error rather than just redirecting.
    <ActionForm action={requestFriendById}>
      <input type="hidden" name="targetId" value={userId} />
      {viaId ? <input type="hidden" name="viaId" value={viaId} /> : null}
      <SubmitButton variant="secondary" pendingLabel="Sending…">
        {compact ? "Add" : "Add as friend"}
      </SubmitButton>
    </ActionForm>
  );
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}
