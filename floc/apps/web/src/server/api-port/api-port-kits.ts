import "server-only";

import type { FlocPort, SavedKit } from "@floc/api/port";

import type { PackCategory } from "@floc/core/packing/packing";
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
    return id === null ? null : { id };
  },

  async renameKit(viewerId, kitId, name) {
    await renamePackingKit(kitId, viewerId, name);
  },

  async deleteKit(viewerId, kitId) {
    await softDeletePackingKit(kitId, viewerId);
  },

  async addKitItem(viewerId, kitId, input) {
    await insertPackingKitItem(
      kitId,
      viewerId,
      input.label,
      input.category,
      input.quantity,
    );
  },

  async removeKitItem(viewerId, itemId) {
    await softDeletePackingKitItem(itemId, viewerId);
  },

  async stepKitItemQuantity(viewerId, itemId, delta) {
    await stepPackingKitItemQuantity(itemId, viewerId, delta);
  },
};
