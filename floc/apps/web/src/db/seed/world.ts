import { randomUUID } from "node:crypto";

import { sql } from "drizzle-orm";

import { db } from "../index.ts";
import {
  expense,
  expenseSplit,
  packingClaim,
  packingLine,
  place,
  trip,
  tripMembership,
} from "../schema.ts";
import type { PackCategory } from "@floc/core/packing/packing";
import type { WritableSplitType } from "@floc/core/money/money";
import { computeSplits } from "@floc/core/money/money";

export function isoIn(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function seedPlace(values: typeof place.$inferInsert): Promise<{ id: number }> {
  const [row] = await db
    .insert(place)
    .values(values)
    .onConflictDoUpdate({
      target: place.providerId,
      targetWhere: sql`provider_id IS NOT NULL AND deleted_at IS NULL`,
      set: { name: values.name },
    })
    .returning({ id: place.id });
  return row;
}

export async function makeTrip(args: {
  name: string;
  startDate: string;
  endDate: string;
  createdBy: string;
  members: { userId: string; role: "admin" | "member" }[];
  tags?: string[];
  colorKey?: string;
}): Promise<number> {
  const [row] = await db
    .insert(trip)
    .values({
      name: args.name,
      startDate: args.startDate,
      endDate: args.endDate,
      createdBy: args.createdBy,
      inviteToken: randomUUID(),
      tags: args.tags ?? null,
      colorKey: args.colorKey ?? null,
    })
    .returning({ id: trip.id });

  await db.insert(tripMembership).values(
    args.members.map((m) => ({ tripId: row.id, userId: m.userId, role: m.role })),
  );

  return row.id;
}

export async function addPackingLine(args: {
  tripId: number;
  createdBy: string;
  label: string;
  category: PackCategory;
  quantity?: number;
  claims?: { userId: string; packed: boolean }[];
}): Promise<void> {
  const [line] = await db
    .insert(packingLine)
    .values({
      tripId: args.tripId,
      createdBy: args.createdBy,
      label: args.label,
      category: args.category,
      quantity: args.quantity ?? 1,
    })
    .returning({ id: packingLine.id });

  if (!args.claims?.length) return;

  await db.insert(packingClaim).values(
    args.claims.map((c) => ({
      packingLineId: line.id,
      userId: c.userId,
      packedAt: c.packed ? new Date() : null,
    })),
  );
}

export async function addPersonalPackingLine(args: {
  tripId: number;
  ownerId: string;
  label: string;
  category: PackCategory;
  packed?: boolean;
}): Promise<void> {
  await db.insert(packingLine).values({
    tripId: args.tripId,
    createdBy: args.ownerId,
    ownerId: args.ownerId,
    label: args.label,
    category: args.category,
    packedAt: args.packed ? new Date() : null,
  });
}

export async function addExpense(args: {
  tripId: number;
  dayId: number | null;
  paidBy: string;
  description: string;
  amountMinor: number;
  currency: "GBP" | "EUR" | "USD";
  splitType: WritableSplitType;
  participants: string[];
  weights?: number[];
}): Promise<void> {
  const [row] = await db
    .insert(expense)
    .values({
      tripId: args.tripId,
      dayId: args.dayId,
      createdBy: args.paidBy,
      paidBy: args.paidBy,
      description: args.description,
      amountMinor: args.amountMinor,
      currency: args.currency,
      splitType: args.splitType,
    })
    .returning({ id: expense.id });

  const splits = computeSplits(
    args.amountMinor,
    args.splitType,
    args.participants.map((userId, i) => ({ userId, value: args.weights?.[i] })),
  );

  await db.insert(expenseSplit).values(
    splits.map((s) => ({
      expenseId: row.id,
      userId: s.userId,
      owedAmountMinor: s.owedAmountMinor,
    })),
  );
}
