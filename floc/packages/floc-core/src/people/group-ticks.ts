/** Group ticks and person ticks are one state (#545): a group is ticked when all its people are. */
import { goingNames } from "../trip/overview/going";

export type GroupTick = "all" | "some" | "none";

export const GROUP_CAP = 20;
export const GROUP_NAME_CAP = 60;
export const TRIP_INVITE_CAP = 100;

export type TripPeopleSelection = {
  ticked: ReadonlySet<string>;
  groups: ReadonlySet<number>;
};

export function toggleTripPeople(selection: TripPeopleSelection, ids: string[], groupId?: number): TripPeopleSelection {
  const ticked = toggleGroup(selection.ticked, ids, TRIP_INVITE_CAP);
  if (groupId === undefined) return { ...selection, ticked };
  const groups = new Set(selection.groups);
  if (groupTick(ids, ticked) === "none") groups.delete(groupId);
  else groups.add(groupId);
  return { ticked, groups };
}

export function groupTick(memberIds: readonly string[], ticked: ReadonlySet<string>): GroupTick {
  const on = memberIds.filter((id) => ticked.has(id)).length;
  if (on === 0) return "none";
  return on === memberIds.length ? "all" : "some";
}

export function toggleGroup(
  ticked: ReadonlySet<string>,
  memberIds: readonly string[],
  cap: number = Number.POSITIVE_INFINITY,
): Set<string> {
  const next = new Set(ticked);
  if (groupTick(memberIds, ticked) === "all") {
    for (const id of memberIds) next.delete(id);
    return next;
  }
  for (const id of memberIds) {
    if (next.size >= cap) break;
    next.add(id);
  }
  return next;
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? "";
}

export function firstNames(names: readonly string[]): string {
  return goingNames(names.map(firstName));
}

export function peopleCount(n: number): string {
  return n === 1 ? "1 person" : `${n} people`;
}
