import { rootBlock, readCss, LIGHT, DARK } from "./tokens.mjs";

import { lightTokens, darkTokens, radii } from "@floc/core/design/tokens";

const css = readCss();
const failures = [];

function declared(selector) {
  const out = [];
  for (const [, name, value] of rootBlock(css, selector).text.matchAll(
    /^[ \t]*--([\w-]+):([^;]+);/gm,
  )) {
    out.push([name, value.trim().replace(/\s+/g, " ")]);
  }
  return out;
}

function compare(theme, selector, source) {
  const css_ = declared(selector);
  const core = Object.entries(source);

  const cssNames = css_.map(([n]) => n);
  const coreNames = core.map(([n]) => n);

  for (const name of coreNames) {
    if (!cssNames.includes(name)) {
      failures.push(
        `${theme}: @floc/core declares --${name}, globals.css does not`,
      );
    }
  }
  for (const name of cssNames) {
    if (!coreNames.includes(name)) {
      failures.push(
        `${theme}: globals.css declares --${name}, @floc/core does not — add it to packages/floc-core/src/tokens.ts`,
      );
    }
  }

  for (const [name, value] of css_) {
    const expected = source[name];
    if (expected !== undefined && expected !== value) {
      failures.push(
        `${theme}: --${name} is "${value}" in globals.css but "${expected}" in @floc/core`,
      );
    }
  }

  const shared = cssNames.filter((n) => coreNames.includes(n));
  const sharedCore = coreNames.filter((n) => cssNames.includes(n));
  for (let i = 0; i < shared.length; i += 1) {
    if (shared[i] !== sharedCore[i]) {
      failures.push(
        `${theme}: --${shared[i]} is declared out of order — globals.css and @floc/core must list tokens the same way`,
      );
      break;
    }
  }
}

function compareRadii() {
  const theme = css.slice(css.indexOf("@theme inline {"));
  const expected = { sm: radii.sm, md: radii.md, lg: radii.md, xl: radii.md, "2xl": radii.md, pill: radii.pill };
  for (const [name, px] of Object.entries(expected)) {
    const m = theme.match(new RegExp(`--radius-${name}:\\s*([^;]+);`));
    if (!m) failures.push(`@theme: --radius-${name} is missing; @floc/core radii says ${px}px`);
    else if (m[1].trim() !== `${px}px`) failures.push(`@theme: --radius-${name} is "${m[1].trim()}" but @floc/core radii says ${px}px`);
  }
}

compare("light", LIGHT, lightTokens);
compare("dark", DARK, darkTokens);
compareRadii();

if (failures.length) {
  console.error("Token drift between globals.css and @floc/core:");
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log(
  `Tokens: ${Object.keys(lightTokens).length} light and ${Object.keys(darkTokens).length} dark match @floc/core exactly.`,
);
