"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { respondToWishInviteAction } from "@/app/lists/wish/actions";
import { Avatar, Button, busyMark } from "@/components/system/ui";
import type { WishInvite } from "@/server/wish-lists/wish-lists";

/** Invites waiting on you (#623): the list stays shut until you accept (ADR-049). Drawn like a trip invite on My trips. */
export function WishInvites({ invites }: { invites: WishInvite[] }) {
  return (
    <ul className="mb-6 grid gap-3" aria-label="Invites">
      {invites.map((invite) => <InviteRow key={invite.id} invite={invite} />)}
    </ul>
  );
}

function InviteRow({ invite }: { invite: WishInvite }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const answer = (accept: boolean) =>
    start(async () => {
      const outcome = await respondToWishInviteAction(invite.id, accept);
      if (outcome.id) router.push(`/lists/wish/${outcome.id}`);
    });
  const from = invite.from?.name ?? "Someone";
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-pastel-blue-edge bg-pastel-blue px-4 py-3 text-ink">
      <div className="flex min-w-0 items-center gap-2.5">
        <Avatar name={from} />
        <p className="min-w-0 text-sm">
          <strong>{from}</strong> invited you to <strong>{invite.title}</strong>
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="primary" disabled={pending} onClick={() => answer(true)}>Join{busyMark(pending)}</Button>
        <Button variant="ghost" disabled={pending} onClick={() => answer(false)}>Decline</Button>
      </div>
    </li>
  );
}
