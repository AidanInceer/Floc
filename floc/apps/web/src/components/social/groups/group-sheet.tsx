"use client";

import { useMemo, useRef, useState, useTransition, type ReactNode } from "react";

import { GROUP_CAP, GROUP_NAME_CAP, firstName, peopleCount } from "@floc/core/people/group-ticks";

import { createGroupAction, saveGroupAction } from "@/app/friends/actions";
import { Dialog, DialogClose } from "@/components/system/dialog";
import { ChevronIcon } from "@/components/system/icons";
import {
  Avatar,
  Button,
  ErrorText,
  SheetFooter,
  busyMark,
  cx,
  panelBandClass,
  panelFieldClass,
  panelTitleClass,
  segmentTrack,
} from "@/components/system/ui";
import type { Person } from "@/server/social/friends";
import type { Group, PastTrip } from "@/server/social/groups";

import { useGroupData } from "./group-data";
import { GroupPeoplePicker, peopleWithTicked } from "./group-people-picker";
import { PastTripRows, tripsWithPeople } from "./past-trip-rows";

export const DIALOG =
  "m-auto max-h-[calc(100dvh-48px)] w-full max-w-lg overflow-y-auto rounded-md border border-rule bg-sheet p-0 text-ink shadow-lifted backdrop:bg-black/40 max-sm:mb-0 max-sm:max-h-[92dvh] max-sm:max-w-full max-sm:rounded-b-none";

const TAB = "rounded-sm px-2 py-1.5 text-sm font-medium transition-colors sm:px-4";
const TAB_ON = "bg-pen-soft text-pen-deep";
const TAB_OFF = "text-ink-soft hover:bg-pen-soft hover:text-pen-deep";

export type GroupSheetMode = { kind: "new"; ticked: string[] } | { kind: "edit"; group: Group };

function useGroupSheet(mode: GroupSheetMode) {
  const { friends, pastTrips, isFriend } = useGroupData();
  const start = mode.kind === "new" ? mode.ticked : mode.group.members.map((m) => m.id);
  const [ticked, setTicked] = useState<Set<string>>(() => new Set(start));
  const [name, setName] = useState(mode.kind === "edit" ? mode.group.name : "");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const bodyRef = useRef<HTMLDivElement>(null);

  const known = useMemo(() => {
    const map = new Map<string, Person>();
    for (const p of friends) map.set(p.id, p);
    for (const trip of pastTrips) for (const p of trip.people) map.set(p.id, p);
    if (mode.kind === "edit") for (const p of mode.group.members) map.set(p.id, p);
    return map;
  }, [friends, pastTrips, mode]);

  const toggle = (id: string) =>
    setTicked((now) => {
      const next = new Set(now);
      if (next.has(id)) next.delete(id);
      else if (next.size < GROUP_CAP) next.add(id);
      return next;
    });

  const addTrip = (trip: PastTrip) =>
    setTicked((now) => {
      const next = new Set(now);
      for (const p of trip.people) if (next.size < GROUP_CAP) next.add(p.id);
      return next;
    });

  const submit = () => {
    setError(undefined);
    const input = { name: name.trim(), memberIds: [...ticked] };
    startTransition(async () => {
      const outcome =
        mode.kind === "new" ? await createGroupAction(input) : await saveGroupAction(mode.group.id, input);
      if (outcome.error) setError(outcome.error);
      else bodyRef.current?.closest("dialog")?.close();
    });
  };

  return {
    ticked,
    toggle,
    addTrip,
    name,
    setName,
    error,
    pending,
    submit,
    bodyRef,
    people: peopleWithTicked(friends, ticked, known),
    trips: tripsWithPeople(pastTrips),
    isFriend,
    tickedPeople: [...ticked].map((id) => known.get(id)).filter((p): p is Person => !!p),
  };
}

type Sheet = ReturnType<typeof useGroupSheet>;

export function GroupSheet({ mode, onClose }: { mode: GroupSheetMode; onClose: () => void }) {
  const sheet = useGroupSheet(mode);
  const [step, setStep] = useState<1 | 2>(1);
  const title = mode.kind === "new" ? "New group" : "Edit group";
  const stepLine = step === 1 ? "1 of 2 · Who is in it" : "2 of 2 · Name it";
  return (
    <Dialog open onClose={onClose} title={title} className={DIALOG}>
      <div ref={sheet.bodyRef}>
        <header className="flex items-center justify-between border-b border-dotted border-rule-strong px-4 py-3">
          <div className="flex flex-col">
            <h2 className="font-display text-base font-semibold">{title}</h2>
            {mode.kind === "new" ? <span className="font-mono text-xs text-ink-soft">{stepLine}</span> : null}
          </div>
          <DialogClose />
        </header>
        {mode.kind === "edit" ? (
          <EditGroupBody sheet={sheet} />
        ) : (
          <NewGroupSteps sheet={sheet} step={step} setStep={setStep} />
        )}
      </div>
    </Dialog>
  );
}

