import { requestJson } from "./http.ts";

export type Service = "web" | "cron";
type Target = { name: string; project: string; environment: string; web: string; cron: string };
type Named = { edges: { node: { id: string; name: string } }[] };
type Project = { id: string; name: string; environments: Named; services: Named };

const find = (list: Named, name: string) => list.edges.find(({ node }) => node.name === name)?.node.id;

export function createRailway(token: string, fetcher: typeof fetch = fetch) {
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
  let target: Target | null = null;
  async function graphql<T>(query: string, variables: object = {}): Promise<T> {
    const result = await requestJson<{ data?: T; errors?: unknown[] }>(fetcher,
      "https://backboard.railway.com/graphql/v2", { method: "POST", headers, body: JSON.stringify({ query, variables }) });
    if (result.errors?.length || !result.data) throw new Error("Railway rejected the request. Response details suppressed.");
    return result.data;
  }
  const bound = () => {
    if (!target) throw new Error("Find the Railway target first.");
    return target;
  };
  const scope = () => ({ projectId: bound().project, environmentId: bound().environment });
  return {
    // Why: the repo is public, so production IDs are looked up by service name instead of written here.
    async findTarget() {
      const { me } = await graphql<{ me: { workspaces: { id: string }[] } }>("{ me { workspaces { id } } }");
      const matches: Target[] = [];
      for (const { id } of me.workspaces) {
        const { projects } = await graphql<{ projects: { edges: { node: Project }[] } }>(`query RotationProjects($id: String!) {
          projects(workspaceId: $id) { edges { node { id name environments { edges { node { id name } } } services { edges { node { id name } } } } } } }`, { id });
        for (const { node } of projects.edges) {
          const [environment, web, cron] = [find(node.environments, "production"), find(node.services, "floc-web"), find(node.services, "floc-cron")];
          if (environment && web && cron) matches.push({ name: node.name, project: node.id, environment, web, cron });
        }
      }
      if (matches.length !== 1) throw new Error("Expected exactly one Railway project with floc-web, floc-cron and a production environment.");
      target = matches[0];
      return target;
    },
    async variables(service: Service) {
      const result = await graphql<{ variables: Record<string, string> }>(`query RotationVariables(
        $projectId: String!, $environmentId: String!, $serviceId: String!) {
        variables(projectId: $projectId, environmentId: $environmentId, serviceId: $serviceId, unrendered: true) }`,
      { ...scope(), serviceId: bound()[service] });
      return result.variables;
    },
    async upsert(service: Service, variables: Record<string, string>) {
      const result = await graphql<{ variableCollectionUpsert: boolean }>(`mutation RotationVariablesUpdate($input: VariableCollectionUpsertInput!) {
        variableCollectionUpsert(input: $input) }`, { input: { ...scope(), serviceId: bound()[service], variables, replace: false, skipDeploys: true } });
      if (!result.variableCollectionUpsert) throw new Error("Railway variable update was not confirmed.");
    },
    // Why: redeploying an old deployment failed with no logs, and a crashed cron run cannot be redeployed; build the branch head like a push.
    async deploy(service: Service) {
      const { serviceInstanceDeployV2 } = await graphql<{ serviceInstanceDeployV2: string | null }>(`mutation RotationDeploy($serviceId: String!, $environmentId: String!) {
        serviceInstanceDeployV2(serviceId: $serviceId, environmentId: $environmentId) }`, { serviceId: bound()[service], environmentId: bound().environment });
      if (!serviceInstanceDeployV2) throw new Error("Railway did not start a deployment.");
      return serviceInstanceDeployV2;
    },
    async status(deploymentId: string) {
      return (await graphql<{ deployment: { status: string } }>(`query RotationDeployment($id: String!) {
        deployment(id: $id) { status } }`, { id: deploymentId })).deployment.status;
    },
  };
}

export type Railway = ReturnType<typeof createRailway>;
