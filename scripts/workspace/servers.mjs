import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { configFile } from "./config.mjs";

/** Process ids listening on any of the ports, read from `netstat -ano -p TCP` output. */
export function listeningPids(netstat, ports) {
  const wanted = new Set(ports.map(Number));
  const pids = new Set();
  for (const line of netstat.split(/\r?\n/)) {
    const [proto, local, , state, pid] = line.trim().split(/\s+/);
    if (proto !== "TCP" || state !== "LISTENING" || !pid || pid === "0") continue;
    const port = Number(local.slice(local.lastIndexOf(":") + 1));
    if (wanted.has(port)) pids.add(Number(pid));
  }
  return [...pids];
}

/** The ports a worktree's own servers use, from its .floc/workspace.json. */
export function worktreePorts(path) {
  const file = configFile(path);
  if (!existsSync(file)) return [];
  const config = JSON.parse(readFileSync(file, "utf8"));
  return config.primary ? [] : Object.values(config.ports ?? {});
}

/**
 * Why: a dev server, Metro or the marketing studio left running by an earlier session holds
 * the worktree's folder open, so Windows cannot remove it. Stops only what listens on this
 * worktree's own ports; the main checkout's ports are never touched.
 */
export function stopServers(path) {
  const ports = worktreePorts(path);
  if (!ports.length || process.platform !== "win32") return [];
  const netstat = spawnSync("netstat", ["-ano", "-p", "TCP"], { encoding: "utf8", windowsHide: true }).stdout ?? "";
  const pids = listeningPids(netstat, ports).filter((pid) => pid !== process.pid);
  for (const pid of pids) spawnSync("taskkill", ["/T", "/F", "/PID", String(pid)], { windowsHide: true });
  return pids;
}
