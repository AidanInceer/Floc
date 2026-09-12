/**
 * Money — the ledger, and writing an expense (tickets 287, 291).
 *
 * MONEY IS NEVER A FLOAT (rule 1). Every amount crossing this boundary is an
 * integer in minor units, and the schema below refuses anything else. A client
 * parses what a person typed with `@floc/core/money`'s `parseMoney` before it
 * gets here and formats with `formatMoney` after — the same two functions on
 * the phone as in the browser, so neither can round differently.
 *
 * SPLITS ARE SNAPSHOTS (rule 2). `write` carries the whole split set and the
 * port rewrites expense and splits in one transaction. There is deliberately
 * no procedure that edits splits alone: one would let a client recalculate a
 * set that must never be recalculated.
 */
import { CURRENCIES } from "@floc/core/money/currency";
import { EXPENSE_CATEGORIES } from "@floc/core/money/expense-category";
import { WRITABLE_SPLIT_TYPES } from "@floc/core/money/money";
import { z } from "zod";

import { router, tripProcedure } from "../trpc";

const minorUnits = z
  .number()
  .int("Money is integer minor units — never a float.")
  .nonnegative();

const splitRow = z.object({
  userId: z.string().min(1),
  owedAmountMinor: z.number().int("Money is integer minor units — never a float."),
});

export const moneyRouter = router({
  /** Expenses, their splits and any settlements. Balances derive client-side, in `@floc/core/money`. */
  ledger: tripProcedure.query(({ ctx, input }) =>
    ctx.port.loadLedger(ctx.viewer.id, input.tripId),
  ),

  write: tripProcedure
    .input(
      z.object({
        /** Absent creates; present rewrites that expense and its whole split set. */
        expenseId: z.number().int().positive().optional(),
        description: z.string().trim().min(1, "Say what it was for.").max(200),
        amountMinor: minorUnits,
        currency: z.enum(CURRENCIES),
        category: z.enum(EXPENSE_CATEGORIES),
        // `even` and `percentage` stay readable as old snapshots, but nothing
        // writes them any more (#117) — so the wire cannot ask for one.
        splitType: z.enum(WRITABLE_SPLIT_TYPES),
        paidBy: z.string().min(1),
        /** Filed under an itinerary day, or under none. Never a timestamp (rule 10). */
        dayId: z.number().int().positive().nullable().default(null),
        notes: z.string().max(2000).nullable().default(null),
        splits: z.array(splitRow).min(1, "Somebody has to owe something."),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tripId, ...expense } = input;
      await ctx.port.writeExpense(ctx.viewer.id, tripId, expense);
    }),

  /**
   * Writes down a transfer that already happened. Any member may record one,
   * in either direction — settling up is not one of the three admin powers
   * (rule 6), and the person who paid is usually the one holding the phone.
   */
  settle: tripProcedure
    .input(
      z.object({
        fromUserId: z.string().min(1),
        toUserId: z.string().min(1),
        amountMinor: minorUnits.positive("A settlement of nothing settles nothing."),
        currency: z.enum(CURRENCIES),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tripId, ...transfer } = input;
      await ctx.port.settleUp(ctx.viewer.id, tripId, transfer);
    }),

  deleteExpense: tripProcedure
    .input(z.object({ expenseId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.deleteExpense(ctx.viewer.id, input.tripId, input.expenseId);
    }),
});
