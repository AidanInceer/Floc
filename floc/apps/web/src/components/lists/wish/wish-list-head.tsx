"use client";

import { WISH_CAPS } from "@floc/core/lists/wish-list";
import { peopleCount } from "@floc/core/people/group-ticks";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { inviteToWishListAction, leaveWishListAction, renameWishListAction } from "@/app/lists/wish/actions";
import { ConfirmSubmit, Menu } from "@/components/system/client-ui";
import { PlusIcon } from "@/components/system/icons";
import { AvatarRow, Button, ErrorText, Input, menuDangerItemClass, menuItemClass } from "@/components/system/ui";
import type { Person } from "@/server/social/friends";

import { PeopleChooser, type PeopleSources } from "./people-chooser";

type Head = { id: number; name: string | null; title: string; members: Person[]; invited: Person[] };

/**
 * The top of one wish list (#623): its name, who is on it and who is asked, Invite, and a menu to rename or leave.
 * Every member may do all of it (ADR-049); nobody can remove someone else.
 */
export function WishListHead({ list, sources }: { list: Head; sources: PeopleSources }) {
  const router = useRouter();
  const [renaming, setRenaming] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string>();
  const [, start] = useTransition();
  const onList = new Set([...list.members, ...list.invited].map((p) => p.id));

  const rename = (form: FormData) =>
    start(async () => {
      const outcome = await renameWishListAction(list.id, String(form.get("name") ?? ""));
      if (outcome.error) setError(outcome.error);
      else setRenaming(false);
    });
  const leave = async () => {
    await leaveWishListAction(list.id);
    router.push("/lists/wish");
  };

  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
      <div className="min-w-0 flex-1">
        {renaming ? (
          <form action={rename} className="flex max-w-md gap-2">
            <Input name="name" aria-label="Name" defaultValue={list.name ?? ""} maxLength={WISH_CAPS.name} autoFocus />
            <Button type="submit" variant="primary">Save</Button>
            <Button type="button" variant="ghost" onClick={() => setRenaming(false)}>Cancel</Button>
          </form>
        ) : (
          <h1 className="font-display text-2xl font-semibold leading-tight tracking-[-0.025em] [overflow-wrap:anywhere]">{list.title}</h1>
        )}
        <ErrorText>{error}</ErrorText>
        <div className="mt-2 flex flex-wrap items-center gap-2.5">
          <AvatarRow people={list.members} size={26} max={6} />
          {list.invited.length ? (
            <span className="nums font-mono text-xs text-ink-soft" title={list.invited.map((p) => p.name).join(", ")}>
              {peopleCount(list.invited.length)} asked
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={() => setInviting(true)}>
          <PlusIcon />
          Invite
        </Button>
        <Menu label="Wish list options">
          <button type="button" className={menuItemClass} onClick={() => setRenaming(true)}>Rename</button>
          <form action={leave}>
            <ConfirmSubmit
              variant="ghost"
              confirmVariant="danger"
              className={menuDangerItemClass}
              message={list.members.length > 1 ? "Leave this wish list? The others keep it." : "Leave this wish list? You are the last one on it, so it goes."}
              confirmLabel="Leave wish list"
            >
              Leave
            </ConfirmSubmit>
          </form>
        </Menu>
      </div>
      {inviting ? (
        <PeopleChooser
          title="Invite to this wish list"
          verb="Send invites"
          sources={sources}
          exclude={onList}
          onClose={() => setInviting(false)}
          onPick={async (ids) => {
            const outcome = await inviteToWishListAction(list.id, ids);
            if (!outcome.error) setInviting(false);
            return outcome;
          }}
        />
      ) : null}
    </header>
  );
}
