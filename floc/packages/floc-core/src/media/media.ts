import { formatBytes } from "../documents/documents";
import { asText } from "../text/text";

export const MEDIA_KINDS = ["photo", "video"] as const;
export type MediaKind = (typeof MEDIA_KINDS)[number];

const MB = 1024 ** 2;
const GB = 1024 ** 3;

export const MEDIA_LIMITS = {
  free: { photos: 100, photoBytes: 10 * MB, videoBytes: 0, spaceBytes: GB },
  pro: { photos: 1000, photoBytes: 50 * MB, videoBytes: GB, spaceBytes: 10 * GB },
} as const;

const TYPES: Record<string, { ext: string; kind: MediaKind }> = {
  "image/jpeg": { ext: "jpg", kind: "photo" },
  "image/png": { ext: "png", kind: "photo" },
  "image/webp": { ext: "webp", kind: "photo" },
  "video/mp4": { ext: "mp4", kind: "video" },
  "video/quicktime": { ext: "mov", kind: "video" },
  "video/webm": { ext: "webm", kind: "video" },
};

export const MEDIA_ACCEPT = Object.keys(TYPES).join(",");
export const VIDEO_LOCATION_NOTE = "A video keeps any location saved in the file.";

export type MediaType = { mimeType: string; ext: string; kind: MediaKind };

export function mediaType(mimeType: unknown): MediaType | null {
  const key = asText(mimeType).trim().toLowerCase();
  const found = TYPES[key];
  return found ? { mimeType: key, ...found } : null;
}

export function refuseType(mimeType: unknown): string {
  return /hei[cf]/i.test(asText(mimeType))
    ? "HEIC photos cannot be added yet. Save it as a JPEG."
    : "Add a JPEG, PNG or WebP photo, or an MP4, MOV or WebM video.";
}

type Upload = {
  pro: boolean;
  kind: MediaKind;
  sizeBytes: number;
  photosHeld: number;
  usedBytes: number;
};

export function maxBytesFor(pro: boolean, kind: MediaKind): number {
  const limits = pro ? MEDIA_LIMITS.pro : MEDIA_LIMITS.free;
  return kind === "video" ? limits.videoBytes : limits.photoBytes;
}

export function rejectMedia({ pro, kind, sizeBytes, photosHeld, usedBytes }: Upload): string | null {
  const limits = pro ? MEDIA_LIMITS.pro : MEDIA_LIMITS.free;
  if (kind === "video" && !pro) return "Video needs Pro.";
  if (kind === "photo" && photosHeld >= limits.photos) {
    return `This trip holds its ${limits.photos.toLocaleString("en-GB")} photos.`;
  }
  if (sizeBytes > maxBytesFor(pro, kind)) {
    return kind === "video"
      ? `Videos are capped at ${formatBytes(limits.videoBytes)}.`
      : `Photos are capped at ${formatBytes(limits.photoBytes)}${pro ? "" : " on Free"}.`;
  }
  const left = limits.spaceBytes - usedBytes;
  if (sizeBytes > left) return `This trip has ${formatBytes(Math.max(left, 0))} of photo and video space left.`;
  return null;
}

const text = (data: Uint8Array, from: number, to: number) => String.fromCharCode(...data.slice(from, to));
const starts = (data: Uint8Array, prefix: number[]) => prefix.every((byte, i) => data[i] === byte);
const MOV_ATOMS = ["moov", "mdat", "wide", "free", "skip"];

export const MEDIA_HEADER_BYTES = 16;

export function bytesMatchMedia(mimeType: string, data: Uint8Array): boolean {
  const box = text(data, 4, 8);
  const brand = text(data, 8, 12);
  switch (mimeType) {
    case "image/jpeg":
      return starts(data, [0xff, 0xd8, 0xff]);
    case "image/png":
      return starts(data, [0x89, 0x50, 0x4e, 0x47]);
    case "image/webp":
      return text(data, 0, 4) === "RIFF" && brand === "WEBP";
    case "video/mp4":
      return box === "ftyp";
    case "video/quicktime":
      return box === "ftyp" || MOV_ATOMS.includes(box);
    case "video/webm":
      return starts(data, [0x1a, 0x45, 0xdf, 0xa3]);
    default:
      return false;
  }
}

export type MediaStop = { placeId: number; no: number; name: string };
export type MediaGroup<T> = { key: string; no: number | null; name: string; placeId: number | null; items: T[] };

export function groupMedia<T extends { placeId: number | null }>(items: T[], stops: MediaStop[]): MediaGroup<T>[] {
  const groups: MediaGroup<T>[] = stops.map((s) => ({ key: String(s.no), no: s.no, name: s.name, placeId: s.placeId, items: [] }));
  const whole: MediaGroup<T> = { key: "trip", no: null, name: "Whole trip", placeId: null, items: [] };
  for (const item of items) {
    (groups.find((g) => g.placeId === item.placeId) ?? whole).items.push(item);
  }
  return [...groups, whole];
}

export function mediaShape(width: number | null, height: number | null): number {
  return width && height ? width / height : 1.5;
}

export function mediaRatio(width: number | null, height: number | null): number {
  return Math.min(2.2, Math.max(0.6, mediaShape(width, height)));
}

export function videoClock(seconds: number | null): string | null {
  if (seconds === null) return null;
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

const widthOf = (list: { ratio: number }[]) => list.reduce((sum, m) => sum + m.ratio, 0);

export function fillRows<T extends { ratio: number }>(list: T[], target: number): T[][] {
  if (list.length === 0) return [];
  const count = Math.max(1, Math.round(widthOf(list) / target));
  const ideal = widthOf(list) / count;
  const rows: T[][] = Array.from({ length: count }, () => []);
  let run = 0;
  for (const item of list) {
    rows[Math.min(count - 1, Math.floor((run + item.ratio / 2) / ideal))].push(item);
    run += item.ratio;
  }
  const full = rows.filter((row) => row.length > 0);
  const last = full[full.length - 1];
  if (full.length < 2 || last.length > 1) return full;
  full[full.length - 2].push(last[0]);
  return full.slice(0, -1);
}
