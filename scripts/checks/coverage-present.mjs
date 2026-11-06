import { existsSync, readFileSync } from "node:fs";

const properties = readFileSync("sonar-project.properties", "utf8");
const reports = /^sonar.javascript.lcov.reportPaths=(.+)$/m.exec(properties)?.[1].split(",") ?? [];
console.log(reports.some((path) => existsSync(path.trim())) ? "true" : "false");
