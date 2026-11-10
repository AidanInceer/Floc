/** The packing half of the port (#573). The rules it carries are listed in `../port.ts`. */
import type { PackCategory, PackTier } from "@floc/core/packing/packing";

/**
 * One saved packing list, with its things (#230). Yours, not a trip's. Copying is one direction
 * only — editing the bag on a trip never writes back here.
 */
export type SavedKit = {
  id: number;
  name: string;
  items: { id: number; label: string; category: PackCategory; quantity: number }[];
};

/**
 * The trip's packing, as a phone reads it (the phone's Packing screen).
 *
 * TWO LISTS, ONE TABLE. A shared line has no owner and belongs to the group;
 * a personal line is owned and is one person's bag. They live in the same
 * table on the host side, and the two are never merged here — a shared line
 * leaking into somebody's bag is what #220 exists to prevent.
 */
export type PackingShared = {
  id: number;
  label: string;
  category: PackCategory;
  /** Everyone who said they would bring it. Several may — two of you with sun cream is an answer. */
  claims: { userId: string; name: string; packed: boolean }[];
};

export type PackingMine = {
  id: number;
  label: string;
  category: PackCategory;
  quantity: number;
  packed: boolean;
  /** Added by auto packing (#469), so "Remove suggested" may take it back. */
  suggested: boolean;
};

/** One auto packing idea the bag does not hold yet (#469). The host re-derives it on take. */
export type PackingIdea = { label: string; category: PackCategory; quantity: number };

/** What the ideas were sized from, so the screen can say why (#469). `firstRain` is YYYY-MM-DD (rule 10). */
export type PackingPlanSummary = {
  nights: number | null;
  climate: { hot: boolean; cold: boolean; wet: boolean } | null;
  gap: "no-dates" | "no-place" | "no-forecast" | null;
  places: string[];
  hottest: number | null; firstRain: string | null;
};

/** One of the viewer's saved kits, as the picker lists them (ticket 230). */
export type PackingKit = { id: number; name: string; itemCount: number };

export type PackingBoard = {
  shared: PackingShared[];
  mine: PackingMine[];
  /**
   * The tier in force on this trip, already resolved against the profile
   * default (ticket 220) — a client never has to know the fallback rule.
   */
  tier: PackTier;
  /** The viewer's saved kits. Empty when they have none; never another account's. */
  kits: PackingKit[];
  /**
   * Whether auto-fill may be pressed. Pro buys the *action*, never the data
   * (ticket 248), so a bag already filled stays readable when this is false.
   */
  canAutoFill: boolean;
  /** Empty without the entitlement: a free member sees one line about Pro instead (#469). */
  ideas: PackingIdea[];
  plan: PackingPlanSummary;
};

export type PackingPort = {
  /** Both lists in one read — the screen draws both, and asking twice is a second round trip. */
  loadPacking(viewerId: string, tripId: number): Promise<PackingBoard>;

  /** Adds to the group's list when `mine` is false, to your own bag when it is true. */
  addPackingLine(
    viewerId: string,
    tripId: number,
    input: { label: string; category: PackCategory | null; mine: boolean },
  ): Promise<void>;

  /**
   * Says you will bring a shared thing, or takes it back. Open by design: any
   * member may claim any line, and several may claim the same one. Not one of
   * the admin powers (rule 6).
   */
  claimPackingLine(
    viewerId: string,
    tripId: number,
    lineId: number,
    claimed: boolean,
  ): Promise<void>;

  /**
   * Ticks something as packed — your own claim on a shared line, or a line in
   * your own bag. Never anyone else's: the host scopes the write to (line,
   * viewer), so ticking for somebody else is not expressible.
   */
  setPackingPacked(
    viewerId: string,
    tripId: number,
    lineId: number,
    packed: boolean,
  ): Promise<void>;

  /** Why: a delta, not a number — the host adds in SQL, so two quick taps are two additions, not a stale overwrite. */
  stepPackingQuantity(
    viewerId: string,
    tripId: number,
    lineId: number,
    delta: 1 | -1,
  ): Promise<void>;

  /** Soft-deletes one line (rule 8). A shared line is anyone's to drop; a personal one only its owner's. */
  removePackingLine(viewerId: string, tripId: number, lineId: number): Promise<void>;

  /** Same reach as remove (#362). Claims hang off the line, so they survive it. */
  renamePackingLine(viewerId: string, tripId: number, lineId: number, label: string): Promise<void>;

  /**
   * Several lines in one press (ticket 229). Every id is still resolved one at
   * a time on the host side: the bulk shape is a convenience for the person,
   * never a way round the per-line check, so a set holding somebody else's
   * personal line is refused whole rather than filtered down to the allowed part.
   */
  removePackingLines(viewerId: string, tripId: number, lineIds: number[]): Promise<void>;

  /**
   * Empties one whole list. `mine` picks which, and it is the only input — the
   * scope is applied in the host's SQL, so "clear my bag" cannot be spelled as
   * "clear someone else's". The shared list is the group's, so any member may.
   */
  resetPackingList(viewerId: string, tripId: number, mine: boolean): Promise<void>;

  /** This trip only. Light for one weekend must not become the default everywhere (ticket 220). */
  setPackTier(viewerId: string, tripId: number, tier: PackTier): Promise<void>;

  /**
   * Fills the bag from the trip's length, weather and tier (ticket 221).
   * Additive — pressing it again tops the list up rather than replacing it, so
   * nothing already edited is at risk. Refused without the entitlement.
   */
  fillMyBag(viewerId: string, tripId: number): Promise<void>;

  /** One idea by its label (#469). Adds nothing for a label that is no longer an idea. Refused without the entitlement. */
  takePackingIdea(viewerId: string, tripId: number, label: string): Promise<void>;

  /** Removes the viewer's unpacked suggested lines (#469). Not gated: Pro buys the action, never the undo. */
  removeSuggestedPacking(viewerId: string, tripId: number): Promise<void>;

  /** Copies a saved kit into the bag (ticket 230). Additive and idempotent. */
  applyPackingKit(viewerId: string, tripId: number, kitId: number): Promise<void>;

  /**
   * Saves the viewer's bag on this trip as a new kit (ticket 230).
   *
   * THE BAG IS THE EDITOR. A kit is a list of labels, and the phone already has
   * a good one — the bag. So a kit is made by naming what is in front of you,
   * not by building a second list on a second screen. Returns false at the kit
   * ceiling, like every other capped list here.
   */
  savePackingKit(viewerId: string, tripId: number, name: string): Promise<boolean>;

  /** Removes one of the viewer's own kits. Bags already filled from it are untouched. */
  deletePackingKit(viewerId: string, kitId: number): Promise<void>;

  /** The viewer's saved lists with their things — the screen draws them all (ticket 230). */
  listMyKits(viewerId: string): Promise<SavedKit[]>;

  /** Null at the kit ceiling, like every other capped list here — never a throw. */
  createKit(viewerId: string, name: string): Promise<{ id: number } | null>;

  renameKit(viewerId: string, kitId: number, name: string): Promise<void>;

  /** Owner-scoped. Bags already filled from it keep their things — a kit is a stencil. */
  deleteKit(viewerId: string, kitId: number): Promise<void>;

  addKitItem(
    viewerId: string,
    kitId: number,
    input: { label: string; category: PackCategory; quantity: number },
  ): Promise<void>;

  removeKitItem(viewerId: string, itemId: number): Promise<void>;

  /** A delta, not a total — two quick taps are two additions, clamped in SQL. */
  stepKitItemQuantity(viewerId: string, itemId: number, delta: 1 | -1): Promise<void>;
};
