// Why: the visual corrections Aidan kept making by hand, as rules a machine can hold. .claude/rules/design.md is the human list.

const RADIUS_PART = /^(var\(--radius-[\w-]+\)|0|0px|50%|inherit|initial)$/;
const RADIUS_CLASS = /^rounded(-(t|b|l|r|s|e|tl|tr|bl|br|ss|se|es|ee))?-(sm|md|full|none)$/;
// Why: only these map to the house tokens in @theme; `shadow-sm` is Tailwind's default and `shadow-lift` draws nothing.
const SHADOW_CLASS = /^shadow-(none|card|raised|lifted)!?$/;
const LENGTH = /^-?[\d.]+(px|em|rem)?$/;

function drawsDepth(part) {
  if (part === "none" || /^var\(--shadow[\w-]*\)$/.test(part)) return false;
  const words = part.split(/\s+(?![^(]*\))/);
  if (words.includes("inset")) return false;
  const lengths = words.filter((w) => LENGTH.test(w)).map(parseFloat);
  return (lengths[2] ?? 0) !== 0;
}
const GREY_FILL = /^(sheet-2|sheet-3|paper|rule|rule-strong)$/;
const GREY_VAR = /background(-color)?\s*:\s*var\(--(sheet-2|sheet-3|paper|rule|rule-2)\)/;
const CLASSY = /className|class=|\bcn\(|clsx|cva\(|["'`]/;

const isComment = (line) => /^\s*(\/\/|\/\*|\*)/.test(line);
const INLINE_COMMENT = new RegExp("/[*].*?[*]/", "g");
const stripInlineComments = (line) => line.replace(INLINE_COMMENT, "");

function classTokens(line, stem) {
  const re = new RegExp(`(?:^|[\\s"'\`{(])((?:[\\w-]+:)*)(${stem}(?:-[^\\s"'\`}]*)?)(?=[\\s"'\`}]|$)`, "g");
  return [...line.matchAll(re)].map((m) => ({ variants: m[1], token: m[2] }));
}

function splitTopLevel(value) {
  const parts = [];
  let depth = 0;
  let current = "";
  for (const ch of value) {
    if (ch === "(") depth += 1;
    if (ch === ")") depth -= 1;
    if (ch === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
    } else current += ch;
  }
  parts.push(current.trim());
  return parts;
}

function cssLine(line, inHover, report) {
  for (const [, value] of line.matchAll(/border(?:-[a-z]+)*-radius\s*:\s*([^;}]+)/g)) {
    const parts = value.replace(/!important/, "").trim().split(/[\s/]+/);
    if (!parts.every((p) => RADIUS_PART.test(p))) report("radius", "use var(--radius-sm|md|pill)");
  }
  for (const [, value] of line.matchAll(/box-shadow\s*:\s*([^;}]+)/g)) {
    const parts = splitTopLevel(value.replace(/!important/, "").trim());
    if (parts.some(drawsDepth)) report("shadow", "depth comes from var(--shadow-sm|shadow|shadow-lift)");
  }
  if ((inHover || /:hover/.test(line)) && GREY_VAR.test(line)) report("hover-grey", "hover lifts, takes a border or a pen wash");
}

function scriptLine(line, report) {
  if (CLASSY.test(line)) {
    for (const { token } of classTokens(line, "rounded")) {
      if (!RADIUS_CLASS.test(token)) report("radius", `${token} → rounded-sm, rounded-md or rounded-full`);
    }
    for (const { token } of classTokens(line, "shadow")) {
      const arbitrary = token.match(/^shadow-\[(.+)\]!?$/);
      const ok = arbitrary
        ? !splitTopLevel(arbitrary[1].replaceAll("_", " ")).some(drawsDepth)
        : SHADOW_CLASS.test(token);
      if (!ok) report("shadow", `${token} → shadow-card, shadow-raised or shadow-lifted`);
    }
  }
  for (const [, n] of line.matchAll(/borderRadius\s*:\s*(\d+(?:\.\d+)?)/g)) {
    if (Number(n) !== 0) report("radius", `borderRadius ${n} → radius.sm, radius.md or radius.pill`);
  }
  for (const [, colour] of line.matchAll(/hover:bg-([\w-]+)/g)) {
    if (GREY_FILL.test(colour)) report("hover-grey", `hover:bg-${colour} → hover:bg-pen-soft, a border or a lift`);
  }
  // Why: --pen-2 is a CSS variable; its Tailwind colour is pen-soft, so a pen-2 class renders nothing (#527).
  for (const [token] of line.matchAll(/(?<![\w-])(?:[\w-]+:)*(?:bg|text|border|ring|outline|fill|stroke)-pen-2(?![\w-])/g)) {
    report("pen-2-class", `${token} → the pen-soft class (token --pen-2)`);
  }
  if (/≈|~\s?[£$€]/.test(line)) report("approx-money", "show the exact amount");
  if (/\bplaceholder\s*=\s*[{"']/.test(line)) report("placeholder", "fields start empty; name them with a label");
}

export function findViolations(file, text) {
  const out = [];
  const isCss = file.endsWith(".css");
  let inHover = false;
  text.split(/\r?\n/).forEach((raw, i) => {
    const report = (rule, hint) => out.push({ rule, line: i + 1, hint, text: raw.trim().slice(0, 120) });
    if (isComment(raw)) return;
    const line = stripInlineComments(raw);
    if (isCss) {
      if (/:hover[^{]*\{/.test(line)) inHover = true;
      cssLine(line, inHover, report);
      if (line.includes("}")) inHover = false;
    } else scriptLine(line, report);
    if (/\p{Extended_Pictographic}/u.test(line)) report("emoji", "use a line icon from components/system/icons");
  });
  return out;
}
