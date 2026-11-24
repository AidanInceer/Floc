import { DEFAULT_CATEGORY } from "@floc/core/money/expense-category";
import { SPLIT_TYPES } from "@floc/core/vocabulary";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { webPort } from "@/server/api-port/api-port";
import { serveAgent } from "@/server/mcp/read-tools";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";

type ToolResult = { isError?: boolean; content: { type: string; text: string }[] };

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

async function rpc<T>(viewerId: string, method: string, params: Record<string, unknown>): Promise<T> {
  const viewer = { id: viewerId, name: "Agent user", email: "agent-user@example.test", image: null };
  const response = await serveAgent(
    new Request("http://localhost/api/mcp", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    }),
    viewer,
  );
  const body = await response.text();
  const event = body.split("\n").find((line) => line.startsWith("data: "));
  return (JSON.parse(event ? event.slice(6) : body) as { result: T }).result;
}

const callTool = (viewerId: string, name: string, args: Record<string, unknown>) =>
  rpc<ToolResult>(viewerId, "tools/call", { name, arguments: args });

const textOf = (result: ToolResult) => result.content.map((part) => part.text).join("");

const TRIP_TOOLS = ["get_trip", "get_itinerary", "get_packing", "get_balances"];

describe("the agent's tools (#354)", () => {
  it("are five, and every one only reads", async () => {
    const { tools } = await rpc<{ tools: { name: string; annotations: { readOnlyHint?: boolean; destructiveHint?: boolean } }[] }>(
      world.member,
      "tools/list",
      {},
    );
    expect(tools.map((tool) => tool.name).sort()).toEqual(["get_balances", "get_itinerary", "get_packing", "get_trip", "list_trips"]);
    expect(tools.every((tool) => tool.annotations.readOnlyHint === true && tool.annotations.destructiveHint === false)).toBe(true);
  });

  it("list only the trips the person belongs to (rule 5)", async () => {
    const mine = textOf(await callTool(world.member, "list_trips", {}));
    const theirs = textOf(await callTool(world.outsider, "list_trips", {}));
    expect(mine).toContain("Ours");
    expect(theirs).not.toContain("Ours");
  });

  it("keeps two people apart when they ask at the same moment (rule 5)", async () => {
    const answers = await Promise.all(
      Array.from({ length: 10 }, (_, turn) => {
        const viewerId = turn % 2 === 0 ? world.member : world.outsider;
        return callTool(viewerId, "list_trips", {}).then((result) => ({ viewerId, text: textOf(result) }));
      }),
    );
    for (const { viewerId, text } of answers) {
      if (viewerId === world.member) expect(text).toContain("Ours");
      else expect(text).not.toContain("Ours");
    }
  });

  it.each(TRIP_TOOLS)("%s answers a non-member and a missing trip identically (rule 5)", async (tool) => {
    const foreign = await callTool(world.outsider, tool, { tripId: world.ours.id });
    const missing = await callTool(world.outsider, tool, { tripId: 999_999 });
    expect(foreign.isError).toBe(true);
    expect(textOf(foreign)).toBe("No such trip.");
    expect(textOf(missing)).toBe(textOf(foreign));
  });

  it.each(TRIP_TOOLS)("%s gives no email address", async (tool) => {
    const result = await callTool(world.member, tool, { tripId: world.ours.id });
    expect(result.isError).toBeFalsy();
    expect(textOf(result)).not.toContain("@example.test");
  });

  it("never returns a removed packing line (rule 8)", async () => {
    await webPort.addPackingLine(world.member, world.ours.id, { label: "Removed tent", category: null, mine: false });
    const before = await webPort.loadPacking(world.member, world.ours.id);
    const line = before.shared.find((row) => row.label === "Removed tent")!;
    expect(textOf(await callTool(world.member, "get_packing", { tripId: world.ours.id }))).toContain("Removed tent");
    await webPort.removePackingLine(world.member, world.ours.id, line.id);
    expect(textOf(await callTool(world.member, "get_packing", { tripId: world.ours.id }))).not.toContain("Removed tent");
  });

  it("names who owes who in whole minor units (rule 1)", async () => {
    await webPort.writeExpense(world.admin, world.ours.id, {
      description: "Dinner",
      amountMinor: 1000,
      currency: "GBP",
      category: DEFAULT_CATEGORY,
      splitType: SPLIT_TYPES[0],
      paidBy: world.admin,
      dayId: null,
      notes: null,
      splits: [
        { userId: world.admin, owedAmountMinor: 500 },
        { userId: world.member, owedAmountMinor: 500 },
      ],
    });
    const trip = await webPort.loadTrip(world.member, world.ours.id);
    const nameOf = (id: string) => trip!.members.find((member) => member.userId === id)!.name;
    const { owed } = JSON.parse(textOf(await callTool(world.member, "get_balances", { tripId: world.ours.id }))) as {
      owed: { from: string; to: string; amountMinor: number; currency: string }[];
    };
    expect(owed).toContainEqual({ from: nameOf(world.member), to: nameOf(world.admin), amountMinor: 500, currency: "GBP" });
  });
});
