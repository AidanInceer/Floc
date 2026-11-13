/**
 * The whole API in one tree (ticket 287).
 *
 * `AppRouter` is the only thing a client imports from this package, and it is
 * a *type* — no runtime code crosses to the phone, so nothing server-side can
 * end up in a bundle that ships to a device.
 */
import { availabilityRouter } from "./routers/itinerary/availability";
import { billingRouter } from "./routers/billing";
import { commentsRouter } from "./routers/comments";
import { exploreRouter } from "./routers/explore";
import { filesRouter } from "./routers/files";
import { friendsRouter } from "./routers/friends";
import { groupsRouter } from "./routers/groups";
import { ideasRouter } from "./routers/itinerary/ideas";
import { invitesRouter } from "./routers/invites";
import { itineraryRouter } from "./routers/itinerary/itinerary";
import { kitsRouter } from "./routers/kits";
import { wishesRouter } from "./routers/wishes";
import { meRouter } from "./routers/me";
import { moneyRouter } from "./routers/money";
import { notificationsRouter } from "./routers/notifications";
import { packingRouter } from "./routers/packing";
import { pagesRouter } from "./routers/notes/pages";
import { peopleRouter } from "./routers/people";
import { placesRouter } from "./routers/itinerary/places";
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
  wishes: wishesRouter,
  trips: tripsRouter,
  explore: exploreRouter,
  ideas: ideasRouter,
  itinerary: itineraryRouter,
  money: moneyRouter,
  roster: rosterRouter,
  friends: friendsRouter,
  groups: groupsRouter,
  people: peopleRouter,
  invites: invitesRouter,
  files: filesRouter,
  comments: commentsRouter,
  pages: pagesRouter,
  packing: packingRouter,
  places: placesRouter,
  availability: availabilityRouter,
  billing: billingRouter,
  notifications: notificationsRouter,
});

export type AppRouter = typeof appRouter;
