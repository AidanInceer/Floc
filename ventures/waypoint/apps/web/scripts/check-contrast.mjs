/**
 * Every ink/surface pair the app actually paints, asserted against WCAG AA.
 *
 * The pale palette's failure mode is a *design* bug no compiler can see:
 * `--ink-3` sat at 2.75:1 through an entire redesign (#204). This is the only
 * check in the repo that catches one.
 */
import { contrast, readTokens } from "./tokens.mjs";

const AA_TEXT = 4.5;

// [ink, surface, floor, what it is]
const PAIRS = [
  ["ink", "paper", AA_TEXT, "body text on the canvas"],
  ["ink", "sheet", AA_TEXT, "body text on a surface"],
  ["ink-2", "paper", AA_TEXT, "secondary text on the canvas"],
  ["ink-2", "sheet", AA_TEXT, "secondary text on a surface"],
  ["ink-3", "paper", AA_TEXT, "the 11px label on the canvas"],
  ["ink-3", "sheet", AA_TEXT, "the 11px label on a surface"],
  ["pen", "sheet", AA_TEXT, "a link on a surface"],
  ["pen", "paper", AA_TEXT, "a link on the canvas"],
  ["pen-deep", "pen-2", AA_TEXT, "blue text on its own soft tint"],
  ["sheet", "pen", AA_TEXT, "white on the blue button"],
  ["peri-ink", "peri", AA_TEXT, "ink on peri"],
  ["mint-ink", "mint", AA_TEXT, "ink on mint"],
  ["butter-ink", "butter", AA_TEXT, "ink on butter"],
  ["blush-ink", "blush", AA_TEXT, "ink on blush"],
  ["pen-deep", "peri", AA_TEXT, "blue text on peri"],
  ["pen-deep", "mint", AA_TEXT, "blue text on mint"],
  ["pen-deep", "butter", AA_TEXT, "blue text on butter"],
  ["pen-deep", "blush", AA_TEXT, "blue text on blush"],
  // Hairlines are decorative separation, not a control boundary, so AA's 3:1
  // does not apply — but a hairline nobody can see is still a bug.
  ["rule", "sheet", 1.05, "a hairline on a surface"],
  ["rule-2", "sheet", 1.3, "a stronger hairline on a surface"],
  ["peri-edge", "peri", 1.1, "a pastel's own edge"],
  ["mint-edge", "mint", 1.1, "a pastel's own edge"],
  ["butter-edge", "butter", 1.1, "a pastel's own edge"],
  ["blush-edge", "blush", 1.1, "a pastel's own edge"],
];

const tokens = readTokens();

// Every `--who-N` / `--who-N-ink` pair, however many there turn out to be.
for (const name of tokens.keys()) {
  const n = name.match(/^who-(\d+)$/);
  if (n) PAIRS.push([`who-${n[1]}-ink`, name, AA_TEXT, `ink on ${name}`]);
}

const failures = [];
for (const [ink, surface, floor, what] of PAIRS) {
  const a = tokens.get(ink);
  const b = tokens.get(surface);
  if (!a || !b) {
    failures.push(`--${ink} on --${surface}: token missing or not a hex`);
    continue;
  }
  const ratio = contrast(a, b);
  if (ratio < floor) {
    failures.push(
      `--${ink} on --${surface} is ${ratio.toFixed(2)}:1, needs ${floor}:1 — ${what}`,
    );
  }
}

if (failures.length) {
  console.error("Contrast failures:");
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log(`Contrast: ${PAIRS.length} token pairs clear their floor.`);
