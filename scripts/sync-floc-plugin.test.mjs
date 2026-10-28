import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { scopeCodexPlugin, syncPlugin } from "./sync-floc-plugin.mjs";

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "floc-plugin-test-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const plugin = join(root, "plugins/floc");
  mkdirSync(join(plugin, ".claude-plugin"), { recursive: true });
  const manifest = {
    name: "floc", version: "1.0.0", description: "Floc workflows",
    author: { name: "Aidan" }, skills: ["./skills/run"],
  };
  const saveManifest = () => writeFileSync(join(plugin, ".claude-plugin/plugin.json"), JSON.stringify(manifest));
  const addSkill = (name) => {
    mkdirSync(join(plugin, "skills", name), { recursive: true });
    writeFileSync(join(plugin, "skills", name, "SKILL.md"), `---\nname: ${name}\ndescription: Test ${name}\n---\n\n# ${name}\n\nKeep this workflow.\n`);
  };
  saveManifest();
  addSkill("run");
  return { root, plugin, manifest, saveManifest, addSkill };
}

test("both clients use the same skill directories as skills and versions change", (t) => {
  const f = fixture(t);
  syncPlugin(f.root);
  f.manifest.version = "1.1.0";
  f.manifest.skills.push("./skills/push");
  f.addSkill("push");
  f.saveManifest();
  syncPlugin(f.root);
  const codex = JSON.parse(readFileSync(join(f.plugin, ".codex-plugin/plugin.json"), "utf8"));
  assert.equal(codex.version, "1.1.0");
  assert.deepEqual(codex.skills, ["./skills/run", "./skills/push"]);
  assert.deepEqual(codex.author, { name: "Aidan" });
  assert.match(readFileSync(join(f.plugin, "skills/run/SKILL.md"), "utf8"), /Keep this workflow\./);
  assert.deepEqual(syncPlugin(f.root), []);
});

test("check detects drift without updating either client", (t) => {
  const f = fixture(t);
  syncPlugin(f.root);
  const output = join(f.plugin, ".codex-plugin/plugin.json");
  const previous = readFileSync(output, "utf8");
  f.manifest.version = "2.0.0";
  f.saveManifest();
  assert.throws(() => syncPlugin(f.root, { check: true }), /out of sync/);
  assert.equal(readFileSync(output, "utf8"), previous);
});

test("invalid skill paths fail before changing any files", (t) => {
  const f = fixture(t);
  f.manifest.skills.push("./skills/../../outside");
  f.saveManifest();
  const previous = readFileSync(join(f.plugin, "skills/run/SKILL.md"), "utf8");
  assert.throws(() => syncPlugin(f.root), /Invalid skill path/);
  assert.equal(readFileSync(join(f.plugin, "skills/run/SKILL.md"), "utf8"), previous);
});

test("marketplace resolves the plugin from the repository root", (t) => {
  const f = fixture(t);
  syncPlugin(f.root);
  const marketplace = JSON.parse(readFileSync(join(f.root, ".agents/plugins/marketplace.json"), "utf8"));
  assert.equal(marketplace.name, "floc");
  assert.deepEqual(marketplace.plugins[0].source, { source: "local", path: "./plugins/floc" });
});

test("Codex installation stays disabled globally and preserves unrelated settings", (t) => {
  const f = fixture(t);
  const config = join(f.root, "config.toml");
  writeFileSync(config, 'model = "existing"\n\n[plugins."floc@floc"]\nenabled = true\n\n[other]\nvalue = 3\n');
  scopeCodexPlugin(config);
  assert.equal(readFileSync(config, "utf8"), 'model = "existing"\n\n[plugins."floc@floc"]\nenabled = false\n\n[other]\nvalue = 3\n');
});
