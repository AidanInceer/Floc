/**
 * The dev seed's front door (#no-ticket).
 *
 *   pnpm db:seed            both scenarios, rebuilt from scratch
 *   pnpm db:seed a          scenario A only, leaving B alone
 *   pnpm db:seed b --reset  take B out and put nothing back
 *   pnpm db:reset           empty the whole database, then both scenarios
 *
 * `db:reset` is the deterministic one: your own trips, friends and uploads go
 * too, ids restart at 1, and every account has a fixed id. Dates stay
 * relative to today on purpose — a fixed date would drift into the past and
 * turn every upcoming trip into a finished one.
 *
 * BUILDING ALWAYS RESETS FIRST. A seed you can only run once is a seed you
 * stop running: the second go leaves two Portugals and no way to tell which
 * one you were looking at. Resetting the same scenario first makes the command
 * mean "put the database in this state", which is the only shape worth
 * reaching for on a Tuesday morning.
 */
import { SCENARIOS, SEED_PASSWORD, type Scenario, seedEmail } from "./identity.ts";
import { buildScenarioA } from "./scenario-a.ts";
import { buildScenarioB } from "./scenario-b.ts";
import { resetSeed } from "./reset.ts";
import { wipeEverything } from "./wipe.ts";

const BUILDERS: Record<Scenario, () => Promise<string>> = {
  a: buildScenarioA,
  b: buildScenarioB,
};

function parse(argv: string[]): { scenarios: Scenario[]; resetOnly: boolean; fresh: boolean } {
  const args = argv.slice(2);
  const resetOnly = args.includes("--reset");
  const fresh = args.includes("--fresh");
  const named = args.filter((a): a is Scenario =>
    (SCENARIOS as readonly string[]).includes(a),
  );
  const scenarios = named.length > 0 ? named : [...SCENARIOS];
  return { scenarios, resetOnly, fresh };
}

async function main(): Promise<void> {
  const { scenarios, resetOnly, fresh } = parse(process.argv);
  if (fresh) console.info(await wipeEverything());

  for (const scenario of scenarios) {
    const gone = await resetSeed(scenario);
    console.info(
      `Scenario ${scenario.toUpperCase()}: removed ${gone.people} people and ${gone.trips} trips.`,
    );
    if (resetOnly) continue;

    console.info(`  ${await BUILDERS[scenario]()}`);
  }

  if (resetOnly) return;

  console.info(
    [
      "",
      "Sign in as any of them from the dev sign-in button on /login, or on the phone's sign-in screen.",
      `Every seeded account uses the password ${SEED_PASSWORD} — e.g. ${seedEmail("priya", "a")}.`,
      "Your own dev account is whatever FLOC_DEV_USER_EMAIL says, and is a member of both scenarios.",
      ...(fresh ? ["Every session went with the wipe — sign in again on the web and the phone."] : []),
    ].join("\n"),
  );
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
