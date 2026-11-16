const AUTH_TABLES = new Set(["session", "account", "verification"]);

function block(text, from) {
  let depth = 1;
  let i = from;
  for (; i < text.length && depth; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}") depth--;
  }
  return text.slice(from, i);
}

function columnsOf(body) {
  return [...body.matchAll(/^\s*\w+:\s*\w+\(\s*"([a-z_0-9]+)"/gm)].map((m) => m[1]);
}

export function schemaTables(schema) {
  const shared = new Map();
  for (const m of schema.matchAll(/^const (\w+) = \{/gm)) {
    shared.set(m[1], columnsOf(block(schema, m.index + m[0].length)));
  }
  const tables = new Map();
  const names = new Map();
  for (const m of schema.matchAll(/export const (\w+) = \w*Table\(\s*"([a-z_]+)",\s*\{/g)) {
    const body = block(schema, m.index + m[0].length);
    const spread = [...body.matchAll(/\.\.\.(\w+)/g)].flatMap((s) => shared.get(s[1]) ?? []);
    const refs = [...body.matchAll(/references\(\s*\(\)\s*=>\s*(\w+)\./g)].map((r) => r[1]);
    names.set(m[1], m[2]);
    tables.set(m[2], { columns: [...columnsOf(body), ...spread], refs });
  }
  for (const table of tables.values()) table.refs = table.refs.map((r) => names.get(r)).filter(Boolean);
  return tables;
}

export function erdDiagram(page) {
  const figure = page.match(/<figure class="sm[^"]*\bsm-erd\b[^"]*"[\s\S]*?<\/figure>/)?.[0];
  if (!figure) return null;
  const nodes = new Map();
  for (const m of figure.matchAll(/<div class="sm-node er[^>]*data-node="([A-Z_0-9]+)"[\s\S]*?<\/div>/g)) {
    nodes.set(m[1].toLowerCase(), [...m[0].matchAll(/data-col="([^"]+)"/g)].map((c) => c[1]));
  }
  const json = figure.match(/<script type="application\/json">([\s\S]*?)<\/script>/)?.[1];
  let joins = [];
  try {
    joins = JSON.parse(json ?? "[]").map((e) => [String(e[0]).toLowerCase(), String(e[1]).toLowerCase()]);
  } catch {
    joins = null;
  }
  return { nodes, joins };
}

export function erdFailures(schema, page) {
  const failures = [];
  if (/class="mermaid"/.test(page)) failures.push('data-model.html: the ERD is hand-built HTML (figure.sm-erd); remove the class="mermaid" block');
  const diagram = erdDiagram(page);
  if (!diagram) return [...failures, "data-model.html: the ERD diagram (figure.sm-erd) is missing; restore it, do not redraw it in another format"];
  if (!diagram.joins) return [...failures, "data-model.html: the ERD's join list is not valid JSON"];
  const tables = schemaTables(schema);
  for (const [name, table] of tables) {
    if (AUTH_TABLES.has(name)) continue;
    const shown = diagram.nodes.get(name);
    if (!shown) {
      failures.push(`data-model.html: table "${name}" is in schema.ts but not in the ERD`);
      continue;
    }
    for (const column of shown) {
      if (!table.columns.includes(column)) failures.push(`data-model.html: the ERD shows "${name}.${column}", which is not in schema.ts`);
    }
    for (const parent of table.refs) {
      if (!diagram.joins.some((j) => j[0] === parent && j[1] === name)) {
        failures.push(`data-model.html: "${name}" has a foreign key to "${parent}" in schema.ts but no join line in the ERD`);
      }
    }
  }
  for (const name of diagram.nodes.keys()) {
    if (!tables.has(name)) failures.push(`data-model.html: the ERD shows table "${name}", which is not in schema.ts`);
  }
  for (const join of diagram.joins) {
    for (const end of join) {
      if (!diagram.nodes.has(end)) failures.push(`data-model.html: an ERD join line names "${end}", which is not a table in the diagram`);
    }
  }
  return failures;
}
