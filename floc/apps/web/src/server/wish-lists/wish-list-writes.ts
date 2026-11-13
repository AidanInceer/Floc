/**
 * Wish lists, write side (#623, ADR-049). Every member is equal: any accepted member adds, removes, renames and
 * invites. Nobody removes a member; the last one out ends the list. Everything is soft-deleted (rule 8).
 */
import "server-only";

import { Refusal } from "@floc/core/errors/refusal";
import { readWishItem, readWishListName, type WishItemInput } from "@floc/core/lists/wish-list";
import { PRESET_TRIPS } from "@floc/core/trip/explore/preset-trips";
import { and, count, eq, isNull, ne } from "drizzle-orm";

import { db } from "@/db";
import { wishList, wishListItem, wishListMember } from "@/db/schema";
import { touch } from "@/server/audit";
import { assertRoom, LIMITS } from "@/server/limits";
import { recordActivity, type Tx } from "@/server/notifications/activity";
import { invitableIdsOf } from "@/server/social/groups";

import { seatOn } from "./wish-lists";

const GONE = "That wish list is gone.";
const STRANGER = "You can only add friends and people on a trip with you.";
const LISTINGS = new Set(PRESET_TRIPS.map((t) => t.id));

async function assertSeat(userId: string, listId: number, want: "accepted" | "invited", reader?: Tx): Promise<void> {
  if ((await seatOn(userId, listId, reader)) !== want) throw new Refusal(GONE, "missing");
}

function liveSeats(listId: number) {
  return and(eq(wishListMember.listId, listId), isNull(wishListMember.deletedAt));
}

async function seatCount(tx: Tx | typeof db, userId: string): Promise<number> {
  const [{ n }] = await tx
    .select({ n: count() })
    .from(wishListMember)
    .innerJoin(wishList, eq(wishList.id, wishListMember.listId))
    .where(and(eq(wishListMember.userId, userId), isNull(wishListMember.deletedAt), isNull(wishList.deletedAt)));
  return n;
}

/** Everyone asked must be someone you could ask onto a trip: a friend or a live co-member, never a guest (ADR-029). */
async function askable(userId: string, ids: string[]): Promise<string[]> {
  const wanted = [...new Set(ids)].filter((id) => id !== userId);
  if (wanted.length === 0) return [];
  const invitable = await invitableIdsOf(userId, wanted);
  if (wanted.some((id) => !invitable.has(id))) throw new Refusal(STRANGER, "forbidden");
  return wanted;
}

function checkedItem(raw: unknown): WishItemInput {
  const item = readWishItem(raw);
  if (!item) {
    const link = !!raw && typeof raw === "object" && (raw as { kind?: unknown }).kind === "link";
    throw new Refusal(link ? "Paste a web address that starts with http or https." : "That cannot go on a wish list.", "invalid");
  }
  if (item.kind === "explore" && !LISTINGS.has(item.presetId)) throw new Refusal("That trip is not on Explore.", "invalid");
  return item;
}

const sameAs = (item: WishItemInput) =>
  item.kind === "explore"
    ? eq(wishListItem.presetId, item.presetId)
    : item.kind === "country"
      ? eq(wishListItem.countryCode, item.code)
      : undefined;

function rowOf(listId: number, addedBy: string, item: WishItemInput) {
  return {
    listId,
    addedBy,
    kind: item.kind,
    presetId: item.kind === "explore" ? item.presetId : null,
    countryCode: item.kind === "country" ? item.code : null,
    text: item.kind === "text" ? item.text : null,
    url: item.kind === "link" ? item.url : null,
    label: item.kind === "link" ? (item.label ?? null) : null,
  };
}

async function sendInvites(tx: Tx, listId: number, fromId: string, toIds: string[]): Promise<void> {
  if (toIds.length === 0) return;
  await tx
    .insert(wishListMember)
    .values(toIds.map((userId) => ({ listId, userId, invitedBy: fromId, status: "invited" as const })))
    .onConflictDoUpdate({
      target: [wishListMember.listId, wishListMember.userId],
      set: { status: "invited", invitedBy: fromId, deletedAt: null, ...touch() },
    });
  await recordActivity(
    tx,
    { kind: "wish_list_invited", tripId: null, actorId: fromId, subjectId: listId, href: "/lists/wish", affected: toIds },
    { members: [] },
  );
}

export type NewWishList = { name?: unknown; inviteIds: string[]; items?: unknown[] };

