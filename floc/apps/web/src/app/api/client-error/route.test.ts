import { expect, it } from "vitest";

import { capturedLogAsync } from "@/test/captured-log";

import { POST } from "./route";

it("logs a browser error report and answers with no content", async () => {
  const body = JSON.stringify({ errorType: "TypeError", message: "x is undefined", route: "/trips" });
  const { result, lines } = await capturedLogAsync(() =>
    POST(new Request("http://localhost/api/client-error", { method: "POST", body, headers: { "x-real-ip": "203.0.113.7" } })),
  );
  expect(result.status).toBe(204);
  expect(lines[0]).toMatchObject({ message: "client.error", route: "/trips" });
});
