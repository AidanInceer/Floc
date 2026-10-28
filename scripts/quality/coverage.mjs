import { existsSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { analysisConfig, normalise } from "./config.mjs";

function readReport(root, report, records) {
  const packageRoot = dirname(dirname(join(root, report)));
  let record;
  for (const line of readFileSync(join(root, report), "utf8").split(/\r?\n/)) {
    if (line.startsWith("SF:")) {
      const source = normalise(line.slice(3));
      const file = isAbsolute(source) ? source
        : existsSync(resolve(root, source)) ? resolve(root, source) : resolve(packageRoot, source);
      const key = normalise(relative(root, file));
      record = records.get(key) ?? { lines: new Map(), branches: new Map() };
      records.set(key, record);
    } else if (line.startsWith("DA:") && record) {
      const [number, hits] = line.slice(3).split(",").map(Number);
      record.lines.set(number, Math.max(record.lines.get(number) ?? 0, hits));
    } else if (line.startsWith("BRDA:") && record) {
      const [number, block, branch, hits] = line.slice(5).split(",");
      const key = [number, block, branch].join(",");
      record.branches.set(key, Math.max(record.branches.get(key) ?? 0, hits === "-" ? 0 : Number(hits)));
    }
  }
}

export function checkCoverage(root, changes) {
  const config = analysisConfig(root);
  const records = new Map();
  for (const report of config.reports) {
    if (existsSync(join(root, report))) readReport(root, report, records);
  }
  const missing = [];
  const files = [];
  let total = 0;
  let covered = 0;
  for (const [file, changed] of changes) {
    if (!config.covered(file)) continue;
    const record = records.get(file);
    if (!record) {
      missing.push(file);
      continue;
    }
    let fileTotal = 0;
    let fileCovered = 0;
    for (const [line, hits] of record.lines) {
      if (!changed.has(line)) continue;
      fileTotal++;
      if (hits > 0) fileCovered++;
    }
    for (const [key, hits] of record.branches) {
      if (!changed.has(Number(key.split(",")[0]))) continue;
      fileTotal++;
      if (hits > 0) fileCovered++;
    }
    total += fileTotal;
    covered += fileCovered;
    if (fileTotal) files.push({ file, covered: fileCovered, total: fileTotal });
  }
  const percent = total === 0 ? 100 : 100 * covered / total;
  return { ok: missing.length === 0 && percent >= 80, percent, covered, total, missing, files };
}
