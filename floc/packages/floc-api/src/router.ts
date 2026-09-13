/**
 * The whole API in one tree (ticket 287).
 *
 * `AppRouter` is the only thing a client imports from this package, and it is
 * a *type* — no runtime code crosses to the phone, so nothing server-side can
 * end up in a bundle that ships to a device.
 */
import { availabilityRouter } from "./routers/availability";
import { billingRouter } from "./routers/billing";
import { commentsRouter } from "./routers/comments";
import { filesRouter } from "./routers/files";
import { friendsRouter } from "./routers/friends";
import { invitesRouter } from "./routers/invites";
import { itineraryRouter } from "./routers/itinerary";
import { kitsRouter } from "./routers/kits";
import { meRouter } from "./routers/me";
import { moneyRouter } from "./routers/money";
import { notesRouter } from "./routers/notes";
import { notificationsRouter } from "./routers/notifications";
import { packingRouter } from "./routers/packing";
import { peopleRouter } from "./routers/people";
import { placesRouter } from "./routers/places";
import { rosterRouter } from "./routers/roster";
import { settingsRouter } from "./routers/settings";
import { tripsRouter } from "./routers/trips";
import { publicProcedure, router } from "./trpc";

export const appRouter = router({
  /** Reachable unauthenticated, so a client can tell "server down" from "signed out". */
  health: publicProcedure.query(() => ({ ok: true as const })),
  me: meRouter,
  settings: settingsRouter,
  kits: kitsRouter,
  trips: tripsRouter,
  itinerary: itineraryRouter,
  money: moneyRouter,
  roster: rosterRouter,
  friends: friendsRouter,
  people: peopleRouter,
  invites: invitesRouter,
  files: filesRouter,
  notes: notesRouter,
  comments: commentsRouter,
  packing: packingRouter,
  places: placesRouter,
  availability: availabilityRouter,
  billing: billingRouter,
  notifications: notificationsRouter,
});

export type AppRouter = typeof appRouter;
