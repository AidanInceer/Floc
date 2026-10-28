import { expect, it, vi } from "vitest";

import { createTurso, tokenExpiration } from "./turso";

const jwt = (claims: object) => `h.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.s`;
const json = (body: object) => new Response(JSON.stringify(body));
const list = (databases: object[]) => json({ databases });

it("keeps a token without expiry as never", () => {
  expect(tokenExpiration(jwt({}))).toBe("never");
});

it("keeps the remaining lifetime in whole minutes", () => {
  expect(tokenExpiration(jwt({ exp: 1_000 + 7_250 }), 1_000)).toBe("120m");
});

it("refuses a token that expires within an hour", () => {
  expect(() => tokenExpiration(jwt({ exp: 1_000 + 600 }), 1_000)).toThrow("within an hour");
});

it("refuses an unreadable token without echoing it", () => {
  expect(() => tokenExpiration("not-a-jwt")).toThrow("Cannot read");
});

const orgs = () => json([{ slug: "team" }]) as Response;
const host = "app-team.turso.io";

it("finds the database by its URL and refuses when another database shares the group", async () => {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(orgs()).mockResolvedValueOnce(list([
    { Name: "app", Hostname: host, group: "default" }, { Name: "other", Hostname: "other-team.turso.io", group: "default" },
  ]));
  await expect(createTurso("api", fetcher).assertScope(`libsql://${host}`)).rejects.toThrow("scope");
});

it("refuses a database URL that no organisation has", async () => {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(orgs()).mockResolvedValueOnce(list([{ Name: "app", Hostname: host, group: "default" }]));
  await expect(createTurso("api", fetcher).assertScope("libsql://elsewhere.turso.io")).rejects.toThrow("scope");
});

it("refuses to replace a token before the scope is checked", async () => {
  await expect(createTurso("api", vi.fn<typeof fetch>()).replaceToken("never", `libsql://${host}`)).rejects.toThrow("scope first");
});

const url = `libsql://${host}`;
const scoped = (fetcher: typeof fetch) => {
  const turso = createTurso("api", fetcher);
  return turso.assertScope(url).then(() => turso);
};
const wait = async () => {};

it("invalidates, then mints a full-access token with the kept lifetime", async () => {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(orgs()).mockResolvedValueOnce(list([{ Name: "app", Hostname: host, group: "solo" }]))
    .mockResolvedValueOnce(new Response("")).mockResolvedValueOnce(json({ jwt: "new-token" })).mockResolvedValueOnce(new Response("{}"));
  expect(await (await scoped(fetcher)).replaceToken("never", url, wait)).toBe("new-token");
  expect(fetcher.mock.calls[2][0]).toBe("https://api.turso.tech/v1/organizations/team/databases/app/auth/rotate");
  expect(fetcher.mock.calls[3][0]).toMatch(/\/databases\/app\/auth\/tokens\?expiration=never&authorization=full-access$/);
  expect(fetcher.mock.calls[4][0]).toBe(`https://${host}/v2/pipeline`);
  expect(fetcher.mock.calls[4][1]?.headers).toMatchObject({ Authorization: "Bearer new-token" });
});

it("mints again while the database still refuses the new token", async () => {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(orgs()).mockResolvedValueOnce(list([{ Name: "app", Hostname: host, group: "solo" }]))
    .mockResolvedValueOnce(new Response("")).mockResolvedValueOnce(json({ jwt: "too-early" })).mockResolvedValueOnce(new Response("", { status: 401 }))
    .mockResolvedValueOnce(json({ jwt: "works" })).mockResolvedValueOnce(new Response("{}"));
  expect(await (await scoped(fetcher)).replaceToken("never", url, wait)).toBe("works");
});

it("tells the operator to run again when no token ever works", async () => {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(orgs()).mockResolvedValueOnce(list([{ Name: "app", Hostname: host, group: "solo" }]))
    .mockImplementation(async (target) => String(target).endsWith("/pipeline") ? new Response("", { status: 401 }) : json({ jwt: "refused" }));
  await expect((await scoped(fetcher)).replaceToken("never", url, wait)).rejects.toThrow("Run again");
});
