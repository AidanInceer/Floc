const NONE = new Set();

const ruleOf = (key) => key.split(" ")[0];

function ruleIds(source) {
  return new Set([...source.matchAll(/report\("([\w-]+)"/g)].map(([, id]) => id));
}

export function newRules(baseSource, source) {
  if (!baseSource) return NONE;
  const before = ruleIds(baseSource);
  return new Set([...ruleIds(source)].filter((id) => !before.has(id)));
}

export function shrunk(baseline, counts, fresh = NONE) {
  const next = {};
  for (const [key, n] of Object.entries(counts)) {
    const kept = fresh.has(ruleOf(key)) ? n : Math.min(n, baseline?.[key] ?? 0);
    if (kept > 0) next[key] = kept;
  }
  return next;
}

export function grown(before, after, fresh = NONE) {
  return Object.keys(after).filter((key) => !fresh.has(ruleOf(key)) && after[key] > (before[key] ?? 0)).sort();
}
