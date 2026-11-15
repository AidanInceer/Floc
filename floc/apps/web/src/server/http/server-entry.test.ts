import type { IncomingMessage, ServerResponse } from "node:http";

import { describe, expect, it, vi } from "vitest";

type Listener = (req: IncomingMessage, res: ServerResponse) => unknown;

const handle = vi.fn();
const fakeServer = { on: vi.fn(), listen: vi.fn(), close: vi.fn() };
const createServer = vi.fn<(listener: Listener) => typeof fakeServer>(() => fakeServer);

vi.mock("node:http", () => ({ createServer }));
vi.mock("next", () => ({
  default: () => ({ prepare: async () => {}, getRequestHandler: () => handle, getUpgradeHandler: () => vi.fn() }),
}));
vi.mock("@/server/notes/live/notes-live", () => ({ createNotesLive: () => ({ flushPendingStores: vi.fn(), closeConnections: vi.fn() }) }));
vi.mock("@/server/notes/live/live-socket", () => ({ attachNotesLive: vi.fn() }));
vi.mock("@/server/notes/live/live-session", () => ({ sessionResolver: () => vi.fn() }));

const request = (method: string, url: string, headers: Record<string, string>) =>
  ({ method, url, headers, socket: { remoteAddress: "10.0.0.1" } }) as unknown as IncomingMessage;

const response = () => ({ setHeader: vi.fn(), once: vi.fn(), writeHead: vi.fn(), end: vi.fn() });

describe("floc-web's entry", () => {
  it("puts the read and write limits in front of Next, and names the visitor on a socket upgrade (#587)", async () => {
    await import("../../../server");
    const listener = createServer.mock.calls[0][0];

    for (let i = 0; i < 600; i += 1) listener(request("GET", "/explore", { "x-real-ip": "203.0.113.9" }), response() as unknown as ServerResponse);
    const refused = response();
    listener(request("GET", "/explore", { "x-real-ip": "203.0.113.9" }), refused as unknown as ServerResponse);
    expect(handle).toHaveBeenCalledTimes(600);
    expect(refused.writeHead).toHaveBeenCalledWith(429, expect.anything());

    const other = response();
    listener(request("GET", "/explore", { "x-real-ip": "198.51.100.4" }), other as unknown as ServerResponse);
    expect(other.writeHead).not.toHaveBeenCalled();

    expect(fakeServer.on).toHaveBeenCalledWith("upgrade", expect.any(Function));
    expect(fakeServer.listen).toHaveBeenCalled();
  });
});
