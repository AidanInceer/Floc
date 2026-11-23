import { Agent, fetch as keptOpenFetch } from "undici";

const KEEP_CONNECTION_OPEN_MS = 30_000;

const connections = new Agent({ keepAliveTimeout: KEEP_CONNECTION_OPEN_MS });

export async function databaseFetch(request: Request): Promise<Response> {
  const body = request.body ? await request.arrayBuffer() : undefined;
  const response = await keptOpenFetch(request.url, {
    method: request.method,
    headers: Object.fromEntries(request.headers),
    body,
    signal: request.signal,
    dispatcher: connections,
  });
  return response as unknown as Response;
}
