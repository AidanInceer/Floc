/**
 * The one-off move off BlockNote (#408), run by hand: `pnpm --filter floc-web
 * notes:move`. Every trip with an old Notes doc and no pages gets that doc as
 * its first page, and each move is checked word for word. Adds rows only and
 * is safe to run twice; the same move also happens the first time a trip's
 * Notes opens.
 */
import { movePagesOffBlockNote } from "../server/notes/pages/page-migration.ts";

const report = await movePagesOffBlockNote();
console.log(`Old Notes docs: ${report.docs}. Moved to pages now: ${report.moved}.`);
if (report.lostText.length) {
  console.error(`Words missing after the move, trips: ${report.lostText.join(", ")}`);
  process.exitCode = 1;
}
