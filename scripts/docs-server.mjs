import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "docs");
const port = Number(process.env.FLOC_DOCS_PORT || 4173);
const mime = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".json": "application/json" };

function safe(relative) {
  const target = path.resolve(root, "." + relative);
  return target.startsWith(root + path.sep) ? target : null;
}

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/__docs/search") {
    const files = [];
    async function walk(dir) {
      for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) await walk(full);
        else if (entry.name.endsWith(".html") && !full.includes(`${path.sep}private${path.sep}`)) files.push(full);
      }
    }
    await walk(root);
    const pages = await Promise.all(files.map(async file => {
      const html = await fs.readFile(file, "utf8");
      const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || path.basename(file, ".html")).replace(/<[^>]+>/g, "").trim();
      const text = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      return { href: "/" + path.relative(root, file).replaceAll(path.sep, "/"), title, text };
    }));
    res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" }); res.end(JSON.stringify(pages));
    return;
  }
  if (req.method === "POST" && req.url === "/__docs/save") {
    let body = "";
    req.on("data", chunk => { body += chunk; if (body.length > 2_000_000) req.destroy(); });
    req.on("end", async () => {
      try {
        const data = JSON.parse(body);
        const target = typeof data.path === "string" && safe(data.path);
        if (!target || !target.endsWith(".html") || typeof data.html !== "string") throw new Error("Invalid document");
        await fs.writeFile(target, data.html, "utf8");
        res.writeHead(200, { "Content-Type": "application/json" }); res.end('{"saved":true}');
      } catch (error) { res.writeHead(400, { "Content-Type": "application/json" }); res.end(JSON.stringify({ error: error.message })); }
    });
    return;
  }
  const requested = decodeURIComponent((req.url || "/").split("?")[0]);
  const target = safe(requested === "/" ? "/index.html" : requested);
  if (!target) { res.writeHead(403); res.end("Forbidden"); return; }
  try { const data = await fs.readFile(target); res.writeHead(200, { "Content-Type": mime[path.extname(target)] || "application/octet-stream" }); res.end(data); }
  catch { res.writeHead(404); res.end("Not found"); }
});
server.listen(port, () => console.log(`Docs: http://localhost:${port}`));
