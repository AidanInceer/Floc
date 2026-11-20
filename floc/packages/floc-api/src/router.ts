import { analyticsRouter } from "./routers/analytics/analytics";
import { availabilityRouter } from "./routers/itinerary/availability";
import { billingRouter } from "./routers/billing";
import { bookingsRouter } from "./routers/bookings/bookings";
import { commentsRouter } from "./routers/comments";
import { exploreRouter } from "./routers/explore";
import { feedbackRouter } from "./routers/feedback/feedback";
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
import { estimateRouter } from "./routers/estimate";
import { notificationsRouter } from "./routers/notifications";
import { nudgesRouter } from "./routers/nudges/nudges";
import { packingRouter } from "./routers/packing";
import { pagesRouter } from "./routers/notes/pages";
import { peopleRouter } from "./routers/people";
import { placesRouter } from "./routers/itinerary/places";
import { rosterRouter } from "./routers/roster";
import { settingsRouter } from "./routers/settings";
import { tripsRouter } from "./routers/trips";
import { publicProcedure, router } from "./trpc";

export const appRouter = router({
  health: publicProcedure.query(() => ({ ok: true as const })),
  me: meRouter,
  settings: settingsRouter,
  kits: kitsRouter,
  bookings: bookingsRouter,
  wishes: wishesRouter,
  trips: tripsRouter,
  explore: exploreRouter,
  ideas: ideasRouter,
  itinerary: itineraryRouter,
  money: moneyRouter,
  estimate: estimateRouter,
  roster: rosterRouter,
  nudges: nudgesRouter,
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
  feedback: feedbackRouter,
  analytics: analyticsRouter,
});

export type AppRouter = typeof appRouter;
