import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { listeningPids, worktreePorts } from "./servers.mjs";

const NETSTAT = `
Active Connections

  Proto  Local Address          Foreign Address        State           PID
  TCP    0.0.0.0:20570          0.0.0.0:0              LISTENING       4120
  TCP    [::]:20571             [::]:0                 LISTENING       5300
  TCP    127.0.0.1:20570        127.0.0.1:61000        ESTABLISHED     4120
  TCP    0.0.0.0:3000           0.0.0.0:0              LISTENING       900
  TCP    127.0.0.1:20575        127.0.0.1:0            TIME_WAIT       0
`;

test("only processes listening on the worktree's ports are picked", () => {
  assert.deepEqual(listeningPids(NETSTAT, [20570, 20571, 20575]), [4120, 5300]);
});

test("the main checkout and an unprepared worktree have no ports to stop", () => {
  const dir = mkdtempSync(join(tmpdir(), "floc-servers-"));
  try {
    assert.deepEqual(worktreePorts(dir), []);
    mkdirSync(join(dir, ".floc"));
    writeFileSync(join(dir, ".floc/workspace.json"), JSON.stringify({ primary: true, ports: { web: 3000 } }));
    assert.deepEqual(worktreePorts(dir), []);
    writeFileSync(join(dir, ".floc/workspace.json"), JSON.stringify({ primary: false, ports: { web: 20570, metro: 20571 } }));
    assert.deepEqual(worktreePorts(dir), [20570, 20571]);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
