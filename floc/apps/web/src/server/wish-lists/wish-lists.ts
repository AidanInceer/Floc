/**
 * Wish lists, read side (#623, ADR-049). Only an accepted member reads a list; an invitee sees its name and who
 * asked, nothing more; anyone else gets null, the same as for a list that never existed (rule 5 spirit).
 */
import "server-only";

import { wishListTitle, type WishItemKind, type WishMemberStatus } from "@floc/core/lists/wish-list";
import { and, count, desc, eq, inArray, isNull } from "drizzle-orm";

import { db } from "@/db";
import { wishList, wishListItem, wishListMember } from "@/db/schema";
import { bounded, LIMITS } from "@/server/limits";
import { peopleByIds, type Person } from "@/server/social/friends";
import { invitableIdsOf } from "@/server/social/groups";

export type WishItem = {
  id: number;
  kind: WishItemKind;
  presetId: string | null;
  countryCode: string | null;
  text: string | null;
  url: string | null;
  label: string | null;
  addedBy: Person | null;
};

export type WishListView = {
  id: number;
  name: string | null;
  title: string;
  /** Accepted members, you included. */
  members: Person[];
  invited: Person[];
  items: WishItem[];
};

export type WishListRow = { id: number; title: string; people: Person[]; itemCount: number };
export type WishInvite = { id: number; title: string; from: Person | null };

type Seat = { listId: number; userId: string; status: WishMemberStatus; invitedBy: string | null };

const byName = (a: Person, b: Person) => a.name.localeCompare(b.name, "en-GB", { sensitivity: "base" });

function liveSeat(listId: number, userId: string) {
  return and(eq(wishListMember.listId, listId), eq(wishListMember.userId, userId), isNull(wishListMember.deletedAt));
}

/** Your seat on a live list, or null. The one gate every read and write goes through. */
export async function seatOn(userId: string, listId: number, reader: Pick<typeof db, "select"> = db): Promise<WishMemberStatus | null> {
  if (!Number.isSafeInteger(listId) || listId <= 0) return null;
  const row = await reader
    .select({ status: wishListMember.status })
    .from(wishListMember)
    .innerJoin(wishList, eq(wishList.id, wishListMember.listId))
    .where(and(liveSeat(listId, userId), isNull(wishList.deletedAt)))
    .get();
  return row?.status ?? null;
}

async function seatsOn(listIds: number[]): Promise<Seat[]> {
  if (listIds.length === 0) return [];
  const rows = await db
    .select({
      listId: wishListMember.listId,
      userId: wishListMember.userId,
      status: wishListMember.status,
      invitedBy: wishListMember.invitedBy,
    })
    .from(wishListMember)
    .where(and(inArray(wishListMember.listId, listIds), isNull(wishListMember.deletedAt)))
    .orderBy(wishListMember.id)
    .limit(listIds.length * LIMITS.wishListMembers)
    .all();
  return rows;
}

const othersAccepted = (seats: Seat[], listId: number, viewerId: string) =>
  seats.filter((s) => s.listId === listId && s.status === "accepted" && s.userId !== viewerId);

/** Your lists, last changed first, and the invites waiting on you. */
export async function listWishListsFor(userId: string): Promise<{ lists: WishListRow[]; invites: WishInvite[] }> {
  const mine = bounded(
    await db
      .select({ id: wishList.id, name: wishList.name, status: wishListMember.status, invitedBy: wishListMember.invitedBy })
      .from(wishListMember)
      .innerJoin(wishList, eq(wishList.id, wishListMember.listId))
      .where(and(eq(wishListMember.userId, userId), isNull(wishListMember.deletedAt), isNull(wishList.deletedAt)))
      .orderBy(desc(wishList.lastModifiedAt), desc(wishList.id))
      .limit(LIMITS.wishLists)
      .all(),
    "wishLists",
    "wishListsFor",
  );
  if (mine.length === 0) return { lists: [], invites: [] };

  const ids = mine.map((l) => l.id);
  const accepted = mine.filter((l) => l.status === "accepted").map((l) => l.id);
  const [seats, counts] = await Promise.all([
    seatsOn(ids),
    accepted.length
      ? db
          .select({ listId: wishListItem.listId, n: count() })
          .from(wishListItem)
          .where(and(inArray(wishListItem.listId, accepted), isNull(wishListItem.deletedAt)))
          .groupBy(wishListItem.listId)
          .all()
      : Promise.resolve([]),
  ]);
  const people = await peopleByIds([...new Set([...seats.map((s) => s.userId), ...mine.flatMap((l) => l.invitedBy ?? [])])]);
  const personOf = (id: string) => people.get(id);
  const named = (seatsFor: Seat[]) => seatsFor.map((s) => personOf(s.userId)).filter((p): p is Person => !!p);

  const lists: WishListRow[] = [];
  const invites: WishInvite[] = [];
  for (const list of mine) {
    const others = named(othersAccepted(seats, list.id, userId));
    // Why: named after everyone else on it, invited too, so the maker and an invitee see the same name.
    const everyone = named(seats.filter((s) => s.listId === list.id && s.userId !== userId));
    const title = wishListTitle(list.name, everyone.map((p) => p.name));
    if (list.status === "invited") {
      invites.push({ id: list.id, title, from: list.invitedBy ? (personOf(list.invitedBy) ?? null) : null });
    } else {
      lists.push({ id: list.id, title, people: others, itemCount: counts.find((c) => c.listId === list.id)?.n ?? 0 });
    }
  }
  return { lists, invites };
}

/** One list, for an accepted member only. */
export async function wishListFor(userId: string, listId: number): Promise<WishListView | null> {
  if ((await seatOn(userId, listId)) !== "accepted") return null;
  const [list, seats, items] = await Promise.all([
    db.select({ name: wishList.name }).from(wishList).where(eq(wishList.id, listId)).get(),
    seatsOn([listId]),
    db
      .select()
      .from(wishListItem)
      .where(and(eq(wishListItem.listId, listId), isNull(wishListItem.deletedAt)))
      .orderBy(desc(wishListItem.createdAt), desc(wishListItem.id))
      .limit(LIMITS.wishListItems)
      .all(),
  ]);
  const people = await peopleByIds([...new Set([...seats.map((s) => s.userId), ...items.flatMap((i) => i.addedBy ?? [])])]);
  const named = (status: WishMemberStatus) =>
    seats
      .filter((s) => s.status === status)
      .map((s) => people.get(s.userId))
      .filter((p): p is Person => !!p);
  const members = named("accepted").sort(byName);
  const name = list?.name ?? null;
  return {
    id: listId,
    name,
    title: wishListTitle(name, [...members, ...named("invited")].filter((m) => m.id !== userId).map((m) => m.name)),
    members,
    invited: named("invited").sort(byName),
    items: items.map((i) => ({
      id: i.id,
      kind: i.kind,
      presetId: i.presetId,
      countryCode: i.countryCode,
      text: i.text,
      url: i.url,
      label: i.label,
      addedBy: i.addedBy ? (people.get(i.addedBy) ?? null) : null,
    })),
  };
}

/** Start trip from a list: its other accepted members you can still ask. Nobody, if you are not on it. */
export async function wishListPeopleToAsk(userId: string, listId: number): Promise<Person[]> {
  if ((await seatOn(userId, listId)) !== "accepted") return [];
  const others = othersAccepted(await seatsOn([listId]), listId, userId).map((s) => s.userId);
  const invitable = await invitableIdsOf(userId, others);
  const people = await peopleByIds(others.filter((id) => invitable.has(id)));
  return [...people.values()].sort(byName);
}
