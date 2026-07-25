// Where the browser's SQLite file lives between sessions.
//
// IndexedDB rather than localStorage: the database is a binary blob that grows
// past localStorage's string quota quickly, and IndexedDB stores Uint8Array
// natively. Writes are debounced — a slider drag fires many updates, and each
// one would otherwise serialise the whole file.

const DB_NAME = "finance-planner";
const STORE = "sqlite";
const FILE_KEY = "main";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function loadDatabaseFile(): Promise<Uint8Array | null> {
  try {
    const idb = await open();
    return await new Promise((resolve, reject) => {
      const req = idb.transaction(STORE, "readonly").objectStore(STORE).get(FILE_KEY);
      req.onsuccess = () => resolve((req.result as Uint8Array | undefined) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null; // no stored file, or storage unavailable — start fresh
  }
}

export async function saveDatabaseFile(bytes: Uint8Array): Promise<void> {
  const idb = await open();
  await new Promise<void>((resolve, reject) => {
    const tx = idb.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(bytes, FILE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteDatabaseFile(): Promise<void> {
  const idb = await open();
  await new Promise<void>((resolve, reject) => {
    const tx = idb.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(FILE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Collapse bursts of writes into one save. */
export function debouncePersist(ms = 250): (bytes: Uint8Array) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let latest: Uint8Array | null = null;

  return (bytes) => {
    latest = bytes;
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (latest) void saveDatabaseFile(latest);
      latest = null;
    }, ms);
  };
}
