import type { ExplorePort } from "./port-explore";
import type { PagesPort } from "./port-pages";
import type { AccountPort } from "./port/account";
import type { TripsPort } from "./port/trips";
import type { ItineraryPort } from "./port/itinerary";
import type { MoneyPort } from "./port/money";
import type { EstimatePort } from "./port/estimate";
import type { FilesPort } from "./port/files";
import type { BookingsPort } from "./port/bookings";
import type { IdeasPort } from "./port/ideas";
import type { NudgesPort } from "./port/nudges";
import type { PackingPort } from "./port/packing";
import type { FriendsPort } from "./port/friends";
import type { NotificationsPort } from "./port/notifications";
import type { CommentsPort } from "./port/comments";
import type { WishListsPort } from "./port/wish-lists";
import type { FeedbackPort } from "./port/feedback";
import type { AnalyticsPort } from "./port/analytics";

export type * from "./port/account";
export type * from "./port/trips";
export type * from "./port/itinerary";
export type * from "./port/money";
export type * from "./port/estimate";
export type * from "./port/files";
export type * from "./port/bookings";
export type * from "./port/ideas";
export type * from "./port/nudges";
export type * from "./port/packing";
export type * from "./port/friends";
export type * from "./port/notifications";
export type * from "./port/comments";
export type * from "./port/wish-lists";

export type { Currency } from "@floc/core/money/currency";
export type { DocCategory } from "@floc/core/documents/documents";
export type { ExpenseCategory } from "@floc/core/money/expense-category";
export type { DayEventType, ReactionKind, SplitType, TransportType } from "@floc/core/vocabulary";

export type { ExploreState, Finder } from "./port-explore";

export type { TripRole } from "./port-trips";

export type Viewer = {
  id: string;
  name: string;
  email: string;
  image: string | null;
};

export type { TripFace, TripSummary } from "./port-trips";

export type { Comment } from "./port-comment";

export type Context = {
  viewer: Viewer | null;
  port: FlocPort;
};

export type FlocPort = AccountPort &
  TripsPort &
  ItineraryPort &
  MoneyPort &
  EstimatePort &
  FilesPort &
  BookingsPort &
  IdeasPort &
  NudgesPort &
  PackingPort &
  FriendsPort &
  NotificationsPort &
  CommentsPort &
  WishListsPort &
  FeedbackPort &
  AnalyticsPort &
  ExplorePort &
  PagesPort &
  import("./port-calendar").CalendarImportPort;
