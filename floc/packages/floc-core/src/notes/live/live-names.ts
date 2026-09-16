export const LIVE_NOTES_PATH = "/live/notes";

export const NOTES_FRAGMENT = "document-store";

const PREFIX = "trip-notes:";

export const notesDocumentName = (tripId: number) => `${PREFIX}${tripId}`;

export function tripIdOf(documentName: string): number | null {
  if (!documentName.startsWith(PREFIX)) return null;
  const id = Number(documentName.slice(PREFIX.length));
  return Number.isInteger(id) && id > 0 ? id : null;
}
