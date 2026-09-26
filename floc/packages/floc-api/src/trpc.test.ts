import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { TRPCError } from "@trpc/server";
import { Refusal } from "@floc/core/errors/refusal";
import { expect, it } from "vitest";
import { z } from "zod";

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

it("answers a refusal as a 4xx carrying its own sentence", async () => {
  const bad = await errorResponse(new Refusal("The shares must add up to the total."));
  expect(bad.status).toBe(400);
  expect(await bad.json()).toMatchObject({
    error: { message: "The shares must add up to the total." },
  });

  const gone = await errorResponse(new Refusal("That is gone.", "missing"));
  expect(gone.status).toBe(404);

  const admin = await errorResponse(new Refusal("Only a trip admin can do that.", "forbidden"));
  expect(admin.status).toBe(403);
});

it("answers bad input with the first rule it broke, not the raw list", async () => {
  const res = await fetchRequestHandler({
    endpoint: "/api/trpc",
    req: new Request("http://localhost/api/trpc/probe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "" }),
    }),
    router: router({
      probe: publicProcedure
        .input(z.object({ name: z.string().min(1, "Give it a name.") }))
        .mutation(() => null),
    }),
    createContext: () => ({ viewer: null, port: {} as FlocPort }),
  });
  expect(res.status).toBe(400);
  expect(await res.json()).toMatchObject({ error: { message: "Give it a name." } });
});
