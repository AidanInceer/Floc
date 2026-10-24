import type { IsoDate } from "../../dates/dates";
import { datesMoment } from "../../dates/dates-moment";
import type { SettleRow } from "../../money/group-settle";
import { leftToSort, type Gap } from "./left-to-sort";

export type LeftToSortSource = {
  trip: { startDate: IsoDate | null; endDate: IsoDate | null };
  today: IsoDate;
  viewerId: string;
  members: { userId: string; name: string }[];
  markedUserIds: string[];
  ideas: { mine: boolean }[];
  /** The group's payments as Money shows them to the viewer (#463). */
  settle: readonly SettleRow[];
  shared: { label: string; claimed: boolean }[];
  /** The Overview's legs as `tripLegs` gives them: a stay file or null, and how you arrive (null on the first). */
  legs: { no: number; placeName: string; arrive: IsoDate; leave: IsoDate; nights: number; stay: unknown; mode: unknown }[];
};

/** The facts both surfaces hold, turned into `leftToSort`'s input, so web and phone list the same gaps (#460). */
export function leftToSortFrom(source: LeftToSortSource): { open: Gap[]; sorted: number } {
  const nameOf = new Map(source.members.map((m) => [m.userId, m.name]));
  const owe = source.settle.filter((r) => r.payer === source.viewerId);
  return leftToSort({
    moment: datesMoment(source.trip, source.today),
    today: source.today,
    viewerId: source.viewerId,
    members: source.members,
    markedUserIds: source.markedUserIds,
    ideas: source.ideas,
    owe: owe.map((r) => ({ to: nameOf.get(r.payee) ?? "a former member", amountMinor: r.amountMinor, currency: r.currency })),
    shared: source.shared,
    legs: source.legs.map((l, i) => ({ ...l, hasStay: l.stay !== null, hasTravel: i === 0 || l.mode !== null })),
  });
}
