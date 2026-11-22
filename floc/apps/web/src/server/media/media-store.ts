import "server-only";

import { randomUUID } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream as NodeWebStream } from "node:stream/web";

import { MEDIA_HEADER_BYTES } from "@floc/core/media/media";

const FOLDER = "media";

function root(): string {
  const dir = process.env.FLOC_FILES_DIR?.trim();
  if (!dir) throw new Error("File storage is not set up");
  return path.resolve(dir);
}

export function mediaPath(storageKey: string): string | null {
  const dir = path.join(root(), FOLDER);
  const full = path.resolve(root(), storageKey);
  return full.startsWith(dir + path.sep) ? full : null;
}

export const thumbKeyOf = (storageKey: string) => `${storageKey}.thumb.webp`;
export const newMediaKey = (ext: string) => `${FOLDER}/${randomUUID()}.${ext}`;

export class TooLarge extends Error {}

export type Received = { file: string; sizeBytes: number; head: Uint8Array };

export async function receiveUpload(body: ReadableStream<Uint8Array>, maxBytes: number): Promise<Received> {
  const dir = path.join(root(), FOLDER);
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, `incoming-${randomUUID()}`);
  let sizeBytes = 0;
  let head = new Uint8Array(0);
  const counter = new Transform({
    transform(chunk: Buffer, _encoding, done) {
      sizeBytes += chunk.length;
      if (sizeBytes > maxBytes) { done(new TooLarge()); return; }
      if (head.length < MEDIA_HEADER_BYTES) {
        head = Uint8Array.from([...head, ...chunk.subarray(0, MEDIA_HEADER_BYTES - head.length)]);
      }
      done(null, chunk);
    },
  });
  try {
    await pipeline(Readable.fromWeb(body as NodeWebStream<Uint8Array>), counter, createWriteStream(file));
  } catch (error) {
    await rm(file, { force: true });
    throw error;
  }
  return { file, sizeBytes, head };
}

export async function keepAs(file: string, storageKey: string): Promise<void> {
  const target = mediaPath(storageKey);
  if (!target) throw new Error("File storage is not set up");
  await rename(file, target);
}

export const dropFile = (file: string) => rm(file, { force: true }).catch(() => {});

export async function dropMediaFiles(storageKey: string): Promise<void> {
  for (const key of [storageKey, thumbKeyOf(storageKey)]) {
    const full = mediaPath(key);
    if (full) await dropFile(full);
  }
}

export type ByteRange = { start: number; end: number };

export function parseRange(header: string | null, size: number): ByteRange | "invalid" | null {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match || (!match[1] && !match[2])) return "invalid";
  const start = match[1] ? Number(match[1]) : Math.max(size - Number(match[2]), 0);
  const end = match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  return start > end || start >= size ? "invalid" : { start, end };
}

export async function fileSize(storageKey: string): Promise<number | null> {
  const full = mediaPath(storageKey);
  if (!full) return null;
  return stat(full).then((found) => (found.isFile() ? found.size : null), () => null);
}

export function streamMedia(storageKey: string, range?: ByteRange): ReadableStream<Uint8Array> {
  const full = mediaPath(storageKey);
  if (!full) throw new Error("File storage is not set up");
  return Readable.toWeb(createReadStream(full, range)) as ReadableStream<Uint8Array>;
}
