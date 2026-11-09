/**
 * Why: `/floc:scenario` runs this. A start always lands on the same database: everything
 * wiped, seeds A and B in, then the start's own rows. The last line is the dev link.
 *
 *   pnpm --filter floc-web db:scenario <name>
 */
import { assertLocalDatabase } from "../local-only.ts";
import { buildScenarioA } from "../scenario-a.ts";
import { buildScenarioB } from "../scenario-b.ts";
import { wipeEverything } from "../wipe.ts";
import { STARTS, buildStart, enterPath, isStartName } from "./starts.ts";

async function main(): Promise<void> {
  const name = process.argv[2] ?? "";
  if (!isStartName(name)) throw new Error(`Name a scenario: ${STARTS.join(", ")}.`);

  assertLocalDatabase();
  console.info(await wipeEverything());
  console.info(`  ${await buildScenarioA()}`);
  console.info(`  ${await buildScenarioB()}`);

  const start = await buildStart(name);
  console.info(`Scenario ${name}: ${start.as ? `signed in as ${start.as}` : "signed out"}, landing on ${start.to}.`);
  console.info(JSON.stringify({ scenario: name, link: enterPath(start) }));
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
