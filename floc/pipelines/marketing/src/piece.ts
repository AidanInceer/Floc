import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";
import { checkCaption } from "./caption.ts";

export type Media = { kind: "reel"; file: string } | { kind: "stills"; files: string[] } | { kind: "none" };

export interface PublishRecord {
  platform: "instagram";
  mediaId: string;
  permalink: string;
  publishedAt: string;
  sha256: string;
}

const CAPTION = "post.md";
const RECORD = "published.json";

export function mediaOf(dir: string): Media {
  const files = readdirSync(dir).sort((a, b) => a.localeCompare(b));
  const videos = files.filter((f) => extname(f) === ".mp4");
  const stills = files.filter((f) => [".png", ".jpg"].includes(extname(f)));
  if (videos.length === 1) return { kind: "reel", file: join(dir, videos[0]) };
  if (videos.length === 0 && stills.length > 0) return { kind: "stills", files: stills.map((f) => join(dir, f)) };
  return { kind: "none" };
}

export function readCaption(dir: string): string {
  const file = join(dir, CAPTION);
  return existsSync(file) ? readFileSync(file, "utf8").trim() : "";
}

export function checkPiece(dir: string): string[] {
  const problems = checkCaption(readCaption(dir));
  if (mediaOf(dir).kind === "none") problems.push("No media: add one .mp4, or one or more .png/.jpg.");
  return problems;
}

export function sha256(file: string): string {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

export function writeRecord(dir: string, record: PublishRecord): void {
  writeFileSync(join(dir, RECORD), `${JSON.stringify(record, null, 2)}\n`);
}

export function readRecord(dir: string): PublishRecord | undefined {
  const file = join(dir, RECORD);
  return existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")) as PublishRecord) : undefined;
}
