import "server-only";

import { tripStorageBytes } from "@floc/core/documents/documents";

import { canUseFeature } from "@/server/billing/entitlements";
import { usedBytes } from "@/server/documents/documents";

export async function storageUsage(tripId: number): Promise<{ usedBytes: number; quotaBytes: number }> {
  const [used, pro] = await Promise.all([
    usedBytes(tripId),
    canUseFeature("files.extraStorage", tripId),
  ]);
  return { usedBytes: used, quotaBytes: tripStorageBytes(pro) };
}
