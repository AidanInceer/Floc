"use client";

import { firstName } from "@floc/core/people/group-ticks";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { startWishListWithAction } from "@/app/lists/wish/actions";
import { PlusIcon } from "@/components/system/icons";
import { Button, ErrorText, busyMark } from "@/components/system/ui";

/** On a friend's Saved part (#623): a wish list with them, filled with what you both saved. They get an invite. */
export function StartWishWith({ friendId, name }: { friendId: string; name: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();
  const go = () =>
    start(async () => {
      const outcome = await startWishListWithAction(friendId);
      if (outcome.error) setError(outcome.error);
      else if (outcome.id) router.push(`/lists/wish/${outcome.id}`);
    });
  return (
    <div className="mb-4 flex flex-col items-start gap-1">
      <Button variant="secondary" disabled={pending} onClick={go}>
        <PlusIcon />
        Start a wish list with {firstName(name)}
        {busyMark(pending)}
      </Button>
      <ErrorText>{error}</ErrorText>
    </div>
  );
}
