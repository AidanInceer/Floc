"use client";

import { useState } from "react";
import { peopleCount, toggleTripPeople, TRIP_INVITE_CAP, type TripPeopleSelection } from "@floc/core/people/group-ticks";
import { TEXT_CAPS } from "@floc/core/text/text";

import { SubmitButton } from "@/components/system/client-ui";
import { AvatarRow, Field, Input, SheetFooter } from "@/components/system/ui";
import type { Person } from "@/server/social/friends";
import type { Group } from "@/server/social/groups";

import { TripPeoplePicker } from "./trips/trip-people-picker";

export function NewTripForm({ action, friends, groups, name = "" }: {
  action: (formData: FormData) => Promise<void>;
  friends: Person[];
  groups: Group[];
  name?: string;
}) {
  const [selection, setSelection] = useState<TripPeopleSelection>(() => ({ ticked: new Set(), groups: new Set() }));
  const { ticked } = selection;
  const known = new Map([...groups.flatMap(({ members }) => members), ...friends].map((person) => [person.id, person]));
  const asked = [...ticked].flatMap((id) => known.get(id) ?? []);
  const toggle = (ids: string[], groupId?: number) => setSelection((now) => toggleTripPeople(now, ids, groupId));
  return (
    <form className="flex min-h-0 flex-1 flex-col" action={action}>
      {asked.map(({ id }) => <input key={id} type="hidden" name="friendIds" value={id} />)}
      {[...selection.groups].map((id) => <input key={id} type="hidden" name="groupIds" value={id} />)}
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
        <div className="p-6">
          <Field label="Name">
            <Input name="name" required maxLength={TEXT_CAPS.tripName} defaultValue={name} />
          </Field>
        </div>
        <div className="border-t border-rule bg-sheet-2 p-6">
          <TripPeoplePicker friends={friends} groups={groups} ticked={ticked} onPerson={(id) => toggle([id])} onGroup={toggle} />
          {asked.length > 0 ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-rule pt-3">
              <AvatarRow people={asked} size={24} max={5} />
              <span className="font-mono text-xs text-ink-soft">{peopleCount(asked.length)}</span>
            </div>
          ) : null}
          {asked.length >= TRIP_INVITE_CAP ? (
            <p className="mt-2 text-xs text-ink-soft">You can invite {TRIP_INVITE_CAP} people at most.</p>
          ) : null}
        </div>
      </div>
      <SheetFooter note={asked.length ? `${peopleCount(asked.length)} asked along` : "Friends can join later"}>
        <SubmitButton>Create trip</SubmitButton>
      </SheetFooter>
    </form>
  );
}
