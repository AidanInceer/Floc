import { readFileSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { addNote, listPosts, removeNote, setStatus } from "./review.ts";
import { mimeOf, studioFile, tokensCss } from "./serve.ts";
import { listPieces } from "./stages.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const roots = { repo: resolve(root, "..", ".."), studio: join(root, "studio") };
const scenes = join(roots.studio, "scenes");
const content = join(root, "content");
const port = Number(process.env.MARKETING_STUDIO_PORT ?? process.env.PORT ?? 4200);

function send(res: ServerResponse, status: number, type: string, body: string | Buffer): void {
  res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" }).end(body);
}

const json = (res: ServerResponse, body: unknown, status = 200) => { send(res, status, "application/json", JSON.stringify(body)); };
const answer = (res: ServerResponse, error: string | undefined) => { json(res, error ? { error } : { ok: true }, error ? 400 : 200); };

async function body(req: IncomingMessage): Promise<Record<string, unknown>> {
  let text = "";
  for await (const chunk of req) {
    text += String(chunk);
    if (text.length > 10_000) return {};
  }
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function list() {
  const pieces = listPieces(content);
  return listPosts(scenes).map((p) => ({
    ...p,
    variants: p.variants.map((v) => ({ ...v, pieces: pieces.filter((x) => x.slug === v.scene).map(({ slug, stage }) => ({ slug, stage })) })),
  }));
}

async function write(req: IncomingMessage, res: ServerResponse, url: string) {
  const [, , , scene, action, id] = url.split("/");
  const data = await body(req);
  if (req.method === "POST" && action === "notes") {
    const note = addNote(scenes, scene, Number(data.t), typeof data.text === "string" ? data.text : "", new Date());
    if (typeof note === "string") answer(res, note);
    else json(res, note);
    return;
  }
  if (req.method === "DELETE" && action === "notes" && id) answer(res, removeNote(scenes, scene, id));
  else if (req.method === "POST" && action === "status") answer(res, setStatus(scenes, scene, typeof data.status === "string" ? data.status : ""));
  else send(res, 404, "text/plain", "Not found");
}

function read(res: ServerResponse, url: string) {
  const file = studioFile(roots, url.endsWith("/") ? `${url}index.html` : url);
  if (url === "/") send(res, 200, "text/html", readFileSync(join(roots.studio, "_studio", "index.html")));
  else if (url === "/_studio/list.json") json(res, list());
  else if (url === "/_house/tokens.css") send(res, 200, "text/css", tokensCss);
  else if (file) send(res, 200, mimeOf(file), readFileSync(file));
  else send(res, 404, "text/plain", "Not found");
}

const server = createServer((req, res) => {
  const url = decodeURIComponent((req.url ?? "/").split("?")[0]);
  if (url.startsWith("/_studio/scenes/")) void write(req, res, url);
  else read(res, url);
});

server.listen(port, () => { console.log(`Marketing studio on http://localhost:${port}`); });
