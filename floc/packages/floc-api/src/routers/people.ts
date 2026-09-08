/**
 * Somebody else's profile (ticket 46).
 *
 * ITS OWN ROUTER, NOT A SECOND `me`. `me` is what you curate about yourself and
 * every field of it is yours to write; this is read-only and arrives already
 * cut down by the owner's rings. Putting the two together would produce an
 * endpoint where half the fields are writable and half are censored.
 *
 * NULL MEANS TWO THINGS AND WILL NOT SAY WHICH. A stranger and an id that was
 * never an account get the same answer, so this cannot be used to find out
 * whether somebody has a Floc account (rule 5, applied to people).
 */
import { z } from "zod";

import { protectedProcedure, router } from "../trpc";

export const peopleRouter = router({
  profile: protectedProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .query(({ ctx, input }) => ctx.port.loadProfileOf(ctx.viewer.id, input.userId)),
});
