export interface InstagramConfig {
  userId: string;
  token: string;
  version: string;
}

export interface Transport {
  fetch: typeof fetch;
  sleep: (ms: number) => Promise<void>;
}

export interface Published {
  mediaId: string;
  permalink: string;
}

const GRAPH = "https://graph.facebook.com";
const UPLOAD = "https://rupload.facebook.com";
const DEFAULT_VERSION = "v23.0";
const ID = /^\w+$/;
const VERSION = /^v\d+\.\d+$/;

function part(value: string, pattern = ID): string {
  if (!pattern.test(value)) throw new Error("Instagram: unexpected id or version.");
  return value;
}

function uploadUrl(uri: string): string {
  const url = new URL(uri);
  if (url.origin !== UPLOAD) throw new Error("Instagram: upload address is not on rupload.facebook.com.");
  return UPLOAD + url.pathname;
}
const POLL_MS = 5000;

export function readInstagramConfig(
  env: Record<string, string | undefined>,
): { ok: true; config: InstagramConfig } | { ok: false; missing: string[] } {
  const userId = env.INSTAGRAM_USER_ID?.trim();
  const token = env.INSTAGRAM_ACCESS_TOKEN?.trim();
  const version = env.INSTAGRAM_GRAPH_VERSION?.trim() || DEFAULT_VERSION;
  const missing = [
    !(userId && ID.test(userId)) && "INSTAGRAM_USER_ID",
    !token && "INSTAGRAM_ACCESS_TOKEN",
    !VERSION.test(version) && "INSTAGRAM_GRAPH_VERSION",
  ].filter((s) => s !== false);
  if (missing.length || !userId || !token) return { ok: false, missing };
  return { ok: true, config: { userId, token, version } };
}

async function call<T>(t: Transport, url: string, init: RequestInit): Promise<T> {
  const res = await t.fetch(url, init);
  const body = (await res.json()) as T & { error?: { message?: string } };
  if (!res.ok || body.error) throw new Error(`Instagram: ${body.error?.message ?? `HTTP ${res.status}`}`);
  return body;
}

// Why: the resumable upload takes the file from this machine. A Reel created from `video_url`
// would need the video on a public host first.
export async function publishReel(
  cfg: InstagramConfig,
  video: Uint8Array,
  caption: string,
  t: Transport,
  maxPolls = 60,
): Promise<Published> {
  const graph = `${GRAPH}/${part(cfg.version, VERSION)}`;
  const auth = { authorization: `Bearer ${cfg.token}` };
  const form = (params: Record<string, string>) => ({ method: "POST", headers: auth, body: new URLSearchParams(params) });

  const container = await call<{ id: string; uri: string }>(
    t,
    `${graph}/${part(cfg.userId)}/media`,
    form({ media_type: "REELS", upload_type: "resumable", caption, share_to_feed: "true" }),
  );

  await call(t, uploadUrl(container.uri), {
    method: "POST",
    headers: { authorization: `OAuth ${cfg.token}`, offset: "0", file_size: String(video.byteLength) },
    body: new Uint8Array(video),
  });

  for (let i = 0; ; i++) {
    if (i === maxPolls) throw new Error(`Instagram: video still processing after ${maxPolls} checks. Container ${container.id}.`);
    const { status_code } = await call<{ status_code: string }>(t, `${graph}/${part(container.id)}?fields=status_code`, { headers: auth });
    if (status_code === "FINISHED") break;
    if (status_code !== "IN_PROGRESS") throw new Error(`Instagram could not process the video (${status_code}).`);
    await t.sleep(POLL_MS);
  }

  const { id } = await call<{ id: string }>(t, `${graph}/${part(cfg.userId)}/media_publish`, form({ creation_id: container.id }));
  const { permalink } = await call<{ permalink: string }>(t, `${graph}/${part(id)}?fields=permalink`, { headers: auth });
  return { mediaId: id, permalink };
}
