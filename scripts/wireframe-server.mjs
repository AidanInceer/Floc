import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { darkTokens, fontStacks, lightTokens } from "../floc/packages/floc-core/src/design/tokens.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "floc", "wireframe");
const house = path.resolve(here, "wireframe");
const port = Number(process.env.FLOC_WIREFRAME_PORT || process.env.PORT || 4100);
const mime = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".mjs": "text/javascript", ".svg": "image/svg+xml", ".json": "application/json", ".png": "image/png" };

const declare = (tokens) => Object.entries(tokens).map(([name, value]) => `  --${name}: ${value};`).join("\n");

// Why: the web's font tokens lead with next/font's generated family, which a static page never has.
const faces = `  --font-display-face: "${fontStacks.display[0]}";\n  --font-body-face: "${fontStacks.sans[0]}";\n  --font-data-face: "${fontStacks.type[0]}";`;

const tokensCss = () => `:root {\n${faces}\n${declare(lightTokens)}\n}\n:root[data-theme="dark"] {\n${declare(darkTokens)}\n}\n`;

function inside(base, relative) {
  const target = path.resolve(base, "." + relative);
  return target === base || target.startsWith(base + path.sep) ? target : null;
}

const meta = (html, name) =>
  html.match(new RegExp(`<meta\\s+name="${name}"\\s+content="([^"]*)"`, "i"))?.[1]?.trim() || "";

async function readPrototype(entry) {
  const file = path.join(root, entry.name, "index.html");
  const html = await fs.readFile(file, "utf8").catch(() => null);
  if (!html) return null;
  const { mtime } = await fs.stat(file);
  return {
    folder: entry.name,
    title: html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || entry.name,
    page: meta(html, "wf-page"),
    route: meta(html, "wf-route"),
    status: meta(html, "wf-status"),
    about: meta(html, "description"),
    changed: mtime.toISOString(),
  };
}

async function prototypes() {
  await fs.mkdir(root, { recursive: true });
  const entries = await fs.readdir(root, { withFileTypes: true });
  return (await Promise.all(entries.filter((e) => e.isDirectory() && !e.name.startsWith("_")).map(readPrototype))).filter(Boolean);
}

// The index is a shell; /_house/nav.js and /_house/index.js draw it from /_house/list.json.
const shell = `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Floc wireframes</title>
<link rel="stylesheet" href="/_house/house.css"><link rel="stylesheet" href="/_house/nav.css">
<script src="/_house/house.js" defer></script><script src="/_house/nav.js" defer></script><script src="/_house/index.js" defer></script></head>
<body class="wf-home-page"><aside class="wf-side" id="wf-side" aria-label="Wireframes"></aside><main class="wf-main" id="wf-main"></main></body></html>`;

const server = http.createServer(async (req, res) => {
  const requested = decodeURIComponent((req.url || "/").split("?")[0]);
  const send = (status, type, body) => {
    res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
    res.end(body);
  };
  if (requested === "/") return send(200, "text/html", shell);
  if (requested === "/_house/list.json") return send(200, "application/json", JSON.stringify(await prototypes()));
  if (requested === "/_house/tokens.css") return send(200, "text/css", tokensCss());

  const base = requested.startsWith("/_house/") ? house : root;
  const relative = requested.startsWith("/_house/") ? requested.slice("/_house".length) : requested;
  let target = inside(base, relative);
  if (!target) return send(403, "text/plain", "Forbidden");
  const stat = await fs.stat(target).catch(() => null);
  if (stat?.isDirectory()) {
    if (!requested.endsWith("/")) {
      res.writeHead(301, { Location: `${requested}/` });
      return res.end();
    }
    target = path.join(target, "index.html");
  }
  const body = await fs.readFile(target).catch(() => null);
  if (!body) return send(404, "text/plain", "Not found");
  send(200, mime[path.extname(target)] || "application/octet-stream", body);
});

server.listen(port, () => console.log(`Wireframes on http://localhost:${port}`));
