export type ParityState = "yes" | "planned" | "wontfix";

export type ParityEntry = { mobile: ParityState; why?: string };

export type ParityManifest = {
  procedures: Record<string, ParityEntry>;
  webOnly: { id: string; path: string; status: Exclude<ParityState, "yes">; why: string }[];
};

export function diffParity(
  procedures: readonly string[],
  mobileCalls: readonly string[],
  manifest: ParityManifest,
): string[] {
  const failures: string[] = [];
  const called = new Set(mobileCalls);
  const declared = new Set(procedures);

  for (const name of procedures) {
    if (!(name in manifest.procedures)) {
      failures.push(`${name}: new procedure, not in parity.json — say whether the app has it`);
    }
  }

  for (const [name, entry] of Object.entries(manifest.procedures)) {
    if (!declared.has(name)) {
      failures.push(`${name}: in parity.json but the router no longer declares it — remove the entry`);
      continue;
    }
    if (entry.mobile === "yes" && !called.has(name)) {
      failures.push(`${name}: parity.json says the app has it, but no mobile file calls it`);
    }
    if (entry.mobile !== "yes" && called.has(name)) {
      failures.push(`${name}: the app calls it — change parity.json to "yes"`);
    }
    if (entry.mobile !== "yes" && !entry.why) {
      failures.push(`${name}: "${entry.mobile}" needs a "why"`);
    }
  }

  return failures;
}

export function paritySummary(manifest: ParityManifest): string {
  const states = Object.values(manifest.procedures);
  const count = (state: ParityState) => states.filter((entry) => entry.mobile === state).length;
  return (
    `${count("yes")}/${states.length} procedures on the app ` +
    `(${count("planned")} planned, ${count("wontfix")} wontfix) · ` +
    `${manifest.webOnly.length} web-only feature(s)`
  );
}
