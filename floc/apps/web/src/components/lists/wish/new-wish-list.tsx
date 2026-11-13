"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createWishListAction } from "@/app/lists/wish/actions";
import { PlusIcon } from "@/components/system/icons";
import { Button } from "@/components/system/ui";

import { PeopleChooser, type PeopleSources } from "./people-chooser";

const NOBODY: ReadonlySet<string> = new Set();

/** New wish list: pick who to ask, then land on the new list. Everyone picked gets an invite to accept (ADR-049). */
export function NewWishList({ sources, variant = "primary" }: { sources: PeopleSources; variant?: "primary" | "secondary" }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)}>
        <PlusIcon />
        New wish list
      </Button>
      {open ? (
        <PeopleChooser
          title="New wish list"
          verb="Create wish list"
          sources={sources}
          exclude={NOBODY}
          onClose={() => setOpen(false)}
          onPick={async (ids) => {
            const outcome = await createWishListAction(ids);
            if (outcome.id) router.push(`/lists/wish/${outcome.id}`);
            return outcome;
          }}
        />
      ) : null}
    </>
  );
}
