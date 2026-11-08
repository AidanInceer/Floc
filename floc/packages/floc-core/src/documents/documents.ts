/**
 * Pure rules for trip documents (ticket 239) — what may be uploaded, how big,
 * and how a file is described on screen. No I/O: the store and the aggregate
 * both validate through here, so "is this allowed?" has one answer.
 */
import { asText, TEXT_CAPS } from "../text/text";


/** 8 MB. A boarding pass is kilobytes; this is generous for a scanned visa. */
const MAX_DOCUMENT_BYTES = 8 * 1024 * 1024;
export const MAX_DOCUMENT_BASE64_LENGTH = Math.ceil(MAX_DOCUMENT_BYTES / 3) * 4;

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

/**
 * What a file is filed under (ticket 239). Five buckets, because a booking
 * is one of a small number of things and a free-text folder name is a
 * taxonomy nobody maintains. `other` is the bucket, not a failure.
 */
export const DOC_CATEGORIES = [
  "travel",
  "hotel",
  "tickets",
  "admin",
  "other",
] as const;

export type DocCategory = (typeof DOC_CATEGORIES)[number];

export const DOC_CATEGORY_LABELS: Record<DocCategory, string> = {
  travel: "Travel",
  hotel: "Hotel",
  tickets: "Tickets",
  admin: "Admin",
  other: "Other",
};

/** One colour per bucket on every surface. Literal class names, so Tailwind finds them. */
export const DOC_CATEGORY_SKINS: Record<DocCategory, string> = {
  travel: "bg-pastel-blue text-pastel-blue-ink",
  hotel: "bg-pastel-green text-pastel-green-ink",
  tickets: "bg-pastel-yellow text-pastel-yellow-ink",
  admin: "bg-pastel-red text-pastel-red-ink",
  other: "bg-sheet-3 text-ink-soft",
};

/** The same colours as a bordered chip, for a file named in a row. */
export const DOC_CATEGORY_CHIPS: Record<DocCategory, string> = {
  travel: "border border-pastel-blue-edge bg-pastel-blue text-pastel-blue-ink hover:border-pastel-blue-ink",
  hotel: "border border-pastel-green-edge bg-pastel-green text-pastel-green-ink hover:border-pastel-green-ink",
  tickets: "border border-pastel-yellow-edge bg-pastel-yellow text-pastel-yellow-ink hover:border-pastel-yellow-ink",
  admin: "border border-pastel-red-edge bg-pastel-red text-pastel-red-ink hover:border-pastel-red-ink",
  other: "border border-rule-strong bg-sheet-3 text-ink-soft hover:border-ink-faint",
};

/** The phone's token for each colour: the base of `pastel-<tone>` and `pastel-<tone>-ink`; other is grey, with no pastel. */
export const DOC_CATEGORY_TONES: Record<DocCategory, "blue" | "green" | "yellow" | "red" | null> = {
  travel: "blue",
  hotel: "green",
  tickets: "yellow",
  admin: "red",
  other: null,
};

/** Why: a phone build from before the rename to hotel still sends `stay`. */
const LEGACY_CATEGORY: Record<string, DocCategory> = { stay: "hotel" };

function knownCategory(value: unknown): DocCategory | null {
  const s = asText(value);
  if ((DOC_CATEGORIES as readonly string[]).includes(s)) return s as DocCategory;
  return LEGACY_CATEGORY[s] ?? null;
}

/** What the phone's API accepts for a category: the current keys and the old ones. */
export const DOC_CATEGORY_INPUTS = [...DOC_CATEGORIES, ...Object.keys(LEGACY_CATEGORY)] as [string, ...string[]];

/** Anything off the list falls to `other` — filing is not data worth refusing a file over. */
export function parseDocCategory(value: unknown): DocCategory {
  return knownCategory(value) ?? "other";
}

/** "all" is a real answer, not a missing one (rule 11). */
export function parseCategoryFilter(value: unknown): DocCategory | "all" {
  return knownCategory(value) ?? "all";
}

export type AllowedType = { mimeType: string; ext: string; kind: DocumentKind };

/** The `accept` attribute, so the file picker and the server agree. */
export const DOCUMENT_ACCEPT = Object.keys(ALLOWED).join(",");

export function allowedType(mimeType: unknown): AllowedType | null {
  const found = ALLOWED[asText(mimeType).toLowerCase()];
  return found ? { mimeType: asText(mimeType).toLowerCase(), ...found } : null;
}

function documentKind(mimeType: string): DocumentKind {
  return allowedType(mimeType)?.kind ?? "pdf";
}

