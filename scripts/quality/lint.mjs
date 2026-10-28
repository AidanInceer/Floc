import { ESLint } from "eslint";
import sonarjs from "eslint-plugin-sonarjs";
import security from "eslint-plugin-security";
import tseslint from "typescript-eslint";
import ts from "typescript";
import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { normalise } from "./config.mjs";

const FS = "security/detect-non-literal-fs-filename";
// Why: SonarCloud's taint analysis flags a path only when it comes from outside the process.
const UNTRUSTED = /process\.argv|parseArgs\(|process\.stdin|\b(?:req|request)\.url\b|searchParams/;
const REVIEWED = new RegExp(String.raw`^\s*(?:\/\/|\/\*).*Why:`);
const SONAR_KEY = { "sonarjs/no-os-command-from-path": "S4036" };

function scopeText(source, line, column) {
  const at = source.getPositionOfLineAndCharacter(line - 1, column - 1);
  let scope = source;
  const visit = (node) => {
    if (node.getStart(source) > at || node.end <= at) return;
    if (ts.isFunctionLike(node)) scope = node;
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(source, visit);
  return scope.getText(source);
}

function untrustedPath(file, text) {
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const lines = text.split(/\r?\n/);
  return (issue) => UNTRUSTED.test(scopeText(source, issue.line, issue.column))
    && !REVIEWED.test(lines[issue.line - 2] ?? "");
}

export async function lintSources(root, files, changes, ignored = () => false) {
  if (files.length === 0) return [];
  const program = ts.createProgram(files.map((file) => resolve(root, file)), {
    allowJs: true, checkJs: true, noEmit: true, strict: true, skipLibCheck: true,
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler, jsx: ts.JsxEmit.ReactJSX,
  });
  const eslint = new ESLint({
    cwd: root, overrideConfigFile: true, allowInlineConfig: false,
    overrideConfig: [{
      files: [(path) => /\.[cm]?[jt]sx?$/.test(path)],
      languageOptions: { parser: tseslint.parser, parserOptions: { programs: [program] } },
      plugins: { sonarjs, security, "@typescript-eslint": tseslint.plugin },
      rules: {
        ...Object.fromEntries(Object.entries(sonarjs.configs.recommended.rules)
          .filter(([name]) => sonarjs.rules[name.replace("sonarjs/", "")].meta.type === "problem")),
        "@typescript-eslint/no-floating-promises": "error",
        [FS]: "error",
        "security/detect-child-process": "error",
        "security/detect-non-literal-require": "error",
        "security/detect-unsafe-regex": "error",
      },
    }],
  });
  const results = await eslint.lintFiles(files);
  return results.flatMap((result) => {
    const file = normalise(relative(root, result.filePath));
    const tainted = untrustedPath(result.filePath, readFileSync(result.filePath, "utf8"));
    const changed = changes?.get(file);
    return result.messages
      .filter((issue) => issue.ruleId !== FS || tainted(issue))
      .filter((issue) => !SONAR_KEY[issue.ruleId] || !ignored(file, SONAR_KEY[issue.ruleId]))
      .filter((issue) => !changes || issue.fatal || [...(changed ?? [])]
        .some((line) => line >= issue.line && line <= (issue.endLine ?? issue.line)))
      .map((issue) => ({ ...issue, file: result.filePath }));
  });
}
