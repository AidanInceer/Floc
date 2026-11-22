import { describe, expect, it } from "vitest";

import { siteSchema } from "./site-schema";

const BASE = "https://floc.example";

type SchemaNode = Record<string, unknown>;

function node(type: string, base = BASE): SchemaNode {
  const { "@graph": graph } = JSON.parse(siteSchema(base)) as { "@graph": SchemaNode[] };
  const found = graph.find((entry) => entry["@type"] === type);
  if (!found) throw new Error(`no ${type} node`);
  return found;
}

describe("siteSchema", () => {
  it("names the website Floc at the site's home address", () => {
    expect(node("WebSite")).toMatchObject({ name: "Floc", url: `${BASE}/` });
  });

  it("names the organisation Floc and gives its logo", () => {
    expect(node("Organization")).toMatchObject({ name: "Floc", url: `${BASE}/`, logo: `${BASE}/floc-logo.png` });
  });

  it("links the website to the organisation that publishes it", () => {
    expect(node("WebSite").publisher).toEqual({ "@id": node("Organization")["@id"] });
  });

  it("cannot close the script tag it is written into", () => {
    expect(siteSchema("https://floc.example/</script>")).not.toContain("<");
  });
});
