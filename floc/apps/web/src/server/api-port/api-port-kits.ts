/**
 * The port's saved-lists half (ticket 230; split out of `api-port.ts`).
 *
 * NOT A TRIP SURFACE. There is no `requireTripAccess` here because a kit
 * belongs to a person, not a trip — `server/packing-kits` carries the owner on
 * every write rather than trusting a resolved id, so somebody else's list is
 * not addressable rather than merely refused.
 */
import "server-only";

import type { FlocPort, SavedKit } from "@floc/api/port";

import type { PackCategory } from "@floc/core/packing/packing";
import { refresh } from "@/server/freshness";
import {
  insertPackingKit,
  insertPackingKitItem,
  listPackingKitsWithItems,
  renamePackingKit,
  softDeletePackingKit,
  softDeletePackingKitItem,
  stepPackingKitItemQuantity,
} from "@/server/packing/packing-kits";

type KitsPort = Pick<
  FlocPort,
  | "listMyKits"
  | "createKit"
  | "renameKit"
  | "deleteKit"
  | "addKitItem"
  | "removeKitItem"
  | "stepKitItemQuantity"
>;

export const kitsPort: KitsPort = {
  async listMyKits(viewerId): Promise<SavedKit[]> {
    const kits = await listPackingKitsWithItems(viewerId);
    return kits.map((kit) => ({
      id: kit.id,
      name: kit.name,
      items: kit.items.map((item) => ({
        id: item.id,
        label: item.label,
        category: item.category as PackCategory,
        quantity: item.quantity,
      })),
    }));
  },

  async createKit(viewerId, name) {
    const id = await insertPackingKit(viewerId, name);
    refresh({ kind: "packingKits" });
    // Null is the ceiling, not a failure — the caller draws the cap.
    return id === null ? null : { id };
  },

  async renameKit(viewerId, kitId, name) {
    await renamePackingKit(kitId, viewerId, name);
    refresh({ kind: "packingKits" });
  },

  async deleteKit(viewerId, kitId) {
    await softDeletePackingKit(kitId, viewerId);
    refresh({ kind: "packingKits" });
  },

  async addKitItem(viewerId, kitId, input) {
    await insertPackingKitItem(
      kitId,
      viewerId,
      input.label,
      input.category,
      input.quantity,
    );
    refresh({ kind: "packingKits" });
  },

  async removeKitItem(viewerId, itemId) {
    await softDeletePackingKitItem(itemId, viewerId);
    refresh({ kind: "packingKits" });
  },

  async stepKitItemQuantity(viewerId, itemId, delta) {
    await stepPackingKitItemQuantity(itemId, viewerId, delta);
    refresh({ kind: "packingKits" });
  },
};
