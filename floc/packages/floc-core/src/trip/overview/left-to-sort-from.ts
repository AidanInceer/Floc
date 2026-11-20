import type { IsoDate } from "../../dates/dates";
import { datesMoment } from "../../dates/dates-moment";
import type { SettleRow } from "../../money/group-settle";
import { leftToSort, type LeftToSort } from "./left-to-sort";
import type { NudgeTargets } from "../nudge/nudge";

export type LeftToSortSource = {
  trip: { startDate: IsoDate | null; endDate: IsoDate | null };
  today: IsoDate;
  viewerId: string;
  members: { userId: string; name: string }[];
  markedUserIds: string[];
  ideas: { mine: boolean }[];
  settle: readonly SettleRow[];
  shared: { label: string; claimed: boolean }[];
  legs: { no: number; placeName: string; arrive: IsoDate; leave: IsoDate; nights: number; stay: unknown; mode: unknown }[];
  nudges?: NudgeTargets | undefined;
};

export function leftToSortFrom(source: LeftToSortSource): LeftToSort {
  const nameOf = new Map(source.members.map((m) => [m.userId, m.name]));
  const owe = source.settle.filter((r) => r.payer === source.viewerId);
  const over = source.trip.endDate !== null && source.today > source.trip.endDate;
  return leftToSort({
    moment: datesMoment(source.trip, source.today),
    today: source.today,
    viewerId: source.viewerId,
    members: source.members,
    markedUserIds: source.markedUserIds,
    ideas: source.ideas,
    owe: owe.map((r) => ({ to: nameOf.get(r.payee) ?? "a former member", amountMinor: r.amountMinor, currency: r.currency })),
    shared: over ? [] : source.shared,
    legs: source.legs.map((l, i) => ({ ...l, hasStay: l.stay !== null, hasTravel: i === 0 || l.mode !== null })),
    ...(source.nudges ? { nudges: source.nudges } : {}),
  });
}
