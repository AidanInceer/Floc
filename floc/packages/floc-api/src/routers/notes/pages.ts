import { PAGE_ICONS } from "@floc/core/notes/pages/page-icons";
import { PAGE_LIMITS } from "@floc/core/notes/pages/page-rules";
import { TEXT_CAPS } from "@floc/core/text/text";
import { z } from "zod";

import { router, tripProcedure } from "../../trpc";

const id = z.number().int().positive();
const onPage = z.object({ pageId: id });

export const pagesRouter = router({
  list: tripProcedure.query(({ ctx, input }) => ctx.port.listPages(ctx.viewer.id, input.tripId)),

  create: tripProcedure
    .input(z.object({ parentId: id.nullable() }))
    .mutation(({ ctx, input }) => ctx.port.createPage(ctx.viewer.id, input.tripId, input.parentId)),

  rename: tripProcedure
    .input(onPage.extend({ title: z.string().trim().max(PAGE_LIMITS.titleChars) }))
    .mutation(({ ctx, input }) => ctx.port.renamePage(ctx.viewer.id, input.tripId, input.pageId, input.title)),

  setIcon: tripProcedure
    .input(onPage.extend({ icon: z.enum(PAGE_ICONS).nullable() }))
    .mutation(({ ctx, input }) => ctx.port.setPageIcon(ctx.viewer.id, input.tripId, input.pageId, input.icon)),

  move: tripProcedure
    .input(onPage.extend({ beforeId: id.nullable() }))
    .mutation(({ ctx, input }) => ctx.port.movePage(ctx.viewer.id, input.tripId, input.pageId, input.beforeId)),

  archive: tripProcedure
    .input(onPage)
    .mutation(({ ctx, input }) => ctx.port.archivePage(ctx.viewer.id, input.tripId, input.pageId)),

  restore: tripProcedure
    .input(onPage)
    .mutation(({ ctx, input }) => ctx.port.restorePage(ctx.viewer.id, input.tripId, input.pageId)),

  links: tripProcedure.query(({ ctx, input }) => ctx.port.listTripLinks(ctx.viewer.id, input.tripId)),

  comments: tripProcedure
    .input(onPage)
    .query(({ ctx, input }) => ctx.port.listPageComments(ctx.viewer.id, input.tripId, input.pageId)),

  comment: tripProcedure
    .input(onPage.extend({
      replyTo: id.nullable(),
      body: z.string().trim().min(1, "Write something first.").max(TEXT_CAPS.noteBody, "That comment is too long to save."),
    }))
    .mutation(({ ctx, input }) => ctx.port.addPageComment(ctx.viewer.id, input.tripId, input.pageId, input.replyTo, input.body)),

  resolve: tripProcedure
    .input(z.object({ commentId: id }))
    .mutation(({ ctx, input }) => ctx.port.resolvePageComment(ctx.viewer.id, input.tripId, input.commentId)),
});
