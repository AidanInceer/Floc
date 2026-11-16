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
  viaId?: string;
}) {
  if (state === "friends") {
    return compact ? null : <Badge tone="agreed">Friends</Badge>;
  }

  if (state === "incoming") {
    return (
      <span className="flex items-center gap-2">
        <form action={acceptFriend}>
          <input type="hidden" name="requesterId" value={userId} />
          <SubmitButton variant="primary">
            {compact ? "Accept" : `Accept ${firstName(name)}'s request`}
          </SubmitButton>
        </form>
        {compact ? null : (
          <form action={declineFriend}>
            <input type="hidden" name="requesterId" value={userId} />
            <SubmitButton variant="ghost">
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
        <SubmitButton variant="ghost">
          {compact ? "Requested" : "Requested — cancel"}
        </SubmitButton>
      </form>
    );
  }

  return (
    <ActionForm action={requestFriendById}>
      <input type="hidden" name="targetId" value={userId} />
      {viaId ? <input type="hidden" name="viaId" value={viaId} /> : null}
      <SubmitButton variant="secondary">
        {compact ? "Add" : "Add as friend"}
      </SubmitButton>
    </ActionForm>
  );
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}
