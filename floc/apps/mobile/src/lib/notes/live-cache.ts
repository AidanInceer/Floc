import { Directory, File, Paths } from "expo-file-system";

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

export function forgetCachedNotes(): void {
  const notes = folder();
  if (notes.exists) notes.delete();
}
