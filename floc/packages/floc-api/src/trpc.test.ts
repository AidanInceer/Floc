import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { TRPCError } from "@trpc/server";
import { expect, it } from "vitest";

import { publicProcedure, router } from "./trpc";
import type { FlocPort } from "./port";

async function errorResponse(error: Error) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: new Request("http://localhost/api/trpc/probe"),
    router: router({ probe: publicProcedure.query(() => { throw error; }) }),
    createContext: () => ({ viewer: null, port: {} as FlocPort }),
  });
}

it("redacts unexpected errors and stack traces from HTTP responses", async () => {
  const res = await errorResponse(new Error("SQL query with private@example.com"));
  expect(res.status).toBe(500);
  const body = await res.json() as { error: { message: string; data: { code: string; stack?: string } } };
  expect(body.error.message).toBe("Something went wrong. Please try again.");
  expect(body.error.data.code).toBe("INTERNAL_SERVER_ERROR");
  expect(body.error.data).not.toHaveProperty("stack");
  expect(JSON.stringify(body)).not.toContain("private@example.com");
});

it("preserves intentional client-facing errors", async () => {
  const res = await errorResponse(new TRPCError({ code: "NOT_FOUND", message: "No such trip." }));
  expect(res.status).toBe(404);
  expect(await res.json()).toMatchObject({ error: { message: "No such trip." } });
});