/** The 3-letter badge on a row. Not colour alone — it is the word too. */
export function kindLabel(mimeType: string): string {
  return documentKind(mimeType) === "image" ? "IMG" : "PDF";
}

/** Why: a name that looks like a path invites a reader to treat it as one, and a stray quote ends the serve route's quoted header early. */
export function cleanFileName(raw: unknown, fallback = "Document"): string {
  const name = asText(raw)
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/["\\/]/g, " ")
    .trim()
    .slice(0, TEXT_CAPS.documentName);
  return name || fallback;
}

/**
 * A new display name for a file already stored (#364). The bytes never change,
 * so a name typed without the extension gets the old one back — a download
 * called "Ferry to Mull" opens as nothing on a desktop.
 */
export function renamedFileName(raw: unknown, previous: string): string | null {
  const cleaned = cleanFileName(raw, "");
  if (!cleaned) return null;
  const extension = /\.[a-z0-9]{1,5}$/i.exec(previous)?.[0] ?? "";
  if (!extension || cleaned.toLowerCase().endsWith(extension.toLowerCase())) return cleaned;
  return cleaned.slice(0, TEXT_CAPS.documentName - extension.length).trimEnd() + extension;
}

/** "240 KB", "1.1 MB" — sized for a row, never more than one decimal. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  const oneDecimal = (n: number) => n.toFixed(1).replace(/\.0$/, "");
  if (mb < 1024) return `${oneDecimal(mb)} MB`;
  return `${oneDecimal(mb / 1024)} GB`;
}

/**
 * Free: what one trip may hold, shared and private together (#285). Pro: a member's own files on
 * one trip (#523). Deleted files give their bytes back. Pro's number is not printed on the landing
 * page — it sells "extra storage", so this can move without the copy going wrong.
 */
export const FREE_TRIP_STORAGE_BYTES = 200 * 1024 ** 2;
export const PRO_TRIP_STORAGE_BYTES = 1024 ** 3;

export function tripStorageBytes(pro: boolean): number {
  return pro ? PRO_TRIP_STORAGE_BYTES : FREE_TRIP_STORAGE_BYTES;
}

/** Refuses an upload that would pass its room, naming what is left: the trip's, or a Pro member's own (#523). */
export function rejectForSpace(usedBytes: number, incomingBytes: number, quotaBytes: number, own = false): string | null {
  const left = quotaBytes - usedBytes;
  const quota = formatBytes(quotaBytes);
  const size = formatBytes(incomingBytes);
  if (left <= 0) {
    return own
      ? `Your files on this trip have used all of your ${quota}. Remove a file to make room.`
      : `This trip has used all of its ${quota}. Remove a file to make room.`;
  }
  if (incomingBytes <= left) return null;
  return own
    ? `You have ${formatBytes(left)} of your ${quota} left on this trip, and that file is ${size}.`
    : `This trip has ${formatBytes(left)} of its ${quota} left, and that file is ${size}.`;
}

const HEIC_BRANDS = ["heic", "heix", "hevc", "heim", "heis", "mif1", "msf1"];

const startsWith = (data: Uint8Array, prefix: number[], offset = 0) =>
  prefix.every((byte, i) => data[offset + i] === byte);

const ascii = (text: string) => Array.from(new TextEncoder().encode(text));

const SIGNATURES: Record<string, (data: Uint8Array) => boolean> = {
  "application/pdf": (d) => startsWith(d, ascii("%PDF-")),
  "image/png": (d) => startsWith(d, [0x89, ...ascii("PNG"), 0x0d, 0x0a, 0x1a, 0x0a]),
  "image/jpeg": (d) => startsWith(d, [0xff, 0xd8, 0xff]),
  "image/heic": (d) =>
    startsWith(d, ascii("ftyp"), 4) && HEIC_BRANDS.some((b) => startsWith(d, ascii(b), 8)),
};

/** Why: the MIME type is the client's claim; the served Content-Type echoes it, so the bytes must agree. */
export function bytesMatchType(mimeType: unknown, data: Uint8Array): boolean {
  const type = allowedType(mimeType);
  return !!type && (SIGNATURES[type.mimeType]?.(data) ?? false);
}

/** Why an upload was refused, in the words the form shows. Null = fine. */
export function rejectUpload(
  mimeType: unknown,
  bytes: number,
): string | null {
  if (bytes <= 0) return "That file is empty";
  if (bytes > MAX_DOCUMENT_BYTES) return "Files are capped at 8 MB";
  if (!allowedType(mimeType)) return "Only PDFs and images can go here";
  return null;
}
