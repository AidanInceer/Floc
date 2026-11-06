import { readdirSync } from "node:fs";
import { join } from "node:path";
import { command } from "../delivery/process.mjs";

function tests(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => entry.isDirectory()
    ? tests(join(dir, entry.name)) : entry.name.endsWith(".test.mjs") ? [join(dir, entry.name)] : []);
}
command(process.execPath, ["--test", ...tests("scripts")], { stdio: "inherit" });
