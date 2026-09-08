/**
 * Web/app parity, asserted rather than remembered.
 *
 * The API is the contract both clients read a trip through, so "does the phone
 * have this yet?" is answerable per procedure. `parity.json` is the answer of
 * record; this compares it to what the router declares and what the phone
 * actually calls, and reports every way the three can disagree.
 *
 * Pure on purpose — the scanning lives in `scripts/parity/run.mjs`, so the
 * rules are testable without a filesystem.
 */

/** `yes` = shipped on the phone. `planned` = deliberate gap. `wontfix` = never coming, and why. */
export type ParityState = "yes" | "planned" | "wontfix";

export type ParityEntry = { mobile: ParityState; why?: string };

export type ParityManifest = {
  procedures: Record<string, ParityEntry>;
  webOnly: { id: string; path: string; status: Exclude<ParityState, "yes">; why: string }[];
};

/**
 * Every disagreement, as a line a human can act on. Empty means the manifest
 * tells the truth. Asserted in all three directions — a new procedure nobody
 * wired up, a claim the phone does not back up, and a claim the phone has
 * outgrown — because only the first is caught by remembering to look.
 */
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

/** What the gate prints when it passes: the shape of the gap, not just its absence. */
export function paritySummary(manifest: ParityManifest): string {
  const states = Object.values(manifest.procedures);
  const count = (state: ParityState) => states.filter((entry) => entry.mobile === state).length;
  return (
    `${count("yes")}/${states.length} procedures on the app ` +
    `(${count("planned")} planned, ${count("wontfix")} wontfix) · ` +
    `${manifest.webOnly.length} web-only feature(s)`
  );
}
