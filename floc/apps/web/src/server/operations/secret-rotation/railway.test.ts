import { expect, it, vi } from "vitest";

import { createRailway } from "./railway";

const reply = (data: object) => new Response(JSON.stringify({ data }));
const named = (...names: string[]) => ({ edges: names.map((name) => ({ node: { id: `id-${name}`, name } })) });
const project = (name: string, services: string[], environments = ["production"]) =>
  ({ node: { id: `id-${name}`, name, environments: named(...environments), services: named(...services) } });

function railwayWith(projects: object[], ...more: Response[]) {
  const fetcher = vi.fn<typeof fetch>()
    .mockResolvedValueOnce(reply({ me: { workspaces: [{ id: "ws" }] } }))
    .mockResolvedValueOnce(reply({ projects: { edges: projects } }));
  for (const response of more) fetcher.mockResolvedValueOnce(response);
  return { railway: createRailway("token", fetcher), fetcher };
}

it("finds the one project that has floc-web, floc-cron and production", async () => {
  const { railway } = railwayWith([project("other", ["api"]), project("app", ["floc-web", "floc-cron"])]);
  expect(await railway.findTarget()).toEqual({ name: "app", project: "id-app", environment: "id-production", web: "id-floc-web", cron: "id-floc-cron" });
});

it("refuses when no project or several projects match", async () => {
  await expect(railwayWith([project("app", ["floc-web"])]).railway.findTarget()).rejects.toThrow("exactly one");
  const two = [project("a", ["floc-web", "floc-cron"]), project("b", ["floc-web", "floc-cron"])];
  await expect(railwayWith(two).railway.findTarget()).rejects.toThrow("exactly one");
});

it("refuses to act before the target is found", async () => {
  await expect(createRailway("token", vi.fn<typeof fetch>()).variables("web")).rejects.toThrow("target first");
});

it("updates only selected variables without deleting others or deploying early", async () => {
  const { railway, fetcher } = railwayWith([project("app", ["floc-web", "floc-cron"])], reply({ variableCollectionUpsert: true }));
  await railway.findTarget();
  await railway.upsert("web", { CRON_SECRET: "new-test-secret" });
  const [url, options] = fetcher.mock.calls[2];
  expect(url).toBe("https://backboard.railway.com/graphql/v2");
  expect(options).toMatchObject({ redirect: "error", headers: { Authorization: "Bearer token" } });
  expect(JSON.parse(String(options?.body)).variables.input).toEqual({
    projectId: "id-app", environmentId: "id-production", serviceId: "id-floc-web",
    variables: { CRON_SECRET: "new-test-secret" }, replace: false, skipDeploys: true,
  });
});

it("deploys the service's branch head and returns the deployment", async () => {
  const { railway, fetcher } = railwayWith([project("app", ["floc-web", "floc-cron"])], reply({ serviceInstanceDeployV2: "dep-new" }));
  await railway.findTarget();
  expect(await railway.deploy("cron")).toBe("dep-new");
  const body = JSON.parse(String(fetcher.mock.calls[2][1]?.body));
  expect(body.query).toContain("serviceInstanceDeployV2");
  expect(body.variables).toEqual({ serviceId: "id-floc-cron", environmentId: "id-production" });
});

it("stops when Railway starts no deployment", async () => {
  const { railway } = railwayWith([project("app", ["floc-web", "floc-cron"])], reply({ serviceInstanceDeployV2: null }));
  await railway.findTarget();
  await expect(railway.deploy("web")).rejects.toThrow("did not start");
});

it("reads a deployment's status", async () => {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(reply({ deployment: { status: "SUCCESS" } }));
  expect(await createRailway("token", fetcher).status("dep")).toBe("SUCCESS");
});

it("treats GraphQL errors inside HTTP 200 as failures without echoing their messages", async () => {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ errors: [{ message: "private-secret-marker" }] })));
  const result = await createRailway("token", fetcher).findTarget().catch((error) => String(error));
  expect(result).not.toContain("private-secret-marker");
  expect(result).toContain("Railway rejected");
});
