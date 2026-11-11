import { afterEach, describe, expect, it, vi } from "vitest";

import { clientErrorHandler } from "./client-error-handler";

const report = JSON.stringify({ errorType: "TypeError", message: "x is undefined", route: "/trip/42" });

const beacon = (body: string, headers: Record<string, string> = { "x-real-ip": "203.0.113.9" }) =>
  new Request("http://localhost/api/client-error", { method: "POST", body, headers });

const stdout = () => vi.spyOn(process.stdout, "write").mockImplementation(() => true);

afterEach(() => vi.restoreAllMocks());

describe("clientErrorHandler", () => {
  it("logs a browser error and answers with no content", async () => {
    const write = stdout();
    const response = await clientErrorHandler()(beacon(report));
    expect(response.status).toBe(204);
    expect(JSON.parse(String(write.mock.calls[0]?.[0]))).toMatchObject({ message: "client.error", route: "/trip/[id]" });
  });

  it("refuses a body that is not a report", async () => {
    const write = stdout();
    expect((await clientErrorHandler()(beacon("nope"))).status).toBe(400);
    expect(write).not.toHaveBeenCalled();
  });

  it("refuses a body past the size cap before reading it", async () => {
    const big = beacon("x", { "content-length": "999999" });
    expect((await clientErrorHandler()(big)).status).toBe(413);
  });

  it("stops one caller from flooding the logs", async () => {
    stdout();
    const handle = clientErrorHandler({ capacity: 2 });
    const statuses: number[] = [];
    for (let i = 0; i < 3; i++) statuses.push((await handle(beacon(report))).status);
    expect(statuses).toEqual([204, 204, 429]);
  });
});
