"use client";

import { peopleCount } from "@floc/core/people/group-ticks";
import { useMemo, useState, useTransition, type ReactNode } from "react";

import type { WishOutcome } from "@/app/lists/wish/actions";
import { GroupPeoplePicker } from "@/components/social/groups/group-people-picker";
import { DIALOG } from "@/components/social/groups/group-sheet";
import { PastTripRows, tripsWithPeople } from "@/components/social/groups/past-trip-rows";
import { Dialog, DialogClose } from "@/components/system/dialog";
import { AvatarRow, Button, ErrorText, SheetFooter, busyMark, cx, panelBandClass, segmentTrack } from "@/components/system/ui";
import type { Person } from "@/server/social/friends";
import type { Group, PastTrip } from "@/server/social/groups";

export type PeopleSources = { friends: Person[]; groups: Group[]; pastTrips: PastTrip[] };

const ROW =
  "flex w-full items-center gap-3 rounded-sm px-2.5 py-2 text-left transition-colors hover:bg-pen-soft hover:text-pen-deep";
const SOURCES = [["friends", "Friends"], ["groups", "Groups"], ["trips", "Past trips"]] as const;
type Source = (typeof SOURCES)[number][0];

/**
 * Who to ask onto a wish list (#623, ADR-049): friends one by one, or everyone in a named group or a past trip at once.
 * A group or trip only ticks its people; nothing links back to it, so a named group stays private (#545).
 */
export function PeopleChooser({ title, verb, sources, exclude, onPick, onClose }: {
  title: string;
  verb: string;
  sources: PeopleSources;
  exclude: ReadonlySet<string>;
  onPick: (ids: string[]) => Promise<WishOutcome>;
  onClose: () => void;
}) {
  const [source, setSource] = useState<Source>("friends");
  const [ticked, setTicked] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const known = useMemo(() => {
    const map = new Map<string, Person>();
    for (const p of [...sources.friends, ...sources.groups.flatMap((g) => g.members), ...sources.pastTrips.flatMap((t) => t.people)]) map.set(p.id, p);
    return map;
  }, [sources]);
  const open = (people: Person[]) => people.filter((p) => !exclude.has(p.id));
  const friendIds = new Set(sources.friends.map((f) => f.id));
  const toggle = (id: string) => setTicked((now) => { const next = new Set(now); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const addAll = (people: Person[]) => setTicked((now) => new Set([...now, ...open(people).map((p) => p.id)]));
  const chosen = [...ticked].flatMap((id) => known.get(id) ?? []);
  const submit = () => {
    setError(undefined);
    start(async () => {
      const outcome = await onPick([...ticked]);
      if (outcome.error) setError(outcome.error);
    });
  };

  return (
    <Dialog open onClose={onClose} title={title} className={DIALOG}>
      <header className="flex items-center justify-between border-b border-dotted border-rule-strong px-4 py-3">
        <h2 className="font-display text-base font-semibold">{title}</h2>
        <DialogClose />
      </header>
      <div className={cx(panelBandClass, "flex h-[min(22rem,56dvh)] flex-col border-t-0")}>
        <div role="group" aria-label="People" className={cx(segmentTrack, "mb-3 flex shrink-0 gap-1")}>
          {SOURCES.map(([id, label]) => (
            <SourceTab key={id} on={source === id} onClick={() => setSource(id)}>{label}</SourceTab>
          ))}
        </div>
        <div className="scroll-thin min-h-0 overflow-y-auto">
          {source === "friends" ? (
            open(sources.friends).length ? (
              <GroupPeoplePicker people={open(sources.friends)} ticked={ticked} onToggle={toggle} isFriend={(id) => friendIds.has(id)} />
            ) : <p className="text-sm text-ink-soft">No friends to add.</p>
          ) : source === "groups" ? (
            <GroupRows groups={sources.groups} onPick={(g) => addAll(g.members)} />
          ) : (
            <PastTripRows trips={tripsWithPeople(sources.pastTrips)} onPick={(t) => addAll(t.people)} />
          )}
        </div>
      </div>
      {chosen.length ? (
        <div className={cx(panelBandClass, "flex items-center gap-2")}>
          <AvatarRow people={chosen} size={24} max={6} />
          <span className="font-mono text-xs text-ink-soft">{peopleCount(chosen.length)}</span>
        </div>
      ) : null}
      <div className="px-5 max-sm:px-4"><ErrorText>{error}</ErrorText></div>
      <SheetFooter>
        <Button variant="primary" disabled={pending} onClick={submit}>{verb}{busyMark(pending)}</Button>
      </SheetFooter>
    </Dialog>
  );
}

function GroupRows({ groups, onPick }: { groups: Group[]; onPick: (group: Group) => void }) {
  const withPeople = groups.filter((g) => g.members.length > 0);
  if (withPeople.length === 0) return <p className="text-sm text-ink-soft">No groups yet.</p>;
  return (
    <ul className="flex flex-col gap-0.5">
      {withPeople.map((group) => (
        <li key={group.id}>
          <button type="button" onClick={() => onPick(group)} className={ROW}>
            <span className="flex min-w-0 flex-1 flex-col leading-tight">
              <span className="truncate text-sm font-semibold">{group.name}</span>
              <span className="nums mt-0.5 font-mono text-xs text-ink-soft">{peopleCount(group.members.length)}</span>
            </span>
            <AvatarRow people={group.members} size={22} max={5} />
          </button>
        </li>
      ))}
    </ul>
  );
}

function SourceTab({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cx("flex min-h-9 flex-1 items-center justify-center rounded-sm px-3 text-sm font-medium", on ? "bg-pen-soft text-pen-deep" : "text-ink-soft hover:bg-pen-soft hover:text-pen-deep")}
    >
      {children}
    </button>
  );
}
