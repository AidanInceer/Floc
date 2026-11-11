"use client";

import { useRef, useState } from "react";
import { TEXT_CAPS } from "@floc/core/text/text";

import Link from "next/link";

import { Menu, Sheet } from "@/components/system/client-ui";
import { PlusIcon } from "@/components/system/icons";
import { cx, menuItemClass } from "@/components/system/ui";
import { NewTripForm } from "@/components/trip/new-trip-form";
import type { Person } from "@/server/social/friends";
import type { Group } from "@/server/social/groups";

/**
 * The top of My trips: name the trip here, then New trip opens the Start a trip sheet with that name in.
 * The button stays quiet until a name is typed (wireframe trips-head C2).
 */
export function NewTripField({
  action,
  friends,
  groups,
  asked,
}: {
  action: (formData: FormData) => Promise<void>;
  friends: Person[];
  groups: Group[];
  asked: string | null;
}) {
  const [name, setName] = useState(asked ?? "");
  const trigger = useRef<HTMLDivElement>(null);
  const ready = name.trim() !== "";

  return (
    <div className="flex w-full sm:w-[24rem]">
      <form
        className="min-w-0 flex-1"
        onSubmit={(event) => {
          event.preventDefault();
          trigger.current?.querySelector("button")?.click();
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
      <div ref={trigger} className="contents">
        <Sheet
          trigger={
            <>
              <PlusIcon />
              New trip
            </>
          }
          triggerVariant={ready ? "primary" : "secondary"}
          // Why: the button is half of one joined control, so it changes colour on hover and never lifts away from the field.
          triggerClassName={cx(
            "h-11 shrink-0 whitespace-nowrap rounded-l-none border-l-0 hover:transform-none max-sm:rounded-r-none sm:h-[2.375rem]",
            ready && "hover:shadow-none",
          )}
          title="Start a trip"
          body="flush"
          defaultOpen={asked !== null}
        >
          <NewTripForm action={action} friends={friends} groups={groups} name={name.trim()} />
        </Sheet>
      </div>
      {/* Why: on a phone Archived took a row of its own above the field; it joins the control as its last part. */}
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
    </div>
  );
}
