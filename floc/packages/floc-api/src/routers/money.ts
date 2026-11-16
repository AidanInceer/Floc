import { CURRENCIES } from "@floc/core/money/currency";
import { EXPENSE_CATEGORIES } from "@floc/core/money/expense-category";
import { NO_AMOUNT, NO_DESCRIPTION, NO_PAYER, NO_SHARES } from "@floc/core/money/expense-rules";
import { WRITABLE_SPLIT_TYPES } from "@floc/core/money/money";
import { TEXT_CAPS } from "@floc/core/text/text";
import { z } from "zod";

import { router, tripProcedure } from "../trpc";

const minorUnits = z
  .number()
  .int("Money is integer minor units — never a float.")
  .nonnegative();

const splitRow = z.object({
  userId: z.string().min(1),
  owedAmountMinor: minorUnits,
});

export const moneyRouter = router({
  ledger: tripProcedure.query(({ ctx, input }) =>
    ctx.port.loadLedger(ctx.viewer.id, input.tripId),
  ),

  write: tripProcedure
    .input(
      z.object({
        expenseId: z.number().int().positive().optional(),
        description: z.string().trim().min(1, NO_DESCRIPTION).max(TEXT_CAPS.expenseDescription),
        amountMinor: minorUnits.positive(NO_AMOUNT),
        currency: z.enum(CURRENCIES),
        category: z.enum(EXPENSE_CATEGORIES),
        splitType: z.enum(WRITABLE_SPLIT_TYPES),
        paidBy: z.string().min(1, NO_PAYER),
        dayId: z.number().int().positive().nullable().default(null),
        notes: z.string().max(TEXT_CAPS.expenseNotes).nullable().default(null),
        splits: z.array(splitRow).min(1, NO_SHARES).max(100),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tripId, ...expense } = input;
      await ctx.port.writeExpense(ctx.viewer.id, tripId, expense);
    }),

  settle: tripProcedure
    .input(
      z.object({
        transfers: z
          .array(
            z.object({
              fromUserId: z.string().min(1),
              toUserId: z.string().min(1),
              amountMinor: minorUnits.positive("A settlement of nothing settles nothing."),
              currency: z.enum(CURRENCIES),
            }),
          )
          .min(1, "Nothing to settle.")
          .max(50),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.port.settleUp(ctx.viewer.id, input.tripId, input.transfers);
    }),

  pairs: tripProcedure.query(({ ctx, input }) => ctx.port.loadPairs(ctx.viewer.id, input.tripId)),

  settlePair: tripProcedure
    .input(z.object({ otherUserId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.settlePair(ctx.viewer.id, input.tripId, input.otherUserId);
    }),

  deleteExpense: tripProcedure
    .input(z.object({ expenseId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.deleteExpense(ctx.viewer.id, input.tripId, input.expenseId);
    }),
});
