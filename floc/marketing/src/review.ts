import { randomUUID } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { isSlug } from "./stages.ts";

export const STATUSES = ["exploring", "chosen", "parked"] as const;
export type Status = (typeof STATUSES)[number];

export interface Note {
  id: string;
  t: number;
  text: string;
  at: string;
}

export interface Review {
  status: Status;
  notes: Note[];
}

export interface Variant {
  scene: string;
  key: string;
  title: string;
  about: string;
  review: Review;
}

export interface Post {
  type: string;
  post: string;
  variants: Variant[];
}

const FILE = "review.json";
const MAX_NOTE = 2000;

const meta = (html: string, name: string) =>
  new RegExp(`<meta\\s+name="${name}"\\s+content="([^"]*)"`, "i").exec(html)?.[1]?.trim() ?? "";

export function readReview(dir: string): Review {
  const file = join(dir, FILE);
  if (!existsSync(file)) return { status: "exploring", notes: [] };
  return JSON.parse(readFileSync(file, "utf8")) as Review;
}

function writeReview(dir: string, review: Review): void {
  writeFileSync(join(dir, FILE), `${JSON.stringify(review, null, 2)}\n`);
}

function readVariant(scenes: string, scene: string): (Variant & { post: string; type: string }) | undefined {
  const file = join(scenes, scene, "index.html");
  if (!existsSync(file)) return undefined;
  const html = readFileSync(file, "utf8");
  return {
    scene,
    post: meta(html, "mk-post") || scene,
    type: meta(html, "mk-type") || "Reel",
    key: meta(html, "mk-variant") || scene,
    title: /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]?.trim() ?? scene,
    about: meta(html, "description"),
    review: readReview(join(scenes, scene)),
  };
}

export function listPosts(scenes: string): Post[] {
  const posts = new Map<string, Variant[]>();
  const types = new Map<string, string>();
  for (const scene of readdirSync(scenes)) {
    if (!isSlug(scene) || !statSync(join(scenes, scene)).isDirectory()) continue;
    const found = readVariant(scenes, scene);
    if (!found) continue;
    const { post, type, ...variant } = found;
    if (!types.has(post)) types.set(post, type);
    posts.set(post, [...(posts.get(post) ?? []), variant]);
  }
  return [...posts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([post, variants]) => ({
      type: types.get(post) ?? "Reel",
      post,
      variants: variants.sort((a, b) => a.key.localeCompare(b.key, "en", { numeric: true })),
    }));
}

const sceneDir = (scenes: string, scene: string) =>
  isSlug(scene) && existsSync(join(scenes, scene, "index.html")) ? join(scenes, scene) : undefined;

export function addNote(scenes: string, scene: string, t: number, text: string, now: Date): Note | string {
  const dir = sceneDir(scenes, scene);
  if (!dir) return `No scene ${scene}.`;
  const clean = text.trim();
  if (!clean) return "The note is empty.";
  if (clean.length > MAX_NOTE) return `A note holds at most ${MAX_NOTE} characters.`;
  if (!Number.isFinite(t) || t < 0) return "The time must be zero or more seconds.";
  const note = { id: randomUUID().slice(0, 8), t: Math.round(t * 10) / 10, text: clean, at: now.toISOString() };
  const review = readReview(dir);
  writeReview(dir, { ...review, notes: [...review.notes, note].sort((a, b) => a.t - b.t) });
  return note;
}

export function removeNote(scenes: string, scene: string, id: string): string | undefined {
  const dir = sceneDir(scenes, scene);
  if (!dir) return `No scene ${scene}.`;
  const review = readReview(dir);
  const notes = review.notes.filter((n) => n.id !== id);
  if (notes.length === review.notes.length) return `No note ${id}.`;
  writeReview(dir, { ...review, notes });
  return undefined;
}

export function setStatus(scenes: string, scene: string, status: string): string | undefined {
  const dir = sceneDir(scenes, scene);
  if (!dir) return `No scene ${scene}.`;
  if (!(STATUSES as readonly string[]).includes(status)) return `Status is one of ${STATUSES.join(", ")}.`;
  if (status === "chosen") {
    const post = listPosts(scenes).find((p) => p.variants.some((v) => v.scene === scene));
    for (const v of post?.variants ?? []) {
      if (v.scene !== scene && v.review.status === "chosen") writeReview(join(scenes, v.scene), { ...v.review, status: "exploring" });
    }
  }
  writeReview(dir, { ...readReview(dir), status: status as Status });
  return undefined;
}
