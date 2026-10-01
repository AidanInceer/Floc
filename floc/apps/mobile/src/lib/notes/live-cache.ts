import type { PageCache } from "@floc/core/notes/live/live-session";
import { Directory, File, Paths } from "expo-file-system";
import * as Y from "yjs";

// Why a file: edits made offline must outlive the app being closed (#394, #408).
const folder = () => new Directory(Paths.document, "notes");

// Why the swap: a live doc's name has colons, which not every file system takes.
const fileFor = (documentName: string) => new File(folder(), `${documentName.replace(/:/g, "_")}.yjs`);

export function readCachedNotes(documentName: string): Uint8Array | null {
  const file = fileFor(documentName);
  try {
    return file.exists ? file.bytesSync() : null;
  } catch {
    return null;
  }
}

export function writeCachedNotes(documentName: string, state: Uint8Array): void {
  folder().create({ idempotent: true, intermediates: true });
  fileFor(documentName).write(state);
}

const SAVE_AFTER_MS = 500;

export const fileCache: PageCache = {
  open(key, doc) {
    const cached = readCachedNotes(key);
    if (cached) Y.applyUpdate(doc, cached);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const save = () => writeCachedNotes(key, Y.encodeStateAsUpdate(doc));
    const keep = () => {
      clearTimeout(timer);
      timer = setTimeout(save, SAVE_AFTER_MS);
    };
    doc.on("update", keep);
    return {
      destroy() {
        clearTimeout(timer);
        doc.off("update", keep);
        save();
      },
    };
  },
};

export function forgetCachedNotes(): void {
  const notes = folder();
  if (notes.exists) notes.delete();
}
