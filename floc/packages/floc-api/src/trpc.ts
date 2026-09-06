/**
 * tRPC initialisation and the three procedure kinds (ticket 287).
 *
 * Authorisation is a procedure, not a line of code somebody has to remember:
 * `protectedProcedure` refuses an unauthenticated caller, and `tripProcedure`
 * additionally resolves the trip through the port, so a procedure body can
 * only ever run with a trip the viewer is genuinely in. That is the same
 * shape `requireTripAccess` gives the web pages, and for the same reason —
 * ticket 104 found six call sites that had forgotten the check by hand.
 */
import { initTRPC, TRPCError } from "@trpc/server";
import { z } from "zod";

import type { Context } from "./port";

const t = initTRPC.context<Context>().create();

export const router = t.router;

/** Anyone, signed in or not. Only health lives here. */
export const publicProcedure = t.procedure;

/** Signed in. Everything about a person's own trips starts here. */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.viewer) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in first." });
  }
  return next({ ctx: { ...ctx, viewer: ctx.viewer } });
});

/** Every trip-scoped input carries the id the same way, so the middleware can read it. */
export const tripInput = z.object({ tripId: z.number().int().positive() });

/**
 * Signed in AND a member of the trip named in the input.
 *
 * A trip that does not exist and a trip the viewer is not in both come back as
 * NOT_FOUND with the same message (rule 5) — an id must not be probeable by
 * the shape of the refusal. The loaded trip is put on the context so the
 * procedure below does not fetch it a second time.
 */
export const tripProcedure = protectedProcedure
  .input(tripInput)
  .use(async ({ ctx, input, next }) => {
    const trip = await ctx.port.loadTrip(ctx.viewer!.id, input.tripId);
    if (!trip) {
      throw new TRPCError({ code: "NOT_FOUND", message: "No such trip." });
    }
    return next({ ctx: { ...ctx, viewer: ctx.viewer!, trip } });
  });
