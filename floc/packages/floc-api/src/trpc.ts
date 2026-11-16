import { isRefusal, type RefusalKind } from "@floc/core/errors/refusal";
import { initTRPC, TRPCError } from "@trpc/server";
import { z, ZodError } from "zod";

import type { Context } from "./port";

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    if (error.cause instanceof ZodError) {
      return { ...shape, message: error.cause.issues[0]?.message ?? "Check what you typed." };
    }
    if (error.code !== "INTERNAL_SERVER_ERROR") return shape;
    return {
      ...shape,
      message: "Something went wrong. Please try again.",
      data: { code: shape.data.code, httpStatus: shape.data.httpStatus, path: shape.data.path },
    };
  },
});

export const router = t.router;

const REFUSAL_CODES: Record<RefusalKind, TRPCError["code"]> = {
  invalid: "BAD_REQUEST",
  missing: "NOT_FOUND",
  forbidden: "FORBIDDEN",
};

const answerRefusals = t.middleware(async ({ next }) => {
  const result = await next();
  if (!result.ok && isRefusal(result.error.cause)) {
    const refusal = result.error.cause;
    throw new TRPCError({ code: REFUSAL_CODES[refusal.kind], message: refusal.message, cause: refusal });
  }
  return result;
});

export const publicProcedure = t.procedure.use(answerRefusals);

export const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.viewer) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in first." });
  }
  return next({ ctx: { ...ctx, viewer: ctx.viewer } });
});

export const tripInput = z.object({ tripId: z.number().int().positive() });

export const tripProcedure = protectedProcedure
  .input(tripInput)
  .use(async ({ ctx, input, next }) => {
    const trip = await ctx.port.loadTrip(ctx.viewer!.id, input.tripId);
    if (!trip) {
      throw new TRPCError({ code: "NOT_FOUND", message: "No such trip." });
    }
    return next({ ctx: { ...ctx, viewer: ctx.viewer!, trip } });
  });
