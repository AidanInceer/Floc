import { LIVE_CACHE_PREFIX } from "@floc/core/notes/live/live-epoch";

type Stores = {
  databases?: () => Promise<{ name?: string }[]>;
  deleteDatabase: (name: string) => unknown;
};

export async function clearNotesCopies(stores: Stores | undefined = globalThis.indexedDB): Promise<void> {
  try {
    const all = (await stores?.databases?.()) ?? [];
    for (const { name } of all) {
      if (name?.startsWith(LIVE_CACHE_PREFIX)) stores?.deleteDatabase(name);
    }
  } catch {
  }
}
