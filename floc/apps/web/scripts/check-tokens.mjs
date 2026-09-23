/**
 * globals.css declares exactly what `@floc/core/tokens` says, and nothing else
 * (ticket 288).
 *
 * The two UIs are deliberately separate — native look on each platform — so
 * there is no shared component to keep them honest. Colour, spacing and type
 * are the one thing that MUST be identical, and the phone app cannot read a
 * stylesheet. So the values live in `@floc/core/tokens` and the browser still
 * loads plain CSS; this is the seam that stops the two from drifting.
 *
 * Asserted in both directions and in order: a token added to one side only, a
 * value changed on one side only, or a declaration moved, all fail here. The
 * fix is always to change `packages/floc-core/src/tokens.ts` first.
 */
import { rootBlock, readCss, LIGHT, DARK } from "./tokens.mjs";

import { lightTokens, darkTokens } from "@floc/core/design/tokens";

const css = readCss();
const failures = [];

/** Declarations in a `:root` block, in source order. Aliases stay unresolved — the check is on what is *written*. */
function declared(selector) {
  const out = [];
  for (const [, name, value] of rootBlock(css, selector).text.matchAll(
    /^[ \t]*--([\w-]+):([^;]+);/gm,
  )) {
    // Multi-line values (the shadows) are folded, so a rewrap is not a diff.
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

  // Order is part of the contract: the blocks are read side by side when a
  // colour changes, and a silent reshuffle makes that diff unreadable.
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

compare("light", LIGHT, lightTokens);
compare("dark", DARK, darkTokens);

if (failures.length) {
  console.error("Token drift between globals.css and @floc/core:");
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log(
  `Tokens: ${Object.keys(lightTokens).length} light and ${Object.keys(darkTokens).length} dark match @floc/core exactly.`,
);