function NewGroupSteps({ sheet, step, setStep }: { sheet: Sheet; step: 1 | 2; setStep: (s: 1 | 2) => void }) {
  const [source, setSource] = useState<"friends" | "trips">("friends");
  const count = `${sheet.ticked.size} of ${GROUP_CAP}`;
  if (step === 2) {
    return (
      <>
        <NameField sheet={sheet} />
        <div className={panelBandClass}>
          <ul className="flex flex-wrap gap-3">
            {sheet.tickedPeople.map((p) => (
              <li key={p.id} className="flex w-12 flex-col items-center gap-1">
                <Avatar name={p.name} size={30} />
                <span className="w-full truncate text-center text-xs text-ink-soft">{firstName(p.name)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 font-mono text-xs text-ink-soft">{peopleCount(sheet.ticked.size)}</p>
          <ErrorText>{sheet.error}</ErrorText>
        </div>
        <SheetFooter note={count}>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button variant="primary" disabled={sheet.pending || !sheet.name.trim()} onClick={sheet.submit}>
              Create group{busyMark(sheet.pending)}
            </Button>
          </div>
        </SheetFooter>
      </>
    );
  }
  return (
    <>
      <div className={cx(panelBandClass, "flex h-[min(20rem,52dvh)] flex-col border-t-0")}>
        <div className={cx(segmentTrack, "mb-3 flex w-fit shrink-0 items-center gap-1")}>
          <SourceTab on={source === "friends"} onClick={() => setSource("friends")}>
            Pick friends
          </SourceTab>
          <SourceTab on={source === "trips"} onClick={() => setSource("trips")}>
            From a past trip
          </SourceTab>
        </div>
        {sheet.ticked.size >= GROUP_CAP ? (
          <p className="mb-2 text-xs text-ink-soft">A group holds {GROUP_CAP} people at most.</p>
        ) : null}
        <div className="scroll-thin min-h-0 overflow-y-auto">
          {source === "trips" ? (
          <PastTripRows
            trips={sheet.trips}
            onPick={(trip) => {
              sheet.addTrip(trip);
              setStep(2);
            }}
          />
        ) : (
          <GroupPeoplePicker
            people={sheet.people}
            ticked={sheet.ticked}
            onToggle={sheet.toggle}
            isFriend={sheet.isFriend}
          />
          )}
        </div>
      </div>
      <SheetFooter note={count}>
        <Button variant="primary" disabled={sheet.ticked.size === 0} onClick={() => setStep(2)}>
          Next
        </Button>
      </SheetFooter>
    </>
  );
}

function EditGroupBody({ sheet }: { sheet: Sheet }) {
  const [tripsOpen, setTripsOpen] = useState(false);
  return (
    <>
      <NameField sheet={sheet} />
      <div className={panelBandClass}>
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className={panelTitleClass}>People</span>
          {sheet.trips.length > 0 ? (
            <button
              type="button"
              aria-expanded={tripsOpen}
              onClick={() => setTripsOpen((o) => !o)}
              className="flex items-center gap-1 text-sm text-ink-soft transition-colors hover:text-pen"
            >
              A past trip&rsquo;s people
              <ChevronIcon direction={tripsOpen ? "up" : "down"} />
            </button>
          ) : null}
        </div>
        {tripsOpen ? (
          <div className="mb-3">
            <PastTripRows
              trips={sheet.trips}
              onPick={(trip) => {
                sheet.addTrip(trip);
                setTripsOpen(false);
              }}
            />
          </div>
        ) : null}
        {sheet.ticked.size >= GROUP_CAP ? (
          <p className="mb-2 text-xs text-ink-soft">A group holds {GROUP_CAP} people at most.</p>
        ) : null}
        <GroupPeoplePicker
          people={sheet.people}
          ticked={sheet.ticked}
          onToggle={sheet.toggle}
          isFriend={sheet.isFriend}
        />
        <ErrorText>{sheet.error}</ErrorText>
      </div>
      <SheetFooter note={`${sheet.ticked.size} of ${GROUP_CAP}`}>
        <Button variant="primary" disabled={sheet.pending || !sheet.name.trim() || sheet.ticked.size === 0} onClick={sheet.submit}>
          Save group{busyMark(sheet.pending)}
        </Button>
      </SheetFooter>
    </>
  );
}

function NameField({ sheet }: { sheet: Sheet }) {
  return (
    <label className={cx(panelBandClass, "block border-t-0")}>
      <span className={panelTitleClass}>Name</span>
      <input
        required
        value={sheet.name}
        onChange={(e) => sheet.setName(e.target.value)}
        maxLength={GROUP_NAME_CAP}
        className={cx(panelFieldClass, "mt-1.5")}
      />
    </label>
  );
}

function SourceTab({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-current={on || undefined} onClick={onClick} className={cx(TAB, on ? TAB_ON : TAB_OFF)}>
      {children}
    </button>
  );
}
