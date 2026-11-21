"use client";

import { useState } from "react";
import { TEXT_CAPS } from "@floc/core/text/text";

import Link from "next/link";

import { Menu } from "@/components/system/client-ui";
import { PlusIcon } from "@/components/system/icons";
import { Button, cx, menuItemClass } from "@/components/system/ui";
import { StartTripModal } from "@/components/onboarding/start/start-trip-modal";
import type { StartPerson } from "@/components/onboarding/start/start-who";

export function NewTripField({ me, people, asked, along }: {
  me: string;
  people: StartPerson[];
  asked: string | null;
  along?: string[];
}) {
  const [name, setName] = useState(asked ?? "");
  const [open, setOpen] = useState(asked !== null);
  const ready = name.trim() !== "";

  return (
    <div className="flex w-full sm:w-[24rem]">
      <form
        className="min-w-0 flex-1"
        onSubmit={(event) => {
          event.preventDefault();
          setOpen(true);
        }}
      >
        <label className="flex h-11 cursor-text items-center gap-3 rounded-l-sm border border-rule-strong bg-sheet px-2.5 transition-colors hover:border-ink-faint has-[input:focus-visible]:outline-2 has-[input:focus-visible]:-outline-offset-1 has-[input:focus-visible]:outline-pen sm:h-[2.375rem]">
          <span className="typed shrink-0 text-ink-2">Name</span>
          <input
            name="name"
            autoComplete="off"
            maxLength={TEXT_CAPS.tripName}
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="h-full min-w-0 flex-1 bg-transparent font-mono text-sm text-ink outline-none"
          />
        </label>
      </form>
      <Button
        type="button"
        variant={ready ? "primary" : "secondary"}
        onClick={() => setOpen(true)}
        className={cx(
          "h-11 shrink-0 whitespace-nowrap rounded-l-none border-l-0 hover:transform-none max-sm:rounded-r-none sm:h-[2.375rem]",
          ready && "hover:shadow-none",
        )}
      >
        <PlusIcon />
        New trip
      </Button>
      <div className="flex sm:hidden">
        <Menu
          label="More on My trips"
          triggerClassName="grid h-11 w-11 place-items-center rounded-r-sm border border-l-0 border-rule-strong bg-sheet text-ink-2 hover:bg-pen-soft hover:text-pen-deep data-[open=true]:bg-pen-soft data-[open=true]:text-pen-deep"
        >
          <Link href="/trips/archived" role="menuitem" className={menuItemClass}>
            Archived
          </Link>
        </Menu>
      </div>
      {open ? <StartTripModal key={name} open onClose={() => setOpen(false)} me={me} people={people} seed={{ name: name.trim(), along }} /> : null}
    </div>
  );
}