export async function createWishList(userId: string, input: NewWishList): Promise<number> {
  const invites = await askable(userId, input.inviteIds);
  assertRoom("wishListMembers", 1, invites.length);
  const items = dedupe((input.items ?? []).slice(0, LIMITS.wishListItems).map(checkedItem));

  return db.transaction(async (tx) => {
    assertRoom("wishLists", await seatCount(tx, userId));
    const list = await tx.insert(wishList).values({ name: readWishListName(input.name) }).returning({ id: wishList.id }).get();
    await tx.insert(wishListMember).values({ listId: list.id, userId, status: "accepted" });
    if (items.length) await tx.insert(wishListItem).values(items.map((item) => rowOf(list.id, userId, item)));
    await sendInvites(tx, list.id, userId, invites);
    return list.id;
  });
}

function dedupe(items: WishItemInput[]): WishItemInput[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.kind === "explore" ? `e:${item.presetId}` : item.kind === "country" ? `c:${item.code}` : null;
    if (!key) return true;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Asks more people. Anyone already on it or already asked is left as they are. */
export async function inviteToWishList(userId: string, listId: number, ids: string[]): Promise<number> {
  const wanted = await askable(userId, ids);
  return db.transaction(async (tx) => {
    await assertSeat(userId, listId, "accepted", tx);
    const seated = await tx.select({ userId: wishListMember.userId }).from(wishListMember).where(liveSeats(listId)).all();
    const already = new Set(seated.map((s) => s.userId));
    const fresh = wanted.filter((id) => !already.has(id));
    assertRoom("wishListMembers", seated.length, fresh.length);
    await sendInvites(tx, listId, userId, fresh);
    if (fresh.length) await tx.update(wishList).set(touch()).where(eq(wishList.id, listId));
    return fresh.length;
  });
}

export async function respondToWishInvite(userId: string, listId: number, accept: boolean): Promise<void> {
  await db.transaction(async (tx) => {
    await assertSeat(userId, listId, "invited", tx);
    const mine = and(eq(wishListMember.listId, listId), eq(wishListMember.userId, userId));
    if (!accept) {
      await tx.update(wishListMember).set({ deletedAt: new Date(), ...touch() }).where(mine);
      return;
    }
    assertRoom("wishLists", (await seatCount(tx, userId)) - 1);
    const seat = await tx.update(wishListMember).set({ status: "accepted", ...touch() }).where(mine).returning({ invitedBy: wishListMember.invitedBy }).get();
    const inviter = seat?.invitedBy;
    if (inviter) {
      await recordActivity(
        tx,
        { kind: "wish_list_joined", tripId: null, actorId: userId, subjectId: listId, href: `/lists/wish/${listId}`, affected: [inviter] },
        { members: [] },
      );
    }
  });
}

/** Takes you off. When nobody accepted is left, the list goes too, and its open invites with it. */
export async function leaveWishList(userId: string, listId: number): Promise<void> {
  await db.transaction(async (tx) => {
    await assertSeat(userId, listId, "accepted", tx);
    await tx
      .update(wishListMember)
      .set({ deletedAt: new Date(), ...touch() })
      .where(and(eq(wishListMember.listId, listId), eq(wishListMember.userId, userId)));
    const [{ n }] = await tx
      .select({ n: count() })
      .from(wishListMember)
      .where(and(liveSeats(listId), eq(wishListMember.status, "accepted"), ne(wishListMember.userId, userId)));
    if (n === 0) await tx.update(wishList).set({ deletedAt: new Date(), ...touch() }).where(eq(wishList.id, listId));
  });
}

export async function renameWishList(userId: string, listId: number, name: unknown): Promise<void> {
  await assertSeat(userId, listId, "accepted");
  await db.update(wishList).set({ name: readWishListName(name), ...touch() }).where(eq(wishList.id, listId));
}

/** Adds one thing. A listing or country already on the list is not added twice. */
export async function addWishItem(userId: string, listId: number, raw: unknown): Promise<number> {
  return db.transaction(async (tx) => {
    await assertSeat(userId, listId, "accepted", tx);
    const item = checkedItem(raw);
    const live = and(eq(wishListItem.listId, listId), isNull(wishListItem.deletedAt));
    const same = sameAs(item);
    if (same) {
      const found = await tx.select({ id: wishListItem.id }).from(wishListItem).where(and(live, same)).get();
      if (found) return found.id;
    }
    const [{ n }] = await tx.select({ n: count() }).from(wishListItem).where(live);
    assertRoom("wishListItems", n);
    const row = await tx.insert(wishListItem).values(rowOf(listId, userId, item)).returning({ id: wishListItem.id }).get();
    await tx.update(wishList).set(touch()).where(eq(wishList.id, listId));
    return row.id;
  });
}

export async function removeWishItem(userId: string, listId: number, itemId: number): Promise<void> {
  await assertSeat(userId, listId, "accepted");
  await db
    .update(wishListItem)
    .set({ deletedAt: new Date(), ...touch() })
    .where(and(eq(wishListItem.id, itemId), eq(wishListItem.listId, listId), isNull(wishListItem.deletedAt)));
}
