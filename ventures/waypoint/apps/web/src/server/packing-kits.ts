/**
 * Saved packing lists — `packing_kit` and `packing_kit_item` (ticket 230).
 * Every read and write is scoped by `owner_id` in the statement rather than
 * checked after: someone else's saved list is not addressable from here, the
 * same way a personal packing line isn't.
 */
import "server-only";

import { and, asc, count, eq, isNull, sql } from "drizzle-orm";

import { db } from "@/db";
import { packingKit, packingKitItem, packingLine } from "@/db/schema";
import { kitItemsToAdd } from "@/lib/packing-kits";
import type { KitItem } from "@/lib/packing-kits";
import {
  MAX_PACK_QUANTITY,
  MIN_PACK_QUANTITY,
  type PackCategory,
} from "@/lib/packing";
import { bounded, LIMITS } from "@/server/limits";
import { touch } from "@/server/audit";

export type PackingKitSummary = { id: number; name: string; itemCount: number };
type PackingKitItem = KitItem & { id: number };

/** Name and size only — the picker on a trip needs both and nothing else. */
export async function listPackingKits(
  ownerId: string,
): Promise<PackingKitSummary[]> {
  const rows = await db
    .select({
      id: packingKit.id,
      name: packingKit.name,
      itemCount: count(packingKitItem.id),
    })
    .from(packingKit)
    .leftJoin(
      packingKitItem,
      and(
        eq(packingKitItem.packingKitId, packingKit.id),
        isNull(packingKitItem.deletedAt),
      ),
    )
    .where(and(eq(packingKit.ownerId, ownerId), isNull(packingKit.deletedAt)))
    .groupBy(packingKit.id)
    .orderBy(asc(packingKit.createdAt), asc(packingKit.id))
    .limit(LIMITS.packingKits)
    .all();
  return bounded(rows, "packingKits", "saved lists");
}

export type PackingKitWithItems = {
  id: number;
  name: string;
  items: PackingKitItem[];
};

/**
 * Every saved list with its things, in one join — the page renders all of them,
 * and asking per kit is 1 + 2N round trips for a screen that is one read.
 */
export async function listPackingKitsWithItems(
  ownerId: string,
): Promise<PackingKitWithItems[]> {
  const rows = await db
    .select({
      id: packingKit.id,
      name: packingKit.name,
      itemId: packingKitItem.id,
      label: packingKitItem.label,
      category: packingKitItem.category,
      quantity: packingKitItem.quantity,
    })
    .from(packingKit)
    .leftJoin(
      packingKitItem,
      and(
        eq(packingKitItem.packingKitId, packingKit.id),
        isNull(packingKitItem.deletedAt),
      ),
    )
    .where(and(eq(packingKit.ownerId, ownerId), isNull(packingKit.deletedAt)))
    .orderBy(
      asc(packingKit.createdAt),
      asc(packingKit.id),
      asc(packingKitItem.createdAt),
      asc(packingKitItem.id),
    )
    .limit(LIMITS.packingKits * LIMITS.packingKitItems)
    .all();

  const kits = new Map<number, PackingKitWithItems>();
  for (const row of rows) {
    const kit = kits.get(row.id) ?? { id: row.id, name: row.name, items: [] };
    if (row.itemId !== null) {
      kit.items.push({
        id: row.itemId,
        label: row.label ?? "",
        category: row.category ?? "other",
        quantity: row.quantity ?? 1,
      });
    }
    kits.set(row.id, kit);
  }
  return [...kits.values()];
}

/** Null rather than a throw when the kit isn't yours — an unowned id and a missing one read the same. */
async function getPackingKit(
  kitId: number,
  ownerId: string,
): Promise<{ id: number; name: string; items: PackingKitItem[] } | null> {
  const kit = await db
    .select({ id: packingKit.id, name: packingKit.name })
    .from(packingKit)
    .where(
      and(
        eq(packingKit.id, kitId),
        eq(packingKit.ownerId, ownerId),
        isNull(packingKit.deletedAt),
      ),
    )
    .get();
  if (!kit) return null;

  const items = await db
    .select({
      id: packingKitItem.id,
      label: packingKitItem.label,
      category: packingKitItem.category,
      quantity: packingKitItem.quantity,
    })
    .from(packingKitItem)
    .where(
      and(
        eq(packingKitItem.packingKitId, kit.id),
        isNull(packingKitItem.deletedAt),
      ),
    )
    .orderBy(asc(packingKitItem.createdAt), asc(packingKitItem.id))
    .limit(LIMITS.packingKitItems)
    .all();

  return { ...kit, items: bounded(items, "packingKitItems", `kit ${kit.id}`) };
}

export async function insertPackingKit(
  ownerId: string,
  name: string,
): Promise<number | null> {
  const kits = await listPackingKits(ownerId);
  if (kits.length >= LIMITS.packingKits) return null;
  const row = await db
    .insert(packingKit)
    .values({ ownerId, name })
    .returning({ id: packingKit.id })
    .get();
  return row.id;
}

