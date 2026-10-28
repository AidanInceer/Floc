import { existsSync, mkdirSync, readdirSync, renameSync, rmSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";
import { approve, publish, reopen, status, type Context } from "./commands.ts";
import { publishReel, readInstagramConfig } from "./instagram.ts";
import { findPiece, isSlug } from "./stages.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repo = resolve(root, "..", "..");
const content = join(root, "content");
const env = join(root, ".env.local");
if (existsSync(env)) process.loadEnvFile(env);

const USAGE = `pnpm marketing <command>

  status                         every piece, by stage
  scenes                         scenes you can render
  studio                         review variants on http://localhost:4200
  render <scene> [--as <slug>] [--stills 0.5,3]
                                 render into content/raw/<slug>
  approve <slug>                 raw → reviewed, if the checks pass
  reopen <slug>                  reviewed → raw
  publish <slug> [--dry-run] [--yes]
                                 reviewed → Instagram → live`;

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(name);
const option = (name: string) => {
  const i = args.indexOf(name);
  return i > -1 ? args[i + 1] : undefined;
};

function context(): Context {
  const cfg = readInstagramConfig(process.env);
  return {
    content,
    log: (line) => { console.log(line); },
    confirm: async (question) => {
      if (!process.stdin.isTTY) return false;
      const rl = createInterface({ input: process.stdin, output: process.stdout });
      const answer = await rl.question(`${question} Type yes: `);
      rl.close();
      return answer.trim().toLowerCase() === "yes";
    },
    instagram: cfg.ok
      ? { publish: (video, caption) => publishReel(cfg.config, video, caption, { fetch, sleep: (ms) => new Promise((r) => setTimeout(r, ms)) }) }
      : { missing: cfg.missing },
    now: () => new Date(),
  };
}

async function renderCommand(scene: string): Promise<boolean> {
  const slug = option("--as") ?? scene;
  if (!isSlug(slug)) return fail(`“${slug}” is not a slug: lower-case letters, digits and hyphens.`);
  const held = findPiece(content, slug);
  if (held && held.stage !== "raw") return fail(`${slug} is already ${held.stage}. Render under a new name: --as ${slug}-2`);
  const stills = option("--stills")?.split(",").map(Number);
  const outDir = join(content, "raw", slug);
  const scratch = join(root, ".render");
  const fresh = join(scratch, `out-${slug}`);
  rmSync(fresh, { recursive: true, force: true });
  const { render, ensureCaptionFile } = await import("./render.ts");
  const files = await render({ repo, studio: join(root, "studio"), scene, outDir: fresh, scratch, ...(stills ? { stills } : {}) });
  mkdirSync(outDir, { recursive: true });
  for (const f of readdirSync(outDir)) if (/\.(mp4|png|jpg)$/.test(f)) rmSync(join(outDir, f));
  for (const f of files) {
    renameSync(f, join(outDir, basename(f)));
    console.log(`wrote ${join(outDir, basename(f))}`);
  }
  rmSync(fresh, { recursive: true, force: true });
  ensureCaptionFile(outDir);
  console.log(`Next: write the caption in content/raw/${slug}/post.md, then pnpm marketing approve ${slug}`);
  return true;
}

function fail(message: string): false {
  console.log(message);
  return false;
}

async function main(): Promise<boolean> {
  const [command, target] = args;
  const ctx = context();
  switch (command) {
    case "status": status(ctx); return true;
    case "studio": await import("./studio.ts"); return true;
    case "scenes": for (const s of readdirSync(join(root, "studio", "scenes"))) console.log(s); return true;
    case "render": return target ? renderCommand(target) : fail(USAGE);
    case "approve": return target ? approve(ctx, target) : fail(USAGE);
    case "reopen": return target ? reopen(ctx, target) : fail(USAGE);
    case "publish": return target ? publish(ctx, target, { yes: flag("--yes"), dryRun: flag("--dry-run") }) : fail(USAGE);
    default: return fail(USAGE);
  }
}

process.exitCode = (await main()) ? 0 : 1;
