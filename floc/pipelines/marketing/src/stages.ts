import { existsSync, readdirSync, renameSync, statSync } from "node:fs";
import { join } from "node:path";

export const STAGES = ["raw", "reviewed", "live"] as const;
export type Stage = (typeof STAGES)[number];

export interface Piece {
  slug: string;
  stage: Stage;
  dir: string;
}

export const isSlug = (s: string): boolean => /^[a-z0-9][a-z0-9-]*$/.test(s);

export function listPieces(content: string): Piece[] {
  return STAGES.flatMap((stage) => {
    const root = join(content, stage);
    if (!existsSync(root)) return [];
    return readdirSync(root)
      .filter((slug) => isSlug(slug) && statSync(join(root, slug)).isDirectory())
      .sort((a, b) => a.localeCompare(b))
      .map((slug) => ({ slug, stage, dir: join(root, slug) }));
  });
}

export function findPiece(content: string, slug: string): Piece | undefined {
  return listPieces(content).find((p) => p.slug === slug);
}

export function movePiece(content: string, piece: Piece, to: Stage): Piece {
  const dir = join(content, to, piece.slug);
  if (existsSync(dir)) throw new Error(`${piece.slug} is already in ${to}.`);
  renameSync(piece.dir, dir);
  return { slug: piece.slug, stage: to, dir };
}