export async function renamePackingKit(
  kitId: number,
  ownerId: string,
  name: string,
): Promise<void> {
  await db
    .update(packingKit)
    .set({ name, ...touch() })
    .where(
      and(
        eq(packingKit.id, kitId),
        eq(packingKit.ownerId, ownerId),
        isNull(packingKit.deletedAt),
      ),
    );
}

/** The items go with it — a kit's rows are only ever reachable through the kit. */
export async function softDeletePackingKit(
  kitId: number,
  ownerId: string,
): Promise<void> {
  const kit = await getPackingKit(kitId, ownerId);
  if (!kit) return;

  const now = new Date();
  await db
    .update(packingKit)
    .set({ deletedAt: now, ...touch() })
    .where(and(eq(packingKit.id, kit.id), isNull(packingKit.deletedAt)));
  await db
    .update(packingKitItem)
    .set({ deletedAt: now, ...touch() })
    .where(
      and(
        eq(packingKitItem.packingKitId, kit.id),
        isNull(packingKitItem.deletedAt),
      ),
    );
}

/** Silently a no-op at the ceiling, like every other capped list here (rule 11). */
export async function insertPackingKitItem(
  kitId: number,
  ownerId: string,
  label: string,
  category: PackCategory,
  quantity: number,
): Promise<void> {
  const kit = await getPackingKit(kitId, ownerId);
  if (!kit || kit.items.length >= LIMITS.packingKitItems) return;
  await db
    .insert(packingKitItem)
    .values({ packingKitId: kit.id, label, category, quantity });
}

/** Resolved through the owning kit, so an id from someone else's list matches nothing. */
async function ownedKitItem(
  itemId: number,
  ownerId: string,
): Promise<{ id: number } | undefined> {
  return db
    .select({ id: packingKitItem.id })
    .from(packingKitItem)
    .innerJoin(packingKit, eq(packingKit.id, packingKitItem.packingKitId))
    .where(
      and(
        eq(packingKitItem.id, itemId),
        eq(packingKit.ownerId, ownerId),
        isNull(packingKit.deletedAt),
        isNull(packingKitItem.deletedAt),
      ),
    )
    .get();
}

export async function softDeletePackingKitItem(
  itemId: number,
  ownerId: string,
): Promise<void> {
  const owned = await ownedKitItem(itemId, ownerId);
  if (!owned) return;

  await db
    .update(packingKitItem)
    .set({ deletedAt: new Date(), ...touch() })
    .where(eq(packingKitItem.id, owned.id));
}

/** Same step-in-SQL as a bag row, and for the same reason — two quick clicks are two steps, not a race. */
export async function stepPackingKitItemQuantity(
  itemId: number,
  ownerId: string,
  delta: 1 | -1,
): Promise<void> {
  const owned = await ownedKitItem(itemId, ownerId);
  if (!owned) return;

  await db
    .update(packingKitItem)
    .set({
      quantity: sql`max(${MIN_PACK_QUANTITY}, min(${MAX_PACK_QUANTITY}, ${packingKitItem.quantity} + ${delta}))`,
      ...touch(),
    })
    .where(eq(packingKitItem.id, owned.id));
}

/**
 * Copy a saved list into one person's bag on one trip. A copy, not a link: the
 * rows are ordinary packing lines from the moment they land, so renaming or
 * re-counting them is just editing your bag, and a later edit to the kit does
 * not reach back into a trip.
 *
 * One transaction, for the reason `fillPersonalBag` documents: read-then-insert
 * across two statements lets a double-press read the same bag twice and write
 * the kit twice, and the duplicates then read as "already there", so no later
 * press can undo them. SQLite serialises write transactions, so the second one
 * sees the first one's rows and adds nothing.
 */
export async function applyPackingKitToBag(args: {
  tripId: number;
  ownerId: string;
  kitId: number;
}): Promise<number> {
  const kit = await getPackingKit(args.kitId, args.ownerId);
  if (!kit || kit.items.length === 0) return 0;

  try {
    return await db.transaction(async (tx) => {
      const existing = await tx
        .select({ label: packingLine.label })
        .from(packingLine)
        .where(
          and(
            eq(packingLine.tripId, args.tripId),
            eq(packingLine.ownerId, args.ownerId),
            isNull(packingLine.deletedAt),
          ),
        )
        .limit(LIMITS.packingLines)
        .all();

      const toAdd = kitItemsToAdd(kit.items, existing).slice(
        0,
        Math.max(0, LIMITS.packingLines - existing.length),
      );
      if (toAdd.length === 0) return 0;

      await tx.insert(packingLine).values(
        toAdd.map((item) => ({
          tripId: args.tripId,
          createdBy: args.ownerId,
          ownerId: args.ownerId,
          label: item.label,
          category: item.category,
          quantity: item.quantity,
          kitName: kit.name,
        })),
      );
      return toAdd.length;
    });
  } catch (err) {
    // The other press is doing the identical work, so "added nothing" is true
    // rather than a 500 at somebody who clicked twice (rule 11).
    if (isLockContention(err)) return 0;
    throw err;
  }
}

function isLockContention(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return message.includes("SQLITE_BUSY") || message.includes("database is locked");
}
