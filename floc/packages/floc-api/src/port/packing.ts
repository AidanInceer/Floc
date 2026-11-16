import type { PackCategory, PackTier } from "@floc/core/packing/packing";

export type SavedKit = {
  id: number;
  name: string;
  items: { id: number; label: string; category: PackCategory; quantity: number }[];
};

export type PackingShared = {
  id: number;
  label: string;
  category: PackCategory;
  claims: { userId: string; name: string; packed: boolean }[];
};

export type PackingMine = {
  id: number;
  label: string;
  category: PackCategory;
  quantity: number;
  packed: boolean;
  suggested: boolean;
};

export type PackingIdea = { label: string; category: PackCategory; quantity: number };

export type PackingPlanSummary = {
  nights: number | null;
  climate: { hot: boolean; cold: boolean; wet: boolean } | null;
  gap: "no-dates" | "no-place" | "no-forecast" | null;
  places: string[];
  hottest: number | null; firstRain: string | null;
};

export type PackingKit = { id: number; name: string; itemCount: number };

export type PackingBoard = {
  shared: PackingShared[];
  mine: PackingMine[];
  tier: PackTier;
  kits: PackingKit[];
  canAutoFill: boolean;
  ideas: PackingIdea[];
  plan: PackingPlanSummary;
};

export type PackingPort = {
  loadPacking(viewerId: string, tripId: number): Promise<PackingBoard>;

  addPackingLine(
    viewerId: string,
    tripId: number,
    input: { label: string; category: PackCategory | null; mine: boolean },
  ): Promise<void>;

  claimPackingLine(
    viewerId: string,
    tripId: number,
    lineId: number,
    claimed: boolean,
  ): Promise<void>;

  setPackingPacked(
    viewerId: string,
    tripId: number,
    lineId: number,
    packed: boolean,
  ): Promise<void>;

  stepPackingQuantity(
    viewerId: string,
    tripId: number,
    lineId: number,
    delta: 1 | -1,
  ): Promise<void>;

  removePackingLine(viewerId: string, tripId: number, lineId: number): Promise<void>;

  renamePackingLine(viewerId: string, tripId: number, lineId: number, label: string): Promise<void>;

  removePackingLines(viewerId: string, tripId: number, lineIds: number[]): Promise<void>;

  resetPackingList(viewerId: string, tripId: number, mine: boolean): Promise<void>;

  setPackTier(viewerId: string, tripId: number, tier: PackTier): Promise<void>;

  fillMyBag(viewerId: string, tripId: number): Promise<void>;

  takePackingIdea(viewerId: string, tripId: number, label: string): Promise<void>;

  removeSuggestedPacking(viewerId: string, tripId: number): Promise<void>;

  applyPackingKit(viewerId: string, tripId: number, kitId: number): Promise<void>;

  savePackingKit(viewerId: string, tripId: number, name: string): Promise<boolean>;

  deletePackingKit(viewerId: string, kitId: number): Promise<void>;

  listMyKits(viewerId: string): Promise<SavedKit[]>;

  createKit(viewerId: string, name: string): Promise<{ id: number } | null>;

  renameKit(viewerId: string, kitId: number, name: string): Promise<void>;

  deleteKit(viewerId: string, kitId: number): Promise<void>;

  addKitItem(
    viewerId: string,
    kitId: number,
    input: { label: string; category: PackCategory; quantity: number },
  ): Promise<void>;

  removeKitItem(viewerId: string, itemId: number): Promise<void>;

  stepKitItemQuantity(viewerId: string, itemId: number, delta: 1 | -1): Promise<void>;
};
