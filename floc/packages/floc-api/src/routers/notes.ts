/**
 * The trip's shared Notes document (ticket 301).
 *
 * ONE BLOB, HANDED BACK UNTOUCHED. The document is BlockNote's own `Block[]`,
 * JSON-encoded. Nothing here parses it: only the editors understand its shape,
 * and a server that half-understood it would be a second opinion about what a
 * note says. `@floc/core/note-blocks` is where a client reads it.
 *
 * LAST WRITE WINS (rule 7). There is no version on this input and there is not
 * going to be one — the web app behaves the same way, and #238's reload guard
 * is the stated follow-up for both clients rather than a lock for one.
 *
 * EVERY MEMBER MAY WRITE. Notes is not gated by role: the four admin powers
 * are invite, kick, promote and delete/archive (rule 6), and writing in the
 * trip's notebook is not among them.
 *
 * The length cap is `TEXT_CAPS.noteDoc` — the same number the web action
 * checks, so a document the browser accepts is never one the phone refuses.
 */
import { TEXT_CAPS } from "@floc/core/text/text";
import { z } from "zod";

import { router, tripProcedure } from "../trpc";

export const notesRouter = router({
  get: tripProcedure.query(({ ctx, input }) => ctx.port.loadNotes(ctx.viewer.id, input.tripId)),

  write: tripProcedure
    .input(z.object({ body: z.string().max(TEXT_CAPS.noteDoc, "That note is too long to save.") }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.saveNotes(ctx.viewer.id, input.tripId, input.body);
    }),
});
