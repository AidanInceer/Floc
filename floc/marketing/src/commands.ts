import { readFileSync } from "node:fs";
import type { Published } from "./instagram.ts";
import { checkPiece, mediaOf, readCaption, sha256, writeRecord } from "./piece.ts";
import { STAGES, findPiece, listPieces, movePiece, type Piece, type Stage } from "./stages.ts";

export interface Context {
  content: string;
  log: (line: string) => void;
  confirm: (question: string) => Promise<boolean>;
  instagram: { publish: (video: Uint8Array, caption: string) => Promise<Published> } | { missing: string[] };
  now: () => Date;
}

export function status(ctx: Context): void {
  const pieces = listPieces(ctx.content);
  for (const stage of STAGES) {
    ctx.log(stage);
    const here = pieces.filter((p) => p.stage === stage);
    if (here.length === 0) ctx.log("  —");
    for (const p of here) {
      const n = stage === "raw" ? checkPiece(p.dir).length : 0;
      ctx.log(n ? `  ${p.slug}  (${n} problem${n > 1 ? "s" : ""})` : `  ${p.slug}`);
    }
  }
}

function pieceIn(ctx: Context, slug: string, stage: Stage, hint = ""): Piece | undefined {
  const piece = findPiece(ctx.content, slug);
  if (!piece) ctx.log(`No piece called ${slug}.`);
  else if (piece.stage !== stage) ctx.log(`${slug} is in ${piece.stage}${hint ? `. ${hint}` : `, not ${stage}.`}`);
  else return piece;
  return undefined;
}

function passes(ctx: Context, piece: Piece): boolean {
  const problems = checkPiece(piece.dir);
  if (problems.length === 0) return true;
  ctx.log(`${piece.slug} is not ready:`);
  for (const p of problems) ctx.log(`  ${p}`);
  return false;
}

export function approve(ctx: Context, slug: string): boolean {
  const piece = pieceIn(ctx, slug, "raw");
  if (!piece || !passes(ctx, piece)) return false;
  movePiece(ctx.content, piece, "reviewed");
  ctx.log(`${slug} → reviewed`);
  return true;
}

export function reopen(ctx: Context, slug: string): boolean {
  const piece = pieceIn(ctx, slug, "reviewed");
  if (!piece) return false;
  movePiece(ctx.content, piece, "raw");
  ctx.log(`${slug} → raw`);
  return true;
}

export async function publish(ctx: Context, slug: string, opts: { yes?: boolean; dryRun?: boolean }): Promise<boolean> {
  const piece = pieceIn(ctx, slug, "reviewed", `Approve it first: pnpm marketing approve ${slug}`);
  if (!piece || !passes(ctx, piece)) return false;

  const media = mediaOf(piece.dir);
  if (media.kind !== "reel") {
    ctx.log("Stills cannot be published yet: Instagram fetches images from a public URL, and none is set up.");
    return false;
  }
  if ("missing" in ctx.instagram) {
    ctx.log(`Instagram is not set up. Add ${ctx.instagram.missing.join(", ")} to floc/marketing/.env.local.`);
    return false;
  }

  const caption = readCaption(piece.dir);
  ctx.log(`Reel: ${media.file}`);
  ctx.log(`Caption:\n${caption}`);
  if (opts.dryRun) {
    ctx.log("Dry run: nothing posted.");
    return true;
  }
  if (!opts.yes && !(await ctx.confirm("Post this to Instagram now?"))) return false;

  try {
    const { mediaId, permalink } = await ctx.instagram.publish(readFileSync(media.file), caption);
    writeRecord(piece.dir, { platform: "instagram", mediaId, permalink, publishedAt: ctx.now().toISOString(), sha256: sha256(media.file) });
    movePiece(ctx.content, piece, "live");
    ctx.log(`Live: ${permalink}`);
    return true;
  } catch (e) {
    ctx.log(e instanceof Error ? e.message : String(e));
    return false;
  }
}
