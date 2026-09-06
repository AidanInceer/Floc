/**
 * The trip's files (ticket 296).
 *
 * Read-only for now: Overview shows the pile, and uploading from a phone is a
 * separate problem (a file picker, a size limit, a quota — #285).
 *
 * The private/shared line is the port's to draw, not this router's. A viewer
 * id goes down with every call and the implementation filters on it, so there
 * is no shape of request that returns somebody else's private file.
 */
import { router, tripProcedure } from "../trpc";

export const filesRouter = router({
  list: tripProcedure.query(({ ctx, input }) =>
    ctx.port.listFiles(ctx.viewer.id, input.tripId),
  ),
});
