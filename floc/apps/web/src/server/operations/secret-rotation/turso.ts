import { requestJson } from "./http.ts";

const API = "https://api.turso.tech/v1/organizations";

// Why: Turso takes durations as `2w1d30m`; whole minutes keep the old token's lifetime without a seconds unit.
export function tokenExpiration(token: string, now = Date.now() / 1000): string {
  let exp: number | undefined;
  try {
    ({ exp } = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8")) as { exp?: number });
  } catch { throw new Error("Cannot read the current database token lifetime."); }
  if (exp === undefined || exp === -1) return "never";
  const minutes = Math.floor((exp - now) / 60);
  if (!Number.isSafeInteger(minutes) || minutes < 60) throw new Error("The current database token expires within an hour; review it first.");
  return `${minutes}m`;
}

async function accepts(token: string, databaseUrl: string, fetcher: typeof fetch) {
  const host = new URL(databaseUrl).hostname;
  const response = await fetcher(`https://${host}/v2/pipeline`, {
    method: "POST", redirect: "error", signal: AbortSignal.timeout(30_000),
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ requests: [{ type: "execute", stmt: { sql: "SELECT 1" } }, { type: "close" }] }),
  }).catch(() => null);
  await response?.body?.cancel();
  return response?.status === 200;
}

type Database = { Name: string; Hostname: string; group: string };

export function createTurso(token: string, fetcher: typeof fetch = fetch) {
  const headers = { Authorization: `Bearer ${token}` };
  let database: string | null = null;
  const base = () => {
    if (!database) throw new Error("Check the Turso scope first.");
    return database;
  };
  return {
    // Why: the repo is public, so the organisation and database are found from TURSO_DATABASE_URL.
    // Invalidation rotates the group's signing key, so any other database in the group would lose access too.
    async assertScope(databaseUrl: string) {
      const host = new URL(databaseUrl).hostname;
      const organisations = await requestJson<{ slug: string }[]>(fetcher, API, { headers });
      for (const { slug } of organisations) {
        const { databases } = await requestJson<{ databases: Database[] }>(fetcher, `${API}/${encodeURIComponent(slug)}/databases`, { headers });
        const current = databases.find((item) => item.Hostname === host);
        if (!current) continue;
        if (!current.group || databases.filter((item) => item.group === current.group).length !== 1) break;
        database = `${API}/${encodeURIComponent(slug)}/databases/${encodeURIComponent(current.Name)}`;
        return;
      }
      throw new Error("Turso database or group scope needs review before invalidation.");
    },
    // Why: invalidation finishes in the background; a token minted a second later was refused with 401, so mint until one works.
    async replaceToken(expiration: string, databaseUrl: string, wait: () => Promise<void> = () => new Promise((done) => setTimeout(done, 10_000))) {
      await requestJson(fetcher, `${base()}/auth/rotate`, { method: "POST", headers });
      for (let attempt = 0; attempt < 18; attempt++) {
        await wait();
        const { jwt } = await requestJson<{ jwt?: string }>(fetcher,
          `${base()}/auth/tokens?expiration=${encodeURIComponent(expiration)}&authorization=full-access`, { method: "POST", headers });
        if (jwt && await accepts(jwt, databaseUrl, fetcher)) return jwt;
      }
      throw new Error("Turso did not give a working token within 3 minutes. Run again: the old token is already invalid.");
    },
  };
}

export type Turso = ReturnType<typeof createTurso>;
