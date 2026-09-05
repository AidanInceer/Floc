/**
 * The whole API in one tree (ticket 287).
 *
 * `AppRouter` is the only thing a client imports from this package, and it is
 * a *type* — no runtime code crosses to the phone, so nothing server-side can
 * end up in a bundle that ships to a device.
 */
import { itineraryRouter } from "./routers/itinerary";
import { moneyRouter } from "./routers/money";
import { rosterRouter } from "./routers/roster";
import { tripsRouter } from "./routers/trips";
import { publicProcedure, router } from "./trpc";

export const appRouter = router({
  /** Reachable unauthenticated, so a client can tell "server down" from "signed out". */
  health: publicProcedure.query(() => ({ ok: true as const })),
  trips: tripsRouter,
  itinerary: itineraryRouter,
  money: moneyRouter,
  roster: rosterRouter,
});

export type AppRouter = typeof appRouter;
