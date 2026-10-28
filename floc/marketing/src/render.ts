import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { homedir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";
import { mimeOf, studioFile, tokensCss, type Roots } from "./serve.ts";

declare global {
  interface Window {
    seek: (t: number) => void;
    promoReady: Promise<void>;
    PROMO: { FPS: number; DURATION: number };
  }
}

function serve(roots: Roots) {
  return createServer((req, res) => {
    const url = decodeURIComponent((req.url ?? "/").split("?")[0]);
    if (url === "/_house/tokens.css") return res.writeHead(200, { "Content-Type": "text/css" }).end(tokensCss);
    const file = studioFile(roots, url);
    if (!file) return res.writeHead(404).end();
    // Why: studioFile keeps the request path inside the studio and repo roots.
    res.writeHead(200, { "Content-Type": mimeOf(file) }).end(readFileSync(file));
  });
}

function findFfmpeg(): string {
  if (process.env.FFMPEG) return process.env.FFMPEG;
  if (spawnSync("ffmpeg", ["-version"]).status === 0) return "ffmpeg";
  const pkgs = join(process.env.LOCALAPPDATA ?? homedir(), "Microsoft", "WinGet", "Packages");
  for (const d of existsSync(pkgs) ? readdirSync(pkgs) : []) {
    if (!d.startsWith("Gyan.FFmpeg")) continue;
    for (const sub of readdirSync(join(pkgs, d))) {
      const exe = join(pkgs, d, sub, "bin", "ffmpeg.exe");
      if (existsSync(exe)) return exe;
    }
  }
  throw new Error("ffmpeg not found. Install it: winget install Gyan.FFmpeg");
}

export interface RenderJob {
  repo: string;
  studio: string;
  scene: string;
  outDir: string;
  scratch: string;
  stills?: number[];
}

export async function render(job: RenderJob): Promise<string[]> {
  const sceneDir = join(job.studio, "scenes", job.scene);
  if (!existsSync(join(sceneDir, "index.html"))) throw new Error(`No scene at studio/scenes/${job.scene}.`);

  const server = serve(job);
  await new Promise<void>((r) => server.listen(0, r));
  const base = `http://localhost:${(server.address() as AddressInfo).port}`;
  const frames = join(job.scratch, `frames-${job.scene}`);
  rmSync(frames, { recursive: true, force: true });
  mkdirSync(frames, { recursive: true });
  mkdirSync(job.outDir, { recursive: true });

  const browser = await chromium.launch();
  const errors = new Set<string>();
  try {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
    page.on("pageerror", (e) => errors.add(e.message));
    page.on("console", (m) => { if (m.type() === "error") errors.add(m.text()); });
    await page.goto(`${base}/${job.scene}/index.html?t=0`, { waitUntil: "networkidle" });
    await page.evaluate(() => window.promoReady);
    const { FPS, DURATION } = await page.evaluate(() => window.PROMO);

    const times = job.stills ?? Array.from({ length: Math.round(FPS * DURATION) }, (_, i) => i / FPS);
    for (const [i, t] of times.entries()) {
      await page.evaluate((x) => { window.seek(x); }, t);
      const file = job.stills ? join(job.outDir, `still-${String(t).replace(".", "_")}s.png`) : join(frames, `${String(i).padStart(4, "0")}.png`);
      await page.screenshot({ path: file });
    }
    if (errors.size) throw new Error(`Scene errors: ${[...errors].join(" | ")}`);
    if (job.stills) return job.stills.map((t) => join(job.outDir, `still-${String(t).replace(".", "_")}s.png`));

    const mp4 = join(job.outDir, "media.mp4");
    // Why: a silent AAC track, because Instagram's Reel spec lists audio and a video-only file risks rejection.
    const r = spawnSync(findFfmpeg(), [
      "-y", "-framerate", String(FPS), "-i", join(frames, "%04d.png"),
      "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo",
      "-c:v", "libx264", "-profile:v", "high", "-pix_fmt", "yuv420p", "-crf", "14", "-preset", "slow", "-r", String(FPS),
      "-c:a", "aac", "-b:a", "128k", "-shortest", "-movflags", "+faststart", mp4,
    ], { stdio: "inherit" });
    if (r.status !== 0) throw new Error("ffmpeg failed.");
    return [mp4];
  } finally {
    await browser.close();
    server.close();
    rmSync(frames, { recursive: true, force: true });
  }
}

export function ensureCaptionFile(dir: string): void {
  const file = join(dir, "post.md");
  if (!existsSync(file)) writeFileSync(file, "");
}
