import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { darkTokens, fontStacks, lightTokens } from "../floc/packages/floc-core/src/design/tokens.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "floc", "wireframe");
const house = path.resolve(here, "wireframe");
const port = Number(process.env.FLOC_WIREFRAME_PORT || 4100);
const mime = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".mjs": "text/javascript", ".svg": "image/svg+xml", ".json": "application/json", ".png": "image/png" };

const declare = (tokens) => Object.entries(tokens).map(([name, value]) => `  --${name}: ${value};`).join("\n");

// Why: the web's font tokens lead with next/font's generated family, which a static page never has.
const faces = `  --font-display-face: "${fontStacks.display[0]}";\n  --font-body-face: "${fontStacks.sans[0]}";\n  --font-data-face: "${fontStacks.type[0]}";`;

const tokensCss = () => `:root {\n${faces}\n${declare(lightTokens)}\n}\n:root[data-theme="dark"] {\n${declare(darkTokens)}\n}\n`;

function inside(base, relative) {
  const target = path.resolve(base, "." + relative);
  return target === base || target.startsWith(base + path.sep) ? target : null;
}

async function listing() {
  await fs.mkdir(root, { recursive: true });
  const entries = await fs.readdir(root, { withFileTypes: true });
  const rows = [];
  for (const entry of entries.filter((e) => e.isDirectory() && !e.name.startsWith("_")).sort((a, b) => a.name.localeCompare(b.name))) {
    const html = await fs.readFile(path.join(root, entry.name, "index.html"), "utf8").catch(() => null);
    if (!html) continue;
    const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || entry.name;
    rows.push(`<li><a href="/${entry.name}/">${title}</a> <span class="typed">${entry.name}</span></li>`);
  }
  return `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><title>Floc wireframes</title>
<link rel="stylesheet" href="/_house/house.css"><script src="/_house/house.js" defer></script></head>
<body><main class="wf-index"><h1>Wireframes</h1>${rows.length ? `<ul>${rows.join("")}</ul>` : `<p>No prototypes yet. Each one is a folder in <code>floc/wireframe/</code> with an <code>index.html</code>.</p>`}</main></body></html>`;
}

const server = http.createServer(async (req, res) => {
  const requested = decodeURIComponent((req.url || "/").split("?")[0]);
  const send = (status, type, body) => {
    res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
    res.end(body);
  };
  if (requested === "/") return send(200, "text/html", await listing());
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
