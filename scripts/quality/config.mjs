import { readFileSync } from "node:fs";
import { join } from "node:path";

export const normalise = (path) => path.replaceAll("\\", "/");

export function matches(path, glob) {
  const pattern = glob.split(/(\*\*\/|\*\*|\*|\?)/).map((part) => {
    if (part === "**/") return "(?:.*/)?";
    if (part === "**") return ".*";
    if (part === "*") return "[^/]*";
    if (part === "?") return "[^/]";
    return part.replace(/[.*+?^$()|[\]\\]/g, "\\$&");
  }).join("");
  return new RegExp("^" + pattern + "$").test(normalise(path));
}

export function analysisConfig(root) {
  const values = Object.fromEntries(readFileSync(join(root, "sonar-project.properties"), "utf8")
    .split(/\r?\n/).filter((line) => line && !line.startsWith("#"))
    .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)]));
  const list = (key) => (values[key] ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const excluded = [...list("sonar.exclusions"), ...list("sonar.test.inclusions")];
  const sources = list("sonar.sources");
  const inScope = (path) => sources.some((source) => path.startsWith(source + "/"))
    && !excluded.some((glob) => matches(path, glob));
  const ignores = list("sonar.issue.ignore.multicriteria").map((id) => ({
    rule: values[`sonar.issue.ignore.multicriteria.${id}.ruleKey`] ?? "",
    glob: values[`sonar.issue.ignore.multicriteria.${id}.resourceKey`] ?? "",
  }));
  return {
    reports: list("sonar.javascript.lcov.reportPaths"),
    ignored: (path, sonarRule) => ignores.some(({ rule, glob }) => rule.endsWith(":" + sonarRule) && matches(path, glob)),
    source: (path) => inScope(path) && /\.(?:[cm]?js|jsx|tsx?)$/.test(path),
    covered: (path) => inScope(path) && /\.(?:[cm]?js|jsx|tsx?)$/.test(path)
      && !list("sonar.coverage.exclusions").some((glob) => matches(path, glob)),
  };
}
