import type { IsoDate } from "../../dates/dates";
import { datesMoment } from "../../dates/dates-moment";
import { CURRENCIES } from "../../money/currency";
import { ledgerBalances, type LedgerRows } from "../../money/ledger";
import { suggestSettlements } from "../../money/money";
import { yourSettleUp } from "../../money/settle-up";
import { leftToSort, type Gap } from "./left-to-sort";

export type LeftToSortSource = {
  trip: { startDate: IsoDate | null; endDate: IsoDate | null };
  today: IsoDate;
  viewerId: string;
  members: { userId: string; name: string }[];
  markedUserIds: string[];
  ideas: { mine: boolean }[];
  ledger: LedgerRows;
  shared: { label: string; claimed: boolean }[];
  /** The Overview's legs as `tripLegs` gives them: a stay file or null, and how you arrive (null on the first). */
  legs: { no: number; placeName: string; arrive: IsoDate; leave: IsoDate; nights: number; stay: unknown; mode: unknown }[];
};

/** The facts both surfaces hold, turned into `leftToSort`'s input, so web and phone list the same gaps (#460). */
export function leftToSortFrom(source: LeftToSortSource): { open: Gap[]; sorted: number } {
  const balances = ledgerBalances(source.ledger);
  const transfers = CURRENCIES.flatMap((currency) => suggestSettlements(balances[currency]).map((s) => ({ ...s, currency })));
  const nameOf = new Map(source.members.map((m) => [m.userId, m.name]));
  const { owe } = yourSettleUp({ transfers, viewerId: source.viewerId });
  return leftToSort({
    moment: datesMoment(source.trip, source.today),
    today: source.today,
    viewerId: source.viewerId,
    members: source.members,
    markedUserIds: source.markedUserIds,
    ideas: source.ideas,
    owe: owe.map((t) => ({ to: nameOf.get(t.to) ?? "a former member", amountMinor: t.amountMinor, currency: t.currency })),
    shared: source.shared,
    legs: source.legs.map((l, i) => ({ ...l, hasStay: l.stay !== null, hasTravel: i === 0 || l.mode !== null })),
  });
}
