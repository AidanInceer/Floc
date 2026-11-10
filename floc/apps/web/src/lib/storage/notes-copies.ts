import { LIVE_CACHE_PREFIX } from "@floc/core/notes/live/live-epoch";

type Stores = {
  databases?: () => Promise<{ name?: string }[]>;
  deleteDatabase: (name: string) => unknown;
};

/** Why: an open notes page is kept in the browser for offline edits, and on a shared browser it outlived sign-out (#582). */
export async function clearNotesCopies(stores: Stores | undefined = globalThis.indexedDB): Promise<void> {
  try {
    const all = (await stores?.databases?.()) ?? [];
    for (const { name } of all) {
      if (name?.startsWith(LIVE_CACHE_PREFIX)) stores?.deleteDatabase(name);
    }
  } catch {
    // A browser that refuses storage holds no copies.
  }
}
