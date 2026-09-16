import { Directory, File, Paths } from "expo-file-system";

// Why a file: edits made offline must outlive the app being closed (#394).
const folder = () => new Directory(Paths.document, "notes");

const fileFor = (tripId: number) => new File(folder(), `${tripId}.yjs`);

export function readCachedNotes(tripId: number): Uint8Array | null {
  const file = fileFor(tripId);
  try {
    return file.exists ? file.bytesSync() : null;
  } catch {
    return null;
  }
}

export function writeCachedNotes(tripId: number, state: Uint8Array): void {
  folder().create({ idempotent: true, intermediates: true });
  fileFor(tripId).write(state);
}

export function forgetCachedNotes(): void {
  const notes = folder();
  if (notes.exists) notes.delete();
}
