import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";

import { createClient } from "@libsql/client";
import { afterEach, describe, expect, it } from "vitest";

import { databaseFetch } from "./database-fetch";

const IDLE_PAST_NODE_DEFAULT_MS = 4_500;

let server: Server | undefined;

afterEach(async () => {
  server?.closeAllConnections();
  await new Promise((done) => (server ? server.close(done) : done(undefined)));
  server = undefined;
});

async function echoServer(): Promise<{ url: string; connections: () => number }> {
  let opened = 0;
  server = createServer((request, response) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer) => chunks.push(chunk));
    request.on("end", () => {
      response.setHeader("content-type", "application/json");
      response.end(JSON.stringify({ method: request.method, auth: request.headers.authorization, body: Buffer.concat(chunks).toString() }));
    });
  });
  server.keepAliveTimeout = 0;
  server.on("connection", () => {
    opened += 1;
  });
  await new Promise<void>((ready) => server!.listen(0, "127.0.0.1", ready));
  const { port } = server.address() as AddressInfo;
  return { url: `http://127.0.0.1:${port}/v3/pipeline`, connections: () => opened };
}

const post = (url: string, body: string) =>
  new Request(url, { method: "POST", headers: { authorization: "Bearer test" }, body });

async function libsqlServer(): Promise<string> {
  const answer = (kind: string) =>
    kind === "execute"
      ? { type: "ok", response: { type: "execute", result: { cols: [{ name: "one", decltype: null }], rows: [[{ type: "integer", value: "1" }]], affected_row_count: 0, last_insert_rowid: null } } }
      : { type: "ok", response: { type: kind } };
  server = createServer((request, response) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer) => chunks.push(chunk));
    request.on("end", () => {
      response.setHeader("content-type", "application/json");
      if (request.method !== "POST") return void response.end("{}");
      const { requests } = JSON.parse(Buffer.concat(chunks).toString()) as { requests: { type: string }[] };
      response.end(JSON.stringify({ baton: null, base_url: null, results: requests.map((r) => answer(r.type)) }));
    });
  });
  await new Promise<void>((ready) => server!.listen(0, "127.0.0.1", ready));
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

describe("the database connection", () => {
  it("carries a real libSQL client query", async () => {
    const client = createClient({ url: await libsqlServer(), fetch: databaseFetch });
    const result = await client.execute("select 1 as one");
    client.close();
    expect(Number(result.rows[0].one)).toBe(1);
  });

  it("sends the method, headers and body of the request unchanged", async () => {
    const { url } = await echoServer();
    const response = await databaseFetch(post(url, "statement"));
    expect(await response.json()).toEqual({ method: "POST", auth: "Bearer test", body: "statement" });
  });

  it("is still open for the next save after several idle seconds", async () => {
    const { url, connections } = await echoServer();
    await (await databaseFetch(post(url, "first"))).text();
    await new Promise((wait) => setTimeout(wait, IDLE_PAST_NODE_DEFAULT_MS));
    await (await databaseFetch(post(url, "second"))).text();
    expect(connections()).toBe(1);
  }, 10_000);
});
