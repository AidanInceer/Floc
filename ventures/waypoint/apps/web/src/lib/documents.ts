/**
 * Pure rules for trip documents (ticket 239) — what may be uploaded, how big,
 * and how a file is described on screen. No I/O: the store and the aggregate
 * both validate through here, so "is this allowed?" has one answer.
 */
import { TEXT_CAPS } from "@/lib/text";


/** 10 MB. A boarding pass is kilobytes; this is generous for a scanned visa. */
const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

/**
 * Allow-list, not a deny-list. Keyed by MIME type because that is what the
 * browser sends and what the serve route echoes back — an extension is a
 * user-supplied string and decides nothing.
 */
const ALLOWED: Record<string, { ext: string; kind: DocumentKind }> = {
  "application/pdf": { ext: "pdf", kind: "pdf" },
  "image/png": { ext: "png", kind: "image" },
  "image/jpeg": { ext: "jpg", kind: "image" },
  "image/heic": { ext: "heic", kind: "image" },
};

export type DocumentKind = "pdf" | "image";

export type AllowedType = { mimeType: string; ext: string; kind: DocumentKind };

/** The `accept` attribute, so the file picker and the server agree. */
export const DOCUMENT_ACCEPT = Object.keys(ALLOWED).join(",");

export function allowedType(mimeType: unknown): AllowedType | null {
  const found = ALLOWED[String(mimeType ?? "").toLowerCase()];
  return found ? { mimeType: String(mimeType).toLowerCase(), ...found } : null;
}

export function documentKind(mimeType: string): DocumentKind {
  return allowedType(mimeType)?.kind ?? "pdf";
}

/** The 3-letter badge on a row. Not colour alone — it is the word too. */
export function kindLabel(mimeType: string): string {
  return documentKind(mimeType) === "image" ? "IMG" : "PDF";
}

/**
 * A file's own name, made safe to print and to store: no path separators, no
 * quotes, no control characters, capped, and never empty. It is only ever
 * a label — the bytes are addressed by `storageKey` — but a name that
 * looks like a path invites a reader to treat it as one, and the serve
 * route puts it in a quoted header, where a stray quote or backslash ends
 * the value early.
 */
export function cleanFileName(raw: unknown, fallback = "Document"): string {
  const name = String(raw ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/["\\/]/g, " ")
    .trim()
    .slice(0, TEXT_CAPS.documentName);
  return name || fallback;
}

/** "240 KB", "1.1 MB" — sized for a row, never more than one decimal. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

/** Why an upload was refused, in the words the form shows. Null = fine. */
export function rejectUpload(
  mimeType: unknown,
  bytes: number,
): string | null {
  if (bytes <= 0) return "That file is empty";
  if (bytes > MAX_DOCUMENT_BYTES) return "Files are capped at 10 MB";
  if (!allowedType(mimeType)) return "Only PDFs and images can go here";
  return null;
}
